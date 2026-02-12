package handler

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"strconv"
	"strings"
	"time"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
)

var safeMintSelectorHex = "40d097c3" // bytes4(keccak256("safeMint(address,string)"))
var erc20TransferTopicHex = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

type MintOrderHandler struct {
	mintOrderRepo     *repository.MintOrderRepository
	characterRepo     *repository.CharacterRepository
	webhookReplayRepo *repository.MintWebhookReplayRepository
}

func NewMintOrderHandler() *MintOrderHandler {
	return &MintOrderHandler{
		mintOrderRepo:     repository.NewMintOrderRepository(),
		characterRepo:     repository.NewCharacterRepository(),
		webhookReplayRepo: repository.NewMintWebhookReplayRepository(),
	}
}

func (h *MintOrderHandler) CreateOrder(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		CharacterID    uint64 `json:"character_id" binding:"required"`
		ChainID        int64  `json:"chain_id" binding:"required"`
		TokenAddress   string `json:"token_address" binding:"required"`
		TokenSymbol    string `json:"token_symbol" binding:"required"`
		TokenAmount    string `json:"token_amount" binding:"required"`
		TokenAmountWei string `json:"token_amount_wei" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	character, err := h.characterRepo.GetByID(req.CharacterID)
	if err != nil {
		response.Error(c, 404, "Character not found")
		return
	}
	if character.UserID != user.ID {
		response.Error(c, 403, "Access denied")
		return
	}

	confirmed, err := h.mintOrderRepo.GetConfirmedByCharacter(user.ID, req.CharacterID)
	if err == nil && confirmed != nil {
		response.Success(c, gin.H{
			"already_paid": true,
			"order":        confirmed,
		})
		return
	}

	pending, err := h.mintOrderRepo.GetLatestPendingByCharacter(user.ID, req.CharacterID)
	if err == nil && pending != nil {
		response.Success(c, gin.H{
			"already_paid": false,
			"order":        pending,
		})
		return
	}

	treasury := strings.ToLower(strings.TrimSpace(config.AppConfig.MintTreasuryWallet))
	if !common.IsHexAddress(treasury) {
		response.Error(c, 500, "Mint treasury wallet is not configured correctly")
		return
	}

	order := &model.MintOrder{
		UserID:         user.ID,
		CharacterID:    req.CharacterID,
		Status:         model.MintOrderStatusPending,
		ChainID:        req.ChainID,
		TokenAddress:   strings.ToLower(req.TokenAddress),
		TokenSymbol:    strings.ToUpper(req.TokenSymbol),
		TokenAmount:    req.TokenAmount,
		TokenAmountWei: strings.TrimSpace(req.TokenAmountWei),
		TreasuryWallet: treasury,
		PayerWallet:    strings.ToLower(user.WalletAddress),
	}
	if err := h.mintOrderRepo.Create(order); err != nil {
		response.Error(c, 500, "Failed to create mint order")
		return
	}

	response.Success(c, gin.H{
		"already_paid": false,
		"order":        order,
	})
}

func (h *MintOrderHandler) ConfirmOrder(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 400, "Invalid order ID")
		return
	}

	var req struct {
		TxHash string `json:"tx_hash" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	order, err := h.mintOrderRepo.GetByIDAndUser(orderID, user.ID)
	if err != nil {
		response.Error(c, 404, "Mint order not found")
		return
	}
	if order.Status == model.MintOrderStatusConfirmed {
		response.Success(c, gin.H{"order": order})
		return
	}

	txHash := strings.ToLower(strings.TrimSpace(req.TxHash))
	if !isHexTxHash(txHash) {
		response.Error(c, 400, "Invalid tx hash")
		return
	}

	if !model.CanMintOrderTransition(order.Status, model.MintOrderStatusVerifying) {
		response.Error(c, 400, "Order is not in a verifiable state")
		return
	}
	order.Status = model.MintOrderStatusVerifying
	order.TxHash = txHash
	order.FailReason = ""
	_ = h.mintOrderRepo.Update(order)

	if verifyErr := h.finalizeMintOrderByTx(order, txHash, strings.ToLower(user.WalletAddress)); verifyErr != nil {
		response.Error(c, 400, "Mint tx verification failed: "+verifyErr.Error())
		return
	}

	response.Success(c, gin.H{"order": order})
}

func (h *MintOrderHandler) GetOrder(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 400, "Invalid order ID")
		return
	}

	order, err := h.mintOrderRepo.GetByIDAndUser(orderID, user.ID)
	if err != nil {
		response.Error(c, 404, "Mint order not found")
		return
	}
	response.Success(c, gin.H{"order": order})
}

