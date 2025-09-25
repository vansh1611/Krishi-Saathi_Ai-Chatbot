from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
try:
    from google import genai
except Exception:
    genai = None
app = Flask(__name__, static_folder="static")
CORS(app)

# Read API key and model from environment variables
API_KEY = os.environ.get("GOOGLE_API_KEY")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

if not API_KEY:
    print("WARNING: GOOGLE_API_KEY not set. The server will start but Gemini calls will fail until you set it.")
if genai:
    client = genai.Client(api_key=API_KEY)
else:
    client = None

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    # serve static files
    return send_from_directory("static", path)

@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Expects JSON: { "message": "...", "lang": "en" }
    Returns JSON: { "reply": "..." }
    """
    data = request.get_json(force=True)
    message = data.get("message", "")
    lang = data.get("lang", "en")
    if not message:
        return jsonify({"error":"empty message"}), 400

    # Simple system instruction to make answers friendly, concise, and in user's language
    system_instruction = (
        "You are Krishi-Saathi, an expert agronomist and friendly assistant for smallholder farmers in India. "
        "Answer simply and practically. When asked about crops, soils, fertilizers, pests or planting times, give step-by-step advice, "
        "mention local/seasonal considerations, and use plain language. If you are unsure, say so and recommend contacting local agricultural extension services. "
        f"Respond in the same language as the user (language code: {lang})."
    )

    prompt = system_instruction + "\n\nUser: " + message

    if client is None:
        return jsonify({"error":"Gemini client library not installed on server. Install 'google-genai' and restart."}), 500
    try:
        # Generate content (simple, synchronous)
        resp = client.models.generate_content(model=MODEL, contents=prompt)
        # The SDK returns an object with .text for text responses
        reply = getattr(resp, "text", None)
        if reply is None:
            # fallback: try str(resp)
            reply = str(resp)
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Use port 5000 by default
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
    from flask import send_file
import io
from google.cloud import texttospeech

@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text", "")
    lang = data.get("lang", "en")

    lang_map = {
        "en": "en-IN",
        "hi": "hi-IN",
        "gu": "gu-IN"
    }
    language_code = lang_map.get(lang, "en-IN")

    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code,
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    return send_file(
        io.BytesIO(response.audio_content),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="tts.mp3"
    )
