
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL")

print("Checking Gemini API...")

try:
    if not api_key:
        raise ValueError("Gemini API key is missing")

    if not model:
        raise ValueError("Gemini model is missing")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model,
        contents="Explain artificial intelligence in exactly three sentences."
    )

    print("\nGEMINI API CONNECTION SUCCESSFUL")
    print("\nGemini response:")
    print(response.text)

except Exception as e:
    print("\nGEMINI API ERROR:")
    print(str(e))
