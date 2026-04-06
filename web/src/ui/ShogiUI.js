import { ShogiEngine, SYMBOLS } from '../engine/ShogiEngine.js';

export class ShogiUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.engine = new ShogiEngine();
        this.selectedSquare = null;
        this.selectedCapturedIdx = null; // To handle drops
        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
    }

    render() {
        this.container.innerHTML = '';

        // --- Hand/Captured Pieces Gote ---
        const goteHand = this.createHand('white');
        this.container.appendChild(goteHand);

        // --- Board 9x9 ---
        const board = document.createElement('div');
        board.className = 'shogi-board';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const square = document.createElement('div');
                square.className = 'shogi-square';
                square.dataset.row = r;
                square.dataset.col = c;

                const piece = this.engine.getPiece(r, c);
                if (piece) {
                    const pieceEl = this.createPieceElement(piece);
                    square.appendChild(pieceEl);
                }

                // Highlighting logic
                if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
                    square.classList.add('selected');
                }

                if (this.selectedSquare && this.engine.isValidMove(this.selectedSquare.r, this.selectedSquare.c, r, c)) {
                    square.classList.add('move-possible');
                }

                if (this.selectedCapturedIdx !== null && !piece) {
                    // All empty squares are possible for drop (simplified, we should check Nifu/Illegal rules)
                    const tempPiece = this.engine.captured[this.engine.turn][this.selectedCapturedIdx];
                    // We can check if engine.drop would be valid if we exposed a dry-run method,
                    // but since drop logic is mostly fast, we'll just allow highlighting empty.
                    square.classList.add('drop-possible');
                }

                square.addEventListener('click', () => this.handleSquareClick(r, c));
                board.appendChild(square);
            }
        }
        this.container.appendChild(board);

        // --- Hand/Captured Pieces Sente ---
        const senteHand = this.createHand('black');
        this.container.appendChild(senteHand);

        const turnLabel = document.createElement('p');
        turnLabel.className = 'turn-indicator';
        turnLabel.textContent = `Turno: ${this.engine.turn === 'black' ? 'Sente (Negro) ⬆' : 'Gote (Blanco) ⬇'}`;
        this.container.appendChild(turnLabel);
    }

    createHand(side) {
        const hand = document.createElement('div');
        hand.className = `shogi-hand ${side}`;
        hand.style.display = 'flex';
        hand.style.gap = '5px';
        hand.style.padding = '10px';
        hand.style.minHeight = '60px';
        hand.style.justifyContent = 'center';

        const captured = this.engine.captured[side];
        captured.forEach((piece, idx) => {
            const pEl = this.createPieceElement(piece);
            pEl.style.cursor = 'pointer';
            if (this.selectedCapturedIdx === idx && this.engine.turn === side) {
                pEl.style.boxShadow = '0 0 10px gold';
            }
            pEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.engine.turn === side) {
                    this.selectedCapturedIdx = idx;
                    this.selectedSquare = null; // Drop, not move
                    this.render();
                }
            });
            hand.appendChild(pEl);
        });
        return hand;
    }

    createPieceElement(piece) {
        const el = document.createElement('div');
        el.className = `shogi-piece ${piece.side} ${piece.promoted ? 'promoted' : ''}`;

        // Pentagonal shape approximation (pointed top)
        el.style.width = '42px';
        el.style.height = '48px';
        el.style.background = '#fff8dc'; // Off-white/Bone color
        el.style.border = '1px solid #333';
        el.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)';
        el.style.display = 'flex';
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';
        el.style.fontSize = '24px';
        el.style.fontFamily = 'Sawarabi Mincho, serif'; // Traditional look if font available
        el.style.color = piece.promoted ? 'rgba(119, 25, 25, 1)' : '#000'; // Promoted pieces are red

        // Flip for Gote side
        if (piece.side === 'white') {
            el.style.transform = 'rotate(180deg)';
        }

        const symbolSet = SYMBOLS[piece.type];
        const symbol = piece.promoted ? symbolSet[`${piece.side}Promoted`] : symbolSet[piece.side];
        el.textContent = symbol;

        return el;
    }

    handleSquareClick(r, c) {
        if (this.engine.turn === 'white') return; // AI turn (white/gote)
        if (this.selectedCapturedIdx !== null) {
            if (this.engine.drop(this.selectedCapturedIdx, r, c)) {
                this.selectedCapturedIdx = null;
                setTimeout(() => this.playAITurn(), 1000);
            }
        } else if (this.selectedSquare) {
            if (this.engine.isValidMove(this.selectedSquare.r, this.selectedSquare.c, r, c)) {
                this.engine.move(this.selectedSquare.r, this.selectedSquare.c, r, c);
                this.selectedSquare = null;
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
                this.selectedCapturedIdx = null;
            }
        }
        this.render();
    }

    playAITurn() {
        if (this.engine.turn !== 'white') return;
        const moves = [];
        // Moves from board
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const p = this.engine.getPiece(r, c);
                if (p && p.side === 'white') {
                    for (let tr = 0; tr < 9; tr++) {
                        for (let tc = 0; tc < 9; tc++) {
                            if (this.engine.isValidMove(r, c, tr, tc)) moves.push({ type: 'move', fr: r, fc: c, tr, tc });
                        }
                    }
                }
            }
        }
        // Drops (simplified)
        const hand = this.engine.captured['white'];
        if (hand.length > 0) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (!this.engine.getPiece(r, c)) moves.push({ type: 'drop', idx: 0, tr: r, tc: c });
                }
            }
        }

        if (moves.length > 0) {
            const m = moves[Math.floor(Math.random() * moves.length)];
            if (m.type === 'move') this.engine.move(m.fr, m.fc, m.tr, m.tc);
            else this.engine.drop(m.idx, m.tr, m.tc);
            this.render();
        }
    }
}
