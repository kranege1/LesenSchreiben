/**
 * keyboard.js - Virtual keyboard presenting only the letters of the current active word.
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
        
        if (!this.currentWord) return;

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
}
