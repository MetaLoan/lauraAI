package middleware

import (
	"encoding/hex"
	"fmt"
	"log"
	"strings"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gin-gonic/gin"
)

const UserContextKey = "user"

// DefaultTestWalletAddress is used in DevMode / WebAppMode when no wallet headers are provided
const DefaultTestWalletAddress = "0x000000000000000000000000000000000000dEaD"

// WalletAuthMiddleware authenticates requests by verifying an EVM wallet signature.
// Headers required:
//   - X-Wallet-Address: 0x-prefixed checksummed or lowercase address
//   - X-Wallet-Signature: 0x-prefixed hex-encoded signature of a known message
func WalletAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		walletAddr := c.GetHeader("X-Wallet-Address")
		walletSig := c.GetHeader("X-Wallet-Signature")

		// DevMode or WebAppMode fallback: use a default test wallet
		useDefaultUser := config.AppConfig.DevMode || (config.AppConfig.WebAppMode && walletAddr == "")
		if useDefaultUser {
			userRepo := repository.NewUserRepository()
			user, err := userRepo.GetByWalletAddress(strings.ToLower(DefaultTestWalletAddress))
			if err != nil {
				user = &model.User{
					WalletAddress: strings.ToLower(DefaultTestWalletAddress),
					Name:          "Test User",
				}
				if err := userRepo.CreateOrUpdate(user); err != nil {
					log.Printf("WalletAuth: CreateOrUpdate failed: %v, retrying fetch", err)
				}
				user, err = userRepo.GetByWalletAddress(strings.ToLower(DefaultTestWalletAddress))
				if err != nil {
					response.Error(c, 500, "Failed to get/create test user: "+err.Error())
					c.Abort()
					return
				}
			}
			c.Set(UserContextKey, user)
			c.Next()
			return
		}

		if walletAddr == "" || walletSig == "" {
			log.Printf("WalletAuth: missing X-Wallet-Address or X-Wallet-Signature")
			response.Error(c, 401, "Missing wallet authentication headers")
			c.Abort()
			return
		}

		// Normalize address to lowercase
		walletAddr = strings.ToLower(walletAddr)

		// Verify signature
		if err := verifyWalletSignature(walletAddr, walletSig); err != nil {
			log.Printf("WalletAuth: signature verification failed: %v", err)
			response.Error(c, 401, "Wallet authentication failed: "+err.Error())
			c.Abort()
			return
		}

		// Lookup or create user
		userRepo := repository.NewUserRepository()
		user, err := userRepo.GetByWalletAddress(walletAddr)
		if err != nil {
			// User doesn't exist, create
			inviteCode := repository.GenerateInviteCode()

			// Check for invite code from header
			inviterCode := c.GetHeader("X-Inviter-Code")
			var inviterID *uint64
			if inviterCode != "" {
				inviter, err := userRepo.GetByInviteCode(inviterCode)
				if err == nil && inviter != nil {
					inviterID = &inviter.ID
					log.Printf("WalletAuth: found invite code %s, binding inviter ID=%d", inviterCode, inviter.ID)
				}
			}

			user = &model.User{
				WalletAddress: walletAddr,
				Name:          shortenAddress(walletAddr),
				InviteCode:    inviteCode,
				InviterID:     inviterID,
			}
			if err := userRepo.Create(user); err != nil {
				response.Error(c, 500, "Failed to create user: "+err.Error())
				c.Abort()
				return
			}
		}

		c.Set(UserContextKey, user)
		c.Next()
	}
}

// GetUserFromContext retrieves the user from the Gin context.
func GetUserFromContext(c *gin.Context) (*model.User, bool) {
	user, exists := c.Get(UserContextKey)
	if !exists {
		return nil, false
	}
	u, ok := user.(*model.User)
	return u, ok
}

// verifyWalletSignature verifies that the signature was produced by the claimed address.
// The signed message format is: "LauraAI Auth: <address>"
// This uses EIP-191 personal_sign format: "\x19Ethereum Signed Message:\n<len><message>"
func verifyWalletSignature(address, sigHex string) error {
	// Remove 0x prefix from signature
	sigHex = strings.TrimPrefix(sigHex, "0x")
	sigBytes, err := hex.DecodeString(sigHex)
	if err != nil {
		return fmt.Errorf("invalid signature hex: %v", err)
	}

	if len(sigBytes) != 65 {
		return fmt.Errorf("invalid signature length: expected 65, got %d", len(sigBytes))
	}

	// Adjust recovery ID (v): Ethereum uses 27/28, go-ethereum expects 0/1
	if sigBytes[64] >= 27 {
		sigBytes[64] -= 27
	}

	// Construct the signed message: "LauraAI Auth: <address>"
	message := "LauraAI Auth: " + address

	// Apply EIP-191 prefix: "\x19Ethereum Signed Message:\n<len><message>"
	prefixedMsg := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256Hash([]byte(prefixedMsg))

	// Recover public key from signature
	pubKey, err := crypto.Ecrecover(hash.Bytes(), sigBytes)
	if err != nil {
		return fmt.Errorf("ecrecover failed: %v", err)
	}

	// Convert to address
	recoveredPubKey, err := crypto.UnmarshalPubkey(pubKey)
	if err != nil {
		return fmt.Errorf("unmarshal pubkey failed: %v", err)
	}
	recoveredAddr := crypto.PubkeyToAddress(*recoveredPubKey)

	if strings.ToLower(recoveredAddr.Hex()) != address {
		return fmt.Errorf("signature address mismatch: expected %s, got %s", address, strings.ToLower(recoveredAddr.Hex()))
	}

	return nil
}

// shortenAddress returns a shortened version like "0x1234...abcd"
func shortenAddress(addr string) string {
	if len(addr) <= 10 {
		return addr
	}
	return addr[:6] + "..." + addr[len(addr)-4:]
}
