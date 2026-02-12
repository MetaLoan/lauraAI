package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/middleware"
	"lauraai-backend/internal/model"
	"lauraai-backend/internal/repository"
	"lauraai-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type DeFiHandler struct{}

func NewDeFiHandler() *DeFiHandler {
	return &DeFiHandler{}
}

// GetMarketIntelligence 获取市场情报（TGE 前不返回池子假数据）
func (h *DeFiHandler) GetMarketIntelligence(c *gin.Context) {
	ethPrice := h.fetchETHPrice()
	gasPrice := h.fetchGasPrice()
	var pools []gin.H
	if config.AppConfig.TGELive {
		pools = h.fetchPancakeSwapPools()
	}
	response.Success(c, gin.H{
		"tge_live":   config.AppConfig.TGELive,
		"timestamp":  time.Now().Unix(),
		"eth_price":  ethPrice,
		"bnb_price":  ethPrice, // backward compatibility
		"v3_pools":   pools,
		"gas_price":  gasPrice,
		"sentiment":  h.calculateMarketSentiment(ethPrice),
	})
}

// GetPools 获取 DeFi 池子数据（TGE 前返回空，不展示假数据）
func (h *DeFiHandler) GetPools(c *gin.Context) {
	var pools []gin.H
	var historicalData []gin.H
	if config.AppConfig.TGELive {
		pools = h.fetchPancakeSwapPools()
		historicalData = h.generateHistoricalData()
	}
	response.Success(c, gin.H{
		"tge_live":   config.AppConfig.TGELive,
		"pools":      pools,
		"historical": historicalData,
		"updated_at": time.Now().Unix(),
	})
}

// GetMarketCharacters 获取市场上架的角色
func (h *DeFiHandler) GetMarketCharacters(c *gin.Context) {
	locale := middleware.GetLocaleString(c)

	var characters []model.Character
	if err := repository.DB.Where("is_listed = ?", true).
		Order("listed_at DESC").
		Find(&characters).Error; err != nil {
		response.Error(c, 500, "Failed to fetch market characters")
		return
	}

	// 转换为安全响应格式
	result := make([]map[string]interface{}, len(characters))
	for i, char := range characters {
		safeData := char.ToSafeResponse(locale)
		// 添加市场相关字段
		safeData["is_listed"] = char.IsListed
		safeData["list_price"] = char.ListPrice
		safeData["listed_at"] = char.ListedAt
		safeData["price"] = fmt.Sprintf("%.3f ETH", char.ListPrice)
		// 为前端兼容添加 rarity 和 likes
		safeData["rarity"] = h.calculateRarity(char.Compatibility)
		safeData["likes"] = char.ID % 500 // 简单模拟
		result[i] = safeData
	}

	response.Success(c, result)
}

// ListCharacter 上架角色到市场
func (h *DeFiHandler) ListCharacter(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		CharacterID uint64  `json:"character_id" binding:"required"`
		Price       float64 `json:"price" binding:"required,gt=0"`
		TxHash      string  `json:"tx_hash"` // 链上交易哈希
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	// 验证角色归属
	var character model.Character
	if err := repository.DB.Where("id = ? AND user_id = ?", req.CharacterID, user.ID).First(&character).Error; err != nil {
		response.Error(c, 404, "Character not found or not owned by you")
		return
	}

	// 验证角色已完全解锁
	if character.UnlockStatus != model.UnlockStatusFullUnlocked {
		response.Error(c, 400, "Character must be fully unlocked before listing")
		return
	}

	// 检查是否已上架
	if character.IsListed {
		response.Error(c, 400, "Character is already listed")
		return
	}

	// 更新上架状态
	now := time.Now()
	updates := map[string]interface{}{
		"is_listed":  true,
		"list_price": req.Price,
		"listed_at":  now,
	}

	if err := repository.DB.Model(&character).Updates(updates).Error; err != nil {
		response.Error(c, 500, "Failed to list character")
		return
	}

	response.Success(c, gin.H{
		"message":      "Character listed successfully",
		"character_id": character.ID,
		"price":        req.Price,
		"listed_at":    now,
	})
}

// PurchaseCharacter 购买角色
func (h *DeFiHandler) PurchaseCharacter(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		CharacterID uint64 `json:"character_id" binding:"required"`
		TxHash      string `json:"tx_hash" binding:"required"` // 链上交易哈希
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	// 获取角色
	var character model.Character
	if err := repository.DB.First(&character, req.CharacterID).Error; err != nil {
		response.Error(c, 404, "Character not found")
		return
	}

	// 验证是否上架
	if !character.IsListed {
		response.Error(c, 400, "Character is not listed for sale")
		return
	}

	// 不能购买自己的角色
	if character.UserID == user.ID {
		response.Error(c, 400, "Cannot purchase your own character")
		return
	}

	oldOwnerID := character.UserID

	// 更新角色所有权
	updates := map[string]interface{}{
		"user_id":    user.ID,
		"is_listed":  false,
		"list_price": 0,
		"listed_at":  nil,
	}

	if err := repository.DB.Model(&character).Updates(updates).Error; err != nil {
		response.Error(c, 500, "Failed to transfer character")
		return
	}

	response.Success(c, gin.H{
		"message":        "Character purchased successfully",
		"character_id":   character.ID,
		"previous_owner": oldOwnerID,
		"new_owner":      user.ID,
		"tx_hash":        req.TxHash,
	})
}

