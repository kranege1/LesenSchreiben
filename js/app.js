/**
 * app.js - Main Application Controller for "Lesen & Schreiben"
 */

import { AppDB } from './db.js';
import { AppAudio, SOUNDS_REGISTRY } from './audio.js';
import { PencilCanvas } from './canvas.js';
import { SmartKeyboard } from './keyboard.js';
import { AppSpeech } from './speech.js';

const MP3_SOUNDS = [
    { file: "none", name: "Kein Sound 🔇" },
    { file: "ivan_luzan-beautiful-piano-logo-143488.mp3", name: "Schönes Klavier-Logo 🎹" },
    { file: "shidenbeatsmusic-funny-sound-effect-for-quotjack-in-the-boxquot-sound-ver1-110923.mp3", name: "Lustige Musikbox (Fehler) 📦" },
    { file: "cartoon_music-arcade-game-achievement-bling-489759.mp3", name: "Arcade Bling 🌟" },
    { file: "cartoon_music-cartoon-game-upgrade-494470.mp3", name: "Cartoon Upgrade 🚀" },
    { file: "cartoon_music-correct-game-show-alert-499485.mp3", name: "Game-Show Richtig ✔️" },
    { file: "cartoon_music-puzzle-game-correct-answer-508718.mp3", name: "Puzzle Richtig 🧩" },
    { file: "cyberwave-orchestra-fantasy-game-sword-cut-sound-effect-get-more-on-my-patreon-339824.mp3", name: "Schwerthieb ⚔️" },
    { file: "denielcz-achievement-unlocked-463070.mp3", name: "Erfolg freigeschaltet 🔓" },
    { file: "dheerajakam4jor-swoosh-sound-effect-for-fight-scenes-or-transitions-2-149890.mp3", name: "Swoosh Übergang 💨" },
    { file: "floraphonic-90s-game-ui-10-185103.mp3", name: "90s Spiel-UI 1 👾" },
    { file: "floraphonic-90s-game-ui-6-185099.mp3", name: "90s Spiel-UI 2 🎮" },
    { file: "floraphonic-woman-cute-silly-ya-3-185320.mp3", name: "Süßes Silly-Ja 👧" },
    { file: "freesound_community-080047_lose_funny_retro_video-game-80925.mp3", name: "Retro Verloren 👾" },
    { file: "freesound_community-cough-104521.mp3", name: "Husten 😷" },
    { file: "freesound_community-rimshot-joke-funny-80325.mp3", name: "Tusch (Rimshot) 🥁" },
    { file: "freesound_gamestudio-button-394464.mp3", name: "Knopf-Klick 🖱️" },
    { file: "freesound_gamestudio-clear-combo-1-394489.mp3", name: "Combo-Löschung 1 ⚡" },
    { file: "freesound_gamestudio-clear-combo-4-394493.mp3", name: "Combo-Löschung 2 ✨" },
    { file: "freesound_gamestudio-clear-combo-5-394488.mp3", name: "Combo-Löschung 3 🌟" },
    { file: "freesound_gamestudio-clear-combo-7-394494.mp3", name: "Combo-Löschung 4 💫" },
    { file: "freesound_gamestudio-material-buy-success-394517.mp3", name: "Kauf-Erfolg 💰" },
    { file: "freesound_gamestudio-material-gold-394476.mp3", name: "Gold-Effekt 🪙" },
    { file: "magiaz-camera-shutter-474252.mp3", name: "Kamera-Auslöser 📸" },
    { file: "muzaproduction-glad-piano-logo-13394.mp3", name: "Fröhliches Klavier-Logo 🎵" },
    { file: "oxidvideos-video-game-sword-swing-sfx-409364.mp3", name: "Schwert-Schwingen 🗡️" },
    { file: "puyopuyomegafan1234-winner-game-sound-404167.mp3", name: "Gewinner-Sound 🏆" },
    { file: "universfield-funny-fail-02-277575.mp3", name: "Lustiger Fehler 🤪" },
    { file: "universfield-soft-cinematic-piano-outro-151764.mp3", name: "Sanftes Klavier-Outro 🎹" }
];

const ARTICLES = new Set(["der", "die", "das", "des", "dem", "den", "ein", "eine", "eines", "einem", "einen", "einer"]);
const PREPOSITIONS = new Set(["in", "im", "auf", "unter", "über", "vor", "hinter", "neben", "an", "am", "mit", "für", "von", "vom", "zu", "zum", "zur", "nach", "bei", "beim", "durch", "aus", "gegen", "ohne", "um", "wegen", "seit", "während"]);
const PRONOUNS = new Set(["ich", "du", "er", "sie", "es", "wir", "ihr", "sie", "mich", "dich", "ihn", "uns", "euch", "ihnen", "mein", "meine", "meinen", "meinem", "meiner", "meines", "dein", "deine", "deinen", "deinem", "deiner", "deines", "sein", "seine", "seinen", "seinem", "seines", "ihr", "ihre", "ihren", "ihrem", "ihrer", "ihres", "unser", "unsere", "unseren", "unserem", "unserer", "unseres", "euer", "euere", "eueren", "euerem", "euerer", "eueres", "wer", "was", "wem", "wen", "dieser", "diese", "dieses", "diesen", "diesem", "dieser", "jener", "jene", "jenes", "man", "jemand", "niemand", "etwas", "nichts", "selbst", "einander"]);
const CONJUNCTIONS = new Set(["und", "oder", "aber", "denn", "sondern", "weil", "dass", "wenn", "als", "obwohl", "da", "damit", "sodass", "solange", "bis", "ehe", "seitdem", "sowie", "während", "wie", "ob"]);
const ADVERBS = new Set(["hier", "dort", "da", "heute", "morgen", "übermorgen", "gestern", "vorgestern", "jetzt", "sofort", "dann", "oft", "immer", "nie", "nimmermehr", "selten", "manchmal", "sehr", "gern", "gerne", "vielleicht", "wohl", "schon", "erst", "nur", "auch", "noch", "fast", "schwer", "leicht", "leise", "laut", "schnell", "langsam", "draußen", "drinnen", "oben", "unten", "vorn", "vorne", "hinten", "links", "rechts", "überall", "nirgends", "daheim", "früher", "später", "zusammen", "zuerst", "zuletzt", "vorher", "nachher", "damals", "bisher", "überhaupt", "ebenso", "genauso"]);
const COMMON_VERBS = new Set([
    "bellt", "trinkt", "liegt", "steht", "rennt", "singt", "lacht", "malt", "lernt", "liest", "spielt", "schwimmt",
    "tanzt", "schläft", "bauen", "suchen", "finden", "entdecken", "fahren", "wohnen", "fliegt", "kriecht", "leuchtet",
    "gehen", "laufen", "schreiben", "essen", "kommen", "haben", "ist", "sind", "war", "waren", "bist", "sein", "backen", "putzen",
    "bringen", "ziehen", "lassen", "müssen", "können", "wollen", "sollen", "dürfen", "kann", "kannst", "muss", "musst",
    "darf", "darfst", "will", "willst", "soll", "sollst", "mag", "magst", "weiß", "weißt", "hat", "hatte", "hatten", "wird", "wurde", "wurden",
    "gibt", "geht", "komme", "kommt", "macht", "machte", "sieht", "siehst", "sah", "sahen",
    "zeigt", "öffnet", "knarrt", "brennt", "leuchten", "schleichen", "hält", "leckt", "tickt", "sitzt", "schützt", "zuckt", "kocht",
    "backt", "rollt", "frisst", "schlüpft", "wollt", "saugt", "fallen", "rodeln", "werfen", "tragen",
    "wachsen", "blühen", "reifen", "regnet", "weht", "plätschert", "fließt", "riecht", "lachen", "spitzen", "packen",
    "schneiden", "sprechen", "springen", "jagt", "putzt", "landen", "fangen", "beobachten",
    "brauen", "schlagen", "basteln", "graben", "erforschen", "wandern", "spritzen", "schnüffelt", "füttert",
    "krabbeln", "erschreckt", "knacken", "klettern", "sammeln", "stellen", "rinnt", "schimmert", "glänzt",
    "zeichnen", "erklärt", "leitet", "gießt", "feiern", "raschelt", "kehren", "wärmt", "wiegen", "schmiegt",
    "biegt", "stiehlt"
]);
const COMMON_ADJECTIVES = new Set([
    "laut", "leise", "frisch", "frische", "frischem", "frischen", "frischer", "frisches", "reif", "reife", "reife",
    "reife", "reifer", "reifes", "bunt", "bunte", "buntem", "bunten", "bunter", "buntes", "rot", "rote", "rotem",
    "roten", "roter", "rotes", "gelb", "gelbe", "gelbem", "gelben", "gelber", "gelbes", "grün", "grüne", "grünem",
    "grünen", "grüner", "grünes", "blau", "blaue", "blauem", "blauen", "blauer", "blaues", "weiß", "weiße", "weißem",
    "weißen", "weißer", "weißes", "schwarz", "schwarze", "schwarzem", "schwarzen", "schwarzer", "schwarzes",
    "groß", "große", "großem", "großen", "großer", "großes", "klein", "kleine", "kleinem", "kleinen", "kleiner",
    "kleines", "dick", "dicke", "dickem", "dicken", "dicker", "dickes", "dünn", "dünne", "dünnem", "dünnen",
    "dünner", "dünnes", "alt", "alte", "altem", "alten", "alter", "altes", "neu", "neue", "neuem", "neuen",
    "neuer", "neues", "jung", "junge", "jungem", "jungen", "junger", "junges", "schnell", "schnelle", "schnellem",
    "schnellen", "schneller", "schnelles", "langsam", "langsame", "langsamem", "langsamen", "langsamer", "langsames",
    "müde", "lustig", "lustige", "lustigem", "lustigen", "lustiger", "lustiges", "traurig", "traurige", "traurigem",
    "traurigen", "trauriger", "trauriges", "fröhlich", "fröhliche", "fröhlichem", "fröhlichen", "fröhlicher",
    "fröhliches", "mutig", "mutige", "mutigem", "mutigen", "mutiger", "mutiges", "wild", "wilde", "wildem",
    "wilden", "wilder", "wildes", "braun", "braune", "braunem", "braunen", "brauner", "braunes", "kalt", "kalte",
    "kaltem", "kalten", "kalter", "kaltes", "warm", "warme", "warmem", "warmen", "warmer", "warmes", "süß", "süße",
    "süßem", "süßen", "süßer", "süßes", "stark", "starke", "starkem", "starken", "starker", "starkes", "schwer",
    "schwere", "schwerem", "schweren", "schwerer", "schweres", "leicht", "leichte", "leichtem", "leichten",
    "leichter", "leichtes", "sauber", "saubere", "sauberem", "sauberen", "sauberer", "sauberes", "schmutzig",
    "schmutzige", "schmutzigem", "schmutzigen", "schmutziger", "schmutziges", "lieb", "liebe", "liebem", "lieben",
    "lieber", "liebes", "schüchtern", "schüchterne", "schüchternem", "schüchternen", "schüchterner", "schüchternes",
    "schlau", "schlaue", "schlauem", "schlauen", "schlauer", "schlaues", "nett", "nette", "nettem", "netten",
    "netter", "nettes", "sportlich", "sportliche", "sportlichem", "sportlichen", "sportlicher", "sportliches",
    "geheimnisvoll", "geheimnisvolle", "geheimnisvollem", "geheimnisvollen", "geheimnisvoller", "geheimnisvolles",
    "verborgen", "verborgene", "verborgenem", "verborgenen", "verborgener", "verborgenes", "dicht", "dichte",
    "dichtem", "dichten", "dichter", "dichtes", "klar", "klare", "klarem", "klaren", "klarer", "klares",
    "brav", "brave", "bravem", "braven", "braver", "braves", "trocken", "trockene", "trockenem", "trockenen",
    "trockener", "trockenes", "scharf", "scharfe", "scharfem", "scharfen", "scharfer", "scharfes", "fest",
    "feste", "festem", "festen", "fester", "festes"
]);

class Application {
    constructor() {
        this.db = new AppDB();
        this.audio = new AppAudio();
        this.canvas = null;
        this.keyboard = null;
        this.speech = null;

        // Application State
        this.profiles = [];
        this.currentProfile = null;
        this.currentMode = null; // 'write' or 'read'
        this.currentCategory = "Alle";
        this.currentStory = null;
        this.storySentences = [];
        this.storySentenceIndex = 0;
        this.sentences = [];
        this.currentSentence = null;
        this.currentWordIndex = 0;
        this.inputBuffer = "";
        
        // Scaffolding & Error Tracking
        this.wordMistakes = 0;
        this.sentenceHasError = false;
        
        // Reading Mode Timer for Help hint
        this.stuckTimer = null;
        this.lastActionTimestamp = 0;
        
        this.init();
    }

