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
     * Stop all active speech and media playback immediately
     */
    stop() {
        if (this.audioElement) {
            try {
                this.audioElement.pause();
                this.audioElement.removeAttribute('src');
                this.audioElement.load();
            } catch (e) {
                // Ignore
            }
        }
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
     * Synthesize a cheerful success fanfare chime when a perfect score is achieved.
     */
    playSuccessFanfare() {
        const soundId = localStorage.getItem('soundSuccess') || 'success_fanfare';
        this.playRegistrySound(soundId);
    }

    /**
     * Synthesize a soft buzzer sound when a word is skipped or unrecognized.
     */
    playErrorSound() {
        const soundId = localStorage.getItem('soundError') || 'error_buzz';
        this.playRegistrySound(soundId);
    }

    /**
     * Plays a sound from the Web Audio API registry.
     */
    playRegistrySound(soundId) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            const registry = {
                // SUCCESS SOUNDS
                "success_fanfare": (c) => {
                    const notes = [523.25, 659.25, 783.99, 1046.50];
                    const startTime = c.currentTime;
                    notes.forEach((freq, idx) => {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, startTime + idx * 0.10);
                        gain.gain.setValueAtTime(0, startTime + idx * 0.10);
                        gain.gain.linearRampToValueAtTime(0.15, startTime + idx * 0.10 + 0.03);
                        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.10 + 0.35);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(startTime + idx * 0.10); osc.stop(startTime + idx * 0.10 + 0.35);
                    });
                },
                "retro_powerup": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, c.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.4);
                    gain.gain.setValueAtTime(0.15, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.4);
                },
                "happy_bell": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(987.77, c.currentTime);
                    gain.gain.setValueAtTime(0.2, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.8);
                },
                "jazz_trumpet": (c) => {
                    const freqs = [392.00, 523.25, 659.25];
                    freqs.forEach((freq, idx) => {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.08);
                        gain.gain.setValueAtTime(0, c.currentTime + idx * 0.08);
                        gain.gain.linearRampToValueAtTime(0.08, c.currentTime + idx * 0.08 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.08 + 0.3);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(c.currentTime + idx * 0.08); osc.stop(c.currentTime + idx * 0.08 + 0.3);
                    });
                },
                "space_laser": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(150, c.currentTime);
                    osc.frequency.linearRampToValueAtTime(1800, c.currentTime + 0.35);
                    gain.gain.setValueAtTime(0.12, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.35);
                },
                "victory_fanfare": (c) => {
                    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
                    notes.forEach((freq, idx) => {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.07);
                        gain.gain.setValueAtTime(0, c.currentTime + idx * 0.07);
                        gain.gain.linearRampToValueAtTime(0.12, c.currentTime + idx * 0.07 + 0.03);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.07 + 0.45);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(c.currentTime + idx * 0.07); osc.stop(c.currentTime + idx * 0.07 + 0.45);
                    });
                },
                "bubbly_pop": (c) => {
                    [600, 900, 1200].forEach((freq, idx) => {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.06);
                        gain.gain.setValueAtTime(0, c.currentTime + idx * 0.06);
                        gain.gain.linearRampToValueAtTime(0.15, c.currentTime + idx * 0.06 + 0.01);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.06 + 0.08);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(c.currentTime + idx * 0.06); osc.stop(c.currentTime + idx * 0.06 + 0.08);
                    });
                },
                "digital_ping": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1500, c.currentTime);
                    gain.gain.setValueAtTime(0.15, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.15);
                },
                "fairy_sparkle": (c) => {
                    for(let i=0; i<8; i++) {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(800 + Math.random() * 800, c.currentTime + i * 0.04);
                        gain.gain.setValueAtTime(0, c.currentTime + i * 0.04);
                        gain.gain.linearRampToValueAtTime(0.08, c.currentTime + i * 0.04 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.04 + 0.2);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(c.currentTime + i * 0.04); osc.stop(c.currentTime + i * 0.04 + 0.2);
                    }
                },
                "trophy_fanfare": (c) => {
                    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
                    notes.forEach((freq, idx) => {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.05);
                        gain.gain.setValueAtTime(0, c.currentTime + idx * 0.05);
                        gain.gain.linearRampToValueAtTime(0.1, c.currentTime + idx * 0.05 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.05 + 0.25);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(c.currentTime + idx * 0.05); osc.stop(c.currentTime + idx * 0.05 + 0.25);
                    });
                },
                
                // ERROR SOUNDS
                "error_buzz": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, c.currentTime);
                    osc.frequency.linearRampToValueAtTime(90, c.currentTime + 0.3);
                    gain.gain.setValueAtTime(0.12, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.3);
                },
                "sad_trombone": (c) => {
                    const notes = [220, 207.65, 196, 174.61];
                    notes.forEach((freq, idx) => {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.15);
                        osc.frequency.linearRampToValueAtTime(freq - 15, c.currentTime + idx * 0.15 + 0.15);
                        gain.gain.setValueAtTime(0, c.currentTime + idx * 0.15);
                        gain.gain.linearRampToValueAtTime(0.1, c.currentTime + idx * 0.15 + 0.03);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.15 + 0.15);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(c.currentTime + idx * 0.15); osc.stop(c.currentTime + idx * 0.15 + 0.15);
                    });
                },
                "retro_hit": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(100, c.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.2, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.2);
                },
                "laser_zap": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, c.currentTime);
                    osc.frequency.linearRampToValueAtTime(150, c.currentTime + 0.25);
                    gain.gain.setValueAtTime(0.15, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.25);
                },
                "warning_beep": (c) => {
                    [440, 440].forEach((freq, idx) => {
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.15);
                        gain.gain.setValueAtTime(0, c.currentTime + idx * 0.15);
                        gain.gain.linearRampToValueAtTime(0.15, c.currentTime + idx * 0.15 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.15 + 0.12);
                        osc.connect(gain); gain.connect(c.destination);
                        osc.start(c.currentTime + idx * 0.15); osc.stop(c.currentTime + idx * 0.15 + 0.12);
                    });
                },
                "boing_bounce": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(150, c.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(450, c.currentTime + 0.25);
                    gain.gain.setValueAtTime(0.15, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.25);
                },
                "spring_boing_down": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(450, c.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.3);
                    gain.gain.setValueAtTime(0.15, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.3);
                },
                "deep_drum_thud": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(90, c.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.4);
                    gain.gain.setValueAtTime(0.25, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.4);
                },
                "system_alert": (c) => {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(660, c.currentTime);
                    osc.frequency.setValueAtTime(880, c.currentTime + 0.08);
                    gain.gain.setValueAtTime(0.15, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
                    osc.connect(gain); gain.connect(c.destination);
                    osc.start(); osc.stop(c.currentTime + 0.25);
                },
                "static_zap": (c) => {
                    const bufferSize = c.sampleRate * 0.12;
                    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    const noise = c.createBufferSource();
                    noise.buffer = buffer;
                    const gain = c.createGain();
                    gain.gain.setValueAtTime(0.05, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
                    noise.connect(gain); gain.connect(c.destination);
                    noise.start(); noise.stop(c.currentTime + 0.12);
                }
            };
            
            const player = registry[soundId];
            if (player) {
                player(ctx);
            }
        } catch (e) {
            console.warn("Could not play registry sound:", e);
        }
    }

    /**
     * Play a sound effect from the audio/sounds folder.
     * @param {string} fileName - Name of the mp3 file under audio/sounds.
     */
    playEffect(fileName) {
        if (!fileName || fileName === 'none') return;
        try {
            const audio = new Audio(`./audio/sounds/${fileName}`);
            audio.volume = 0.5;
            audio.play().catch(err => {
                // Ignore AbortError when audio is stopped/restarted
                if (err.name !== 'AbortError') {
                    console.warn(`Could not play effect ${fileName}:`, err);
                }
            });
        } catch (e) {
            console.warn(`Error playing effect ${fileName}:`, e);
        }
    }
}

