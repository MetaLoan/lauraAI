import os
from google import genai
from google.genai import types

api_key = "AIzaSyAVRpgku-fZQM9nVJoyyJAQzLNZ0yyicps"
client = genai.Client(api_key=api_key)

# Trying one more time with explicit output_mime_type if it allows it via dict
prompt = "A 3D sticker of a dashboard. Transparent background."

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config={
            "response_modalities": ["IMAGE"],
            "image_config": {
                # Just trying everything
            },
            "output_mime_type": "image/png"
        }
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            with open("test_final.png", "wb") as f:
                f.write(part.inline_data.data)
            print("Saved test_final.png")
except Exception as e:
    print(f"Error: {e}")
