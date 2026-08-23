/**
 * speech.js - Speech recognition controller for Karaoke Tracking in Reading Mode
 * Uses native Web Speech API (webkitSpeechRecognition)
 */

export class AppSpeech {
    /**
     * @param {Function} onWordMatched - Callback (wordIndex) when a word is read correctly
     * @param {Function} onInterimResult - Callback (transcript) for live preview
     * @param {Function} onFinished - Callback (success) when full sentence is read
     * @param {Function} onError - Callback (errorMessage)
     */
    constructor(onWordMatched, onInterimResult, onFinished, onError) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
        
        this.onWordMatched = onWordMatched;
        this.onInterimResult = onInterimResult;
        this.onFinished = onFinished;
        this.onError = onError;
        
        this.targetWords = [];
        this.currentWordIndex = 0;
        this.isListening = false;
        
        this._setupRecognition();
    }

    isSupported() {
        return this.recognition !== null;
    }

    _setupRecognition() {
        if (!this.recognition) return;

        this.recognition.lang = 'de-DE'; // Fallback / default
        this.recognition.interimResults = true;
        this.recognition.continuous = true;

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const fullTranscript = (finalTranscript + ' ' + interimTranscript).trim().toLowerCase();
            this.onInterimResult(fullTranscript);
            this._processTranscript(fullTranscript);
        };

        this.recognition.onerror = (e) => {
            console.error("Speech Recognition Error:", e);
            if (e.error === 'not-allowed') {
                this.onError("Zugriff auf Mikrofon verweigert. Bitte in den Einstellungen erlauben.");
            } else if (e.error === 'no-speech') {
                // Silently ignore or show brief notification
            } else {
                this.onError(`Erkennungsfehler: ${e.error}`);
            }
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                // Keep listening or restart if expected, but let's handle via state
                try {
                    this.recognition.start();
                } catch (e) {
                    // Already running
                }
            }
        };
    }

    /**
     * Start speech recognition for a sentence
     * @param {Array} wordsArray - Array of word objects (from sentences.json)
     * @param {number} startIndex - Index to start matching from
     * @param {string} locale - 'de-AT' or 'de-DE'
     */
    start(wordsArray, startIndex = 0, locale = 'de-AT') {
        if (!this.isSupported()) {
            this.onError("Spracherkennung wird von diesem Browser nicht unterstützt.");
            return;
        }

        this.targetWords = wordsArray.map(w => w.clean.toLowerCase());
        this.currentWordIndex = startIndex;
        this.isListening = true;
        
        this.recognition.lang = locale;

        try {
            this.recognition.start();
        } catch (e) {
            console.warn("Recognition already started or starting:", e);
        }
    }

    stop() {
        this.isListening = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Compare live speech tokens against the remaining sentence words
     */
    _processTranscript(transcript) {
        if (this.currentWordIndex >= this.targetWords.length) return;

        // Clean punctuation from speech words
        const spokenTokens = transcript
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
            .split(/\s+/);

        let advanced = false;
        
        // Scan spoken words to see if we match the next expected word(s)
        for (const token of spokenTokens) {
            if (this.currentWordIndex >= this.targetWords.length) break;

            const target = this.targetWords[this.currentWordIndex];
            
            // Loose comparison: check matching or substring (to handle slight recognition variations)
            if (token === target || 
                this._isFuzzyMatch(token, target)) {
                
                this.onWordMatched(this.currentWordIndex);
                this.currentWordIndex++;
                advanced = true;
            }
        }

        if (this.currentWordIndex >= this.targetWords.length) {
            this.stop();
            this.onFinished(true);
        }
    }

    /**
     * Allow minor speech variations (e.g. spelling of umlauts or endings)
     */
    _isFuzzyMatch(spoken, target) {
        if (spoken.length < 2 || target.length < 2) return false;
        
        // Normalize common German speech recognition replacements
        const norm = (s) => s
            .replace(/ae/g, 'ä')
            .replace(/oe/g, 'ö')
            .replace(/ue/g, 'ü')
            .replace(/ß/g, 'ss');

        const sNorm = norm(spoken);
        const tNorm = norm(target);

        if (sNorm === tNorm) return true;

        // Levenshtein / simple edit distance fallback for longer words
        if (target.length > 5) {
            const distance = this._editDistance(sNorm, tNorm);
            return distance <= 1; // allow 1 character difference
        }

        return false;
    }

    _editDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i - 1][j] + 1, // insertion
                            matrix[i][j - 1] + 1  // deletion
                        )
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}
