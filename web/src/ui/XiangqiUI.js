import { XiangqiEngine, SYMBOLS } from '../engine/XiangqiEngine.js';

export class XiangqiUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.engine = new XiangqiEngine();
        this.selectedSquare = null;
        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        
        const board = document.createElement('div');
        board.className = 'xiangqi-board';
        board.style.width = '450px';
        board.style.height = '500px';
        board.style.position = 'relative';
        board.style.background = '#f5deb3'; // Wood/Wheat color
        board.style.border = '4px solid var(--color-maroon)';
        board.style.boxShadow = '10px 10px 20px rgba(0,0,0,0.6)';

        // Draw grid lines
        this.drawGrid(board);

        // Render pieces on intersections
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = this.engine.getPiece(r, c);
                
                // Clickable area (intersection)
                const point = document.createElement('div');
                point.className = 'xiangqi-point';
                point.style.position = 'absolute';
                point.style.top = `${r * 50}px`;
                point.style.left = `${c * 50}px`;
                point.style.width = '50px';
                point.style.height = '50px';
                point.style.transform = 'translate(-25px, -25px)'; // Center intersection
                point.style.cursor = 'pointer';
                point.style.zIndex = '5';
                
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `xiangqi-piece ${piece.side}`;
                    pieceEl.textContent = SYMBOLS[piece.type][piece.side];
                    point.appendChild(pieceEl);
                }

                // Highlighting
                if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
                    point.classList.add('selected');
                }
                
                if (this.selectedSquare && this.engine.isValidMove(this.selectedSquare.r, this.selectedSquare.c, r, c)) {
                    point.classList.add('move-possible');
                }

                point.addEventListener('click', () => this.handlePointClick(r, c));
                board.appendChild(point);
            }
        }

        const turnLabel = document.createElement('p');
        turnLabel.style.textAlign = 'center';
        turnLabel.style.marginTop = '20px';
        turnLabel.style.color = 'var(--color-maroon)';
        turnLabel.style.fontWeight = 'bold';
        turnLabel.textContent = `Turno: ${this.engine.turn === 'red' ? 'Rojas 🟥 (Abajo)' : 'Negras ⬛ (Arriba)'}`;
        
        this.container.appendChild(board);
        this.container.appendChild(turnLabel);
    }

    drawGrid(board) {
        // Horizontal lines (10)
        for(let i = 0; i < 10; i++){
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.top = `${i * 50}px`;
            line.style.left = '0';
            line.style.width = '400px';
            line.style.height = '1px';
            line.style.background = '#444';
            board.appendChild(line);
        }
        // Vertical lines (9)
        for(let i = 0; i < 9; i++){
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.left = `${i * 50}px`;
            line.style.top = '0';
            line.style.width = '1px';
            line.style.height = '450px';
            line.style.background = '#444';
            // Break lines for the River
            if (i > 0 && i < 8) {
                line.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 200px, 0% 200px, 0% 250px, 100% 250px, 100% 100%, 0% 100%)';
            }
            board.appendChild(line);
        }

        // River text
        const river = document.createElement('div');
        river.style.position = 'absolute';
        river.style.top = '215px';
        river.style.width = '100%';
        river.style.textAlign = 'center';
        river.style.fontSize = '1.2rem';
         river.style.fontFamily = 'serif';
        river.style.color = '#333';
        river.innerHTML = '&nbsp;楚 河 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 漢 界&nbsp;';
        board.appendChild(river);

        // Palaces (X marks)
        this.drawX(board, 0, 3); // Black palace
        this.drawX(board, 7, 3); // Red palace
    }

    drawX(board, r, c) {
        const xSize = 100;
        const line1 = document.createElement('div');
        line1.style.position = 'absolute';
        line1.style.top = `${r * 50}px`;
        line1.style.left = `${c * 50}px`;
        line1.style.width = '141px'; // sqrt(100^2 + 100^2)
        line1.style.height = '1px';
        line1.style.background = '#444';
        line1.style.transform = 'rotate(45deg)';
        line1.style.transformOrigin = '0 0';
        board.appendChild(line1);

        const line2 = document.createElement('div');
        line2.style.position = 'absolute';
        line2.style.top = `${r * 50}px`;
        line2.style.left = `${(c + 2) * 50}px`;
        line2.style.width = '141px';
        line2.style.height = '1px';
        line2.style.background = '#444';
        line2.style.transform = 'rotate(135deg)';
        line2.style.transformOrigin = '0 0';
        board.appendChild(line2);
    }

    handlePointClick(r, c) {
        if (this.engine.turn === 'black') return; // IA turn
        if (this.selectedSquare) {
            if (this.engine.move(this.selectedSquare.r, this.selectedSquare.c, r, c)) {
                this.selectedSquare = null;
                this.render();
                setTimeout(() => this.playAITurn(), 1000);
            } else {
                const piece = this.engine.getPiece(r, c);
                if (piece && piece.side === this.engine.turn) {
                    this.selectedSquare = { r, c };
                } else {
                    this.selectedSquare = null;
                }
            }
        } else {
            const piece = this.engine.getPiece(r, c);
            if (piece && piece.side === this.engine.turn) {
                this.selectedSquare = { r, c };
            }
        }
        this.render();
    }

    playAITurn() {
        const moves = [];
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const p = this.engine.getPiece(r, c);
                if (p && p.side === 'black') {
                    for (let tr = 0; tr < 10; tr++) {
                        for (let tc = 0; tc < 9; tc++) {
                            if (this.engine.isValidMove(r, c, tr, tc)) moves.push({ r, c, tr, tc });
                        }
                    }
                }
            }
        }
        if (moves.length > 0) {
            const m = moves[Math.floor(Math.random() * moves.length)];
            this.engine.move(m.r, m.c, m.tr, m.tc);
            this.render();
        }
    }
}
