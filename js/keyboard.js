/**
 * keyboard.js - Virtual keyboard presenting dynamic layouts.
 */

export class SmartKeyboard {
    /**
     * @param {HTMLDivElement} container - The container for the keyboard layout
     * @param {Function} onKeyPress - Callback receiving the character clicked
     * @param {Function} onDeletePress - Callback for backspace clicked
     */
    constructor(container, onKeyPress, onDeletePress) {
        this.container = container;
        this.onKeyPress = onKeyPress;
        this.onDeletePress = onDeletePress;
        this.currentWord = "";
        this.keyboardMode = "smart"; // "smart", "full", "physical"
        this.isShifted = true; // German words/nouns start with uppercase
    }

    /**
     * Set the current word and render the shuffled keys
     * @param {string} word - Target word
     */
    setWord(word) {
        this.currentWord = word;
        this.render();
    }

    /**
     * Shuffle helper
     */
    _shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    render() {
        this.container.innerHTML = "";
        
        if (this.keyboardMode === 'physical') {
            const tip = document.createElement('div');
            tip.style.textAlign = 'center';
            tip.style.color = 'var(--text-secondary)';
            tip.style.fontSize = '13.5px';
            tip.style.fontWeight = '600';
            tip.style.padding = '12px';
            tip.style.background = 'rgba(0, 122, 255, 0.05)';
            tip.style.borderRadius = '8px';
            tip.style.border = '1px dashed var(--accent-blue)';
            tip.style.maxWidth = '400px';
            tip.style.margin = '0 auto';
            tip.innerHTML = `💻 <b>Physische Tastatur aktiv</b><br>Tippe direkt auf deinen Tasten!`;
            this.container.appendChild(tip);
            return;
        }

        if (!this.currentWord) return;

        if (this.keyboardMode === 'full') {
            this.renderFullKeyboard();
        } else {
            this.renderSmartKeyboard();
        }
    }

