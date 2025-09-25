# FarmBot — Farmer Q&A (Gemini-powered)

This is a minimal example project that demonstrates a simple web UI (single-page) and a Python/Flask backend that talks to the Google Gemini (GenAI) API using the official `google-genai` SDK.

## Features
- Simple chat UI for farmers (English, Hindi, Gujarati selection).
- Microphone icon uses browser Web Speech API to transcribe (client-side) and send text.
- Night mode (toggle).
- Flask backend that sends prompts to Google Gemini model and returns answers.

## How to run (quick)
1. Install Python 3.10+ and create a virtual environment.
```bash
python -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Get a Gemini API key from Google AI Studio (create account & "Get API Key") and export it:
```bash
export GOOGLE_API_KEY="YOUR_KEY_HERE"
# Optional: select model
export GEMINI_MODEL="gemini-2.5-flash"
```

3. Run the server:
```bash
python app.py
```

4. Open http://127.0.0.1:5000 in your browser.

## Notes & customization
- The project uses the `google-genai` Python SDK. See Google's GenAI docs for model choices and quotas.
- Microphone transcription uses the browser's Web Speech API — browser support varies (Chrome on desktop/Android works best).
- For production or public deployment, secure your API key (do not embed it in the frontend) and use server-side billing/project settings.

## Where to get help
- Google Gemini API docs / quickstart: https://ai.google.dev/gemini-api/docs/quickstart
- Google GenAI Python SDK docs: https://googleapis.github.io/python-genai/