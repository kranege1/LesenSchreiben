/**
 * app.js - Main Application Controller for "Lesen & Schreiben"
 */

import { AppDB } from './db.js';
import { AppAudio } from './audio.js';
import { PencilCanvas } from './canvas.js';
import { SmartKeyboard } from './keyboard.js';
import { AppSpeech } from './speech.js';

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
        this.canvas = new PencilCanvas(canvasEl, ghostEl);
        
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
        
        // Resize canvas on layout changes
        window.addEventListener('resize', () => {
            if (this.canvas) this.canvas.resize();
        });

        // Bind physical hardware keyboard for Writing Mode
        window.addEventListener('keydown', (e) => {
            if (this.currentMode === 'write' && this.currentSentence) {
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
        document.getElementById('btn-change-profile').addEventListener('click', () => this.switchView('profile-view'));
        
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
        document.getElementById('btn-view-stats').addEventListener('click', () => this.showStatsView());
        
        // Back buttons
        document.getElementById('btn-write-back').addEventListener('click', () => this.stopActiveMode());
        document.getElementById('btn-read-back').addEventListener('click', () => this.stopActiveMode());
        document.getElementById('btn-stats-back').addEventListener('click', () => this.switchView('menu-view'));
        document.getElementById('btn-stories-back').addEventListener('click', () => this.switchView('menu-view'));

        // Canvas Controls
        document.getElementById('btn-canvas-clear').addEventListener('click', () => this.canvas.clear());
        document.getElementById('btn-canvas-undo').addEventListener('click', () => this.canvas.undo());
        document.getElementById('btn-write-pencil-toggle').addEventListener('click', () => this.togglePencilPanel());
        document.getElementById('btn-write-keyboard-toggle').addEventListener('click', () => this.toggleKeyboardPanel());
        
        // Writing checks & aids
        document.getElementById('btn-write-check').addEventListener('click', () => this.checkWrittenWord());
        document.getElementById('btn-write-speak').addEventListener('click', () => {
            if (this.currentSentence) {
                const activeWord = this.currentSentence.words[this.currentWordIndex];
                this.audio.playWord(activeWord.word);
            }
        });
        document.getElementById('btn-write-speak-sentence').addEventListener('click', () => {
            if (this.currentSentence) {
                this.audio.playSentence(this.currentSentence.id, this.currentSentence.sentence);
            }
        });

        // Speech controls
        document.getElementById('btn-read-mic').addEventListener('click', () => this.toggleSpeechListening());
        document.getElementById('btn-read-speak-help').addEventListener('click', () => this.playCurrentReadingWordHelp());
        document.getElementById('btn-read-skip').addEventListener('click', () => this.nextSentence());
    }

    switchView(viewId) {
        // Stop any running speech & audio
        if (this.speech) this.speech.stop();
        if (this.audio) this.audio.stop();
        this.clearStuckTimer();

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
        
        // Set Menu welcome text
        document.getElementById('menu-welcome-text').innerText = `Hallo, ${this.currentProfile.name}! 👋`;
        
        // Render dynamic category pills for selected grade
        this.renderCategorySelector();
        
        this.switchView('menu-view');
    }

    renderCategorySelector() {
        if (!this.currentProfile) return;
        const currentGrade = this.currentProfile.grade;
        
        // Extract unique themes/spelling categories matching the child's grade
        const gradeSentences = this.sentences.filter(s => s.grade === currentGrade);
        const themes = [...new Set(gradeSentences.map(s => s.theme).filter(Boolean))];
        
        const container = document.getElementById('category-pills-list');
        if (!container) return;
        container.innerHTML = "";
        
        // Always include "Alle"
        const allThemes = ["Alle", ...themes];
        
        // Ensure selected category is valid for this grade
        if (!allThemes.includes(this.currentCategory)) {
            this.currentCategory = "Alle";
        }
        
        allThemes.forEach(theme => {
            const pill = document.createElement('button');
            pill.className = 'category-pill';
            if (theme === this.currentCategory) {
                pill.classList.add('active');
            }
            
            // Map theme to premium user-facing emojis
            let emoji = "📝";
            if (theme === "Alle") emoji = "🌟";
            else if (theme === "Großschreibung") emoji = "🔠";
            else if (theme === "ie-Laut") emoji = "🐝";
            else if (theme === "stummes h") emoji = "⏰";
            else if (theme === "z und tz") emoji = "⚡";
            else if (theme === "Doppelkonsonanten") emoji = "🪵";
            else if (theme === "sp und st") emoji = "🎯";
            else if (theme === "d oder t") emoji = "🦆";
            else if (theme === "Nominalisierung") emoji = "🏷️";
            else if (theme === "Fremdwörter") emoji = "🌍";
            
            pill.innerText = `${emoji} ${theme}`;
            pill.addEventListener('click', () => {
                container.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentCategory = theme;
                this.showStatusToast(`Übungsschwerpunkt: ${theme}`);
            });
            container.appendChild(pill);
        });
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
        const now = Date.now();
        const currentGrade = this.currentProfile.grade;
        
        // Filter sentences by child's grade first, excluding stories
        let pool = this.sentences.filter(s => s.grade === currentGrade && !s.story);
        
        // Filter by selected spelling category if set
        if (this.currentCategory && this.currentCategory !== "Alle") {
            pool = pool.filter(s => s.theme === this.currentCategory);
        }
        
        // 1. Prioritize NEW sentences matching the filtered pool first
        const learnedIds = progressList.map(p => p.sentenceId);
        const availableInGrade = pool.filter(s => !learnedIds.includes(s.id));
        if (availableInGrade.length > 0) {
            return availableInGrade[0];
        }
        
        // 2. If all matching sentences have been introduced, check for due repetitions
        const dueSentences = progressList.filter(p => p.nextReview <= now && p.box < 5);
        if (dueSentences.length > 0) {
            // Filter due repetitions to only include sentences from our pool
            const poolIds = pool.map(s => s.id);
            const dueFiltered = dueSentences.filter(d => poolIds.includes(d.sentenceId));
            
            if (dueFiltered.length > 0) {
                // Sort by Box level ascending (lowest box first)
                dueFiltered.sort((a, b) => a.box - b.box);
                const targetId = dueFiltered[0].sentenceId;
                const match = this.sentences.find(s => s.id === targetId);
                if (match) {
                    console.log(`Leitner rep due for: ${match.sentence}`);
                    return match;
                }
            }
        }
        
        // 3. Fallback: take any sentence in the filtered pool
        if (pool.length > 0) {
            const randIdx = Math.floor(Math.random() * pool.length);
            return pool[randIdx];
        }
        
        // 4. Ultimate fallback: take any random sentence from the entire pool
        const randIdx = Math.floor(Math.random() * this.sentences.length);
        return this.sentences[randIdx];
    }

    // --- WRITING & READING MODES MANAGEMENT ---
    async startMode(mode) {
        this.audio.unlock();
        this.currentMode = mode;
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

            if (bar) bar.style.width = `${percent}%`;
            if (text) text.innerText = `Geschichte: ${this.currentStory} (Satz ${current} von ${count})`;
            if (percentEl) percentEl.innerText = `${percent}%`;

            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    async nextSentence() {
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
        
        // Update Story Progress Bar if in story mode
        this.updateStoryProgressBar();
        
        if (this.currentMode === 'write') {
            this.switchView('write-view');
            this.setupWritingWord();
        } else if (this.currentMode === 'read') {
            this.switchView('read-view');
            this.setupReadingSentence();
        }
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
            const bubble = document.createElement('div');
            bubble.className = 'word-bubble';
            
            if (idx < this.currentWordIndex) {
                // Solved
                bubble.innerText = wData.word;
                bubble.classList.add('correct');
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

            container.appendChild(bubble);
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
                    this.audio.playWord(activeWord.word);
                }
            });
        } else {
            this.audio.playWord(activeWord.word);
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
    }

    updateActiveWordBubble() {
        const container = document.getElementById('write-sentence-container');
        if (!container || !this.currentSentence) return;
        const activeBubble = container.children[this.currentWordIndex];
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
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        if (this.inputBuffer.length < activeWord.clean.length) {
            this.inputBuffer += char;
            this.updateWriteInputIndicator();

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
        }
    }

    async checkWrittenWord() {
        if (!this.currentSentence) return;
        
        const activeWord = this.currentSentence.words[this.currentWordIndex];
        const attempt = this.inputBuffer.trim();
        const target = activeWord.clean;
        
        const wordBubble = document.getElementById('write-sentence-container').children[this.currentWordIndex];
        const indicator = document.getElementById('write-input-indicator');

        if (attempt === target) {
            // Word correct!
            this.showStatusToast("Super gemacht! 👍");
            
            // Turn active bubble green immediately
            if (wordBubble) {
                wordBubble.innerText = activeWord.word;
                wordBubble.classList.remove('active', 'masked');
                wordBubble.classList.add('correct');
            }
            
            // Advance
            this.currentWordIndex++;
            if (this.currentWordIndex >= this.currentSentence.words.length) {
                // Full sentence solved!
                this.showStatusToast("Satz komplett gelöst! 🎉");
                
                // Record Leitner success
                await this.db.recordResult(
                    this.currentProfile.id,
                    this.currentSentence.id,
                    'write',
                    !this.sentenceHasError
                );

                // Show progress bar container
                const pbContainer = document.getElementById('write-progress-bar-container');
                const pb = document.getElementById('write-progress-bar');
                if (pbContainer && pb) {
                    pb.style.transition = 'none';
                    pb.style.width = '0%';
                    pbContainer.style.display = 'block';
                }

                // Register dynamic progress listener
                this.audio.onPlayProgress = (percent) => {
                    if (pb) {
                        pb.style.transition = 'none';
                        pb.style.width = (percent * 100) + '%';
                    }
                };

                // Play the whole sentence and wait until finished
                await this.audio.playSentence(this.currentSentence.id, this.currentSentence.sentence);
                
                // Unregister progress listener
                this.audio.onPlayProgress = null;
                
                setTimeout(() => {
                    if (pbContainer) pbContainer.style.display = 'none';
                    this.nextSentence();
                }, 500);
            } else {
                this.setupWritingWord();
            }
        } else {
            // Incorrect attempt
            this.sentenceHasError = true;
            this.wordMistakes++;
            
            // Visual Shake feedback on bubble & input field
            wordBubble.classList.add('shake');
            indicator.classList.add('shake');
            setTimeout(() => {
                wordBubble.classList.remove('shake');
                indicator.classList.remove('shake');
            }, 600);

            // Play mistake buzzer/sound or repeat word
            await this.audio.playWord(activeWord.word);

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
        this.resetStuckTimer();
    }

    highlightActiveReadingWord() {
        const container = document.getElementById('read-sentence-container');
        const words = container.querySelectorAll('.reading-word');
        
        words.forEach((wSpan, idx) => {
            wSpan.classList.remove('active', 'correct');
            if (idx < this.currentWordIndex) {
                wSpan.classList.add('correct');
            } else if (idx === this.currentWordIndex) {
                wSpan.classList.add('active');
            }
        });
    }

    async playWordHelpAt(idx) {
        if (!this.currentSentence) return;
        const wData = this.currentSentence.words[idx];
        await this.audio.playWord(wData.word);
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
            this.clearStuckTimer();
        } else {
            const activeWords = this.currentSentence.words;
            this.speech.start(activeWords, 'de-AT');
            btn.classList.add('recording');
            statusLbl.innerText = "Ich höre zu... Lies laut vor!";
            this.resetStuckTimer();
        }
    }

    handleSpeechWordMatched(matchedIdx) {
        // Karaoke tracker jumped
        if (matchedIdx >= this.currentWordIndex) {
            this.currentWordIndex = matchedIdx + 1;
            this.highlightActiveReadingWord();
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
            
            // Record progress success (box promote)
            await this.db.recordResult(
                this.currentProfile.id,
                this.currentSentence.id,
                'read',
                !this.sentenceHasError
            );

            setTimeout(() => {
                this.nextSentence();
            }, 2000);
        }
    }

    // Stuck Tracking timer (> 4 seconds trigger helper)
    resetStuckTimer() {
        this.clearStuckTimer();
        
        this.stuckTimer = setTimeout(async () => {
            if (this.currentMode === 'read' && this.currentSentence) {
                // Visual wiggle or prompt to tap active word
                this.showStatusToast("Tippe auf das blaue Wort, um Hilfe zu hören! 🔊");
                
                // Track reading error in progress store since child stalled
                this.sentenceHasError = true;
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
    }

    showStoriesView() {
        if (!this.currentProfile) return;
        const currentGrade = this.currentProfile.grade;
        
        const container = document.getElementById('stories-list');
        if (!container) return;
        container.innerHTML = "";
        
        // Find unique stories and group their sentences
        const gradeSentences = this.sentences.filter(s => s.grade === currentGrade && s.story);
        const storiesMap = {};
        
        gradeSentences.forEach(s => {
            if (!storiesMap[s.story]) {
                storiesMap[s.story] = [];
            }
            storiesMap[s.story].push(s);
        });
        
        const storyNames = Object.keys(storiesMap);
        if (storyNames.length === 0) {
            container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; margin-top: 24px;">Keine Geschichten für die ${currentGrade}. Klasse vorhanden.</p>`;
            this.switchView('stories-view');
            return;
        }
        
        storyNames.forEach(storyName => {
            const sList = storiesMap[storyName];
            
            const card = document.createElement('div');
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '12px';
            card.style.padding = '20px';
            card.style.background = 'var(--card-background)';
            card.style.borderRadius = '16px';
            card.style.border = '1px solid var(--system-gray-light)';
            
            // Header: Title and sentence count
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            
            const title = document.createElement('h3');
            title.style.margin = '0';
            title.style.fontSize = '18px';
            title.style.fontWeight = '700';
            title.innerText = storyName;
            
            const count = document.createElement('span');
            count.style.fontSize = '12px';
            count.style.opacity = '0.6';
            count.innerText = `${sList.length} Sätze`;
            
            header.appendChild(title);
            header.appendChild(count);
            card.appendChild(header);
            
            // Preview of the first sentence
            const preview = document.createElement('p');
            preview.style.margin = '0';
            preview.style.fontSize = '14px';
            preview.style.color = 'var(--text-secondary)';
            preview.style.fontStyle = 'italic';
            preview.innerText = `"${sList[0].sentence.substring(0, 60)}..."`;
            card.appendChild(preview);
            
            // Actions
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '12px';
            actions.style.marginTop = '8px';
            
            const btnWrite = document.createElement('button');
            btnWrite.className = 'btn btn-primary';
            btnWrite.style.flex = '1';
            btnWrite.style.minHeight = '44px';
            btnWrite.innerText = "✍️ Diktat schreiben";
            btnWrite.addEventListener('click', () => {
                this.currentStory = storyName;
                this.storySentences = sList;
                this.storySentenceIndex = 0;
                this.startMode('write');
            });
            
            const btnRead = document.createElement('button');
            btnRead.className = 'btn btn-success';
            btnRead.style.flex = '1';
            btnRead.style.minHeight = '44px';
            btnRead.innerText = "🗣️ Vorlesen";
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
}

// Instantiate core PWA app on window load
window.addEventListener('DOMContentLoaded', () => {
    window.App = new Application();
});
