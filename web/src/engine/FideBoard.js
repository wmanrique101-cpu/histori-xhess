import { StockfishManager } from './StockfishManager.js';

export class FideBoard {
    constructor(containerId) {
        this.boardEl = document.getElementById(containerId);
        // chess.js library must be globally available from CDN in index.html
        if (typeof Chess !== 'undefined') {
            this.chess = new Chess();
        } else {
            console.error("Chess.js no está cargado.");
        }
        
        this.stockfish = new StockfishManager(this.onEngineMove.bind(this));
        
        this.selectedSquare = null;
        this.isEngineThinking = false;
        
        this.unicodePieces = {
            'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
        };
    }
    
    init() {
        if (!this.chess) return;
        this.logMessage("Bienvenido. Eres las piezas blancas.");
        this.renderBoard();
    }
    
    resetGame() {
        this.chess.reset();
        this.selectedSquare = null;
        this.isEngineThinking = false;
        document.getElementById('fide-log').innerHTML = '';
        this.logMessage("Partida Reiniciada");
        this.renderBoard();
    }

    coordsToAlg(r, c) {
        const file = String.fromCharCode(97 + c);
        const rank = 8 - r;
        return `${file}${rank}`;
    }

    onSquareClick(r, c) {
        if (this.isEngineThinking || this.chess.game_over()) return;
        
        const alg = this.coordsToAlg(r, c);
        
        if (this.selectedSquare) {
            const fromAlg = this.selectedSquare;
            // Promoción por defecto a reina de forma simple
            const move = {
                from: fromAlg,
                to: alg,
                promotion: 'q' 
            };
            
            const result = this.chess.move(move);
            
            if (result) {
                this.selectedSquare = null;
                this.logMessage(`Tú: ${result.san}`);
                this.renderBoard();
                this.makeEngineMove();
            } else {
                const piece = this.chess.get(alg);
                if (piece && piece.color === this.chess.turn()) {
                    this.selectedSquare = alg;
                } else {
                    this.selectedSquare = null;
                }
                this.renderBoard();
            }
        } else {
            const piece = this.chess.get(alg);
            if (piece && piece.color === this.chess.turn()) {
                this.selectedSquare = alg;
                this.renderBoard();
            }
        }
    }

    makeEngineMove() {
        if (this.chess.game_over()) {
            this.checkGameOver();
            return;
        }
        
        this.isEngineThinking = true;
        this.logMessage("Stockfish analizando...");
        this.stockfish.findBestMove(this.chess.fen(), 5, 10);
    }

    onEngineMove(bestMoveStr) {
        console.log("Stockfish move:", bestMoveStr);
        if (!bestMoveStr || bestMoveStr === '(none)') {
            // No hay movimiento (posición de mate o ahogado)
            this.isEngineThinking = false;
            this.checkGameOver();
            return;
        }
        const from = bestMoveStr.substring(0, 2);
        const to = bestMoveStr.substring(2, 4);
        const promotion = bestMoveStr.length > 4 ? bestMoveStr[4] : undefined;
        
        const move = this.chess.move({ from, to, promotion });
        if (move) {
            this.logMessage(`Stockfish: ${move.san}`);
        } else {
            this.logMessage(`IA sin movimiento válido.`);
        }
        
        this.isEngineThinking = false;
        this.renderBoard();
        this.checkGameOver();
    }

    checkGameOver() {
        if (this.chess.in_checkmate()) this.logMessage("¡Jaque Mate! Fin del juego.");
        else if (this.chess.in_draw() || this.chess.in_stalemate()) this.logMessage("Tablas. Juego empatado.");
    }

    logMessage(msg) {
        const logUl = document.getElementById('fide-log');
        if (logUl) {
            const li = document.createElement('li');
            li.textContent = msg;
            logUl.insertBefore(li, logUl.firstChild);
        }
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        const board = this.chess.board();
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                square.className = `square ${isLight ? 'light' : 'dark'}`;
                
                const alg = this.coordsToAlg(r, c);
                if (this.selectedSquare === alg) {
                    square.classList.add('selected');
                }
                
                const piece = board[r][c];
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
                    const char = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                    pieceEl.textContent = this.unicodePieces[char] || '?';
                    square.appendChild(pieceEl);
                }
                
                square.addEventListener('click', () => this.onSquareClick(r, c));
                this.boardEl.appendChild(square);
            }
        }
    }
}
