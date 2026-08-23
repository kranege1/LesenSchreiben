import os
import json
import re

def fallback_hyphenate(word):
    # Clean non-letters
    clean_word = re.sub(r'[^a-zA-ZäöüÄÖÜß]', '', word)
    if len(clean_word) <= 3:
        return [clean_word] if clean_word else [word]

    vowels = 'aeiouäöüAEIOUÄÖÜ'
    diphthongs = ['ei', 'au', 'eu', 'äu', 'ie', 'EI', 'AU', 'EU', 'ÄU', 'IE']
    
    # We want to identify vowel groups and consonant groups
    tokens = []
    i = 0
    while i < len(clean_word):
        # Check diphthong
        if i < len(clean_word) - 1 and clean_word[i:i+2].lower() in diphthongs:
            tokens.append((clean_word[i:i+2], 'V'))
            i += 2
        elif clean_word[i] in vowels:
            tokens.append((clean_word[i], 'V'))
            i += 1
        else:
            # Consonants
            # Check ch, sch, ph, th, st, sp
            if i < len(clean_word) - 2 and clean_word[i:i+3].lower() == 'sch':
                tokens.append((clean_word[i:i+3], 'C'))
                i += 3
            elif i < len(clean_word) - 1 and clean_word[i:i+2].lower() in ['ch', 'ph', 'th', 'st', 'sp', 'pf', 'qu']:
                tokens.append((clean_word[i:i+2], 'C'))
                i += 2
            else:
                tokens.append((clean_word[i], 'C'))
                i += 1
                
    # Now, split syllables based on tokens
    # General rule: split before the last consonant in a sequence between two vowels
    syllables = []
    current_syllable = ""
    
    vowel_indices = [idx for idx, t in enumerate(tokens) if t[1] == 'V']
    
    if not vowel_indices:
        return [word]
        
    start_tok = 0
    for idx, v_idx in enumerate(vowel_indices):
        if idx == len(vowel_indices) - 1:
            # Last vowel, take all remaining tokens
            part = "".join(t[0] for t in tokens[start_tok:])
            if part:
                syllables.append(part)
        else:
            # Between this vowel and next vowel
            next_v_idx = vowel_indices[idx + 1]
            consonants_between = tokens[v_idx + 1 : next_v_idx]
            
            if not consonants_between:
                # No consonants, split between vowels (hi-atus)
                split_at = v_idx + 1
            else:
                # Split before the last consonant structure
                # e.g., "s" in "le-sen", "t" in "Ka-tze" (if we treat tz as two consonants: t and z)
                split_at = next_v_idx - 1
                
            part = "".join(t[0] for t in tokens[start_tok:split_at])
            if part:
                syllables.append(part)
            start_tok = split_at
            
    return syllables

def get_syllables(word, dic=None):
    clean = re.sub(r'[^a-zA-ZäöüÄÖÜß]', '', word)
    if not clean:
        return [word]
    if dic:
        hyphenated = dic.inserted(clean)
        parts = hyphenated.split('-')
        return [p for p in parts if p]
    else:
        return fallback_hyphenate(clean)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    
    saetze_path = os.path.join(base_dir, 'data', 'saetze.txt')
    output_path = os.path.join(base_dir, 'data', 'sentences.json')
    
    dic = None
    try:
        import pyphen
        dic = pyphen.Pyphen(lang='de_DE')
        print("Pyphen successfully loaded for German.")
    except ImportError:
        print("Pyphen not installed. Using rule-based fallback syllable division.")
        
    sentences = []
    
    if not os.path.exists(saetze_path):
        print(f"Error: {saetze_path} not found.")
        return
        
    with open(saetze_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for index, line in enumerate(lines):
        line = line.strip()
        if not line or '|' not in line:
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) < 3:
            continue
            
        grade = int(parts[0])
        theme = parts[1]
        sentence = parts[2]
        
        is_story = theme.startswith("Story: ")
        story_name = theme[7:] if is_story else None
        
        # Word parsing
        raw_words = sentence.split(' ')
        words_data = []
        
        for w in raw_words:
            clean = re.sub(r'[^a-zA-ZäöüÄÖÜß]', '', w)
            syllables = get_syllables(clean, dic)
            words_data.append({
                "word": w,
                "clean": clean,
                "syllables": syllables
            })
            
        # Create a unique ID (make theme slug filesystem safe)
        sentence_slug = re.sub(r'[^a-z0-9]', '_', sentence.lower())[:30].strip('_')
        theme_clean = re.sub(r'[^a-z0-9]', '_', theme.lower())
        s_id = f"g{grade}_{theme_clean}_{sentence_slug}"
        
        sentences.append({
            "id": s_id,
            "grade": grade,
            "theme": theme,
            "sentence": sentence,
            "words": words_data,
            "story": story_name
        })
        
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sentences, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully generated {len(sentences)} sentences in {output_path}")

if __name__ == '__main__':
    main()
