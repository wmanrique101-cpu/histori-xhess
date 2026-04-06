// StockfishManager: Carga el motor Stockfish desde CDN usando un Blob Worker.
// No necesita archivo local de stockfish.js.

const STOCKFISH_CDN = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';

export class StockfishManager {
    constructor(onMoveCallback) {
        this.onMoveCallback = onMoveCallback;
        this.stockfish = null;
        this.ready = false;
        this._initWorker();
    }

    _initWorker() {
        try {
            // Crear un Blob Worker que importa stockfish.js desde CDN
            const blob = new Blob(
                [`importScripts('${STOCKFISH_CDN}');`],
                { type: 'application/javascript' }
            );
            this.stockfish = new Worker(URL.createObjectURL(blob));

            this.stockfish.onmessage = (event) => {
                const line = event.data;
                if (typeof line !== 'string') return;

                if (line === 'uciok' || line === 'readyok') {
                    this.ready = true;
                }

                if (line.startsWith('bestmove')) {
                    // Captura movimiento + posible pieza de promoción (q, r, b, n)
                    const match = line.match(/^bestmove\s([a-h][1-8][a-h][1-8][qrbn]?)/);
                    if (match && match[1]) {
                        if (this.onMoveCallback) {
                            this.onMoveCallback(match[1]);
                        }
                    }
                }
            };

            this.stockfish.onerror = (err) => {
                console.error('Error en Stockfish Worker:', err);
            };

            // Inicializar protocolo UCI
            this.stockfish.postMessage('uci');
            this.stockfish.postMessage('isready');
        } catch (e) {
            console.error('No se pudo iniciar Stockfish:', e);
        }
    }

    findBestMove(fen, skillLevel = 5, depth = 10) {
        if (!this.stockfish) return;
        this.stockfish.postMessage(`setoption name Skill Level value ${skillLevel}`);
        this.stockfish.postMessage(`position fen ${fen}`);
        this.stockfish.postMessage(`go depth ${depth}`);
    }

    terminate() {
        if (this.stockfish) {
            this.stockfish.terminate();
        }
    }
}
