package i18n

// messagesZh 中文翻译
var messagesZh = &Messages{
	Errors: ErrorMessages{
		Unauthorized:             "请重新登录",
		InvalidRequest:           "无效的请求参数",
		CharacterNotFound:        "角色未找到",
		AccessDenied:             "访问被拒绝",
		NotFound:                 "未找到",
		ServerError:              "服务器错误，请重试",
		NetworkFailed:            "网络连接失败",
		AlreadyHelped:            "您已经帮助过此用户了",
		NotInvited:               "您未被此用户邀请",
		PaymentFailed:            "支付失败",
		UploadFailed:             "上传失败",
		GenerationFailed:         "生成失败，请重试",
		CannotHelpYourself:       "不能帮助自己解锁",
		InvalidShareCode:         "无效的分享码",
		ShareLinkExpired:         "分享链接无效或已过期",
		CharacterAlreadyUnlocked: "角色已解锁或已帮助过",
	},
	Success: SuccessMessages{
		Success:           "成功",
		CharacterCreated:  "角色创建成功",
		UnlockSuccess:     "解锁成功",
		HelpUnlockSuccess: "帮助解锁成功",
	},
	Chat: ChatMessages{
		WelcomeMessage: "你好！很高兴认识你。期待与你聊天！",
	},
}