    renderSmartKeyboard() {
        // Extract unique, clean letters of the word (case-sensitive)
        // Also split Umlauts and keep special letters if present
        const letters = this.currentWord.split('').filter(char => {
            return /[a-zA-ZäöüÄÖÜß]/.test(char);
        });

        // Unique set
        const uniqueLetters = [...new Set(letters)];
        
        // Shuffle letters
        const shuffledLetters = this._shuffle([...uniqueLetters]);

        // Keyboard grid wrapper
        const grid = document.createElement('div');
        grid.className = 'smart-keyboard-grid';

        shuffledLetters.forEach(letter => {
            const key = document.createElement('button');
            key.className = 'keyboard-key';
            key.innerText = letter;
            key.setAttribute('aria-label', `Taste ${letter}`);
            
            // Touch interaction
            key.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                key.classList.add('active');
            });
            key.addEventListener('pointerup', (e) => {
                e.preventDefault();
                key.classList.remove('active');
                this.onKeyPress(letter);
            });
            key.addEventListener('pointerleave', () => {
                key.classList.remove('active');
            });
            
            grid.appendChild(key);
        });

        // Add a Space key
        const spaceKey = document.createElement('button');
        spaceKey.className = 'keyboard-key space-key';
        spaceKey.innerText = '␣ Leertaste';
        spaceKey.setAttribute('aria-label', 'Leertaste');
        spaceKey.style.minWidth = '140px';
        spaceKey.style.backgroundColor = '#E5E5EA';
        spaceKey.style.flexGrow = '1';
        
        spaceKey.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            spaceKey.classList.add('active');
        });
        spaceKey.addEventListener('pointerup', (e) => {
            e.preventDefault();
            spaceKey.classList.remove('active');
            this.onKeyPress(' ');
        });
        spaceKey.addEventListener('pointerleave', () => {
            spaceKey.classList.remove('active');
        });
        grid.appendChild(spaceKey);

        // Add a backspace/delete key at the end
        const delKey = document.createElement('button');
        delKey.className = 'keyboard-key delete-key';
        delKey.innerHTML = '⌫';
        delKey.setAttribute('aria-label', 'Löschen');
        
        delKey.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            delKey.classList.add('active');
        });
        delKey.addEventListener('pointerup', (e) => {
            e.preventDefault();
            delKey.classList.remove('active');
            this.onDeletePress();
        });
        delKey.addEventListener('pointerleave', () => {
            delKey.classList.remove('active');
        });

        grid.appendChild(delKey);
        this.container.appendChild(grid);
    }

    renderFullKeyboard() {
        const rows = [
            ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "ü"],
            ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ö", "ä"],
            ["shift", "y", "x", "c", "v", "b", "n", "m", "ß", "delete"],
            ["space"]
        ];

        const kbContainer = document.createElement('div');
        kbContainer.style.display = 'flex';
        kbContainer.style.flexDirection = 'column';
        kbContainer.style.gap = '6px';
        kbContainer.style.alignItems = 'center';
        kbContainer.style.width = '100%';
        kbContainer.style.maxWidth = '550px';
        kbContainer.style.margin = '0 auto';

        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.justifyContent = 'center';
            rowDiv.style.gap = '4px';
            rowDiv.style.width = '100%';

            row.forEach(keyChar => {
                const key = document.createElement('button');
                
                // Style configurations
                key.style.height = '42px';
                key.style.borderRadius = '6px';
                key.style.border = 'none';
                key.style.background = '#FFFFFF';
                key.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
                key.style.fontFamily = 'inherit';
                key.style.fontSize = '16px';
                key.style.fontWeight = '700';
                key.style.color = 'var(--text-primary)';
                key.style.cursor = 'pointer';
                key.style.display = 'flex';
                key.style.alignItems = 'center';
                key.style.justifyContent = 'center';
                key.style.transition = 'transform 0.05s ease, background-color 0.05s';
                
                // Base width
                key.style.flex = '1';
                key.style.minWidth = '24px';
                key.style.maxWidth = '44px';

                if (keyChar === "shift") {
                    key.innerHTML = "⇧";
                    key.style.maxWidth = '50px';
                    key.style.fontSize = '18px';
                    if (this.isShifted) {
                        key.style.background = 'var(--accent-blue)';
                        key.style.color = '#FFFFFF';
                    } else {
                        key.style.background = '#D1D1D6';
                        key.style.color = 'var(--text-primary)';
                    }
                    key.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        this.isShifted = !this.isShifted;
                        this.render();
                    });
                } else if (keyChar === "delete") {
                    key.innerHTML = "⌫";
                    key.style.maxWidth = '50px';
                    key.style.background = '#D1D1D6';
                    key.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        this.onDeletePress();
                    });
                } else if (keyChar === "space") {
                    key.innerHTML = "␣ Leertaste";
                    key.style.maxWidth = '260px';
                    key.style.minWidth = '140px';
                    key.style.background = '#E5E5EA';
                    key.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        this.onKeyPress(' ');
                    });
                } else {
                    // Regular characters
                    const label = this.isShifted ? keyChar.toUpperCase() : keyChar.toLowerCase();
                    key.innerText = label;

                    key.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        key.style.transform = 'scale(0.9)';
                        key.style.background = 'var(--accent-blue)';
                        key.style.color = '#FFFFFF';
                    });
                    key.addEventListener('pointerup', (e) => {
                        e.preventDefault();
                        key.style.transform = 'none';
                        key.style.background = '#FFFFFF';
                        key.style.color = 'var(--text-primary)';
                        this.onKeyPress(label);
                        
                        // Auto shift down after typing first letter if shifted
                        if (this.isShifted && this.currentWord.length > 0) {
                            this.isShifted = false;
                            this.render();
                        }
                    });
                    key.addEventListener('pointerleave', () => {
                        key.style.transform = 'none';
                        key.style.background = '#FFFFFF';
                        key.style.color = 'var(--text-primary)';
                    });
                }

                rowDiv.appendChild(key);
            });

            kbContainer.appendChild(rowDiv);
        });

        this.container.appendChild(kbContainer);
    }
}
