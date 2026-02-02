package i18n

// messagesRu 俄语翻译
var messagesRu = &Messages{
	Errors: ErrorMessages{
		Unauthorized:             "Пожалуйста, войдите снова",
		InvalidRequest:           "Неверные параметры запроса",
		CharacterNotFound:        "Персонаж не найден",
		AccessDenied:             "Доступ запрещён",
		NotFound:                 "Не найдено",
		ServerError:              "Ошибка сервера, попробуйте снова",
		NetworkFailed:            "Ошибка сетевого подключения",
		AlreadyHelped:            "Вы уже помогли этому пользователю",
		NotInvited:               "Вас не пригласил этот пользователь",
		PaymentFailed:            "Ошибка оплаты",
		UploadFailed:             "Ошибка загрузки",
		GenerationFailed:         "Ошибка генерации, попробуйте снова",
		CannotHelpYourself:       "Нельзя помочь себе разблокировать",
		InvalidShareCode:         "Неверный код доступа",
		ShareLinkExpired:         "Ссылка недействительна или истекла",
		CharacterAlreadyUnlocked: "Персонаж уже разблокирован или вы уже помогли",
	},
	Success: SuccessMessages{
		Success:           "Успешно",
		CharacterCreated:  "Персонаж успешно создан",
		UnlockSuccess:     "Разблокировка успешна",
		HelpUnlockSuccess: "Помощь в разблокировке успешна",
	},
	Chat: ChatMessages{
		WelcomeMessage: "Привет! Рада познакомиться. С нетерпением жду общения с тобой!",
	},
}
