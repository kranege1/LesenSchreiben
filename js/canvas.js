/**
 * canvas.js - Drawing canvas for handwriting with Apple Pencil support
 * Features: Grundschul-Lineatur (4 lines), pressure sensitivity, undo/clear, and ghosting outline.
 */

export class PencilCanvas {
    /**
     * @param {HTMLCanvasElement} canvasElement - The drawing canvas
     * @param {HTMLDivElement} ghostOverlay - Div for ghosting text container
     */
    constructor(canvasElement, ghostOverlay) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.ghostOverlay = ghostOverlay;
        
        this.strokes = []; // undo history
        this.currentStroke = [];
        this.isDrawing = false;
        
        this.lineColor = 'rgba(0, 122, 255, 0.15)'; // light blue lineatur
        this.centerLineColor = 'rgba(255, 59, 48, 0.15)'; // red center line option or helper
        this.lineWidthBase = 8;
        
        this._setupListeners();
        this.resize();
    }

    _setupListeners() {
        // Prevent default touch gestures to allow palm rejection
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('pointermove', (e) => this.draw(e));
        this.canvas.addEventListener('pointerup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('pointercancel', (e) => this.stopDrawing(e));
    }

    resize() {
        // Set actual canvas resolution matching its layout size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.redraw();
    }

    clear() {
        this.strokes = [];
        this.currentStroke = [];
        this.redraw();
    }

    undo() {
        if (this.strokes.length > 0) {
            this.strokes.pop();
            this.redraw();
        }
    }

    /**
     * Draws the 4-line primary school lineatur (Grundschullineatur)
     * Proportions from top to bottom: 1 : 1 : 1 (or 3 : 4 : 3)
     * Let's center it vertically.
     */
    drawLineatur() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // Find center zone
        const lineSpacing = height / 5; // Split height into 5 intervals
        const yOffset = height / 2 - (lineSpacing * 1.5);
        
        this.ctx.save();
        this.ctx.lineWidth = 1;
        
        // 4 lines
        for (let i = 0; i < 4; i++) {
            const y = yOffset + i * lineSpacing;
            
            // Set style for lines
            if (i === 1 || i === 2) {
                // Middle zone lines
                this.ctx.strokeStyle = '#8E8E93';
                this.ctx.setLineDash([5, 5]);
            } else {
                // Top and bottom lines
                this.ctx.strokeStyle = '#AEAEB2';
                this.ctx.setLineDash([]);
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(10, y);
            this.ctx.lineTo(width - 10, y);
            this.ctx.stroke();
        }
        
        // Let's color the background of the middle write zone (between line 1 and 2)
        this.ctx.fillStyle = 'rgba(0, 122, 255, 0.03)';
        this.ctx.fillRect(10, yOffset + lineSpacing, width - 20, lineSpacing);
        
        // Draw helpful labels for the lines
        this.ctx.fillStyle = 'rgba(142, 142, 147, 0.5)';
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText("Oben (d, h, k, l, t, A...)", 15, yOffset + lineSpacing - 18);
        this.ctx.fillText("Mitte (a, e, i, o, u...)", 15, yOffset + (lineSpacing * 2) - 18);
        this.ctx.fillText("Unten (g, j, p, q, y...)", 15, yOffset + (lineSpacing * 3) - 18);
        
        this.ctx.restore();
    }

    redraw() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw the background lines
        this.drawLineatur();
        
        // Redraw all saved strokes
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        for (const stroke of this.strokes) {
            if (stroke.length === 0) continue;
            
            this.ctx.beginPath();
            this.ctx.moveTo(stroke[0].x, stroke[0].y);
            
            for (let i = 1; i < stroke.length; i++) {
                const pt = stroke[i];
                // Apply pressure sensitivity to line width if available
                const w = this.lineWidthBase * (pt.pressure || 0.5) * 2;
                this.ctx.lineWidth = Math.max(3.0, w);
                
                // Draw a small path segment
                this.ctx.lineTo(pt.x, pt.y);
                this.ctx.strokeStyle = '#1C1C1E'; // iOS dark label color
                this.ctx.stroke();
                
                // Start a new path for next width to enable variable width drawing
                this.ctx.beginPath();
                this.ctx.moveTo(pt.x, pt.y);
            }
        }
        this.ctx.restore();
    }

    startDrawing(e) {
        // If it's a touch event, but we have pen input active, implement palm rejection
        if (e.pointerType === 'touch' && this.strokes.some(s => s.some(pt => pt.type === 'pen'))) {
            // Discard touch points if pen was used recently
            return;
        }
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const pt = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 0.5,
            type: e.pointerType
        };
        this.currentStroke = [pt];
        this.strokes.push(this.currentStroke);
        this.redraw();
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const pt = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 0.5,
            type: e.pointerType
        };
        
        this.currentStroke.push(pt);
        this.redraw();
    }

    stopDrawing(e) {
        this.isDrawing = false;
        this.redraw();
    }

    /**
     * Shows or hides the background text for ghost tracing
     * @param {string} text - The word to ghost write
     * @param {boolean} show - Toggle state
     */
    setGhosting(text, show) {
        if (show && text) {
            this.ghostOverlay.innerText = text;
            this.ghostOverlay.style.opacity = '0.12';
        } else {
            this.ghostOverlay.style.opacity = '0';
            this.ghostOverlay.innerText = '';
        }
    }
}
