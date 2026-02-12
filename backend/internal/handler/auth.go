package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userRepo      *repository.UserRepository
	authNonceRepo *repository.AuthNonceRepository
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		userRepo:      repository.NewUserRepository(),
		authNonceRepo: repository.NewAuthNonceRepository(),
	}
}

func (h *AuthHandler) GetNonce(c *gin.Context) {
	var req struct {
		WalletAddress string `json:"wallet_address" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	walletAddress, err := middleware.NormalizeWalletAddress(req.WalletAddress)
	if err != nil {
		response.Error(c, 400, "Invalid wallet address")
		return
	}

	nonce, err := generateNonceHex(16)
	if err != nil {
		response.Error(c, 500, "Failed to create auth challenge")
		return
	}

	issuedAt := time.Now().UTC().Format(time.RFC3339)
	message := fmt.Sprintf("LauraAI Login\nAddress: %s\nNonce: %s\nIssued At: %s", walletAddress, nonce, issuedAt)
	expiresAt := time.Now().Add(10 * time.Minute)

	challenge := &model.AuthNonce{
		WalletAddress: walletAddress,
		Nonce:         nonce,
		Message:       message,
		ExpiresAt:     expiresAt,
		Used:          false,
	}
	if err := h.authNonceRepo.Create(challenge); err != nil {
		response.Error(c, 500, "Failed to store auth challenge")
		return
	}
	_ = h.authNonceRepo.DeleteExpired()

	response.Success(c, gin.H{
		"wallet_address": walletAddress,
		"nonce":          nonce,
		"message":        message,
		"expires_at":     expiresAt.Unix(),
	})
}

func (h *AuthHandler) Verify(c *gin.Context) {
	var req struct {
		WalletAddress string `json:"wallet_address" binding:"required"`
		Nonce         string `json:"nonce" binding:"required"`
		Signature     string `json:"signature" binding:"required"`
		InviterCode   string `json:"inviter_code"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	walletAddress, err := middleware.NormalizeWalletAddress(req.WalletAddress)
	if err != nil {
		response.Error(c, 400, "Invalid wallet address")
		return
	}

	challenge, err := h.authNonceRepo.ConsumeValid(walletAddress, strings.TrimSpace(req.Nonce))
	if err != nil {
		response.Error(c, 401, "Auth challenge expired or already used")
		return
	}

	if err := middleware.VerifyWalletSignatureMessage(walletAddress, req.Signature, challenge.Message); err != nil {
		response.Error(c, 401, "Wallet signature verification failed")
		return
	}

	user, err := h.userRepo.GetByWalletAddress(walletAddress)
	if err != nil || user == nil {
		inviteCode := repository.GenerateInviteCode()

		var inviterID *uint64
		if req.InviterCode != "" {
			inviter, inviterErr := h.userRepo.GetByInviteCode(req.InviterCode)
			if inviterErr == nil && inviter != nil {
				inviterID = &inviter.ID
			}
		}

		user = &model.User{
			WalletAddress: walletAddress,
			Name:          shortenAddress(walletAddress),
			InviteCode:    inviteCode,
			InviterID:     inviterID,
		}
		if err := h.userRepo.Create(user); err != nil {
			response.Error(c, 500, "Failed to create user")
			return
		}
	}

	token, expiresAt, err := middleware.GenerateAuthToken(user.ID, walletAddress)
	if err != nil {
		response.Error(c, 500, "Failed to issue auth token")
		return
	}

	response.Success(c, gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"expires_at":   expiresAt,
		"user":         user,
	})
}

func generateNonceHex(byteLen int) (string, error) {
	buf := make([]byte, byteLen)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func shortenAddress(addr string) string {
	if len(addr) <= 10 {
		return addr
	}
	return addr[:6] + "..." + addr[len(addr)-4:]
}
