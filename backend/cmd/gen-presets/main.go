package main

import (
	"context"
	"fmt"
	"image"
	"image/jpeg"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/disintegration/imaging"
	"github.com/joho/godotenv"
	"google.golang.org/genai"
)

type PresetConfig struct {
	Type   string
	Prompt string
}

var presets = []PresetConfig{
	{
		Type: "girlfriend",
		Prompt: `A beautiful and sweet young woman portrait, soft warm lighting, dreamy bokeh background with pink and gold tones. 
She has gentle expressive eyes, a warm inviting smile, and natural flowing hair. 
Romantic and tender atmosphere, soft pastel color palette.
Professional portrait photography, 8K quality, hyperrealistic skin texture, cinematic lighting.
Style: Modern romantic portrait, fashion photography aesthetic.`,
	},
	{
		Type: "boyfriend",
		Prompt: `A handsome and charming young man portrait, confident warm smile, bright natural lighting.
He has strong yet gentle features, well-groomed hair, and kind expressive eyes.
Clean modern background with blue and warm tones.
Professional portrait photography, 8K quality, hyperrealistic, cinematic lighting.
Style: Modern editorial portrait, warm and approachable.`,
	},
	{
		Type: "best_friend",
		Prompt: `A friendly and energetic young person portrait, bright cheerful expression with a genuine laugh.
Vibrant and lively atmosphere, warm sunset golden hour lighting.
Casual and relatable style, colorful background with orange and yellow tones.
Professional portrait photography, 8K quality, hyperrealistic, natural candid feel.
Style: Lifestyle photography, warm and inviting.`,
	},
	{
		Type: "soulmate",
		Prompt: `A mysterious and ethereal portrait of a beautiful person, surrounded by cosmic starfield and soft nebula light.
Otherworldly beauty with deep soulful eyes that seem to gaze through dimensions.
Purple, blue and gold celestial color palette, magical floating particles of light.
Professional portrait photography merged with cosmic art, 8K quality, hyperrealistic yet dreamlike.
Style: Fantasy portrait with cosmic elements, mystical and romantic.`,
	},
	{
		Type: "future_baby",
		Prompt: `An adorable and cute baby portrait, soft diffused natural light, warm pastel nursery background.
Chubby cheeks, big innocent sparkling eyes, the sweetest little smile.
Gentle soft pink, cream and mint color palette, dreamy and tender atmosphere.
Professional baby portrait photography, 8K quality, heartwarming and precious.
Style: Newborn portrait photography, soft and angelic.`,
	},
	{
		Type: "future_wife",
		Prompt: `An elegant and graceful young woman portrait, sophisticated and refined beauty.
She wears a delicate outfit suggesting a wedding or formal occasion, with soft lace or silk details.
Soft golden backlighting, romantic and timeless atmosphere, rose and cream tones.
Professional portrait photography, 8K quality, hyperrealistic, bridal elegance.
Style: Elegant bridal portrait, classic and timeless beauty.`,
	},
	{
		Type: "future_husband",
		Prompt: `A distinguished and mature young man portrait, confident and reliable aura.
Well-dressed in a classic suit or formal attire, with a warm assured expression.
Rich warm tones, amber and navy color palette, sophisticated background.
Professional portrait photography, 8K quality, hyperrealistic, polished and refined.
Style: Classic gentleman portrait, sophisticated and dependable.`,
	},
	{
		Type: "companion",
		Prompt: `A warm and trustworthy person portrait, standing in an outdoor adventure setting.
Wearing casual outdoor clothing, with a reassuring and dependable expression.
Beautiful nature background with mountains or forest, teal and earth tones.
Professional portrait photography, 8K quality, hyperrealistic, warm natural lighting.
Style: Adventure lifestyle portrait, reliable and adventurous spirit.`,
	},
	{
		Type: "wise_mentor",
		Prompt: `A wise and dignified older person portrait, emanating knowledge and calm authority.
Distinguished features with silver or grey accents, warm penetrating eyes full of wisdom.
Surrounded by warm ambient light, books or scholarly elements softly visible in background.
Rich golden and amber color palette, library or study atmosphere.
Professional portrait photography, 8K quality, hyperrealistic, scholarly elegance.
Style: Distinguished scholar portrait, wisdom and gravitas.`,
	},
	{
		Type: "dream_guide",
		Prompt: `A mysterious and ethereal figure portrait, ancient and dreamlike atmosphere.
The person appears from another era or dimension, with flowing garments and an enigmatic expression.
Surreal purple, gold, and deep indigo color palette, floating luminous particles.
Misty and otherworldly background suggesting a dreamscape or past life memory.
Professional portrait photography merged with fantasy art, 8K quality, hauntingly beautiful.
Style: Dark fantasy portrait, mystical and ancient.`,
	},
	{
		Type: "mysterious_stranger",
		Prompt: `A mysterious silhouette portrait, the person is partially obscured by shadow and mist.
Only hints of their features are visible - glinting eyes, the curve of a smile in darkness.
Dark moody atmosphere with dramatic chiaroscuro lighting, deep navy and charcoal tones.
Noir-inspired composition with a single shaft of light revealing partial features.
Professional portrait photography, 8K quality, cinematic mystery.
Style: Film noir portrait, enigmatic and intriguing.`,
	},
}

