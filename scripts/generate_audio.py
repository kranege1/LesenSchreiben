import os
import json
import asyncio
import re

# We will try to import edge_tts. If not installed, we inform the user.
try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    HAS_EDGE_TTS = False

VOICE = "de-AT-IngridNeural" # A natural Austrian-German voice suited for schools, fallback: de-DE-KatjaNeural

async def generate_file(text, filepath):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(filepath)

async def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    
    sentences_path = os.path.join(base_dir, 'data', 'sentences.json')
    audio_dir = os.path.join(base_dir, 'audio')
    
    os.makedirs(audio_dir, exist_ok=True)
    
    if not HAS_EDGE_TTS:
        print("\n" + "="*60)
        print("WARNING: 'edge-tts' package is not installed.")
        print("To generate offline audios, please install it via:")
        print("  pip install edge-tts")
        print("="*60 + "\n")
        return
        
    if not os.path.exists(sentences_path):
        print(f"Error: {sentences_path} not found. Run generate_sentences.py first.")
        return
        
    with open(sentences_path, 'r', encoding='utf-8') as f:
        sentences = json.load(f)
        
    print(f"Generating audio files in {audio_dir} using voice {VOICE}...")
    
    # We will generate audios for:
    # 1. The full sentences (filename: [sentence_id].mp3)
    # 2. Individual unique words (filename: word_[cleaned_word_lowercase].mp3)
    
    unique_words = set()
    
    for s in sentences:
        s_id = s['id']
        s_text = s['sentence']
        s_file = os.path.join(audio_dir, f"{s_id}.mp3")
        
        if not os.path.exists(s_file):
            print(f"Generating sentence audio: '{s_text}' -> {s_id}.mp3")
            try:
                await generate_file(s_text, s_file)
            except Exception as e:
                print(f"Failed to generate sentence audio for '{s_text}': {e}")
        else:
            print(f"Audio already exists for: {s_id}.mp3")
            
        for w_data in s['words']:
            clean_word = w_data['clean']
            if clean_word:
                unique_words.add(clean_word)
                
    for word in sorted(unique_words):
        word_slug = re.sub(r'[^a-z0-9]', '_', word.lower())
        w_file = os.path.join(audio_dir, f"word_{word_slug}.mp3")
        if not os.path.exists(w_file):
            print(f"Generating word audio: '{word}' -> word_{word_slug}.mp3")
            try:
                await generate_file(word, w_file)
            except Exception as e:
                print(f"Failed to generate word audio for '{word}': {e}")
        else:
            print(f"Audio already exists for: word_{word_slug}.mp3")
            
    print("Audio generation completed!")

if __name__ == '__main__':
    asyncio.run(main())
