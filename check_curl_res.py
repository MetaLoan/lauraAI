import json
import base64
from PIL import Image
import io

with open("raw_response.json", "r") as f:
    data = json.load(f)

# The response structure is usually candidates[0].content.parts[0].inlineData.data
try:
    img_data_b64 = data['candidates'][0]['content']['parts'][0]['inlineData']['data']
    img_bytes = base64.b64decode(img_data_b64)
    img = Image.open(io.BytesIO(img_bytes))
    print(f"Mode: {img.mode}")
    img.save("extracted_from_curl.png")
except Exception as e:
    print(f"Error: {e}")
    # Print keys to debug
    if 'candidates' in data:
        print("Candidates found")
        if 'content' in data['candidates'][0]:
            print("Content found")
            if 'parts' in data['candidates'][0]['content']:
                print(f"Parts found: {len(data['candidates'][0]['content']['parts'])}")
                print(data['candidates'][0]['content']['parts'][0].keys())
