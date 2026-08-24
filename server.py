import os
import json
import re
import asyncio
import urllib.parse
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = int(os.environ.get("PORT", 8000))

# Try importing edge_tts
try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    HAS_EDGE_TTS = False

VOICE = "de-AT-IngridNeural"

async def generate_file(text, filepath):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(filepath)

def get_missing_audios():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sentences_path = os.path.join(base_dir, 'data', 'sentences.json')
    audio_dir = os.path.join(base_dir, 'audio')
    
    if not os.path.exists(sentences_path):
        return {"error": "sentences.json not found", "missing_sentences": [], "missing_words": []}
        
    with open(sentences_path, 'r', encoding='utf-8') as f:
        sentences = json.load(f)
        
    missing_sentences = []
    missing_words = []
    unique_words = set()
    
    for s in sentences:
        s_id = s['id']
        s_text = s['sentence']
        s_file = os.path.join(audio_dir, f"{s_id}.mp3")
        if not os.path.exists(s_file):
            missing_sentences.append({"id": s_id, "text": s_text})
            
        for w_data in s['words']:
            clean_word = w_data['clean']
            if clean_word:
                unique_words.add(clean_word)
                
    for word in sorted(unique_words):
        word_slug = re.sub(r'[^a-z0-9]', '_', word.lower())
        w_file = os.path.join(audio_dir, f"word_{word_slug}.mp3")
        if not os.path.exists(w_file):
            missing_words.append({"word": word, "filename": f"word_{word_slug}.mp3"})
            
    return {
        "has_edge_tts": HAS_EDGE_TTS,
        "missing_sentences": missing_sentences,
        "missing_words": missing_words
    }

async def generate_missing_audios_async():
    if not HAS_EDGE_TTS:
        return {"error": "edge-tts package not installed on server."}
        
    status = get_missing_audios()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    audio_dir = os.path.join(base_dir, 'audio')
    os.makedirs(audio_dir, exist_ok=True)
    
    generated_count = 0
    for s in status["missing_sentences"]:
        s_file = os.path.join(audio_dir, f"{s['id']}.mp3")
        try:
            await generate_file(s['text'], s_file)
            generated_count += 1
        except Exception as e:
            print(f"Failed to generate: {e}")
            
    for w in status["missing_words"]:
        w_file = os.path.join(audio_dir, w['filename'])
        try:
            await generate_file(w['word'], w_file)
            generated_count += 1
        except Exception as e:
            print(f"Failed to generate: {e}")
            
    return {"success": True, "generated": generated_count}

class CustomHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/audio-status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            status = get_missing_audios()
            self.wfile.write(json.dumps(status).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/generate-missing-audio':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # Run async generator in event loop
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
            if loop.is_running():
                # If running inside a loop (like nested loops in some setups)
                import nest_asyncio
                nest_asyncio.apply()
                result = loop.run_until_complete(generate_missing_audios_async())
            else:
                result = loop.run_until_complete(generate_missing_audios_async())
                
            self.wfile.write(json.dumps(result).encode('utf-8'))
        else:
            self.send_error(404, "Not Found")

if __name__ == '__main__':
    print(f"Starting custom server on port {PORT}...")
    httpd = HTTPServer(('0.0.0.0', PORT), CustomHandler)
    httpd.serve_forever()
