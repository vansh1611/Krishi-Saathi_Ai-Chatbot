// Frontend logic: sends requests to /api/chat and uses the Web Speech API for mic input (if available).
const chatEl = document.getElementById("chat");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const msgInput = document.getElementById("messageInput");
const langSelect = document.getElementById("langSelect");
const statusEl = document.getElementById("status");
const themeToggle = document.getElementById("themeToggle");

// initialize theme
if(localStorage.getItem("farm_theme") === "dark"){
  document.body.classList.add("dark");
}
themeToggle.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("farm_theme", document.body.classList.contains("dark") ? "dark" : "light");
});

function addBubble(text, who="bot"){
  const div = document.createElement("div");
  div.className = "bubble " + (who === "user" ? "user" : "bot");
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendMessage(){
  const text = msgInput.value.trim();
  if(!text) return;
  addBubble(text, "user");
  msgInput.value = "";
  statusEl.textContent = "Thinking...";
  try{
    const resp = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message: text, lang: langSelect.value})
    });
    const data = await resp.json();
    if(data.error){
      addBubble("Error: " + data.error, "bot");
    } else {
      addBubble(data.reply, "bot");
    }
  } catch(err){
    addBubble("Network error: " + err.message, "bot");
  } finally {
    statusEl.textContent = "Ready";
  }
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => { if(e.key === "Enter") sendMessage(); });

// Microphone / Speech recognition
function getLocaleFromLang(code){
  if(code === "hi") return "hi-IN";
  if(code === "gu") return "gu-IN";
  if(code === "en") return "en-IN";
  return "en-IN";
}

let recognition = null;
function initRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) return null;
  try{
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.lang = getLocaleFromLang(langSelect.value);
    r.maxAlternatives = 1;
    r.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      msgInput.value = transcript;
      // Auto-send after speech captured
      sendMessage();
    };
    r.onerror = (e) => {
      console.error("Speech recognition error", e);
      statusEl.textContent = "Speech recognition error: " + e.error;
    };
    return r;
  } catch(e){
    return null;
  }
}

micBtn.addEventListener("click", ()=>{
  if(!recognition) recognition = initRecognition();
  if(!recognition){
    alert("Speech recognition not available in this browser. Use Chrome on desktop or Android for best support.");
    return;
  }
  recognition.lang = getLocaleFromLang(langSelect.value);
  try{
    recognition.start();
    statusEl.textContent = "Listening...";
  } catch(e){
    console.error(e);
    statusEl.textContent = "Failed to start microphone: " + e.message;
  }
});

// show a starter message
addBubble("Hello! Ask me about crops, soils, pests, weather-safe planting, or crop cycles. Choose language and use the mic or type your question.", "bot");

// --- TTS (Text-to-Speech) Logic ---
// Default to 'true' (audio on) unless explicitly set to 'false' in localStorage
const ttsToggleBtn = document.getElementById("ttsToggleBtn"); // <-- ADD THIS
let isTtsEnabled = localStorage.getItem('tts_enabled') !== 'false';

// Function to speak the bot's response
function speakText(text, lang) {
  if (!isTtsEnabled || !('speechSynthesis' in window)) {
    return; // Do nothing if TTS is disabled or not supported
  }
  // Cancel any previous speech to prevent overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  // Use the same locale mapping as the microphone input
  utterance.lang = getLocaleFromLang(lang); 
  
  // Optional: You can fine-tune pitch and rate
  // utterance.pitch = 1;
  // utterance.rate = 1;

  window.speechSynthesis.speak(utterance);
}

// Function to update the button's appearance based on state
function updateTtsButtonState() {
  if (isTtsEnabled) {
    ttsToggleBtn.textContent = '🔊'; // Speaker High Volume icon
    ttsToggleBtn.classList.remove('tts-off');
    ttsToggleBtn.title = "Audio response is ON";
  } else {
    ttsToggleBtn.textContent = '🔇'; // Muted Speaker icon
    ttsToggleBtn.classList.add('tts-off');
    ttsToggleBtn.title = "Audio response is OFF";
  }
}

// Event listener for the toggle button
ttsToggleBtn.addEventListener('click', () => {
  isTtsEnabled = !isTtsEnabled;
  localStorage.setItem('tts_enabled', isTtsEnabled);
  updateTtsButtonState();
  // If user just turned audio off, stop any current speech
  if (!isTtsEnabled) {
    window.speechSynthesis.cancel();
  }
});

// Set the initial button state on page load
updateTtsButtonState();
// --- End of TTS Logic ---