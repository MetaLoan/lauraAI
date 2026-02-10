package handler

import (
	"os"
	"path/filepath"

	"lauraai-backend/internal/config"
	"lauraai-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

// ClearAllData 清空所有用户数据：messages、characters、users，以及 uploads 目录下的文件；重置自增 ID。
// 请求头必须带 X-Admin-Key: <ADMIN_SECRET>，否则 403。
func ClearAllData(c *gin.Context) {
	if config.AppConfig.AdminSecret == "" {
		c.JSON(503, gin.H{"error": "ADMIN_SECRET 未配置"})
		return
	}
	if c.GetHeader("X-Admin-Key") != config.AppConfig.AdminSecret {
		c.JSON(403, gin.H{"error": "Forbidden"})
		return
	}

	var errors []string
	var deletedFiles int

	// 1. 删除消息
	if result := repository.DB.Exec("DELETE FROM messages"); result.Error != nil {
		errors = append(errors, "messages: "+result.Error.Error())
	}

	// 2. 删除角色
	if result := repository.DB.Exec("DELETE FROM characters"); result.Error != nil {
		errors = append(errors, "characters: "+result.Error.Error())
	}

	// 3. 删除用户
	if result := repository.DB.Exec("DELETE FROM users"); result.Error != nil {
		errors = append(errors, "users: "+result.Error.Error())
	}

	// 4. 删除上传目录下的文件（可选，不删目录）
	uploadsDir := config.AppConfig.UploadsDir
	if uploadsDir != "" {
		_ = filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if path == uploadsDir {
				return nil
			}
			if !info.IsDir() {
				if err := os.Remove(path); err != nil {
					errors = append(errors, "file "+path+": "+err.Error())
					return nil
				}
				deletedFiles++
			}
			return nil
		})
	}

	// 5. 重置序列
	repository.DB.Exec("ALTER SEQUENCE messages_id_seq RESTART WITH 1")
	repository.DB.Exec("ALTER SEQUENCE characters_id_seq RESTART WITH 1")
	repository.DB.Exec("ALTER SEQUENCE users_id_seq RESTART WITH 1")

	if len(errors) > 0 {
		c.JSON(500, gin.H{"error": "部分删除失败", "details": errors, "deleted_files": deletedFiles})
		return
	}

	c.JSON(200, gin.H{
		"message":        "所有用户数据已清空",
		"tables_cleared": []string{"messages", "characters", "users"},
		"deleted_files":  deletedFiles,
	})
}
