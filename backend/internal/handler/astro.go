package handler

import "time"

// getZodiacSignFromBirthDate calculates zodiac sign by month/day.
// Returns empty string when birthDate is nil.
func getZodiacSignFromBirthDate(birthDate *time.Time) string {
	if birthDate == nil {
		return ""
	}

	month := birthDate.Month()
	day := birthDate.Day()

	switch {
	case (month == time.March && day >= 21) || (month == time.April && day <= 19):
		return "Aries"
	case (month == time.April && day >= 20) || (month == time.May && day <= 20):
		return "Taurus"
	case (month == time.May && day >= 21) || (month == time.June && day <= 21):
		return "Gemini"
	case (month == time.June && day >= 22) || (month == time.July && day <= 22):
		return "Cancer"
	case (month == time.July && day >= 23) || (month == time.August && day <= 22):
		return "Leo"
	case (month == time.August && day >= 23) || (month == time.September && day <= 22):
		return "Virgo"
	case (month == time.September && day >= 23) || (month == time.October && day <= 23):
		return "Libra"
	case (month == time.October && day >= 24) || (month == time.November && day <= 21):
		return "Scorpio"
	case (month == time.November && day >= 22) || (month == time.December && day <= 21):
		return "Sagittarius"
	case (month == time.December && day >= 22) || (month == time.January && day <= 19):
		return "Capricorn"
	case (month == time.January && day >= 20) || (month == time.February && day <= 18):
		return "Aquarius"
	default:
		return "Pisces"
	}
}

