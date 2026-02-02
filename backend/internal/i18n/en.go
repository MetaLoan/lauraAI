package i18n

// messagesEn 英语翻译
var messagesEn = &Messages{
	Errors: ErrorMessages{
		Unauthorized:             "Please login again",
		InvalidRequest:           "Invalid request parameters",
		CharacterNotFound:        "Character not found",
		AccessDenied:             "Access denied",
		NotFound:                 "Not found",
		ServerError:              "Server error, please try again",
		NetworkFailed:            "Network connection failed",
		AlreadyHelped:            "You have already helped this user",
		NotInvited:               "You are not invited by this user",
		PaymentFailed:            "Payment failed",
		UploadFailed:             "Upload failed",
		GenerationFailed:         "Generation failed, please try again",
		CannotHelpYourself:       "Cannot help yourself unlock",
		InvalidShareCode:         "Invalid share code",
		ShareLinkExpired:         "Share link invalid or expired",
		CharacterAlreadyUnlocked: "Character already unlocked or already helped",
	},
	Success: SuccessMessages{
		Success:           "Success",
		CharacterCreated:  "Character created successfully",
		UnlockSuccess:     "Unlock successful",
		HelpUnlockSuccess: "Help unlock successful",
	},
	Chat: ChatMessages{
		WelcomeMessage: "Hello! Nice to meet you. I'm excited to chat with you!",
	},
}
