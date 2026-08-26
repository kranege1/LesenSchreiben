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
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            let temp = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temp;
        }
        return array;
    }

    render() {
        this.container.innerHTML = "";
        
        if (this.keyboardMode === 'physical') {
            const tip = document.createElement('div');
            tip.style.textAlign = 'center';
            tip.style.color = 'var(--text-secondary)';
            tip.style.fontSize = '13px';
            tip.style.fontWeight = '600';
            tip.style.padding = '8px 12px';
            tip.style.background = 'rgba(0, 122, 255, 0.05)';
            tip.style.borderRadius = '8px';
            tip.style.border = '1px dashed var(--accent-blue)';
            tip.style.width = '100%';
            tip.style.boxSizing = 'border-box';
            tip.innerHTML = `💻 <b>Physische Tastatur aktiv</b><br>Tippe direkt auf deinen Tasten!`;
            this.container.appendChild(tip);
            return;
        }

        if (!this.currentWord) return;

        // Force container to fill full space of the layout
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'stretch';

        // Main layout wrapper: Flex row layout containing letters grid on left, and actions (Delete/Space) on right
        const mainWrapper = document.createElement('div');
        mainWrapper.style.display = 'flex';
        mainWrapper.style.flexDirection = 'row';
        mainWrapper.style.gap = '8px';
        mainWrapper.style.width = '100%';
        mainWrapper.style.alignItems = 'stretch';
        mainWrapper.style.boxSizing = 'border-box';

        // Left element: Letters Area
        const letterArea = document.createElement('div');
        letterArea.style.flex = '1';
        letterArea.style.display = 'flex';
        letterArea.style.flexDirection = 'column';
        letterArea.style.gap = '6px';
        letterArea.style.boxSizing = 'border-box';
        letterArea.style.justifyContent = 'space-between';

        // Populate letters based on active mode
        if (this.keyboardMode === 'full') {
            this.populateFullKeyboard(letterArea);
        } else {
            this.populateSmartKeyboard(letterArea);
        }
        mainWrapper.appendChild(letterArea);

        // Right element: Action Area (tall Backspace and Space keys)
        const actionArea = document.createElement('div');
        actionArea.style.display = 'flex';
        actionArea.style.flexDirection = 'column';
        actionArea.style.gap = '6px';
        actionArea.style.width = '95px';
        actionArea.style.flexShrink = '0';
        actionArea.style.boxSizing = 'border-box';

        // 1. Backspace button
        const backspaceBtn = document.createElement('button');
        backspaceBtn.style.flex = '1';
        backspaceBtn.style.height = '100%';
        backspaceBtn.style.maxHeight = '72px';
        backspaceBtn.style.border = 'none';
        backspaceBtn.style.background = '#D1D1D6';
        backspaceBtn.style.color = 'var(--text-primary)';
        backspaceBtn.style.borderRadius = '6px';
        backspaceBtn.style.fontSize = '20px';
        backspaceBtn.style.fontWeight = '700';
        backspaceBtn.style.cursor = 'pointer';
        backspaceBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
        backspaceBtn.style.display = 'flex';
        backspaceBtn.style.alignItems = 'center';
        backspaceBtn.style.justifyContent = 'center';
        backspaceBtn.style.transition = 'transform 0.05s, background-color 0.05s';
        backspaceBtn.innerHTML = '⌫';
        backspaceBtn.setAttribute('aria-label', 'Löschen');
        
        backspaceBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            backspaceBtn.style.transform = 'scale(0.95)';
            backspaceBtn.style.background = '#B0B0B5';
        });
        backspaceBtn.addEventListener('pointerup', (e) => {
            e.preventDefault();
            backspaceBtn.style.transform = 'none';
            backspaceBtn.style.background = '#D1D1D6';
            this.onDeletePress();
        });
        backspaceBtn.addEventListener('pointerleave', () => {
            backspaceBtn.style.transform = 'none';
            backspaceBtn.style.background = '#D1D1D6';
        });
        actionArea.appendChild(backspaceBtn);

        // 2. Space button
        const spaceBtn = document.createElement('button');
        spaceBtn.style.flex = '1';
        spaceBtn.style.height = '100%';
        spaceBtn.style.maxHeight = '72px';
        spaceBtn.style.border = 'none';
        spaceBtn.style.background = '#E5E5EA';
        spaceBtn.style.color = 'var(--text-primary)';
        spaceBtn.style.borderRadius = '6px';
        spaceBtn.style.fontSize = '12px';
        spaceBtn.style.fontWeight = '700';
        spaceBtn.style.cursor = 'pointer';
        spaceBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
        spaceBtn.style.display = 'flex';
        spaceBtn.style.flexDirection = 'column';
        spaceBtn.style.alignItems = 'center';
        spaceBtn.style.justifyContent = 'center';
        spaceBtn.style.gap = '2px';
        spaceBtn.style.transition = 'transform 0.05s, background-color 0.05s';
        spaceBtn.innerHTML = '<span>␣</span><span>Leertaste</span>';
        
        spaceBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            spaceBtn.style.transform = 'scale(0.95)';
            spaceBtn.style.background = '#C8C8CD';
        });
        spaceBtn.addEventListener('pointerup', (e) => {
            e.preventDefault();
            spaceBtn.style.transform = 'none';
            spaceBtn.style.background = '#E5E5EA';
            this.onKeyPress(' ');
        });
        spaceBtn.addEventListener('pointerleave', () => {
            spaceBtn.style.transform = 'none';
            spaceBtn.style.background = '#E5E5EA';
        });
        actionArea.appendChild(spaceBtn);

        mainWrapper.appendChild(actionArea);
        this.container.appendChild(mainWrapper);
    }

    populateSmartKeyboard(targetArea) {
        // Extract unique, clean letters of the word
        const letters = this.currentWord.split('').filter(char => {
            return /[a-zA-ZäöüÄÖÜß]/.test(char);
        });
        const uniqueLetters = [...new Set(letters)];
        const shuffledLetters = this._shuffle([...uniqueLetters]);

        // Place them in a grid wrapped rows dynamically
        const grid = document.createElement('div');
        grid.style.display = 'flex';
        grid.style.flexWrap = 'wrap';
        grid.style.gap = '6px';
        grid.style.justifyContent = 'center';
        grid.style.width = '100%';
        grid.style.flex = '1';
        grid.style.alignContent = 'center';

        shuffledLetters.forEach(letter => {
            const key = document.createElement('button');
            
            // Large comfort keys (50px width/height)
            key.style.height = '50px';
            key.style.minWidth = '50px';
            key.style.borderRadius = '6px';
            key.style.border = 'none';
            key.style.background = '#FFFFFF';
            key.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
            key.style.fontFamily = 'inherit';
            key.style.fontSize = '20px';
            key.style.fontWeight = '700';
            key.style.color = 'var(--text-primary)';
            key.style.cursor = 'pointer';
            key.style.display = 'flex';
            key.style.alignItems = 'center';
            key.style.justifyContent = 'center';
            key.style.transition = 'transform 0.05s, background-color 0.05s';
            key.innerText = letter;

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
                this.onKeyPress(letter);
            });
            key.addEventListener('pointerleave', () => {
                key.style.transform = 'none';
                key.style.background = '#FFFFFF';
                key.style.color = 'var(--text-primary)';
            });

            grid.appendChild(key);
        });

        targetArea.appendChild(grid);
    }

    populateFullKeyboard(targetArea) {
        // Rows without delete or space since they are on the right side now
        const rows = [
            ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "ü"],
            ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ö", "ä"],
            ["shift", "y", "x", "c", "v", "b", "n", "m", "ß"]
        ];

        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.justifyContent = 'center';
            rowDiv.style.gap = '4px';
            rowDiv.style.width = '100%';
            rowDiv.style.flex = '1';
            rowDiv.style.alignItems = 'stretch';

            row.forEach(keyChar => {
                const key = document.createElement('button');
                
                // key height stretches row height but capped at 48px to keep Apple style standard
                key.style.height = '100%';
                key.style.maxHeight = '48px';
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
                
                key.style.flex = '1';
                key.style.minWidth = '20px';
                key.style.maxWidth = '42px';

                if (keyChar === "shift") {
                    key.innerHTML = "⇧";
                    key.style.maxWidth = '48px';
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
                } else {
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
                        
                        // Auto shift down after typing first letter
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

            targetArea.appendChild(rowDiv);
        });
    }
}
