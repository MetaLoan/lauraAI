package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

func main() {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY not set")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		log.Fatal(err)
	}

	iter, err := client.Models.List(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	count := 0
	for {
		model, err := iter.Next(ctx)
		if err != nil {
			fmt.Printf("End/Error: %v\n", err)
			break
		}
		fmt.Printf("Model: %s\n", model.Name)
		count++
	}
	fmt.Printf("Total models found: %d\n", count)
}
