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
        document.getElementById('btn-save-grade').addEventListener('click', () => this.handleSaveGrade());
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
        document.getElementById('btn-write-skip').addEventListener('click', () => this.handleSkipWord());

        // Speech controls
        document.getElementById('btn-read-mic').addEventListener('click', () => this.toggleSpeechListening());
        document.getElementById('btn-read-speak-help').addEventListener('click', () => this.playCurrentReadingWordHelp());
        document.getElementById('btn-read-word-skip').addEventListener('click', () => this.handleReadWordSkip());
        document.getElementById('btn-read-skip').addEventListener('click', () => this.nextSentence());
        document.getElementById('btn-summary-close').addEventListener('click', () => this.closeSummaryModal());
    }

    switchView(viewId) {
        // Stop any running speech & audio
        if (this.speech) this.speech.stop();
        if (this.audio) this.audio.stop();
        this.stopAudioVisualizer();
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
        
        // Extract unique spelling categories from all sentences, prioritizing current grade categories
        const allGradeSentences = this.sentences.filter(s => !s.story);
        const currentGradeThemes = [...new Set(allGradeSentences.filter(s => s.grade === currentGrade).map(s => s.theme).filter(Boolean))];
        const otherThemes = [...new Set(allGradeSentences.filter(s => s.grade !== currentGrade).map(s => s.theme).filter(Boolean))];
        
        const uniqueOtherThemes = otherThemes.filter(t => !currentGradeThemes.includes(t));
        const themes = [...currentGradeThemes, ...uniqueOtherThemes];
        
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
        
        // Include sentences from all grades (excluding stories)
        let pool = this.sentences.filter(s => !s.story);
        
        // Filter by selected spelling category if set
        if (this.currentCategory && this.currentCategory !== "Alle") {
            pool = pool.filter(s => s.theme === this.currentCategory);
        }
        
        const learnedIds = progressList.map(p => p.sentenceId);

        // 1. Prioritize NEW sentences from the CURRENT grade
        const availableInGrade = pool.filter(s => s.grade === currentGrade && !learnedIds.includes(s.id));
        if (availableInGrade.length > 0) {
            return availableInGrade[0];
        }
        
        // 2. Prioritize NEW sentences from OTHER grades (sorted by proximity/ascending)
        const availableOthers = pool.filter(s => s.grade !== currentGrade && !learnedIds.includes(s.id));
        if (availableOthers.length > 0) {
            availableOthers.sort((a, b) => {
                const diffA = Math.abs(a.grade - currentGrade);
                const diffB = Math.abs(b.grade - currentGrade);
                if (diffA !== diffB) return diffA - diffB;
                return a.grade - b.grade;
            });
            return availableOthers[0];
        }
        
        // 3. If all matching sentences are introduced, check for due repetitions
        const dueSentences = progressList.filter(p => p.nextReview <= now && p.box < 5);
        if (dueSentences.length > 0) {
            // Filter due repetitions to only include sentences from our pool
            const poolIds = pool.map(s => s.id);
            const dueFiltered = dueSentences.filter(d => poolIds.includes(d.sentenceId));
            
            if (dueFiltered.length > 0) {
                // Sort: current grade due sentences first, then sort by box level (lowest box first)
                dueFiltered.sort((a, b) => {
                    const sentA = this.sentences.find(s => s.id === a.sentenceId);
                    const sentB = this.sentences.find(s => s.id === b.sentenceId);
                    const isCurrA = sentA && sentA.grade === currentGrade;
                    const isCurrB = sentB && sentB.grade === currentGrade;
                    
                    if (isCurrA && !isCurrB) return -1;
                    if (!isCurrA && isCurrB) return 1;
                    
                    return a.box - b.box;
                });
                const targetId = dueFiltered[0].sentenceId;
                const match = this.sentences.find(s => s.id === targetId);
                if (match) {
                    console.log(`Leitner rep due for: ${match.sentence}`);
                    return match;
                }
            }
        }
        
        // 4. Fallback: take any sentence in the filtered pool (preferring current grade)
        if (pool.length > 0) {
            const gradePool = pool.filter(s => s.grade === currentGrade);
            const activePool = gradePool.length > 0 ? gradePool : pool;
            const randIdx = Math.floor(Math.random() * activePool.length);
            return activePool[randIdx];
        }
        
        // 5. Ultimate fallback: take any random sentence from the entire pool
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
                this.audio.playWord(wData.word);
            });
            
            if (idx < this.currentWordIndex) {
                // Solved
                bubble.innerText = wData.clean;
                if (this.skippedWords.includes(idx)) {
                    bubble.classList.add('skipped');
                } else {
                    bubble.classList.add('correct');
                }
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

            wrapper.appendChild(bubble);

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
        
        const wordWrapper = document.getElementById('write-sentence-container').children[this.currentWordIndex];
        const wordBubble = wordWrapper ? wordWrapper.querySelector('.word-bubble') : null;
        const indicator = document.getElementById('write-input-indicator');

        if (attempt === target) {
            // Word correct!
            this.showStatusToast("Super gemacht! 👍");
            
            // Turn active bubble green immediately
            if (wordBubble) {
                wordBubble.innerText = activeWord.clean;
                wordBubble.classList.remove('active', 'masked');
                wordBubble.classList.add('correct');
            }
            
            // Advance
            this.currentWordIndex++;
            if (this.currentWordIndex >= this.currentSentence.words.length) {
                // Full sentence solved!
                this.showStatusToast("Satz komplett gelöst! 🎉");
                await this.finishCurrentSentence();
            } else {
                this.setupWritingWord();
            }
        } else {
            // Incorrect attempt
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
        this.updateStoryProgressBar();
        this.resetStuckTimer();
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

        this.showSummaryModal(earnedPoints, progressRecord);
    }

    async finishCurrentReadingSentence() {
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

        if (this.speech.isListening) {
            this.toggleSpeechListening();
        }

        this.showSummaryModal(earnedPoints, progressRecord);
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
        
        const container = document.getElementById('mic-visualizer-container');
        if (container) container.style.display = 'none';
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
                
                if (!this.wordMistakeCounts[this.currentWordIndex]) {
                    this.wordMistakeCounts[this.currentWordIndex] = 0;
                }
                this.wordMistakeCounts[this.currentWordIndex]++;
                
                const activeWord = this.currentSentence.words[this.currentWordIndex];
                if (activeWord) {
                    const alreadyLogged = this.mistakenWords.find(m => m.target === activeWord.clean);
                    if (!alreadyLogged) {
                        this.mistakenWords.push({
                            target: activeWord.clean,
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
}

// Instantiate core PWA app on window load
window.addEventListener('DOMContentLoaded', () => {
    window.App = new Application();
});
