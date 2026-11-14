
import os
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

api_key = os.getenv("TAVILY_API_KEY")

if not api_key:
    print("ERROR: Tavily API key not found.")
else:
    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query="NVIDIA latest AI developments",
            topic="news",
            max_results=3
        )

        print("TAVILY API CONNECTION SUCCESSFUL")

        for result in response.get("results", []):
            print("Title:", result.get("title"))
            print("URL:", result.get("url"))
            print("---")

    except Exception as e:
        print("TAVILY API ERROR:", str(e))
