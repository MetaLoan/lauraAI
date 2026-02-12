import os
from google import genai

api_key = "AIzaSyAVRpgku-fZQM9nVJoyyJAQzLNZ0yyicps"
client = genai.Client(api_key=api_key)

for m in client.models.list():
    if 'image' in m.name.lower():
        print(m)
