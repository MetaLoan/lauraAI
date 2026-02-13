package middleware

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"soulface-backend/internal/config"
	"soulface-backend/internal/model"
	"soulface-backend/internal/repository"
	"soulface-backend/pkg/response"
)

const UserContextKey = "user"

// DefaultTestWalletAddress is used in DevMode / WebAppMode when no wallet headers are provided
const DefaultTestWalletAddress = "0x000000000000000000000000000000000000dEaD"

// WalletAuthMiddleware authenticates requests with Bearer token.
// Legacy X-Wallet-* signature auth can be temporarily enabled by ALLOW_LEGACY_SIGNATURE_AUTH=true.
func WalletAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authorization := strings.TrimSpace(c.GetHeader("Authorization"))
		if strings.HasPrefix(strings.ToLower(authorization), "bearer ") {
			token := strings.TrimSpace(authorization[len("Bearer "):])
			claims, err := ParseAndVerifyAuthToken(token)
			if err != nil {
				log.Printf("WalletAuth: invalid bearer token: %v", err)
				response.Error(c, 401, "Invalid or expired authorization token")
				c.Abort()
				return
			}

			userRepo := repository.NewUserRepository()
			user, err := userRepo.GetByID(claims.UserID)
			if err != nil {
				response.Error(c, 401, "User not found for token")
				c.Abort()
				return
			}

			if strings.ToLower(user.WalletAddress) != strings.ToLower(claims.WalletAddress) {
				response.Error(c, 401, "Token subject mismatch")
				c.Abort()
				return
			}

			c.Set(UserContextKey, user)
			c.Next()
			return
		}

		// DevMode/WebAppMode fallback for local testing only.
		useDefaultUser := config.AppConfig.DevMode || config.AppConfig.WebAppMode
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

		if config.AppConfig.AllowLegacySignatureAuth {
			walletAddr := c.GetHeader("X-Wallet-Address")
			walletSig := c.GetHeader("X-Wallet-Signature")
			if walletAddr != "" && walletSig != "" {
				normalizedAddress, err := NormalizeWalletAddress(walletAddr)
				if err == nil {
					message := "SoulFace Auth: " + normalizedAddress
					if err := VerifyWalletSignatureMessage(normalizedAddress, walletSig, message); err == nil {
						userRepo := repository.NewUserRepository()
						user, err := userRepo.GetByWalletAddress(normalizedAddress)
						if err == nil && user != nil {
							c.Set(UserContextKey, user)
							c.Next()
							return
						}
					}
				}
			}
		}

		response.Error(c, 401, "Missing or invalid authorization token")
		c.Abort()
	}
}

// shortenAddress returns a shortened version like "0x1234...abcd"
func shortenAddress(addr string) string {
	if len(addr) <= 10 {
		return addr
	}
	return addr[:6] + "..." + addr[len(addr)-4:]
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
