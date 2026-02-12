from google import genai
from google.genai import types

api_key = "AIzaSyAVRpgku-fZQM9nVJoyyJAQzLNZ0yyicps"
client = genai.Client(api_key=api_key)

prompt = "A 3D skeuomorphic sticker of a dashboard icon. Transparent background."

try:
    # Trying with gemini-2.5-flash-image
    # And adding some possible config for transparency
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                # There might be a parameter for alpha or format
                # But let's try to just be very explicit in the prompt
            )
        )
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            print(f"MIME type: {part.inline_data.mime_type}")
            with open("test_transparency.png", "wb") as f:
                f.write(part.inline_data.data)
except Exception as e:
    print(f"Error: {e}")