// WebhookConfirm handles asynchronous mint confirmation callbacks from indexer/relayer.
// Security:
// - HMAC signature with shared secret
// - timestamp skew check
// - replay protection with unique webhook id
func (h *MintOrderHandler) WebhookConfirm(c *gin.Context) {
	if strings.TrimSpace(config.AppConfig.MintWebhookSecret) == "" {
		response.Error(c, 503, "Mint webhook secret is not configured")
		return
	}

	webhookID := strings.TrimSpace(c.GetHeader("X-Webhook-Id"))
	timestamp := strings.TrimSpace(c.GetHeader("X-Webhook-Timestamp"))
	signature := strings.TrimSpace(c.GetHeader("X-Webhook-Signature"))
	if webhookID == "" || timestamp == "" || signature == "" {
		response.Error(c, 401, "Missing webhook auth headers")
		return
	}

	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		response.Error(c, 401, "Invalid webhook timestamp")
		return
	}
	now := time.Now().Unix()
	skew := config.AppConfig.MintWebhookMaxSkewSec
	if skew <= 0 {
		skew = 300
	}
	if now-ts > skew || ts-now > skew {
		response.Error(c, 401, "Webhook timestamp expired")
		return
	}

	rawBody, err := io.ReadAll(c.Request.Body)
	if err != nil {
		response.Error(c, 400, "Failed to read webhook body")
		return
	}
	if !verifyWebhookSignature(timestamp, rawBody, signature, config.AppConfig.MintWebhookSecret) {
		response.Error(c, 401, "Invalid webhook signature")
		return
	}

	ok, err := h.webhookReplayRepo.RegisterReplayKey("mint_webhook:"+webhookID, 24*time.Hour)
	if err != nil {
		response.Error(c, 500, "Failed to register webhook replay key")
		return
	}
	if !ok {
		response.Success(c, gin.H{
			"status":  "ignored",
			"message": "Duplicate webhook event",
		})
		return
	}
	_ = h.webhookReplayRepo.CleanupExpired()

	var req struct {
		OrderID uint64 `json:"order_id"`
		OrderNo string `json:"order_no"`
		TxHash  string `json:"tx_hash" binding:"required"`
	}
	if err := json.Unmarshal(rawBody, &req); err != nil {
		response.Error(c, 400, "Invalid webhook payload")
		return
	}
	if req.OrderID == 0 && strings.TrimSpace(req.OrderNo) == "" {
		response.Error(c, 400, "order_id or order_no is required")
		return
	}
	txHash := strings.ToLower(strings.TrimSpace(req.TxHash))
	if !isHexTxHash(txHash) {
		response.Error(c, 400, "Invalid tx hash")
		return
	}

	var order *model.MintOrder
	if req.OrderID > 0 {
		order, err = h.mintOrderRepo.GetByID(req.OrderID)
	} else {
		order, err = h.mintOrderRepo.GetByOrderNo(strings.TrimSpace(req.OrderNo))
	}
	if err != nil {
		response.Error(c, 404, "Mint order not found")
		return
	}
	if order.Status == model.MintOrderStatusConfirmed {
		response.Success(c, gin.H{
			"status": "confirmed",
			"order":  order,
		})
		return
	}
	if !model.CanMintOrderTransition(order.Status, model.MintOrderStatusVerifying) {
		response.Error(c, 400, "Order is not in a verifiable state")
		return
	}

	order.Status = model.MintOrderStatusVerifying
	order.TxHash = txHash
	order.FailReason = ""
	_ = h.mintOrderRepo.Update(order)

	payer := strings.ToLower(strings.TrimSpace(order.PayerWallet))
	if payer == "" {
		response.Error(c, 400, "Order has no payer_wallet")
		return
	}

	if err := h.finalizeMintOrderByTx(order, txHash, payer); err != nil {
		response.Error(c, 400, "Mint tx verification failed: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"status": "confirmed",
		"order":  order,
	})
}

