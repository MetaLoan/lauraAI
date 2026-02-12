import os
from google import genai
from google.genai import types

api_key = "AIzaSyAVRpgku-fZQM9nVJoyyJAQzLNZ0yyicps"
client = genai.Client(api_key=api_key)

prompt = "A 3D skeuomorphic icon of a dashboard. Transparent background. High quality PNG with alpha channel."

try:
    response = client.models.generate_content(
        model="imagen-4.0-generate-001", 
        contents=prompt,
        config={
            "response_modalities": ["IMAGE"],
        }
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            with open("test_imagen4.png", "wb") as f:
                f.write(part.inline_data.data)
            print("Saved test_imagen4.png")
except Exception as e:
    print(f"Error: {e}")