    async init() {
        // Initialize IndexedDB
        await this.db.init();

        // Load Sentences
        try {
            const res = await fetch('./data/sentences.json');
            this.sentences = await res.json();
        } catch (e) {
            console.error("Could not load sentences.json", e);
        }

        // Initialize UI Elements & Event Listeners
        this.setupUI();
        
        // Initialize canvas
        const canvasEl = document.getElementById('pencil-canvas');
        const ghostEl = document.getElementById('ghost-text-overlay');
        this.canvas = new PencilCanvas(canvasEl, ghostEl, () => this.handleCanvasStrokeEnd());
        
        // Initialize virtual keyboard
        const kbContainer = document.getElementById('smart-keyboard-container');
        this.keyboard = new SmartKeyboard(
            kbContainer,
            (char) => this.handleKeyPress(char),
            () => this.handleDeletePress()
        );

        // Initialize Speech recognition
        this.speech = new AppSpeech(
            (wordIdx) => this.handleSpeechWordMatched(wordIdx),
            (interimText) => this.handleSpeechInterim(interimText),
            (success) => this.handleSpeechFinished(success),
            (errMsg) => this.showStatusToast(errMsg, 'error')
        );

        // Load and display profiles
        await this.loadProfiles();

        this.playEventSound('start');
        
        // Resize canvas on layout changes
        window.addEventListener('resize', () => {
            if (this.canvas) this.canvas.resize();
        });

        // Bind physical hardware keyboard for Writing Mode
        window.addEventListener('keydown', (e) => {
            if (this.currentMode === 'write' && this.currentSentence) {
                // Automatically switch to physical keyboard layout if a key is typed
                if (this.keyboard && this.keyboard.keyboardMode !== 'physical') {
                    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
                        this.setKeyboardMode('physical');
                    }
                }

                const activeWord = this.currentSentence.words[this.currentWordIndex];
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    this.handleDeletePress();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.checkWrittenWord();
                } else if (e.key === ' ' || e.key === 'Tab') { // Space or Tab key
                    e.preventDefault();
                    this.checkWrittenWord();
                } else if (e.key.length === 1 && /[a-zA-ZäöüÄÖÜß]/.test(e.key)) {
                    e.preventDefault();
                    this.handleKeyPress(e.key);
                }
            }
        });
    }

    // --- UI EVENT ROUTING ---
    setupUI() {
        // Profile selections
        document.getElementById('btn-create-profile').addEventListener('click', () => this.handleCreateProfile());
        document.getElementById('btn-select-profile').addEventListener('click', () => this.handleSelectProfile());
        document.getElementById('btn-delete-profile').addEventListener('click', () => this.handleDeleteProfile());
        document.getElementById('btn-save-grade').addEventListener('click', () => this.handleSaveGrade());
        
        // Avatar selection triggers
        const avatarOpts = document.querySelectorAll('.avatar-option');
        avatarOpts.forEach(opt => {
            opt.addEventListener('click', () => {
                avatarOpts.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // Mode Navigation
        document.getElementById('menu-card-write').addEventListener('click', () => this.startMode('write'));
        document.getElementById('menu-card-read').addEventListener('click', () => this.startMode('read'));
        document.getElementById('menu-card-stories').addEventListener('click', () => this.showStoriesView());
        // Active Profile Badges Navigation
        document.getElementById('active-profile-badge').addEventListener('click', () => this.switchView('profile-view'));
        document.getElementById('active-profile-score-badge').addEventListener('click', () => this.showStatsView());
        
        // Back buttons
        document.getElementById('btn-write-back').addEventListener('click', () => this.stopActiveMode());
        document.getElementById('btn-read-back').addEventListener('click', () => this.stopActiveMode());
        document.getElementById('btn-stats-back').addEventListener('click', () => this.switchView('menu-view'));
        document.getElementById('btn-stories-back').addEventListener('click', () => this.switchView('menu-view'));

        // Stats Chart Toggle Buttons
        document.getElementById('btn-chart-week').addEventListener('click', () => this.renderDailyScoresChart('week'));
        document.getElementById('btn-chart-month').addEventListener('click', () => this.renderDailyScoresChart('month'));

        // Canvas Controls
        document.getElementById('btn-canvas-clear').addEventListener('click', () => {
            this.canvas.clear();
            this.inputBuffer = "";
            this.updateWriteInputIndicator();
            this.clearLetterStuckTimer();
            this.resetWordTypeHintTimer();
        });
        document.getElementById('btn-canvas-undo').addEventListener('click', () => {
            this.canvas.undo();
            this.handleCanvasStrokeEnd();
        });
        document.getElementById('btn-write-pencil-toggle').addEventListener('click', () => this.togglePencilPanel());
        document.getElementById('btn-write-keyboard-toggle').addEventListener('click', () => this.toggleKeyboardPanel());
        
        // Writing checks & aids
        document.getElementById('btn-write-check').addEventListener('click', () => this.checkWrittenWord());
        document.getElementById('btn-write-speak').addEventListener('click', () => {
            if (this.currentSentence) {
                const activeWord = this.currentSentence.words[this.currentWordIndex];
                this.audio.playWord(activeWord.clean);
            }
        });
        document.getElementById('btn-write-speak-sentence').addEventListener('click', () => {
            if (this.currentSentence) {
                this.audio.playSentence(this.currentSentence.id, this.currentSentence.sentence);
            }
        });
        document.getElementById('btn-write-skip').addEventListener('click', () => this.handleSkipWord());

        // Speech controls
        document.getElementById('btn-read-mic').addEventListener('click', () => this.toggleSpeechListening());
        document.getElementById('btn-read-speak-help').addEventListener('click', () => this.playCurrentReadingWordHelp());
        document.getElementById('btn-read-word-skip').addEventListener('click', () => this.handleReadWordSkip());
        document.getElementById('btn-read-skip').addEventListener('click', () => this.nextSentence());
        document.getElementById('btn-summary-close').addEventListener('click', () => this.closeSummaryModal());

        // Global App Reload & Cache clear with timestamp comparison
        const reloadBtn = document.getElementById('btn-app-reload');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', async () => {
                const timestampEl = document.getElementById('app-build-timestamp');
                const localBuildText = timestampEl ? timestampEl.innerText.trim() : '';
                const localMatch = localBuildText.match(/\[Build:\s*([^\]]+)\]/i);
                const localTimestamp = localMatch ? localMatch[1] : localBuildText;

                console.log(`[Reload] Lokaler Build Timestamp: "${localTimestamp}"`);
                this.showStatusToast("Vergleiche Timestamps & leere Cache... 🔄", 2000);

                let serverTimestamp = null;
                try {
                    // Fetch fresh index.html with cache-busting to inspect server build timestamp
                    const res = await fetch('./index.html?t=' + Date.now(), {
                        cache: 'no-store',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache'
                        }
                    });
                    if (res.ok) {
                        const htmlText = await res.text();
                        const match = htmlText.match(/\[Build:\s*([^\]]+)\]/i);
                        if (match && match[1]) {
                            serverTimestamp = match[1].trim();
                        }
                    }
                } catch (err) {
                    console.warn('[Reload] Server-Timestamp konnte nicht abgerufen werden:', err);
                }

                console.log(`[Reload] Server Build Timestamp: "${serverTimestamp || 'unbekannt'}"`);

                if (serverTimestamp && localTimestamp && serverTimestamp !== localTimestamp) {
                    console.log(`[Reload] Update festgestellt: Lokal (${localTimestamp}) vs Server (${serverTimestamp})`);
                    this.showStatusToast(`Neuer Build (${serverTimestamp})! Lade neu... 🔄`, 3000);
                } else if (serverTimestamp) {
                    console.log(`[Reload] Timestamps identisch (${serverTimestamp}). Cache wird vollständig geleert.`);
                    this.showStatusToast(`App neu geladen (${serverTimestamp}) 🔄`, 3000);
                } else {
                    this.showStatusToast("App wird vollständig neu geladen... 🔄", 3000);
                }

                // Clear service workers
                if ('serviceWorker' in navigator) {
                    try {
                        const regs = await navigator.serviceWorker.getRegistrations();
                        for (let reg of regs) {
                            if (reg.active) {
                                reg.active.postMessage('CLEAR_CACHE');
                            }
                            await reg.unregister();
                        }
                    } catch (e) {
                        console.warn("Failed to unregister service workers:", e);
                    }
                }

                // Clear Cache Storage
                if ('caches' in window) {
                    try {
                        const keys = await caches.keys();
                        for (let key of keys) {
                            await caches.delete(key);
                        }
                    } catch (e) {
                        console.warn("Failed to clear caches:", e);
                    }
                }

                // Clear sessionStorage
                try {
                    sessionStorage.clear();
                } catch (e) {}

                // Short delay so the user sees the toast, then hard reload with cache-bust parameter
                setTimeout(() => {
                    const cleanUrl = new URL(window.location.href);
                    cleanUrl.searchParams.set('reload', Date.now().toString());
                    window.location.href = cleanUrl.toString();
                }, 400);
            });
        }

        // Settings listeners
        const settingsBtn = document.getElementById('btn-app-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsView());
        }
        const settingsBackBtn = document.getElementById('btn-settings-back');
        if (settingsBackBtn) {
            settingsBackBtn.addEventListener('click', () => this.switchView('menu-view'));
        }
        
        document.getElementById('btn-tolerance-strict').addEventListener('click', () => this.selectTolerance('strict'));
        document.getElementById('btn-tolerance-medium').addEventListener('click', () => this.selectTolerance('medium'));
        document.getElementById('btn-tolerance-lax').addEventListener('click', () => this.selectTolerance('lax'));
        
        document.getElementById('btn-rules-always').addEventListener('click', () => this.selectRuleMode('always'));
        document.getElementById('btn-rules-errors').addEventListener('click', () => this.selectRuleMode('errors'));
        document.getElementById('btn-rules-never').addEventListener('click', () => this.selectRuleMode('never'));
        
        document.getElementById('btn-check-audio').addEventListener('click', () => this.checkAudioStatus());
        document.getElementById('btn-generate-audio').addEventListener('click', () => this.generateMissingAudio());

        // Sound selectors listeners
        const successSelect = document.getElementById('select-sound-success');
        const errorSelect = document.getElementById('select-sound-error');

        if (successSelect && errorSelect) {
            // Populate success dropdown
            SOUNDS_REGISTRY.filter(s => s.type === 'success').forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.innerText = s.name;
                successSelect.appendChild(opt);
            });
            // Populate error dropdown
            SOUNDS_REGISTRY.filter(s => s.type === 'error').forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.innerText = s.name;
                errorSelect.appendChild(opt);
            });

            // Set current values
            successSelect.value = localStorage.getItem('soundSuccess') || 'success_fanfare';
            errorSelect.value = localStorage.getItem('soundError') || 'error_buzz';

            // Change listeners
            successSelect.addEventListener('change', (e) => {
                localStorage.setItem('soundSuccess', e.target.value);
            });
            errorSelect.addEventListener('change', (e) => {
                localStorage.setItem('soundError', e.target.value);
            });

            // Preview listeners
            document.getElementById('btn-play-success-preview').addEventListener('click', () => {
                this.audio.playRegistrySound(successSelect.value);
            });
            document.getElementById('btn-play-error-preview').addEventListener('click', () => {
                this.audio.playRegistrySound(errorSelect.value);
            });

            // Populate 8 event-based selectors
            const eventsList = [
                'start', 'user-select', 'word-correct', 'sentence-complete',
                'menu-switch', 'exercise-select', 'letter-written', 'word-incorrect'
            ];

            eventsList.forEach(evt => {
                const sel = document.getElementById(`select-event-${evt}`);
                if (sel) {
                    MP3_SOUNDS.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.file;
                        opt.innerText = s.name;
                        sel.appendChild(opt);
                    });

                    // Set default / saved value
                    const key = evt.replace(/-/g, '_');
                    sel.value = localStorage.getItem(`soundEvent_${key}`) || this.getDefaultEventSound(key);

                    // Add change listener
                    sel.addEventListener('change', (e) => {
                        localStorage.setItem(`soundEvent_${key}`, e.target.value);
                    });

                    // Add preview listener
                    const btnPreview = document.getElementById(`btn-play-event-${evt}-preview`);
                    if (btnPreview) {
                        btnPreview.addEventListener('click', () => {
                            if (sel.value && sel.value !== 'none') {
                                this.audio.playEffect(sel.value);
                            }
                        });
                    }
                }
            });
        }

        // Keyboard Mode selectors
        const btnKbSmart = document.getElementById('btn-kb-mode-smart');
        const btnKbFull = document.getElementById('btn-kb-mode-full');
        const btnKbPhysical = document.getElementById('btn-kb-mode-physical');

        if (btnKbSmart && btnKbFull && btnKbPhysical) {
            btnKbSmart.addEventListener('click', () => this.setKeyboardMode('smart'));
            btnKbFull.addEventListener('click', () => this.setKeyboardMode('full'));
            btnKbPhysical.addEventListener('click', () => this.setKeyboardMode('physical'));
        }

        // Global touch click event to maintain hidden input receiver focus
        document.addEventListener('pointerdown', (e) => {
            if (this.currentMode === 'write') {
                const receiver = document.getElementById('keyboard-receiver');
                if (receiver && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && e.target.tagName !== 'INPUT') {
                    setTimeout(() => receiver.focus(), 50);
                }
            }
        });
    }

    getDefaultEventSound(eventKey) {
        switch(eventKey) {
            case 'start':
                return 'ivan_luzan-beautiful-piano-logo-143488.mp3';
            case 'user_select':
                return 'cartoon_music-cartoon-game-upgrade-494470.mp3';
            case 'word_correct':
                return 'dheerajakam4jor-swoosh-sound-effect-for-fight-scenes-or-transitions-2-149890.mp3';
            case 'sentence_complete':
                return 'cartoon_music-correct-game-show-alert-499485.mp3';
            case 'menu_switch':
                return 'cartoon_music-arcade-game-achievement-bling-489759.mp3';
            case 'exercise_select':
                return 'universfield-soft-cinematic-piano-outro-151764.mp3';
            case 'letter_written':
                return 'freesound_gamestudio-button-394464.mp3';
            case 'word_incorrect':
                return 'shidenbeatsmusic-funny-sound-effect-for-quotjack-in-the-boxquot-sound-ver1-110923.mp3';
            default:
                return 'none';
        }
    }

    playEventSound(eventKey) {
        const soundFile = localStorage.getItem(`soundEvent_${eventKey}`) || this.getDefaultEventSound(eventKey);
        if (soundFile && soundFile !== 'none') {
            this.audio.playEffect(soundFile);
        }
    }

    guessWordType(cleanWord, index, sentenceWords) {
        const word = cleanWord.trim();
        if (!word) return "";
        
        const lowerWord = word.toLowerCase();
        
        // Check closed classes
        if (ARTICLES.has(lowerWord)) return "Artikel";
        if (PREPOSITIONS.has(lowerWord)) return "Präposition";
        if (PRONOUNS.has(lowerWord)) return "Pronomen";
        if (CONJUNCTIONS.has(lowerWord)) return "Konjunktion";
        if (ADVERBS.has(lowerWord)) return "Adverb";
        
        // Capitalized check
        const isCapitalized = /^[A-ZÄÖÜ]/.test(word);
        if (isCapitalized) {
            if (index > 0) {
                return "Substantiv";
            } else {
                if (COMMON_VERBS.has(lowerWord)) return "Verb";
                if (COMMON_ADJECTIVES.has(lowerWord)) return "Adjektiv";
                if (ADVERBS.has(lowerWord)) return "Adverb";
                return "Substantiv";
            }
        }
        
        // Lowercase check
        if (COMMON_VERBS.has(lowerWord)) return "Verb";
        if (COMMON_ADJECTIVES.has(lowerWord)) return "Adjektiv";
        if (ADVERBS.has(lowerWord)) return "Adverb";
        
        // Suffix verbs
        if (lowerWord.endsWith("st") || lowerWord.endsWith("te") || lowerWord.endsWith("ten") || (lowerWord.endsWith("en") && lowerWord.length > 4)) {
            return "Verb";
        }
        if (lowerWord.endsWith("t") && lowerWord.length > 3) {
            return "Verb";
        }
        
        // Suffix adjectives
        if (lowerWord.endsWith("ste") || lowerWord.endsWith("sten") || lowerWord.endsWith("ig") || lowerWord.endsWith("ige") || lowerWord.endsWith("igen") || lowerWord.endsWith("lich") || lowerWord.endsWith("liche") || lowerWord.endsWith("lichen")) {
            return "Adjektiv";
        }
        
        return "Sonstiges";
    }

    resetWordTypeHintTimer() {
        this.clearWordTypeHintTimer();
        if (this.currentMode !== 'write' || !this.currentSentence) return;
        
        this.wordTypeHintTimer = setTimeout(() => {
            this.revealActiveWordType();
        }, 3000); // 3 seconds of inactivity
    }

    clearWordTypeHintTimer() {
        if (this.wordTypeHintTimer) {
            clearTimeout(this.wordTypeHintTimer);
            this.wordTypeHintTimer = null;
        }
    }

    revealActiveWordType() {
        const container = document.getElementById('write-sentence-container');
        if (!container) return;
        const wordWrapper = container.children[this.currentWordIndex];
        if (wordWrapper) {
            const label = wordWrapper.querySelector('.word-type-label');
            if (label) {
                label.style.opacity = '1';
            }
        }
    }

    switchView(viewId) {
        // Stop any running speech & audio
        if (this.speech) this.speech.stop();
        if (this.audio) this.audio.stop();
        this.stopAudioVisualizer();
        this.clearStuckTimer();
        this.clearWordTypeHintTimer();

        if (viewId === 'profile-view') {
            const pBadge = document.getElementById('active-profile-badge');
            const sBadge = document.getElementById('active-profile-score-badge');
            if (pBadge) pBadge.style.display = 'none';
            if (sBadge) sBadge.style.display = 'none';
            this.currentProfile = null;
        }

        this.playEventSound('menu_switch');

        // Switch active CSS class
        const views = document.querySelectorAll('.view');
        views.forEach(v => v.classList.remove('active'));
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
            
            // Adjust canvas drawing viewport when write view appears
            if (viewId === 'write-view') {
                setTimeout(() => {
                    this.canvas.resize();
                }, 50);
            }
        }
    }

    showStatusToast(msg, type = 'info') {
        // Minimal visual status helper
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = type === 'error' ? '#FF3B30' : '#007AFF';
        toast.style.color = '#FFFFFF';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '20px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.zIndex = '1000';
        toast.style.fontWeight = 'bold';
        toast.style.fontFamily = 'sans-serif';
        toast.innerText = msg;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    // --- PROFILE CONTROLLERS ---
    async loadProfiles() {
        this.profiles = await this.db.getProfiles();
        const listDiv = document.getElementById('profiles-list');
        listDiv.innerHTML = "";
        
        if (this.profiles.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.color = 'var(--text-secondary)';
            emptyMsg.style.padding = '10px';
            emptyMsg.innerText = "Keine Profile gefunden. Erstelle ein neues Profil unten.";
            listDiv.appendChild(emptyMsg);
            
            document.getElementById('btn-select-profile').style.display = 'none';
            document.getElementById('btn-delete-profile').style.display = 'none';
            const editContainer = document.getElementById('edit-grade-container');
            if (editContainer) editContainer.style.display = 'none';
            return;
        }

        this.profiles.forEach(p => {
            const item = document.createElement('div');
            item.className = 'profile-item';
            item.innerHTML = `<span>${p.avatar} ${p.name} (Klasse ${p.grade})</span>`;
            item.addEventListener('click', () => this.selectProfileItem(p, item));
            listDiv.appendChild(item);
        });

        // Select first automatically
        if (this.profiles.length > 0) {
            const firstItem = listDiv.children[0];
            firstItem.click();
        }
    }

    selectProfileItem(profile, itemElement) {
        document.querySelectorAll('.profile-item').forEach(i => i.classList.remove('selected'));
        itemElement.classList.add('selected');
        
        this.selectedProfileCandidate = profile;
        document.getElementById('btn-select-profile').style.display = 'block';
        document.getElementById('btn-delete-profile').style.display = 'block';

        // Show edit grade container and select current grade
        const editContainer = document.getElementById('edit-grade-container');
        const editSelect = document.getElementById('edit-profile-grade');
        if (editContainer && editSelect) {
            editSelect.value = profile.grade.toString();
            editContainer.style.display = 'flex';
        }
    }

    async handleSaveGrade() {
        if (!this.selectedProfileCandidate) return;
        const editSelect = document.getElementById('edit-profile-grade');
        if (!editSelect) return;
        
        const newGrade = parseInt(editSelect.value);
        this.selectedProfileCandidate.grade = newGrade;
        
        // Save back to IndexedDB
        await this.db.saveProfile(this.selectedProfileCandidate);
        this.showStatusToast("Schulstufe erfolgreich aktualisiert!");
        
        // Reload profiles list
        await this.loadProfiles();
    }

    async handleCreateProfile() {
        const nameInput = document.getElementById('new-profile-name');
        const gradeSelect = document.getElementById('new-profile-grade');
        const activeAvatarOpt = document.querySelector('.avatar-option.selected');
        
        const name = nameInput.value.trim();
        if (!name) {
            this.showStatusToast("Bitte gib einen Namen ein.", "error");
            return;
        }
        
        const grade = parseInt(gradeSelect.value);
        const avatar = activeAvatarOpt ? activeAvatarOpt.dataset.avatar : "🦊";

        const newProfile = { name, grade, avatar };
        await this.db.saveProfile(newProfile);
        
        nameInput.value = "";
        this.showStatusToast("Profil erfolgreich erstellt!");
        await this.loadProfiles();
    }

    async handleSelectProfile() {
        if (!this.selectedProfileCandidate) return;
        this.audio.unlock();
        this.currentProfile = this.selectedProfileCandidate;
        this.playEventSound('user_select');
        
        // Show Profile badge in header
        const badge = document.getElementById('active-profile-badge');
        const avatarImg = document.getElementById('active-profile-avatar');
        
        // Replace image source or show emoji
        avatarImg.style.display = 'none';
        let emojiSpan = badge.querySelector('.avatar-emoji');
        if (!emojiSpan) {
            emojiSpan = document.createElement('span');
            emojiSpan.className = 'avatar-emoji';
            emojiSpan.style.fontSize = '20px';
            emojiSpan.style.marginRight = '8px';
            badge.insertBefore(emojiSpan, badge.firstChild);
        }
        emojiSpan.innerText = this.currentProfile.avatar;
        
        document.getElementById('active-profile-name').innerText = this.currentProfile.name;
        badge.style.display = 'flex';
        document.getElementById('active-profile-score-badge').style.display = 'flex';
        await this.updateProfileScoreUI(this.currentProfile.id, 0);
        
        // Set Menu welcome text
        document.getElementById('menu-welcome-text').innerText = `Hallo, ${this.currentProfile.name}! 👋`;
        
        // Render dynamic category pills for selected grade
        this.renderCategorySelector();
        
        await this.updateDailyMotivation();
        this.switchView('menu-view');
    }

    renderCategorySelector() {
        if (!this.currentProfile) return;
        const currentGrade = this.currentProfile.grade;
        
        // Extract unique spelling categories from all sentences, prioritizing current grade categories
        const allGradeSentences = this.sentences.filter(s => !s.story);
        const currentGradeThemes = [...new Set(allGradeSentences.filter(s => s.grade === currentGrade).map(s => s.theme).filter(Boolean))];
        const otherThemes = [...new Set(allGradeSentences.filter(s => s.grade !== currentGrade).map(s => s.theme).filter(Boolean))];
        
        const uniqueOtherThemes = otherThemes.filter(t => !currentGradeThemes.includes(t));
        const themes = [...currentGradeThemes, ...uniqueOtherThemes];
        
        const topicsContainer = document.getElementById('category-topics-list');
        const focusContainer = document.getElementById('category-focus-list');
        if (!topicsContainer || !focusContainer) return;
        
        topicsContainer.innerHTML = "";
        focusContainer.innerHTML = "";
        
        // Define focus areas set
        const focusAreasSet = new Set([
            "ck und tz", "Langes ie", "Auslaut", "Doppelkonsonant", "Stummes h",
            "Großschreibung", "ie-Laut", "stummes h", "z und tz", "Doppelkonsonanten",
            "sp und st", "d oder t", "Nominalisierung", "Fremdwörter",
            "Umlautableitung", "s-Laut (ss/ß)", "Vogel-v", "sp / st", "Endung -ig/-lich", "Großschreibung Nomen"
        ]);
        
        // Always include "Alle" in topics
        const topics = ["Alle", ...themes.filter(t => !focusAreasSet.has(t))];
        const focusAreas = themes.filter(t => focusAreasSet.has(t));
        
        // Ensure selected category is valid for this grade
        const allAvailable = [...topics, ...focusAreas];
        if (!allAvailable.includes(this.currentCategory)) {
            this.currentCategory = "Alle";
        }
        
        const createPill = (theme, targetContainer) => {
            const pill = document.createElement('button');
            pill.className = 'category-pill';
            if (theme === this.currentCategory) {
                pill.classList.add('active');
            }
            
            // Map theme to premium user-facing emojis
            let emoji = "📝";
            if (theme === "Alle") emoji = "🌟";
            else if (theme === "Tiere") emoji = "🐾";
            else if (theme === "Schule") emoji = "🏫";
            else if (theme === "Jahreszeiten") emoji = "🍂";
            else if (theme === "Natur") emoji = "🌿";
            else if (theme === "Abenteuer") emoji = "🚀";
            else if (theme === "Langes ie" || theme === "ie-Laut") emoji = "🐝";
            else if (theme === "Stummes h" || theme === "stummes h") emoji = "⏰";
            else if (theme === "ck und tz" || theme === "z und tz") emoji = "⚡";
            else if (theme === "Doppelkonsonant" || theme === "Doppelkonsonanten") emoji = "🪵";
            else if (theme === "Auslaut" || theme === "d oder t") emoji = "🦆";
            else if (theme === "Nominalisierung") emoji = "🏷️";
            else if (theme === "Fremdwörter") emoji = "🌍";
            else if (theme === "Umlautableitung") emoji = "🍎";
            else if (theme === "s-Laut (ss/ß)") emoji = "🐍";
            else if (theme === "Vogel-v") emoji = "🦅";
            else if (theme === "sp / st") emoji = "🗣️";
            else if (theme === "Endung -ig/-lich") emoji = "🏷️";
            else if (theme === "Großschreibung Nomen") emoji = "🔠";
            
            pill.innerText = `${emoji} ${theme}`;
            pill.addEventListener('click', () => {
                // Remove active class from all pills in BOTH containers
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                
                pill.classList.add('active');
                this.currentCategory = theme;
                this.showStatusToast(`Übungsschwerpunkt: ${theme}`);
                this.playEventSound('exercise_select');
            });
            targetContainer.appendChild(pill);
        };
        
        topics.forEach(t => createPill(t, topicsContainer));
        focusAreas.forEach(f => createPill(f, focusContainer));
    }

    async handleDeleteProfile() {
        if (!this.selectedProfileCandidate) return;
        const confirmDelete = confirm(`Möchtest du das Profil "${this.selectedProfileCandidate.name}" wirklich löschen?`);
        if (confirmDelete) {
            await this.db.deleteProfile(this.selectedProfileCandidate.id);
            this.selectedProfileCandidate = null;
            this.showStatusToast("Profil gelöscht.");
            await this.loadProfiles();
        }
    }

    // --- LEITNER BOX SELECTION ALGORITHM ---
    async fetchNextSentence() {
        if (!this.currentProfile) return null;
        
        const progressList = await this.db.getProfileProgress(this.currentProfile.id);
        const currentGrade = this.currentProfile.grade;
        
        // Include sentences from all grades (excluding stories)
        let pool = this.sentences.filter(s => !s.story);
        
        // Filter by selected spelling category if set
        if (this.currentCategory && this.currentCategory !== "Alle") {
            pool = pool.filter(s => s.theme === this.currentCategory);
        }

        if (pool.length === 0) {
            // Ultimate fallback: take any random sentence from the entire pool
            const randIdx = Math.floor(Math.random() * this.sentences.length);
            return this.sentences[randIdx];
        }

        // Filter out currently active sentence to avoid immediate repeat if pool is large enough
        let candidates = pool;
        if (this.currentSentence && pool.length > 1) {
            candidates = pool.filter(s => s.id !== this.currentSentence.id);
        }

        // Sort candidates based on attempts, errors, and boxes
        candidates.sort((a, b) => {
            const recA = progressList.find(p => p.sentenceId === a.id);
            const recB = progressList.find(p => p.sentenceId === b.id);
            
            const isNewA = !recA;
            const isNewB = !recB;
            
            // 1. New (unattempted) sentences have priority
            if (isNewA && !isNewB) return -1;
            if (!isNewA && isNewB) return 1;
            
            if (isNewA && isNewB) {
                // Both new: prioritize current grade
                const isCurrA = a.grade === currentGrade;
                const isCurrB = b.grade === currentGrade;
                if (isCurrA && !isCurrB) return -1;
                if (!isCurrA && isCurrB) return 1;
                return a.id.localeCompare(b.id);
            }
            
            // Both attempted: prioritize those with errors in current mode
            const errA = this.currentMode === 'write' ? (recA.errorsWriting || 0) : (recA.errorsReading || 0);
            const errB = this.currentMode === 'write' ? (recB.errorsWriting || 0) : (recB.errorsReading || 0);
            
            if (errA !== errB) {
                return errB - errA; // higher error count first
            }
            
            // Sort by Leitner box level (lowest box first)
            if (recA.box !== recB.box) {
                return recA.box - recB.box;
            }
            
            // Prioritize current grade
            const isCurrA = a.grade === currentGrade;
            const isCurrB = b.grade === currentGrade;
            if (isCurrA && !isCurrB) return -1;
            if (!isCurrA && isCurrB) return 1;
            
            // Otherwise, sort by oldest review date
            return recA.nextReview - recB.nextReview;
        });

        const selected = candidates[0];
        console.log(`fetchNextSentence selected: ${selected.sentence} (ID: ${selected.id})`);
        return selected;
    }

    // --- WRITING & READING MODES MANAGEMENT ---
    async startMode(mode) {
        this.audio.unlock();
        this.currentMode = mode;
        this.playEventSound('exercise_select');
        await this.nextSentence();
    }

    stopActiveMode() {
        this.currentMode = null;
        this.currentSentence = null;
        this.currentStory = null;
        this.storySentences = [];
        this.storySentenceIndex = 0;
        
        // Hide story progress containers when stopping
        const writeProgress = document.getElementById('write-story-progress-container');
        const readProgress = document.getElementById('read-story-progress-container');
        if (writeProgress) writeProgress.style.display = 'none';
        if (readProgress) readProgress.style.display = 'none';
        
        this.switchView('menu-view');
    }

    updateStoryProgressBar() {
        const mode = this.currentMode; // 'write' or 'read'
        if (!mode) return;
        
        const container = document.getElementById(`${mode}-story-progress-container`);
        const bar = document.getElementById(`${mode}-story-progress-bar`);
        const text = document.getElementById(`${mode}-story-progress-text`);
        const percentEl = document.getElementById(`${mode}-story-progress-percent`);

        if (!container) return;

        if (this.currentStory && this.storySentences && this.storySentences.length > 0) {
            const count = this.storySentences.length;
            const current = this.storySentenceIndex; // already incremented in nextSentence()
            const percent = Math.round((current / count) * 100);

            const wordCount = this.currentSentence ? this.currentSentence.words.length : 0;
            const currentWord = Math.min(this.currentWordIndex + 1, wordCount || 1);

            if (bar) bar.style.width = `${percent}%`;
            
            let label = `Geschichte: ${this.currentStory} (Satz ${current} von ${count}`;
            if (wordCount > 0) {
                label += `, Wort ${currentWord} von ${wordCount}`;
            }
            label += `)`;
            
            if (text) text.innerText = label;
            if (percentEl) percentEl.innerText = `${percent}%`;

            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    async nextSentence() {
        if (this.audio) this.audio.stop();
        if (this.speech) this.speech.stop();

        let sentence;
        if (this.currentStory) {
            if (this.storySentenceIndex < this.storySentences.length) {
                sentence = this.storySentences[this.storySentenceIndex];
                this.storySentenceIndex++;
            } else {
                this.showStatusToast(`Super! Du hast die Geschichte "${this.currentStory}" beendet! 🎉`);
                this.stopActiveMode();
                return;
            }
        } else {
            sentence = await this.fetchNextSentence();
        }

        if (!sentence) {
            this.showStatusToast("Keine Sätze verfügbar.", "error");
            this.stopActiveMode();
            return;
        }

        this.currentSentence = sentence;
        this.currentWordIndex = 0;
        this.sentenceHasError = false;
        this.skippedWords = [];
        this.mistakenWords = [];
        this.wordMistakeCounts = {};
        
        // Update Story Progress Bar if in story mode
        this.updateStoryProgressBar();
        
        if (this.currentMode === 'write') {
            this.switchView('write-view');
            this.setupWritingWord();
        } else if (this.currentMode === 'read') {
            this.switchView('read-view');
            this.setupReadingSentence();
        }
        this.clearLetterStuckTimer();
    }

    // --- WRITE MODE LOGIC ---
    setupWritingWord() {
        if (!this.currentSentence) return;
        
        const pbContainer = document.getElementById('write-progress-bar-container');
        if (pbContainer) pbContainer.style.display = 'none';
        
        const words = this.currentSentence.words;
        const container = document.getElementById('write-sentence-container');
        container.innerHTML = "";

        // Render masked & active word bubbles
        words.forEach((wData, idx) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'inline-flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '4px';
            
            const raw = wData.word;
            const clean = wData.clean;
            const cleanIdx = raw.indexOf(clean);
            const leadingPunct = cleanIdx > 0 ? raw.substring(0, cleanIdx) : "";
            const trailingPunct = cleanIdx !== -1 ? raw.substring(cleanIdx + clean.length) : "";

            if (leadingPunct) {
                const lpSpan = document.createElement('span');
                lpSpan.style.fontSize = '24px';
                lpSpan.style.fontWeight = '700';
                lpSpan.style.color = 'var(--text-primary)';
                lpSpan.innerText = leadingPunct;
                wrapper.appendChild(lpSpan);
            }

            const bubble = document.createElement('div');
            bubble.className = 'word-bubble';
            
            // Speak the word when the bubble is clicked
            bubble.addEventListener('click', () => {
                this.audio.playWord(wData.clean);
            });

            // Container for word type label and bubble
            const bubbleContainer = document.createElement('div');
            bubbleContainer.style.display = 'flex';
            bubbleContainer.style.flexDirection = 'column';
            bubbleContainer.style.alignItems = 'center';
            bubbleContainer.style.gap = '2px';

            const wordTypeLabel = document.createElement('span');
            wordTypeLabel.className = 'word-type-label';
            wordTypeLabel.style.fontSize = '11px';
            wordTypeLabel.style.fontWeight = 'bold';
            wordTypeLabel.style.color = 'var(--accent-blue)';
            wordTypeLabel.style.minHeight = '14px';
            wordTypeLabel.style.opacity = '0';
            wordTypeLabel.style.transition = 'opacity 0.3s ease';
            wordTypeLabel.innerText = this.guessWordType(wData.clean, idx, words);
            
            if (idx < this.currentWordIndex) {
                // Solved
                bubble.innerText = wData.clean;
                if (this.skippedWords.includes(idx)) {
                    bubble.classList.add('skipped');
                } else {
                    bubble.classList.add('correct');
                }
                wordTypeLabel.style.opacity = '1';
            } else if (idx === this.currentWordIndex) {
                // Active
                bubble.classList.add('active', 'masked');
                // Display placeholder dashes matching word length
                bubble.innerText = wData.clean.split('').map(() => '_').join(' ');
            } else {
                // Masked / Unsolved
                bubble.classList.add('masked');
                bubble.innerText = wData.clean.split('').map(() => '_').join(' ');
            }

            bubbleContainer.appendChild(wordTypeLabel);
            bubbleContainer.appendChild(bubble);
            wrapper.appendChild(bubbleContainer);

            if (trailingPunct) {
                const tpSpan = document.createElement('span');
                tpSpan.style.fontSize = '24px';
                tpSpan.style.fontWeight = '700';
                tpSpan.style.color = 'var(--text-primary)';
                tpSpan.innerText = trailingPunct;
                wrapper.appendChild(tpSpan);
            }

            container.appendChild(wrapper);
        });

        // Initialize Active word states
        const activeWord = words[this.currentWordIndex];
        this.wordMistakes = 0;
        this.inputBuffer = "";
        
        // Configure Custom Keyboard
        this.keyboard.setWord(activeWord.clean);
        
        // Canvas configurations
        this.canvas.clear();
        this.canvas.setGhosting(activeWord.clean, false);
        
        this.updateWriteInputIndicator();
        this.updateStoryProgressBar();
        
        // Hide pencil panel by default for a clean layout, unless they select it
        if (this.currentWordIndex === 0) {
            this.togglePencilPanel(false);
            this.toggleKeyboardPanel(false);
        }

        // Update Title Header dynamically for Stories Mode
        const titleHeader = document.getElementById('write-mode-title');
        if (titleHeader) {
            if (this.currentStory) {
                titleHeader.innerText = `Diktat: ${this.currentStory} (Satz ${this.storySentenceIndex} von ${this.storySentences.length})`;
            } else {
                titleHeader.innerText = "Mit Stift schreiben";
            }
        }

        // Autoplay sentence at the beginning of writing mode, then play active word
        if (this.currentWordIndex === 0) {
            this.audio.playSentence(this.currentSentence.id, this.currentSentence.sentence).then(() => {
                if (this.currentMode === 'write' && this.currentWordIndex === 0) {
                    this.audio.playWord(activeWord.clean);
                }
            });
        } else {
            this.audio.playWord(activeWord.clean);
        }

        // Apply saved keyboard mode selection and focus receiver
        const savedMode = localStorage.getItem('keyboardLayoutMode') || 'smart';
        this.setKeyboardMode(savedMode);

        // Initialize stuck timer for first letter
        this.resetLetterStuckTimer();
        this.resetWordTypeHintTimer();
    }

    setKeyboardMode(mode) {
        if (!this.keyboard) return;
        this.keyboard.keyboardMode = mode;
        this.keyboard.render();

        localStorage.setItem('keyboardLayoutMode', mode);

        const modes = ['smart', 'full', 'physical'];
        modes.forEach(m => {
            const btn = document.getElementById(`btn-kb-mode-${m}`);
            if (btn) {
                if (m === mode) {
                    btn.classList.add('active');
                    btn.style.background = 'white';
                    btn.style.fontWeight = '700';
                    btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
                    btn.style.color = 'var(--text-primary)';
                } else {
                    btn.classList.remove('active');
                    btn.style.background = 'transparent';
                    btn.style.fontWeight = '600';
                    btn.style.boxShadow = 'none';
                    btn.style.color = 'var(--text-secondary)';
                }
            }
        });

        const kbSection = document.querySelector('#write-view .keyboard-section');
        const receiver = document.getElementById('keyboard-receiver');
        
        if (kbSection) {
            if (mode === 'physical') {
                kbSection.style.padding = '8px';
            } else {
                kbSection.style.padding = '20px';
            }
        }

        if (receiver) {
            receiver.setAttribute('inputmode', 'none');
            setTimeout(() => {
                receiver.focus();
            }, 50);
        }
    }

    updateWriteInputIndicator() {
        const indicator = document.getElementById('write-input-indicator');
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        
        // Render characters typed or underlines
        const cleanChars = activeWord.clean.split('');
        const rendered = cleanChars.map((char, idx) => {
            if (idx < this.inputBuffer.length) {
                return `<span>${this.inputBuffer[idx]}</span>`;
            } else {
                return `<span style="color: var(--system-gray-light);">_</span>`;
            }
        }).join(' ');

        indicator.innerHTML = rendered || "Zeichne oder tippe unten...";
        this.updateActiveWordBubble();

        // Update grammatical hints helper for difficulties
        const tipBox = document.getElementById('write-word-tip-box');
        if (tipBox) {
            if (this.wordMistakes > 0) {
                const word = activeWord.clean;
                let wortart = "Kleinwort (klein schreiben)";
                const firstChar = word.charAt(0);
                
                if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
                    const commonSentenceStarters = ["Der", "Die", "Das", "Ein", "Eine", "Im", "In", "Am", "An", "Es", "Sie", "Er", "Wir", "Und", "Aber", "Bei"];
                    if (commonSentenceStarters.includes(word) && this.currentWordIndex === 0) {
                        wortart = "Artikel / Pronomen (groß schreiben am Satzanfang)";
                    } else {
                        wortart = "Nomen / Namenwort (groß schreiben)";
                    }
                } else {
                    if (word.endsWith('en') || word.endsWith('et') || word.endsWith('st') || word.endsWith('te')) {
                        wortart = "Verb (Zeitwort) / Adjektiv (klein schreiben)";
                    } else {
                        wortart = "Wort (klein schreiben)";
                    }
                }
                tipBox.innerHTML = `💡 Tipp: ${wortart}`;
            } else {
                tipBox.innerHTML = "";
            }
        }
    }

    updateActiveWordBubble() {
        const container = document.getElementById('write-sentence-container');
        if (!container || !this.currentSentence) return;
        const activeWrapper = container.children[this.currentWordIndex];
        const activeBubble = activeWrapper ? activeWrapper.querySelector('.word-bubble') : null;
        if (!activeBubble || !activeBubble.classList.contains('active')) return;
        
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        const cleanChars = activeWord.clean.split('');
        
        let html = '';
        for (let i = 0; i < cleanChars.length; i++) {
            if (i < this.inputBuffer.length) {
                html += this.inputBuffer[i];
            } else if (i === this.inputBuffer.length) {
                html += `<span class="typing-cursor">|</span>_`;
            } else {
                html += '_';
            }
            if (i < cleanChars.length - 1) html += ' ';
        }
        activeBubble.innerHTML = html;
    }

    togglePencilPanel(show) {
        const workspace = document.querySelector('#write-view .workspace');
        const btn = document.getElementById('btn-write-pencil-toggle');
        if (!workspace) return;
        
        const isHidden = workspace.classList.contains('pencil-hidden');
        const shouldShow = (show !== undefined) ? show : isHidden;
        
        if (shouldShow) {
            workspace.classList.remove('pencil-hidden');
            if (btn) {
                btn.innerHTML = '✏️ Stift ausblenden';
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
            }
            setTimeout(() => {
                if (this.canvas) this.canvas.resize();
            }, 60);
        } else {
            workspace.classList.add('pencil-hidden');
            if (btn) {
                btn.innerHTML = '✏️ Stift einblenden';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            }
        }
    }

    toggleKeyboardPanel(show) {
        const kbSection = document.querySelector('#write-view .keyboard-section');
        const btn = document.getElementById('btn-write-keyboard-toggle');
        if (!kbSection) return;
        
        const isHidden = kbSection.classList.contains('keyboard-hidden');
        const shouldShow = (show !== undefined) ? show : isHidden;
        
        if (shouldShow) {
            kbSection.classList.remove('keyboard-hidden');
            if (btn) {
                btn.innerHTML = '⌨️ Tastatur ausblenden';
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
            }
        } else {
            kbSection.classList.add('keyboard-hidden');
            if (btn) {
                btn.innerHTML = '⌨️ Tastatur einblenden';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            }
        }
    }

    handleKeyPress(char) {
        if (char === ' ') {
            this.checkWrittenWord();
            return;
        }
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        if (this.inputBuffer.length < activeWord.clean.length) {
            this.inputBuffer += char;
            this.updateWriteInputIndicator();
            this.resetLetterStuckTimer();
            this.resetWordTypeHintTimer();
            this.playEventSound('letter_written');
 
            // Automatically check ONLY if it is the last word of the sentence and the buffer matches the word length
            const isLastWord = this.currentWordIndex === this.currentSentence.words.length - 1;
            if (isLastWord && this.inputBuffer.length === activeWord.clean.length) {
                setTimeout(() => {
                    this.checkWrittenWord();
                }, 200);
            }
        }
    }

    handleDeletePress() {
        if (this.inputBuffer.length > 0) {
            this.inputBuffer = this.inputBuffer.slice(0, -1);
            this.updateWriteInputIndicator();
            this.resetLetterStuckTimer();
            this.resetWordTypeHintTimer();
        }
    }

    async checkWrittenWord() {
        if (!this.currentSentence) return;
        
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        const attempt = this.inputBuffer.trim();
        const target = activeWord.clean;
        
        const wordWrapper = document.getElementById('write-sentence-container').children[this.currentWordIndex];
        const wordBubble = wordWrapper ? wordWrapper.querySelector('.word-bubble') : null;
        const indicator = document.getElementById('write-input-indicator');
        if (attempt === target) {
            // Word correct!
            this.showStatusToast("Super gemacht! 👍");
            this.playEventSound('word_correct');
            
            // Show word type label
            if (wordWrapper) {
                const label = wordWrapper.querySelector('.word-type-label');
                if (label) label.style.opacity = '1';
            }
            
            // Turn active bubble green immediately
            if (wordBubble) {
                wordBubble.innerText = activeWord.clean;
                wordBubble.classList.remove('active', 'masked');
                wordBubble.classList.add('correct');
            }
            
            // Advance
            this.currentWordIndex++;
            this.clearLetterStuckTimer();
            if (this.currentWordIndex >= this.currentSentence.words.length) {
                // Full sentence solved!
                this.showStatusToast("Satz komplett gelöst! 🎉");
                await this.finishCurrentSentence();
            } else {
                this.setupWritingWord();
            }
        } else {
            // Incorrect attempt
            this.revealActiveWordType();
            this.sentenceHasError = true;
            this.wordMistakes++;
            
            if (!this.wordMistakeCounts[this.currentWordIndex]) {
                this.wordMistakeCounts[this.currentWordIndex] = 0;
            }
            this.wordMistakeCounts[this.currentWordIndex]++;
            
            const existingMistake = this.mistakenWords.find(m => m.target === activeWord.clean);
            if (!existingMistake) {
                this.mistakenWords.push({
                    target: activeWord.clean,
                    attempt: attempt
                });
            } else {
                existingMistake.attempt = attempt;
            }
            
            // Visual Shake feedback on wrapper & input field
            if (wordWrapper) wordWrapper.classList.add('shake');
            indicator.classList.add('shake');
            setTimeout(() => {
                if (wordWrapper) wordWrapper.classList.remove('shake');
                indicator.classList.remove('shake');
            }, 600);

            // Play mistake buzzer/sound or repeat word
            this.playEventSound('word_incorrect');
            this.audio.playErrorSound();
            await this.audio.playWord(activeWord.clean);
            this.resetLetterStuckTimer();

            // Scaffolding Logic:
            if (this.wordMistakes === 1) {
                // Play audio repetition (already played above)
            } else if (this.wordMistakes === 2) {
                // Help 2: Auto-fill first letter
                this.inputBuffer = activeWord.clean.charAt(0);
                this.updateWriteInputIndicator();
                this.showStatusToast("Hier ist eine Hilfe: Erster Buchstabe eingetragen!");
            } else if (this.wordMistakes >= 3) {
                // Help 3: Ghosting tracing template in background
                this.canvas.setGhosting(activeWord.clean, true);
                this.showStatusToast("Zeichne den blassen Buchstaben nach!");
                this.togglePencilPanel(true); // Auto-show pencil canvas on third mistake
            }
            
            // Save box demotion instantly to ensure they repeat this sentence
            await this.db.recordResult(
                this.currentProfile.id,
                this.currentSentence.id,
                'write',
                false
            );
        }
    }

    // --- READING MODE LOGIC ---
    setupReadingSentence() {
        if (!this.currentSentence) return;

        // Update Title Header dynamically for Stories Mode
        const titleHeader = document.getElementById('read-mode-title');
        if (titleHeader) {
            if (this.currentStory) {
                titleHeader.innerText = `Vorlesen: ${this.currentStory} (Satz ${this.storySentenceIndex} von ${this.storySentences.length})`;
            } else {
                titleHeader.innerText = "Satz laut vorlesen";
            }
        }

        const container = document.getElementById('read-sentence-container');
        container.innerHTML = "";

        this.currentSentence.words.forEach((wData, idx) => {
            const span = document.createElement('span');
            span.className = 'reading-word';
            span.innerText = wData.word;
            span.dataset.index = idx;
            
            // Allow manual click to listen as a reading helper
            span.addEventListener('click', () => this.playWordHelpAt(idx));
            
            container.appendChild(span);
        });

        this.highlightActiveReadingWord();
        this.updateStoryProgressBar();
        this.resetStuckTimer();

        // Automatically activate microphone on start
        if (!this.speech.isListening) {
            this.toggleSpeechListening();
        }
    }

    highlightActiveReadingWord() {
        const container = document.getElementById('read-sentence-container');
        const words = container.querySelectorAll('.reading-word');
        
        words.forEach((wSpan, idx) => {
            wSpan.classList.remove('active', 'correct', 'skipped');
            if (idx < this.currentWordIndex) {
                if (this.skippedWords.includes(idx)) {
                    wSpan.classList.add('skipped');
                } else {
                    wSpan.classList.add('correct');
                }
            } else if (idx === this.currentWordIndex) {
                wSpan.classList.add('active');
            }
        });
    }

    async playWordHelpAt(idx) {
        if (!this.currentSentence) return;
        const wData = this.currentSentence.words[idx];
        await this.audio.playWord(wData.clean);
        this.resetStuckTimer();
    }

    async playCurrentReadingWordHelp() {
        if (!this.currentSentence) return;
        await this.playWordHelpAt(this.currentWordIndex);
    }

    // Speech control buttons
    toggleSpeechListening() {
        const btn = document.getElementById('btn-read-mic');
        const statusLbl = document.getElementById('mic-status-label');

        if (this.speech.isListening) {
            this.speech.stop();
            btn.classList.remove('recording');
            statusLbl.innerText = "Tippe auf das Mikrofon, um zu lesen";
            this.stopAudioVisualizer();
            this.clearStuckTimer();
        } else {
            const activeWords = this.currentSentence.words;
            this.speech.start(activeWords, this.currentWordIndex, 'de-AT');
            btn.classList.add('recording');
            statusLbl.innerText = "Ich höre zu... Lies laut vor!";
            this.startAudioVisualizer();
            this.resetStuckTimer();
        }
    }

    handleSpeechWordMatched(matchedIdx) {
        // Karaoke tracker jumped
        if (matchedIdx >= this.currentWordIndex) {
            this.currentWordIndex = matchedIdx + 1;
            this.highlightActiveReadingWord();
            this.updateStoryProgressBar();
            this.resetStuckTimer();
        }
    }

    handleSpeechInterim(text) {
        const preview = document.getElementById('read-interim-preview');
        preview.innerText = `Gehört: "${text}"`;
    }

    async handleSpeechFinished(success) {
        const btn = document.getElementById('btn-read-mic');
        const statusLbl = document.getElementById('mic-status-label');
        btn.classList.remove('recording');
        statusLbl.innerText = "Tippe auf das Mikrofon, um zu lesen";
        this.clearStuckTimer();

        if (success) {
            this.showStatusToast("Hervorragend gelesen! 🌟");
            
            // Play sentence confirmation audio
            await this.audio.playSentence(this.currentSentence.id, this.currentSentence.sentence);
            
            // Record progress & display summary
            await this.finishCurrentReadingSentence();
        }
    }

    // --- WORD SKIPPING & PRACTICE SUMMARIES ---
    handleSkipWord() {
        if (!this.currentSentence) return;
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        
        this.skippedWords.push(this.currentWordIndex);
        
        const wordWrapper = document.getElementById('write-sentence-container').children[this.currentWordIndex];
        const wordBubble = wordWrapper ? wordWrapper.querySelector('.word-bubble') : null;
        if (wordBubble) {
            wordBubble.innerText = activeWord.clean;
            wordBubble.classList.remove('active', 'masked');
            wordBubble.classList.add('skipped');
        }
        
        this.sentenceHasError = true;
        this.audio.playErrorSound();
        this.showStatusToast(`Wort übersprungen: ${activeWord.clean}`, "warning");
        
        this.currentWordIndex++;
        if (this.currentWordIndex >= this.currentSentence.words.length) {
            this.finishCurrentSentence();
        } else {
            this.setupWritingWord();
        }
    }

    handleReadWordSkip() {
        if (!this.currentSentence) return;
        
        this.skippedWords.push(this.currentWordIndex);
        
        const container = document.getElementById('read-sentence-container');
        const words = container.querySelectorAll('.reading-word');
        const activeWordSpan = words[this.currentWordIndex];
        if (activeWordSpan) {
            activeWordSpan.classList.remove('active');
            activeWordSpan.classList.add('skipped');
        }
        
        this.sentenceHasError = true;
        this.audio.playErrorSound();
        this.showStatusToast(`Wort übersprungen: ${this.currentSentence.words[this.currentWordIndex].clean}`, "warning");
        
        // Feed matching simulator next step to speech engine if listening
        if (this.speech.isListening) {
            this.speech.currentWordIndex = this.currentWordIndex + 1;
        }

        this.currentWordIndex++;
        if (this.currentWordIndex >= this.currentSentence.words.length) {
            this.finishCurrentReadingSentence();
        } else {
            this.highlightActiveReadingWord();
            this.updateStoryProgressBar();
        }
    }

    async finishCurrentSentence() {
        this.playEventSound('sentence_complete');
        let earnedPoints = 0;
        const words = this.currentSentence.words;
        
        words.forEach((wData, idx) => {
            const mistakes = this.wordMistakeCounts[idx] || 0;
            const isSkipped = this.skippedWords.includes(idx);
            
            if (isSkipped) {
                earnedPoints += 0;
            } else if (mistakes === 0) {
                earnedPoints += 10;
            } else if (mistakes === 1) {
                earnedPoints += 5;
            } else if (mistakes === 2) {
                earnedPoints += 2;
            } else {
                earnedPoints += 0;
            }
        });

        const isSuccess = !this.sentenceHasError;
        const stats = {
            points: earnedPoints,
            mistakes: this.mistakenWords.map(m => m.target),
            skipped: this.skippedWords
        };
        
        const progressRecord = await this.db.recordResult(
            this.currentProfile.id,
            this.currentSentence.id,
            this.currentMode,
            isSuccess,
            stats
        );

        await this.updateProfileScoreUI(this.currentProfile.id, earnedPoints);
        await this.updateDailyMotivation();

        const maxPossiblePoints = this.currentSentence.words.length * 10;
        if (earnedPoints === maxPossiblePoints) {
            this.audio.playSuccessFanfare();
        } else if (earnedPoints === 0) {
            this.audio.playErrorSound();
        }

        const hasSignificantErrors = this.skippedWords.length > 0 || this.mistakenWords.length > 1;
        if (!hasSignificantErrors) {
            this.showCenterPointsSplash(earnedPoints);
        }

        const pbContainer = document.getElementById('write-progress-bar-container');
        const pb = document.getElementById('write-progress-bar');
        if (pbContainer && pb) {
            pb.style.transition = 'none';
            pb.style.width = '0%';
            pbContainer.style.display = 'block';
        }

        this.audio.onPlayProgress = (percent) => {
            if (pb) {
                pb.style.transition = 'none';
                pb.style.width = (percent * 100) + '%';
            }
        };

        await this.audio.playSentence(this.currentSentence.id, this.currentSentence.sentence);
        
        this.audio.onPlayProgress = null;
        if (pbContainer) pbContainer.style.display = 'none';

        const ruleMode = localStorage.getItem('ruleMode') || 'always';
        const showModal = (ruleMode === 'always') || (ruleMode === 'errors' && this.sentenceHasError);

        if (showModal) {
            this.showSummaryModal(earnedPoints, progressRecord);
        } else {
            this.showCenterPointsSplash(earnedPoints);
            setTimeout(() => {
                this.nextSentence();
            }, 1000);
        }
    }

    async finishCurrentReadingSentence() {
        this.playEventSound('sentence_complete');
        let earnedPoints = 0;
        const words = this.currentSentence.words;
        
        words.forEach((wData, idx) => {
            const mistakes = this.wordMistakeCounts[idx] || 0;
            const isSkipped = this.skippedWords.includes(idx);
            
            if (isSkipped) {
                earnedPoints += 0;
            } else if (mistakes === 0) {
                earnedPoints += 10;
            } else if (mistakes === 1) {
                earnedPoints += 5;
            } else if (mistakes === 2) {
                earnedPoints += 2;
            } else {
                earnedPoints += 0;
            }
        });

        const isSuccess = !this.sentenceHasError;
        const stats = {
            points: earnedPoints,
            mistakes: this.mistakenWords.map(m => m.target),
            skipped: this.skippedWords
        };

        const progressRecord = await this.db.recordResult(
            this.currentProfile.id,
            this.currentSentence.id,
            this.currentMode,
            isSuccess,
            stats
        );

        await this.updateProfileScoreUI(this.currentProfile.id, earnedPoints);
        await this.updateDailyMotivation();

        const maxPossiblePoints = this.currentSentence.words.length * 10;
        if (earnedPoints === maxPossiblePoints) {
            this.audio.playSuccessFanfare();
        } else if (earnedPoints === 0) {
            this.audio.playErrorSound();
        }

        if (this.speech.isListening) {
            this.toggleSpeechListening();
        }

        const ruleMode = localStorage.getItem('ruleMode') || 'always';
        const showModal = (ruleMode === 'always') || (ruleMode === 'errors' && this.sentenceHasError);

        if (showModal) {
            this.showSummaryModal(earnedPoints, progressRecord);
        } else {
            this.showCenterPointsSplash(earnedPoints);
            setTimeout(() => {
                this.nextSentence();
            }, 1000);
        }
    }

    showSummaryModal(points, progressRecord) {
        const modal = document.getElementById('summary-modal');
        if (!modal) return;

        document.getElementById('summary-repeated-error-alert').style.display = 'none';
        document.getElementById('summary-mistakes-container').style.display = 'none';
        document.getElementById('summary-skipped-container').style.display = 'none';

        const scoreBadge = document.getElementById('summary-score-badge');
        scoreBadge.innerText = `+${points} Punkte!`;
        if (points === 10) {
            scoreBadge.style.color = 'var(--success-green)';
        } else if (points >= 5) {
            scoreBadge.style.color = 'var(--accent-blue)';
        } else if (points > 0) {
            scoreBadge.style.color = '#FF9500';
        } else {
            scoreBadge.style.color = 'var(--text-secondary)';
        }

        const scoreCompare = document.getElementById('summary-score-compare');
        if (progressRecord.previousPoints !== null && progressRecord.previousPoints !== undefined) {
            const diff = points - progressRecord.previousPoints;
            let diffText = "";
            if (diff > 0) {
                diffText = ` (Vorher: ${progressRecord.previousPoints} Punkte - Verbesserung! 📈)`;
            } else if (diff < 0) {
                diffText = ` (Vorher: ${progressRecord.previousPoints} Punkte - Nächstes Mal schaffst du wieder mehr! 💪)`;
            } else {
                diffText = ` (Vorher: ${progressRecord.previousPoints} Punkte - Konstant gut! 🎯)`;
            }
            scoreCompare.innerText = diffText;
        } else {
            scoreCompare.innerText = "(Erster Versuch bei diesem Satz)";
        }

        if (progressRecord.repeatedErrors && progressRecord.repeatedErrors.length > 0) {
            const list = document.getElementById('summary-repeated-error-list');
            list.innerHTML = "";
            progressRecord.repeatedErrors.forEach(w => {
                const li = document.createElement('li');
                li.innerText = w;
                list.appendChild(li);
            });
            document.getElementById('summary-repeated-error-alert').style.display = 'block';
        }

        const solvedList = document.getElementById('summary-solved-list');
        solvedList.innerHTML = "";
        const mistakesList = document.getElementById('summary-mistakes-list');
        mistakesList.innerHTML = "";
        const skippedList = document.getElementById('summary-skipped-list');
        skippedList.innerHTML = "";

        const mistakenTargets = this.mistakenWords.map(m => m.target);

        // Spelling feedback rules helper
        const getSpellingFeedback = (attempt, target) => {
            if (!attempt) return `Du hast das Wort nicht fertig geschrieben.`;
            const attemptLower = attempt.toLowerCase();
            const targetLower = target.toLowerCase();

            if (attemptLower === targetLower) {
                if (target[0] === target[0].toUpperCase() && attempt[0] === attempt[0].toLowerCase()) {
                    if (target === "Setzen" || target === "Spielen" || target === "Lernen" || target === "Essen") {
                        return `Du hast <b>"${attempt}"</b> klein geschrieben. Hier ist es ein Namenwort (Substantivierung: "das ${target}"), daher schreibt man es groß!`;
                    }
                    return `Du hast <b>"${attempt}"</b> klein geschrieben. Nomen (Namenwörter) wie <b>"${target}"</b> schreibt man groß!`;
                }
                if (target[0] === target[0].toLowerCase() && attempt[0] === attempt[0].toUpperCase()) {
                    return `Du hast <b>"${attempt}"</b> groß geschrieben. Dieses Wort schreibt man klein: <b>"${target}"</b>.`;
                }
            }

            const doubleConsonants = ['bb', 'dd', 'ff', 'gg', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt'];
            for (let dc of doubleConsonants) {
                const sc = dc[0];
                if (targetLower.includes(dc) && !attemptLower.includes(dc) && attemptLower.includes(sc)) {
                    return `Nach einem kurz gesprochenen Vokal (Selbstlaut) wird der Mitlaut verdoppelt. Schreib <b>"${target}"</b> mit <b>"${dc}"</b> statt "${sc}".`;
                }
                if (!targetLower.includes(dc) && attemptLower.includes(dc) && targetLower.includes(sc)) {
                    return `Hier schreibt man nur einen einfachen Mitlaut: Schreib <b>"${target}"</b> mit <b>"${sc}"</b> statt "${dc}".`;
                }
            }

            if (targetLower.includes('tz') && !attemptLower.includes('tz') && attemptLower.includes('z')) {
                return `Nach einem kurzen Vokal schreiben wir meist <b>"tz"</b> (wie in <b>"${target}"</b>) statt nur "z".`;
            }
            if (targetLower.includes('ck') && !attemptLower.includes('ck') && attemptLower.includes('k')) {
                return `Nach einem kurzen Vokal schreiben wir meist <b>"ck"</b> (wie in <b>"${target}"</b>) statt nur "k".`;
            }

            if (targetLower.includes('ie') && !attemptLower.includes('ie') && attemptLower.includes('i')) {
                return `Hier wird das "i" lang gesprochen. Schreib <b>"${target}"</b> mit <b>"ie"</b> statt nur "i".`;
            }
            if (targetLower.includes('ieh') && !attemptLower.includes('ieh') && attemptLower.includes('ie')) {
                return `Hier gehört ein Dehnungs-h dazu. Schreib <b>"${target}"</b> mit <b>"ieh"</b>.`;
            }

            if (targetLower.startsWith('v') && attemptLower.startsWith('f')) {
                return `Vorsicht beim "F-Laut"! Manches schreibt man mit "V" (wie den "Vogel" oder <b>"${target}"</b>).`;
            }
            if (targetLower.startsWith('f') && attemptLower.startsWith('v')) {
                return `Dieses Wort schreibt man mit "F" am Anfang: <b>"${target}"</b>.`;
            }

            if (targetLower.includes('ä') && attemptLower.includes('e')) {
                return `Tipp: Leite das Wort von der Grundform ab (z. B. Äpfel von Apfel). Schreib <b>"${target}"</b> mit <b>"ä"</b>.`;
            }

            return `Du hast <b>"${attempt}"</b> geschrieben, gesucht war aber <b>"${target}"</b>. Schau dir die Buchstaben noch einmal genau an!`;
        };

        const getSpellingRuleForWord = (word, isSentenceStart) => {
            const clean = word.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
            const lower = clean.toLowerCase();
            if (!clean) return "";

            let parts = [];
            const doubleConsonants = ['bb', 'dd', 'ff', 'gg', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt'];
            
            if (lower.includes('ieh') || (lower.includes('h') && !lower.startsWith('h') && !lower.includes('ch') && !lower.includes('sch') && !lower.includes('ph') && !lower.includes('th'))) {
                parts.push("Stummes h");
            }
            if (doubleConsonants.some(dc => lower.includes(dc))) {
                parts.push("Doppelkonsonant");
            }
            if (lower.includes('ie')) {
                parts.push("Langes ie");
            }
            if (lower.includes('ck') || lower.includes('tz')) {
                parts.push("ck und tz");
            }
            if (lower.endsWith('d') || lower.endsWith('g') || lower.endsWith('b')) {
                parts.push("Auslaut");
            }
            if (lower.includes('ä') || lower.includes('äu')) {
                parts.push("Umlautableitung (ä/äu)");
            }
            if (lower.includes('ß') || lower.includes('ss')) {
                parts.push("s-Laut (ss/ß)");
            }
            if (lower.startsWith('v')) {
                parts.push("Vogel-v");
            }
            if (lower.startsWith('sp') || lower.startsWith('st')) {
                parts.push("sp / st");
            }
            if (lower.endsWith('ig') || lower.endsWith('lich') || lower.endsWith('isch')) {
                parts.push("Endung -ig/-lich");
            }

            const isCapital = clean[0] === clean[0].toUpperCase() && clean[0] !== clean[0].toLowerCase();
            if (isCapital && !isSentenceStart) {
                parts.push("Nomen (groß)");
            }

            return parts.length > 0 ? parts.join(", ") : "Standard";
        };

        // Populate dynamic rules container
        const rulesList = document.getElementById('summary-rules-list');
        if (rulesList) {
            rulesList.innerHTML = "";
            this.currentSentence.words.forEach((wData, idx) => {
                const ruleText = getSpellingRuleForWord(wData.clean, idx === 0);
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.fontSize = '13px';
                row.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
                row.style.padding = '4px 0';
                
                const wordSpan = document.createElement('span');
                wordSpan.style.fontWeight = '700';
                wordSpan.style.color = 'var(--text-primary)';
                wordSpan.innerText = wData.word;
                
                const ruleSpan = document.createElement('span');
                ruleSpan.style.color = 'var(--accent-blue)';
                ruleSpan.style.fontWeight = '600';
                ruleSpan.innerText = ruleText;
                
                row.appendChild(wordSpan);
                row.appendChild(ruleSpan);
                rulesList.appendChild(row);
            });
        }

        this.currentSentence.words.forEach((wData, idx) => {
            const span = document.createElement('span');
            span.style.padding = '4px 8px';
            span.style.borderRadius = '6px';
            span.style.fontSize = '14px';
            span.style.fontWeight = '600';
            span.innerText = wData.clean;

            if (this.skippedWords.includes(idx)) {
                span.style.background = 'rgba(255, 149, 0, 0.15)';
                span.style.color = '#FF9500';
                skippedList.appendChild(span);
                document.getElementById('summary-skipped-container').style.display = 'block';
            } else if (mistakenTargets.includes(wData.clean)) {
                const mistakeObj = this.mistakenWords.find(m => m.target === wData.clean);
                const explanation = getSpellingFeedback(mistakeObj ? mistakeObj.attempt : "", wData.clean);
                
                span.style.background = 'rgba(255, 59, 48, 0.15)';
                span.style.color = 'var(--error-red)';
                
                const wordBox = document.createElement('div');
                wordBox.style.display = 'flex';
                wordBox.style.flexDirection = 'column';
                wordBox.style.gap = '4px';
                wordBox.style.width = '100%';
                wordBox.style.padding = '8px 12px';
                wordBox.style.borderRadius = '8px';
                wordBox.style.background = 'var(--system-gray-light)';
                
                const headerLine = document.createElement('div');
                headerLine.style.display = 'flex';
                headerLine.style.gap = '12px';
                headerLine.style.alignItems = 'center';
                
                headerLine.appendChild(span);
                
                const attemptLabel = document.createElement('span');
                attemptLabel.style.fontSize = '13px';
                attemptLabel.style.color = 'var(--text-secondary)';
                attemptLabel.innerHTML = `Deine Eingabe: <span style="text-decoration: line-through; color: var(--error-red); font-weight: 600;">${mistakeObj ? mistakeObj.attempt : "?"}</span>`;
                headerLine.appendChild(attemptLabel);
                
                wordBox.appendChild(headerLine);
                
                const explanationText = document.createElement('div');
                explanationText.style.fontSize = '12.5px';
                explanationText.style.color = 'var(--text-primary)';
                explanationText.style.lineHeight = '1.4';
                explanationText.innerHTML = `💡 ${explanation}`;
                wordBox.appendChild(explanationText);
                
                mistakesList.appendChild(wordBox);
                document.getElementById('summary-mistakes-container').style.display = 'block';
            } else {
                span.style.background = 'rgba(52, 199, 89, 0.15)';
                span.style.color = 'var(--success-green)';
                solvedList.appendChild(span);
            }
        });

        modal.classList.add('active');
    }

    closeSummaryModal() {
        const modal = document.getElementById('summary-modal');
        if (modal) modal.classList.remove('active');
        this.nextSentence();
    }

    // --- AUDIO VISUALIZER ---
    async startAudioVisualizer() {
        this.stopAudioVisualizer();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.visualizerStream = stream;
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            
            const source = this.audioCtx.createMediaStreamSource(stream);
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 32;
            
            source.connect(this.analyser);
            
            const container = document.getElementById('mic-visualizer-container');
            if (container) container.style.display = 'flex';
            
            this.visualizeMic();
        } catch (e) {
            console.warn("Could not start mic visualizer:", e);
        }
    }

    visualizeMic() {
        if (!this.analyser) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        const bars = document.querySelectorAll('.mic-bar');
        if (bars.length > 0) {
            bars.forEach((bar, idx) => {
                const val = dataArray[idx % dataArray.length] || 0;
                // Map frequency value (0-255) to height (5px to 30px)
                const height = 5 + (val / 255) * 25;
                bar.style.height = `${height}px`;
            });
        }
        
        this.visualizerFrameId = requestAnimationFrame(() => this.visualizeMic());
    }

    stopAudioVisualizer() {
        if (this.visualizerFrameId) {
            cancelAnimationFrame(this.visualizerFrameId);
            this.visualizerFrameId = null;
        }
        if (this.visualizerStream) {
            this.visualizerStream.getTracks().forEach(track => track.stop());
            this.visualizerStream = null;
        }
        if (this.audioCtx) {
            this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
        }
        this.analyser = null;
        this.clearLetterStuckTimer();
        
        const container = document.getElementById('mic-visualizer-container');
        if (container) container.style.display = 'none';
    }

    resetLetterStuckTimer() {
        this.clearLetterStuckTimer();
        
        if (this.currentMode !== 'write' || !this.currentSentence) return;
        
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        if (!activeWord) return;
        
        const nextCharIdx = this.inputBuffer.length;
        if (nextCharIdx >= activeWord.clean.length) return;
        
        const nextChar = activeWord.clean.charAt(nextCharIdx).toLowerCase();
        const letterSoundName = this._getGermanLetterName(nextChar);
        
        this.letterStuckTimer = setTimeout(async () => {
            this.showStatusToast(`Tipp: Der nächste Buchstabe ist "${nextChar.toUpperCase()}"`);
            await this.audio.speak(letterSoundName);
            
            // Loop timer if still stuck
            this.resetLetterStuckTimer();
        }, 5500); // 5.5 seconds delay
    }

    clearLetterStuckTimer() {
        if (this.letterStuckTimer) {
            clearTimeout(this.letterStuckTimer);
            this.letterStuckTimer = null;
        }
    }

    _getGermanLetterName(char) {
        const dict = {
            'a': 'a', 'b': 'be', 'c': 'ze', 'd': 'de', 'e': 'e', 'f': 'eff', 'g': 'ge',
            'h': 'ha', 'i': 'i', 'j': 'jot', 'k': 'ka', 'l': 'ell', 'm': 'em', 'n': 'en',
            'o': 'o', 'p': 'pe', 'q': 'ku', 'r': 'er', 's': 'es', 't': 'te', 'u': 'u',
            'v': 'vau', 'w': 'we', 'x': 'ix', 'y': 'ypsilon', 'z': 'zett',
            'ä': 'ä', 'ö': 'ö', 'ü': 'ü', 'ß': 'eszett'
        };
        return dict[char.toLowerCase()] || char;
    }

    async updateProfileScoreUI(profileId, pointsToAdd = 0) {
        if (!this.currentProfile || this.currentProfile.id !== profileId) return;

        const progressRecords = await this.db.getProfileProgress(profileId);
        let totalScore = 0;
        progressRecords.forEach(r => {
            if (r.points !== undefined && r.points !== null) {
                totalScore += r.points;
            }
        });

        const scoreEl = document.getElementById('active-profile-score');
        if (scoreEl) {
            scoreEl.innerText = `⭐ ${totalScore} Punkte`;
        }

        // Play floating points animation
        if (pointsToAdd > 0) {
            const badge = document.getElementById('active-profile-score-badge');
            if (badge) {
                const animSpan = document.createElement('span');
                animSpan.className = 'score-floating-anim';
                animSpan.innerText = `+${pointsToAdd}`;
                badge.appendChild(animSpan);

                setTimeout(() => {
                    animSpan.remove();
                }, 1400);
            }
        }
    }

    showCenterPointsSplash(points) {
        const container = document.getElementById('center-splash-container');
        if (!container) return;

        const el = document.createElement('div');
        el.className = 'splash-points';
        el.innerHTML = `🌟 +${points} Punkte`;
        container.appendChild(el);

        setTimeout(() => {
            el.remove();
        }, 1200);
    }

    // Stuck Tracking timer (> 4 seconds trigger helper)
    resetStuckTimer() {
        this.clearStuckTimer();
        
        // Only run stuck tracker if speech recognition is actively listening!
        if (!this.speech || !this.speech.isListening) return;
        
        this.stuckTimer = setTimeout(async () => {
            if (this.currentMode === 'read' && this.currentSentence) {
                // Visual wiggle or prompt to tap active word
                this.showStatusToast("Tippe auf das blaue Wort, um Hilfe zu hören! 🔊");
                
                // Track reading error in progress store since child stalled
                this.sentenceHasError = true;
                this.audio.playErrorSound();
                
                if (!this.wordMistakeCounts[this.currentWordIndex]) {
                    this.wordMistakeCounts[this.currentWordIndex] = 0;
                }
                this.wordMistakeCounts[this.currentWordIndex]++;
                
                const activeWord = this.currentSentence.words[this.currentWordIndex];
                if (activeWord) {
                    const cleanWord = activeWord.clean;
                    let typeHint = "klein geschrieben";
                    if (cleanWord.charAt(0) === cleanWord.charAt(0).toUpperCase()) {
                        typeHint = "Nomen / Namenwort (groß)";
                    }
                    this.showStatusToast(`Tipp: "${cleanWord}" ist ein ${typeHint}. Tippe darauf, um Hilfe zu hören! 🔊`);
                    
                    const alreadyLogged = this.mistakenWords.find(m => m.target === cleanWord);
                    if (!alreadyLogged) {
                        this.mistakenWords.push({
                            target: cleanWord,
                            attempt: "(nicht gesprochen / Hilfe benötigt)"
                        });
                    }
                }
                
                await this.db.recordResult(
                    this.currentProfile.id,
                    this.currentSentence.id,
                    'read',
                    false
                );
            }
        }, 4000);
    }

    clearStuckTimer() {
        if (this.stuckTimer) {
            clearTimeout(this.stuckTimer);
            this.stuckTimer = null;
        }
    }

    // --- STATISTICS PROGRESS REPORT ---
    async showStatsView() {
        if (!this.currentProfile) return;
        
        const history = await this.db.getHistory(this.currentProfile.id);
        const progressList = await this.db.getProfileProgress(this.currentProfile.id);
        
        // Sum total mastered sentences (Box 5)
        const mastered = progressList.filter(p => p.box === 5).length;
        
        // Sum errors
        let writeErrors = 0;
        let readErrors = 0;
        
        progressList.forEach(p => {
            writeErrors += p.errorsWriting || 0;
            readErrors += p.errorsReading || 0;
        });

        // Set labels
        document.getElementById('stat-sentences-total').innerText = progressList.length;
        document.getElementById('stat-leitner-mastered').innerText = mastered;
        document.getElementById('stat-errors-write').innerText = writeErrors;
        document.getElementById('stat-errors-read').innerText = readErrors;

        this.switchView('stats-view');
        this.renderDailyScoresChart('week');
    }

    showStoriesView() {
        if (!this.currentProfile) return;
        const currentGrade = this.currentProfile.grade;
        
        const container = document.getElementById('stories-list');
        if (!container) return;
        container.innerHTML = "";
        
        // Group all stories from all grades
        const storySentences = this.sentences.filter(s => s.story);
        const storiesMap = {};
        
        storySentences.forEach(s => {
            if (!storiesMap[s.story]) {
                storiesMap[s.story] = [];
            }
            storiesMap[s.story].push(s);
        });
        
        const storyNames = Object.keys(storiesMap);
        if (storyNames.length === 0) {
            container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; margin-top: 24px;">Keine Geschichten vorhanden.</p>`;
            this.switchView('stories-view');
            return;
        }

        // Sort stories: current grade stories first, then other stories sorted by grade and title
        storyNames.sort((a, b) => {
            const gradeA = storiesMap[a][0].grade;
            const gradeB = storiesMap[b][0].grade;
            
            const isCurrA = (gradeA === currentGrade);
            const isCurrB = (gradeB === currentGrade);
            
            if (isCurrA && !isCurrB) return -1;
            if (!isCurrA && isCurrB) return 1;
            
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.localeCompare(b);
        });
        
        storyNames.forEach(storyName => {
            const sList = storiesMap[storyName];
            
            const card = document.createElement('div');
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.gap = '16px';
            card.style.padding = '12px 18px';
            card.style.background = 'var(--card-background)';
            card.style.borderRadius = '16px';
            card.style.border = '1px solid var(--system-gray-light)';
            
            // Left column: Info
            const info = document.createElement('div');
            info.style.display = 'flex';
            info.style.flexDirection = 'column';
            info.style.gap = '4px';
            info.style.flex = '1';
            
            const titleRow = document.createElement('div');
            titleRow.style.display = 'flex';
            titleRow.style.alignItems = 'baseline';
            titleRow.style.gap = '8px';
            
            const title = document.createElement('h3');
            title.style.margin = '0';
            title.style.fontSize = '16px';
            title.style.fontWeight = '700';
            title.innerText = storyName;
            
            const count = document.createElement('span');
            count.style.fontSize = '11px';
            count.style.opacity = '0.6';
            count.innerText = `(${sList.length} Sätze)`;
            
            titleRow.appendChild(title);
            titleRow.appendChild(count);
            info.appendChild(titleRow);
            
            // Preview
            const preview = document.createElement('p');
            preview.style.margin = '0';
            preview.style.fontSize = '13px';
            preview.style.color = 'var(--text-secondary)';
            preview.style.fontStyle = 'italic';
            preview.innerText = `"${sList[0].sentence.substring(0, 50)}..."`;
            info.appendChild(preview);
            
            card.appendChild(info);
            
            // Right column: Actions
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';
            
            const btnWrite = document.createElement('button');
            btnWrite.className = 'btn btn-primary';
            btnWrite.style.minHeight = '36px';
            btnWrite.style.padding = '6px 12px';
            btnWrite.style.fontSize = '13px';
            btnWrite.innerText = "✍️ Diktat";
            btnWrite.style.minWidth = '80px';
            btnWrite.addEventListener('click', () => {
                this.currentStory = storyName;
                this.storySentences = sList;
                this.storySentenceIndex = 0;
                this.startMode('write');
            });
            
            const btnRead = document.createElement('button');
            btnRead.className = 'btn btn-success';
            btnRead.style.minHeight = '36px';
            btnRead.style.padding = '6px 12px';
            btnRead.style.fontSize = '13px';
            btnRead.innerText = "🗣️ Lesen";
            btnRead.style.minWidth = '80px';
            btnRead.addEventListener('click', () => {
                this.currentStory = storyName;
                this.storySentences = sList;
                this.storySentenceIndex = 0;
                this.startMode('read');
            });
            
            actions.appendChild(btnWrite);
            actions.appendChild(btnRead);
            card.appendChild(actions);
            
            container.appendChild(card);
        });
        
        this.switchView('stories-view');
    }

    handleCanvasStrokeEnd() {
        if (this.canvasRecognitionTimeout) {
            clearTimeout(this.canvasRecognitionTimeout);
        }
        this.canvasRecognitionTimeout = setTimeout(() => {
            this.runCanvasRecognition();
        }, 1100);
    }

    async runCanvasRecognition() {
        if (!this.currentSentence || this.currentMode !== 'write') return;
        if (this.canvas.strokes.length === 0) return;

        this.showStatusToast("Erkenne Schrift... ✏️");
        const candidates = await this.canvas.recognizeHandwriting();
        if (candidates && candidates.length > 0) {
            const bestMatch = candidates[0].trim();
            // Populate buffer with handwriting result
            this.inputBuffer = bestMatch;
            this.updateWriteInputIndicator();
            this.showStatusToast(`Erkannt: "${bestMatch}"`);
            this.resetLetterStuckTimer();

            // Automatically advance if it matches target word exactly
            const activeWord = this.currentSentence.words[this.currentWordIndex];
            if (activeWord && bestMatch.toLowerCase() === activeWord.clean.toLowerCase()) {
                setTimeout(() => {
                    this.checkWrittenWord();
                }, 400); // 400ms delay so they can see the word populated
            }
        }
    }

    showSettingsView() {
        // Highlight active tolerance level
        const activeLevel = localStorage.getItem('speechTolerance') || 'lax';
        this.selectTolerance(activeLevel, false);
        
        // Highlight active rule mode preference
        const activeRuleMode = localStorage.getItem('ruleMode') || 'always';
        this.selectRuleMode(activeRuleMode, false);
        
        // Reset results display
        const resultsBox = document.getElementById('audio-check-results');
        if (resultsBox) {
            resultsBox.style.display = 'none';
            resultsBox.innerHTML = "";
        }
        
        const btnGen = document.getElementById('btn-generate-audio');
        if (btnGen) btnGen.style.display = 'none';

        this.switchView('settings-view');
    }

    selectTolerance(level, showToast = true) {
        localStorage.setItem('speechTolerance', level);
        
        const levels = ['strict', 'medium', 'lax'];
        levels.forEach(lvl => {
            const btn = document.getElementById(`btn-tolerance-${lvl}`);
            if (btn) {
                if (lvl === level) {
                    btn.className = 'btn btn-primary';
                    btn.style.flex = '1';
                } else {
                    btn.className = 'btn btn-secondary';
                    btn.style.flex = '1';
                }
            }
        });

        if (showToast) {
            const labels = { 'strict': 'Streng', 'medium': 'Mittel', 'lax': 'Tolerant' };
            this.showStatusToast(`Toleranz geändert auf: ${labels[level]}`);
        }
    }

    selectRuleMode(mode, showToast = true) {
        localStorage.setItem('ruleMode', mode);
        
        const modes = ['always', 'errors', 'never'];
        modes.forEach(m => {
            const btn = document.getElementById(`btn-rules-${m}`);
            if (btn) {
                if (m === mode) {
                    btn.className = 'btn btn-primary';
                    btn.style.flex = '1';
                } else {
                    btn.className = 'btn btn-secondary';
                    btn.style.flex = '1';
                }
            }
        });

        if (showToast) {
            const labels = { 'always': 'Immer', 'errors': 'Nur bei Fehlern', 'never': 'Nie' };
            this.showStatusToast(`Regel-Anzeige geändert auf: ${labels[mode]}`);
        }
    }

    async checkAudioStatus() {
        const resultsBox = document.getElementById('audio-check-results');
        const btnGen = document.getElementById('btn-generate-audio');
        if (!resultsBox) return;

        resultsBox.style.display = 'block';
        resultsBox.innerHTML = "Prüfe Audio-Datenbank auf dem Server... ⏳";
        
        try {
            const res = await fetch('/api/audio-status');
            if (!res.ok) {
                throw new Error("HTTP Status " + res.status);
            }
            const data = await res.json();
            
            if (data.error) {
                resultsBox.innerHTML = `<span style="color: var(--error-red); font-weight: 700;">Fehler:</span> ${data.error}`;
                return;
            }

            const missingSents = data.missing_sentences || [];
            const missingWds = data.missing_words || [];
            const totalMissing = missingSents.length + missingWds.length;
            
            let html = `<b>Status:</b> ${data.has_edge_tts ? "edge-tts ist installiert ✅" : "edge-tts fehlt auf Server ⚠️"}<br><br>`;
            
            if (totalMissing === 0) {
                html += `<span style="color: var(--success-green); font-weight: 700;">Super! Alle Audio-Dateien existieren komplett! 🎉</span>`;
                if (btnGen) btnGen.style.display = 'none';
            } else {
                html += `<span style="color: #FF9500; font-weight: 700;">Gefundene Lücken: ${totalMissing} fehlende Dateien!</span><br>`;
                html += `• Fehlende Sätze: ${missingSents.length}<br>`;
                html += `• Fehlende Wörter: ${missingWds.length}<br>`;
                
                if (data.has_edge_tts) {
                    if (btnGen) btnGen.style.display = 'inline-block';
                } else {
                    html += `<br><span style="color: var(--error-red);">Hinweis: Installiere <code>edge-tts</code> auf dem Server, um Generierung freizugeben.</span>`;
                }
            }
            resultsBox.innerHTML = html;
        } catch (e) {
            console.error("Audio check failed:", e);
            resultsBox.innerHTML = `<span style="color: var(--error-red); font-weight: 700;">Fehler:</span> Konnte Server-API nicht erreichen.<br>Bitte starte <code>python server.py</code> anstatt <code>http.server</code>!`;
        }
    }

    async generateMissingAudio() {
        const resultsBox = document.getElementById('audio-check-results');
        const btnGen = document.getElementById('btn-generate-audio');
        if (!resultsBox) return;

        resultsBox.innerHTML = "Generiere fehlende Audios auf dem Server... Bitte warten... 🎙️⏳";
        if (btnGen) btnGen.style.disabled = true;

        try {
            const res = await fetch('/api/generate-missing-audio', { method: 'POST' });
            if (!res.ok) {
                throw new Error("HTTP Status " + res.status);
            }
            const data = await res.json();
            
            if (data.error) {
                resultsBox.innerHTML = `<span style="color: var(--error-red); font-weight: 700;">Generierung fehlgeschlagen:</span> ${data.error}`;
            } else {
                resultsBox.innerHTML = `<span style="color: var(--success-green); font-weight: 700;">Erfolgreich!</span> ${data.generated} Audio-Dateien wurden erfolgreich generiert! 🎉`;
                if (btnGen) btnGen.style.display = 'none';
            }
        } catch (e) {
            console.error("Audio generation failed:", e);
            resultsBox.innerHTML = `<span style="color: var(--error-red); font-weight: 700;">Fehler:</span> Verbindung zum Server unterbrochen.`;
        } finally {
            if (btnGen) btnGen.style.disabled = false;
        }
    }

    async updateDailyMotivation() {
        if (!this.currentProfile) return;
        const daily = await this.db.getDailyScores(this.currentProfile.id);
        
        const getLocalDateString = (date) => {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };

        const todayStr = getLocalDateString(new Date());
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        
        const todayPoints = daily[todayStr] || 0;
        const yesterdayPoints = daily[yesterdayStr] || 0;
        
        // Find all-time daily record (excluding today)
        let maxPrevDailyPoints = 0;
        for (const date in daily) {
            if (date !== todayStr && daily[date] > maxPrevDailyPoints) {
                maxPrevDailyPoints = daily[date];
            }
        }
        
        const banner = document.getElementById('daily-motivation-banner');
        if (!banner) return;
        
        banner.style.display = 'inline-block';
        
        if (yesterdayPoints > 0 && todayPoints < yesterdayPoints) {
            const diff = yesterdayPoints - todayPoints;
            banner.innerHTML = `🏃‍♂️ Du brauchst nun noch <strong>${diff} Punkte</strong>, um deinen Tagesrekord von gestern (${yesterdayPoints} Punkte) zu toppen!`;
            banner.style.color = 'var(--accent-blue)';
            banner.style.borderColor = 'rgba(0, 122, 255, 0.15)';
            banner.style.background = 'rgba(0, 122, 255, 0.08)';
        } else if (yesterdayPoints > 0 && todayPoints >= yesterdayPoints && todayPoints < yesterdayPoints + 50) {
            banner.innerHTML = `🎉 Super! Du hast deinen gestrigen Tagesrekord überholt! Aktuell heute: <strong>${todayPoints} Punkte</strong>.`;
            banner.style.color = 'var(--success-green)';
            banner.style.borderColor = 'rgba(48, 209, 88, 0.15)';
            banner.style.background = 'rgba(48, 209, 88, 0.08)';
        } else if (maxPrevDailyPoints > 0 && todayPoints < maxPrevDailyPoints) {
            const diff = maxPrevDailyPoints - todayPoints;
            banner.innerHTML = `🏆 Du brauchst noch <strong>${diff} Punkte</strong>, um deinen Allzeit-Tagesrekord (${maxPrevDailyPoints} Punkte) zu knacken!`;
            banner.style.color = '#FF9500';
            banner.style.borderColor = 'rgba(255, 149, 0, 0.15)';
            banner.style.background = 'rgba(255, 149, 0, 0.08)';
        } else if (maxPrevDailyPoints > 0 && todayPoints >= maxPrevDailyPoints) {
            banner.innerHTML = `👑 Unglaublich! Du hast heute einen neuen Allzeit-Tagesrekord aufgestellt! Aktuell: <strong>${todayPoints} Punkte</strong>!`;
            banner.style.color = 'var(--success-green)';
            banner.style.borderColor = 'rgba(48, 209, 88, 0.15)';
            banner.style.background = 'rgba(48, 209, 88, 0.08)';
        } else {
            if (todayPoints > 0) {
                banner.innerHTML = `✨ Heute hast du schon <strong>${todayPoints} Punkte</strong> gesammelt. Weiter so!`;
            } else {
                banner.innerHTML = `🎯 Los geht's! Sammle heute deine ersten Punkte und stelle einen Tagesrekord auf!`;
            }
            banner.style.color = 'var(--text-secondary)';
            banner.style.borderColor = 'var(--system-gray-light)';
            banner.style.background = 'rgba(120, 120, 128, 0.05)';
        }
    }

    async renderDailyScoresChart(mode = 'week') {
        if (!this.currentProfile) return;
        const daily = await this.db.getDailyScores(this.currentProfile.id);
        const container = document.getElementById('chart-visualization-container');
        if (!container) return;
        
        container.innerHTML = "";
        
        const daysCount = mode === 'week' ? 7 : 30;
        const days = [];
        
        const getLocalDateString = (date) => {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };

        // Generate date list backwards from today
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                dateStr: getLocalDateString(d),
                label: mode === 'week' ? d.toLocaleDateString('de-DE', { weekday: 'short' }) : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
            });
        }
        
        // Find max points to scale heights
        let maxPoints = 50;
        days.forEach(day => {
            const pts = daily[day.dateStr] || 0;
            if (pts > maxPoints) maxPoints = pts;
        });
        
        // Render flex wrapper
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'flex-end';
        wrapper.style.justifyContent = 'space-between';
        wrapper.style.height = '180px';
        wrapper.style.width = '100%';
        wrapper.style.gap = mode === 'week' ? '12px' : '4px';
        if (mode === 'month') {
            wrapper.style.minWidth = '750px';
        }
        
        days.forEach(day => {
            const points = daily[day.dateStr] || 0;
            const pct = (points / maxPoints) * 100;
            
            const col = document.createElement('div');
            col.className = 'chart-column';
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = '0%';
            
            const tooltip = document.createElement('div');
            tooltip.className = 'chart-bar-tooltip';
            tooltip.innerText = `${points} Pkt (${day.dateStr.substring(8, 10)}.${day.dateStr.substring(5, 7)}.)`;
            
            bar.appendChild(tooltip);
            col.appendChild(bar);
            
            const lbl = document.createElement('div');
            lbl.className = 'chart-label';
            lbl.innerText = day.label;
            col.appendChild(lbl);
            
            wrapper.appendChild(col);
            
            // Trigger animation
            setTimeout(() => {
                bar.style.height = `${pct}%`;
            }, 50);
        });
        
        container.appendChild(wrapper);
        
        // Update tab buttons active state
        const weekBtn = document.getElementById('btn-chart-week');
        const monthBtn = document.getElementById('btn-chart-month');
        if (weekBtn && monthBtn) {
            if (mode === 'week') {
                weekBtn.className = 'btn btn-primary';
                monthBtn.className = 'btn btn-secondary';
            } else {
                weekBtn.className = 'btn btn-secondary';
                monthBtn.className = 'btn btn-primary';
            }
        }
    }
}

// Instantiate core PWA app on window load
window.addEventListener('DOMContentLoaded', () => {
    window.App = new Application();
});