func main() {
	// Load .env
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY not set. Please set it in .env or environment.")
	}

	// Output directory
	outputDir := "../../public/presets"
	if len(os.Args) > 1 {
		outputDir = os.Args[1]
	}

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		log.Fatalf("Failed to create Gemini client: %v", err)
	}

	log.Printf("Starting preset image generation for %d types...", len(presets))
	log.Printf("Output directory: %s", outputDir)

	successCount := 0
	for i, preset := range presets {
		outputPath := filepath.Join(outputDir, preset.Type+".jpg")

		// Check if already exists
		if _, err := os.Stat(outputPath); err == nil {
			log.Printf("[%d/%d] %s - already exists, skipping", i+1, len(presets), preset.Type)
			successCount++
			continue
		}

		log.Printf("[%d/%d] Generating %s...", i+1, len(presets), preset.Type)

		err := generateAndSave(ctx, client, preset.Prompt, outputPath)
		if err != nil {
			log.Printf("[%d/%d] FAILED %s: %v", i+1, len(presets), preset.Type, err)
			// Wait a bit and try once more
			time.Sleep(5 * time.Second)
			log.Printf("[%d/%d] Retrying %s...", i+1, len(presets), preset.Type)
			err = generateAndSave(ctx, client, preset.Prompt, outputPath)
			if err != nil {
				log.Printf("[%d/%d] RETRY FAILED %s: %v", i+1, len(presets), preset.Type, err)
				continue
			}
		}

		successCount++
		log.Printf("[%d/%d] SUCCESS %s -> %s", i+1, len(presets), preset.Type, outputPath)

		// Rate limiting: wait between requests
		if i < len(presets)-1 {
			time.Sleep(3 * time.Second)
		}
	}

	log.Printf("Done! Generated %d/%d preset images.", successCount, len(presets))
}

func generateAndSave(ctx context.Context, client *genai.Client, prompt string, outputPath string) error {
	// Add portrait aspect ratio instruction
	fullPrompt := prompt + "\n\nIMPORTANT: Generate this as a vertical 3:4 aspect ratio portrait. The subject should be centered in frame."

	// Use GenerateContentConfig for image generation
	imgConfig := &genai.GenerateContentConfig{
		ResponseModalities: []string{"TEXT", "IMAGE"},
		ImageConfig: &genai.ImageConfig{
			AspectRatio: "3:4",
		},
	}

	resp, err := client.Models.GenerateContent(ctx, "gemini-3-pro-image-preview", genai.Text(fullPrompt), imgConfig)
	if err != nil {
		return fmt.Errorf("API call failed: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return fmt.Errorf("no content in response")
	}

	for _, part := range resp.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			// Decode image
			img, _, decErr := image.Decode(
				newByteReader(part.InlineData.Data),
			)
			if decErr != nil {
				// Try with imaging library
				img, decErr = imaging.Decode(newByteReader(part.InlineData.Data))
				if decErr != nil {
					// Save raw bytes
					return os.WriteFile(outputPath, part.InlineData.Data, 0644)
				}
			}

			// Resize to reasonable card size (450x600 for 3:4)
			resized := imaging.Fill(img, 450, 600, imaging.Center, imaging.Lanczos)

			// Save as JPEG
			file, fErr := os.Create(outputPath)
			if fErr != nil {
				return fErr
			}
			defer file.Close()

			return jpeg.Encode(file, resized, &jpeg.Options{Quality: 90})
		}

		if part.Text != "" {
			log.Printf("  Text response: %s", part.Text[:min(100, len(part.Text))])
		}
	}

	return fmt.Errorf("no image data in response")
}

type byteReader struct {
	data []byte
	pos  int
}

func newByteReader(data []byte) *byteReader {
	return &byteReader{data: data}
}

func (r *byteReader) Read(p []byte) (n int, err error) {
	if r.pos >= len(r.data) {
		return 0, fmt.Errorf("EOF")
	}
	n = copy(p, r.data[r.pos:])
	r.pos += n
	return
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