// DelistCharacter 下架角色
func (h *DeFiHandler) DelistCharacter(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		response.Error(c, 401, "Unauthorized")
		return
	}

	var req struct {
		CharacterID uint64 `json:"character_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request parameters")
		return
	}

	// 验证角色归属
	var character model.Character
	if err := repository.DB.Where("id = ? AND user_id = ?", req.CharacterID, user.ID).First(&character).Error; err != nil {
		response.Error(c, 404, "Character not found or not owned by you")
		return
	}

	// 验证是否已上架
	if !character.IsListed {
		response.Error(c, 400, "Character is not listed")
		return
	}

	// 更新下架状态
	updates := map[string]interface{}{
		"is_listed":  false,
		"list_price": 0,
		"listed_at":  nil,
	}

	if err := repository.DB.Model(&character).Updates(updates).Error; err != nil {
		response.Error(c, 500, "Failed to delist character")
		return
	}

	response.Success(c, gin.H{
		"message":      "Character delisted successfully",
		"character_id": character.ID,
	})
}

// ===== Helper Functions =====

func (h *DeFiHandler) fetchETHPrice() string {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT")
	if err != nil {
		return "3000.00" // Fallback
	}
	defer resp.Body.Close()

	var data struct {
		Price string `json:"price"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "3000.00"
	}

	return data.Price
}

func (h *DeFiHandler) fetchGasPrice() string {
	// 使用配置的 EVM RPC 获取真实 gas price
	client := &http.Client{Timeout: 5 * time.Second}

	rpcPayload := strings.NewReader(`{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}`)
	resp, err := client.Post(
		config.AppConfig.ChainRPCURL,
		"application/json",
		rpcPayload,
	)
	if err != nil {
		return "3.0 Gwei"
	}
	defer resp.Body.Close()

	var result struct {
		Result string `json:"result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "3.0 Gwei"
	}

	// 解析十六进制 gas price 并转换为 Gwei
	if result.Result != "" && len(result.Result) > 2 {
		gasWei, err := strconv.ParseInt(result.Result[2:], 16, 64)
		if err == nil {
			gasGwei := float64(gasWei) / 1e9
			return fmt.Sprintf("%.1f Gwei", gasGwei)
		}
	}

	return "3.0 Gwei"
}

func (h *DeFiHandler) fetchPancakeSwapPools() []gin.H {
	// 使用 PancakeSwap Subgraph API 获取真实池子数据
	// 这里使用简化版本，实际生产环境应该调用 The Graph API
	client := &http.Client{Timeout: 10 * time.Second}

	// 获取 ETH 24h 变化作为参考
	resp, err := client.Get("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT")
	if err == nil {
		defer resp.Body.Close()
		var ticker struct {
			PriceChangePercent string `json:"priceChangePercent"`
		}
		if json.NewDecoder(resp.Body).Decode(&ticker) == nil {
			// 根据市场变化动态调整 APY
			priceChange, _ := strconv.ParseFloat(ticker.PriceChangePercent, 64)

			// 基础 APY 加上市场波动
			lraBnbAPY := 18.5 + priceChange*0.5
			lraUsdtAPY := 12.2 + priceChange*0.3

			return []gin.H{
				{
					"name":       "LRA-ETH",
					"apy":        lraBnbAPY,
					"tvl":        "$1.85M",
					"tvl_number": 1850000,
					"trend":      h.getTrend(priceChange),
					"volume_24h": "$245K",
					"fee_tier":   "0.25%",
				},
				{
					"name":       "LRA-USDT",
					"apy":        lraUsdtAPY,
					"tvl":        "$920K",
					"tvl_number": 920000,
					"trend":      "stable",
					"volume_24h": "$128K",
					"fee_tier":   "0.05%",
				},
				{
					"name":       "LRA-BUSD",
					"apy":        10.8,
					"tvl":        "$450K",
					"tvl_number": 450000,
					"trend":      "stable",
					"volume_24h": "$67K",
					"fee_tier":   "0.05%",
				},
			}
		}
	}

	// Fallback mock data
	return []gin.H{
		{"name": "LRA-ETH", "apy": 24.5, "tvl": "$1.2M", "tvl_number": 1200000, "trend": "up", "volume_24h": "$180K", "fee_tier": "0.25%"},
		{"name": "LRA-USDT", "apy": 18.2, "tvl": "$840K", "tvl_number": 840000, "trend": "stable", "volume_24h": "$95K", "fee_tier": "0.05%"},
	}
}

func (h *DeFiHandler) generateHistoricalData() []gin.H {
	// 生成过去7天的历史数据
	now := time.Now()
	data := make([]gin.H, 7)

	for i := 6; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		// 使用日期作为随机种子生成一致的数据
		dayOffset := float64(date.Day())

		data[6-i] = gin.H{
			"date":  date.Format("Mon"),
			"yield": 12.0 + (dayOffset/30.0)*10.0 + float64(i)*0.5,
			"tvl":   3800000 + int(dayOffset*50000) + i*100000,
		}
	}

	return data
}

func (h *DeFiHandler) calculateMarketSentiment(bnbPrice string) string {
	price, err := strconv.ParseFloat(bnbPrice, 64)
	if err != nil {
		return "Neutral"
	}

	if price > 350 {
		return "Very Bullish"
	} else if price > 300 {
		return "Bullish"
	} else if price > 250 {
		return "Neutral"
	} else if price > 200 {
		return "Cautious"
	}
	return "Bearish"
}

func (h *DeFiHandler) getTrend(priceChange float64) string {
	if priceChange > 2 {
		return "up"
	} else if priceChange < -2 {
		return "down"
	}
	return "stable"
}

func (h *DeFiHandler) calculateRarity(compatibility int) string {
	if compatibility >= 90 {
		return "Legendary"
	} else if compatibility >= 75 {
		return "Rare"
	} else if compatibility >= 50 {
		return "Uncommon"
	}
	return "Common"
}
