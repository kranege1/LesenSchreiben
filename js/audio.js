/**
 * audio.js - Audio playback for sentences and words
 * Tries loading offline files first, falls back to Web Speech Synthesis.
 */

export class AppAudio {
    constructor() {
        this.synth = window.speechSynthesis;
        this.germanVoice = null;
        this.audioElement = new Audio();
        this.onPlayProgress = null;
        this._initVoices();
    }

    /**
     * Unlocks the audio context for subsequent async playbacks
     */
    unlock() {
        if (this.audioElement) {
            // Silent 1s wav file
            this.audioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA';
            this.audioElement.play().catch(() => {});
        }
        
        // Silent TTS utterance
        if (this.synth) {
            const utterance = new SpeechSynthesisUtterance('');
            this.synth.speak(utterance);
        }
    }

    _initVoices() {
        // Load speech synthesis voices
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            // Try to find Austrian or German voices
            this.germanVoice = voices.find(v => v.lang === 'de-AT') || 
                               voices.find(v => v.lang.startsWith('de-')) || 
                               voices[0];
        };
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    /**
     * Helper to compute file slugs for words matching python's generation
     */
    _getWordSlug(word) {
        return word.toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
    }

    /**
     * Plays a full sentence audio.
     * @param {string} sentenceId - The ID of the sentence.
     * @param {string} text - Fallback text to speak.
     */
    async playSentence(sentenceId, text) {
        return this.playMedia(`./audio/${sentenceId}.mp3`, text);
    }

    /**
     * Plays a single word audio. Fallback to browser TTS if MP3 is missing.
     * @param {string} wordText - The raw or cleaned word text.
     */
    async playWord(wordText) {
        const slug = this._getWordSlug(wordText);
        return this.playMedia(`./audio/word_${slug}.mp3`, wordText);
    }

    /**
     * Plays audio via URL, falling back to TTS on failure.
     */
    async playMedia(url, fallbackText) {
        return new Promise((resolve) => {
            const audio = this.audioElement;
            
            // Stop any currently active playbacks
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            
            audio.onended = null;
            audio.onerror = null;
            audio.ontimeupdate = null;
            
            let hasTriggeredFallback = false;

            const triggerFallback = () => {
                if (hasTriggeredFallback) return;
                hasTriggeredFallback = true;
                console.log(`Audio file ${url} failed to play. Falling back to Web Speech Synthesis.`);
                this.speak(fallbackText).then(resolve);
            };
            
            audio.ontimeupdate = () => {
                if (this.onPlayProgress && audio.duration) {
                    this.onPlayProgress(audio.currentTime / audio.duration);
                }
            };

            audio.onended = () => {
                if (this.onPlayProgress) this.onPlayProgress(1.0);
                resolve();
            };

            audio.onerror = () => {
                triggerFallback();
            };

            audio.src = url;
            audio.play().catch(err => {
                // If the audio was aborted intentionally, do not fall back to speech synthesis
                if (err.name === 'AbortError') {
                    resolve();
                    return;
                }
                triggerFallback();
            });
        });
    }

    /**
     * Speaks text using client SpeechSynthesis
     */
    async speak(text) {
        return new Promise((resolve) => {
            if (this.synth.speaking) {
                this.synth.cancel();
            }

            const cleanText = text.replace(/_/g, ' ');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            if (this.germanVoice) {
                utterance.voice = this.germanVoice;
            }
            utterance.lang = 'de-DE';
            utterance.rate = 0.85; // slightly slower for educational clarity

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (e) => {
                console.error("SpeechSynthesis error:", e);
                resolve();
            };

            this.synth.speak(utterance);
        });
    }

    /**
     * Stop all active speech immediately
     */
    stop() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
    }

    /**
     * Synthesize a cheerful success fanfare chime when a perfect score is achieved.
     */
    playSuccessFanfare() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const startTime = ctx.currentTime;
            
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, startTime + idx * 0.10);
                
                gain.gain.setValueAtTime(0, startTime + idx * 0.10);
                gain.gain.linearRampToValueAtTime(0.15, startTime + idx * 0.10 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.10 + 0.35);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(startTime + idx * 0.10);
                osc.stop(startTime + idx * 0.10 + 0.35);
            });
        } catch (e) {
            console.warn("Could not play success fanfare:", e);
        }
    }

    /**
     * Synthesize a soft buzzer sound when a word is skipped or unrecognized.
     */
    playErrorSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.warn("Could not play error sound:", e);
        }
    }
}