func (h *MintOrderHandler) verifyMintTransaction(txHash string, walletAddress string, order *model.MintOrder) (uint64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	client, err := ethclient.DialContext(ctx, config.AppConfig.ChainRPCURL)
	if err != nil {
		return 0, fmt.Errorf("rpc dial failed")
	}
	defer client.Close()

	hash := common.HexToHash(txHash)
	tx, isPending, err := client.TransactionByHash(ctx, hash)
	if err != nil {
		return 0, fmt.Errorf("tx not found on chain")
	}
	if isPending {
		return 0, fmt.Errorf("tx is still pending")
	}

	receipt, err := client.TransactionReceipt(ctx, hash)
	if err != nil {
		return 0, fmt.Errorf("failed to get tx receipt")
	}
	if receipt.Status != types.ReceiptStatusSuccessful {
		return 0, fmt.Errorf("tx execution failed on chain")
	}

	if config.AppConfig.MintExpectedChainID > 0 && tx.ChainId() != nil && tx.ChainId().Int64() != config.AppConfig.MintExpectedChainID {
		return 0, fmt.Errorf("unexpected chain id %d", tx.ChainId().Int64())
	}

	signer := types.LatestSignerForChainID(tx.ChainId())
	sender, err := types.Sender(signer, tx)
	if err != nil {
		return 0, fmt.Errorf("failed to recover tx sender")
	}
	if strings.ToLower(sender.Hex()) != strings.ToLower(walletAddress) {
		return 0, fmt.Errorf("tx sender mismatch")
	}

	if tx.To() == nil {
		return 0, fmt.Errorf("tx destination is empty")
	}
	if config.AppConfig.MintContractAddress != "" && strings.ToLower(tx.To().Hex()) != strings.ToLower(config.AppConfig.MintContractAddress) {
		return 0, fmt.Errorf("tx target is not mint contract")
	}

	data := tx.Data()
	if len(data) < 4 {
		return 0, fmt.Errorf("tx data too short for safeMint")
	}
	if hex.EncodeToString(data[:4]) != safeMintSelectorHex {
		return 0, fmt.Errorf("tx method is not safeMint(address,string)")
	}

	charIDMarker := "/api/nft/metadata/" + strconv.FormatUint(order.CharacterID, 10)
	if !strings.Contains(strings.ToLower(hex.EncodeToString(data)), strings.ToLower(hex.EncodeToString([]byte(charIDMarker)))) {
		return 0, fmt.Errorf("tx metadata uri does not match character")
	}

	if err := verifyERC20TreasuryTransfer(receipt, strings.ToLower(walletAddress), strings.ToLower(order.TokenAddress), strings.ToLower(order.TreasuryWallet), order.TokenAmountWei); err != nil {
		return 0, err
	}

	return receipt.BlockNumber.Uint64(), nil
}

func verifyERC20TreasuryTransfer(receipt *types.Receipt, payer string, tokenAddress string, treasuryWallet string, amountWei string) error {
	if !common.IsHexAddress(tokenAddress) {
		return fmt.Errorf("invalid token address in order")
	}
	if !common.IsHexAddress(treasuryWallet) {
		return fmt.Errorf("invalid treasury wallet in order")
	}
	expectedAmount, ok := new(big.Int).SetString(strings.TrimSpace(amountWei), 10)
	if !ok || expectedAmount.Sign() <= 0 {
		return fmt.Errorf("invalid token amount_wei in order")
	}

	transferTopic := common.HexToHash("0x" + erc20TransferTopicHex)
	payerHash := topicFromAddress(payer)
	treasuryHash := topicFromAddress(treasuryWallet)

	for _, lg := range receipt.Logs {
		if strings.ToLower(lg.Address.Hex()) != tokenAddress {
			continue
		}
		if len(lg.Topics) < 3 {
			continue
		}
		if lg.Topics[0] != transferTopic {
			continue
		}
		if lg.Topics[1] != payerHash || lg.Topics[2] != treasuryHash {
			continue
		}
		if len(lg.Data) == 0 {
			continue
		}
		amount := new(big.Int).SetBytes(lg.Data)
		if amount.Cmp(expectedAmount) == 0 {
			return nil
		}
	}

	return fmt.Errorf("no FF transfer to treasury found in receipt logs")
}

func topicFromAddress(addr string) common.Hash {
	address := common.HexToAddress(addr)
	return common.BytesToHash(common.LeftPadBytes(address.Bytes(), 32))
}

func isHexTxHash(txHash string) bool {
	if len(txHash) != 66 || !strings.HasPrefix(txHash, "0x") {
		return false
	}
	for _, ch := range txHash[2:] {
		if !((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')) {
			return false
		}
	}
	return true
}

func (h *MintOrderHandler) finalizeMintOrderByTx(order *model.MintOrder, txHash string, payerWallet string) error {
	blockNumber, verifyErr := h.verifyMintTransaction(txHash, payerWallet, order)
	if verifyErr != nil {
		if model.CanMintOrderTransition(order.Status, model.MintOrderStatusFailed) {
			order.Status = model.MintOrderStatusFailed
		}
		order.TxHash = txHash
		order.FailReason = verifyErr.Error()
		_ = h.mintOrderRepo.Update(order)
		return verifyErr
	}

	now := time.Now()
	if model.CanMintOrderTransition(order.Status, model.MintOrderStatusConfirmed) {
		order.Status = model.MintOrderStatusConfirmed
	}
	order.TxHash = txHash
	order.PayerWallet = strings.ToLower(payerWallet)
	order.BlockNumber = blockNumber
	order.VerifiedAt = &now
	order.FailReason = ""
	if err := h.mintOrderRepo.Update(order); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}
	return nil
}

func verifyWebhookSignature(timestamp string, rawBody []byte, gotSignature string, secret string) bool {
	payload := timestamp + "." + string(rawBody)
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(strings.ToLower(expected)), []byte(strings.ToLower(strings.TrimPrefix(gotSignature, "0x"))))
}