export const SOUNDS_REGISTRY = [
    { id: "success_fanfare", name: "Klassische Fanfare", type: "success" },
    { id: "retro_powerup", name: "Retro Power-Up 🚀", type: "success" },
    { id: "happy_bell", name: "Glücksglöckchen 🔔", type: "success" },
    { id: "jazz_trumpet", name: "Mini-Trompete 🎺", type: "success" },
    { id: "space_laser", name: "Weltall-Laser 🌠", type: "success" },
    { id: "victory_fanfare", name: "Siegeshymne 🏆", type: "success" },
    { id: "bubbly_pop", name: "Seifenblasen-Pop 🫧", type: "success" },
    { id: "digital_ping", name: "Digitaler Ping 💻", type: "success" },
    { id: "fairy_sparkle", name: "Feenstaub ✨", type: "success" },
    { id: "trophy_fanfare", name: "Pokal-Fanfare 🥇", type: "success" },
    
    { id: "error_buzz", name: "Klassischer Brummer", type: "error" },
    { id: "sad_trombone", name: "Traurige Posaune 😭", type: "error" },
    { id: "retro_hit", name: "Retro Treffer 💥", type: "error" },
    { id: "laser_zap", name: "Laser-Schuss ⚡", type: "error" },
    { id: "warning_beep", name: "Warn-Piepser 🚨", type: "error" },
    { id: "boing_bounce", name: "Sprungfeder 🌀", type: "error" },
    { id: "spring_boing_down", name: "Feder-Absturz 📉", type: "error" },
    { id: "deep_drum_thud", name: "Trommel-Schlag 🥁", type: "error" },
    { id: "system_alert", name: "System-Alarm 📱", type: "error" },
    { id: "static_zap", name: "Statik-Blitz 🔌", type: "error" }
];
