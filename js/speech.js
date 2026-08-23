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
            } else if (e.error === 'no-speech' || e.error === 'network') {
                // Silently ignore. The 'onend' handler will automatically restart recognition if isListening is true.
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
        const cleanTranscript = transcript
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
            .toLowerCase();

        // Strip all spaces for compound word checking (e.g. "so dass" vs "sodass")
        const spaceStrippedTranscript = cleanTranscript.replace(/\s+/g, "");

        let advanced = true;
        while (advanced && this.currentWordIndex < this.targetWords.length) {
            advanced = false;
            const target = this.targetWords[this.currentWordIndex];
            const targetNorm = this._normalizeGerman(target);

            // 1. Direct search in transcript tokens
            const spokenTokens = cleanTranscript.split(/\s+/);
            let matched = false;
            for (const token of spokenTokens) {
                const tokenNorm = this._normalizeGerman(token);
                if (tokenNorm === targetNorm || this._isFuzzyMatch(tokenNorm, targetNorm)) {
                    matched = true;
                    break;
                }
            }

            // 2. Compound word matching (target is "sodass", transcript has "so dass")
            if (!matched) {
                const targetNoSpace = targetNorm.replace(/\s+/g, "");
                if (spaceStrippedTranscript.includes(targetNoSpace)) {
                    matched = true;
                }
            }

            // 3. Reverse compound matching (target is "so dass", transcript has "sodass")
            if (!matched && targetNorm.includes(" ")) {
                const targetNoSpace = targetNorm.replace(/\s+/g, "");
                if (spaceStrippedTranscript.includes(targetNoSpace)) {
                    matched = true;
                }
            }

            if (matched) {
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
     * Normalize common German speech recognition replacements, numbers, and compounds
     */
    _normalizeGerman(text) {
        if (!text) return "";
        return text.toLowerCase()
            .replace(/ae/g, 'ä')
            .replace(/oe/g, 'ö')
            .replace(/ue/g, 'ü')
            .replace(/ß/g, 'ss')
            .replace(/\b1000\b/g, 'tausend')
            .replace(/\b100\b/g, 'hundert')
            .replace(/\b10\b/g, 'zehn')
            .replace(/\b9\b/g, 'neun')
            .replace(/\b8\b/g, 'acht')
            .replace(/\b7\b/g, 'sieben')
            .replace(/\b6\b/g, 'sechs')
            .replace(/\b5\b/g, 'fünf')
            .replace(/\b4\b/g, 'vier')
            .replace(/\b3\b/g, 'drei')
            .replace(/\b2\b/g, 'zwei')
            .replace(/\b1\b/g, 'eins');
    }

    /**
     * Allow minor speech variations (e.g. spelling of umlauts or endings)
     */
    _isFuzzyMatch(sNorm, tNorm) {
        if (sNorm === tNorm) return true;
        if (sNorm.length < 2 || tNorm.length < 2) return false;

        const distance = this._editDistance(sNorm, tNorm);
        
        // Forgiving tolerance thresholds scaled to target word size
        if (tNorm.length <= 4) {
            return distance <= 1; // Allow 1 typo/mishearing for short words (e.g., und -> unt, ist -> is)
        } else if (tNorm.length <= 8) {
            return distance <= 2; // Allow up to 2 typos for medium words
        } else {
            return distance <= 3; // Allow up to 3 typos for very long compound words (e.g. majestätisch)
        }
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
