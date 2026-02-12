import os
from google import genai
from google.genai import types

api_key = "AIzaSyAVRpgku-fZQM9nVJoyyJAQzLNZ0yyicps"
client = genai.Client(api_key=api_key)

prompt = "A 3D skeuomorphic sticker of a dashboard icon. The background must be transparent and the output must have an alpha channel."

try:
    # Try passing include_alpha in config
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config={
            "response_modalities": ["IMAGE"],
            "image_config": {
                "include_alpha": True
            }
        }
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            with open("test_alpha.png", "wb") as f:
                f.write(part.inline_data.data)
            print("Saved test_alpha.png")
except Exception as e:
    print(f"Error: {e}")
