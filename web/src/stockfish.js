importScripts('stockfish-16.1-lite-single.js');

let engine = null;
let isEngineReady = false;
let moveQueue = [];
let currentBestMove = null;

// Inicialización
onmessage = function (e) {
    const data = e.data;

    if (data.type === 'init') {
        // Inicializar Stockfish
        engine = Stockfish();

        engine.onmessage = function (event) {
            const line = event.data;

            // Parsear la salida del motor
            if (line.startsWith('bestmove')) {
                const parts = line.split(' ');
                currentBestMove = parts[1];

                // Si hay movimientos en cola, procesarlos
                if (moveQueue.length > 0) {
                    const nextMove = moveQueue.shift();
                    engine.postMessage(`position fen ${nextMove.fen}`);
                    engine.postMessage(`go depth ${nextMove.depth}`);
                }
            }
        };

        // Configurar parámetros iniciales
        engine.postMessage('uci');
        engine.postMessage('setoption name Skill Level value 0'); // Modo fácil
        engine.postMessage('setoption name Threads value 2');
        engine.postMessage('isready');

        // Esperar a que el motor esté listo
        setTimeout(() => {
            isEngineReady = true;
            postMessage({ type: 'ready' });
        }, 1000);
    }

    // Obtener mejor movimiento
    if (data.type === 'getBestMove' && isEngineReady) {
        engine.postMessage(`position fen ${data.fen}`);
        engine.postMessage(`go depth ${data.depth}`);

        // Si no hay movimientos en cola, procesar inmediatamente
        if (moveQueue.length === 0) {
            setTimeout(() => {
                if (currentBestMove) {
                    postMessage({ type: 'bestMove', move: currentBestMove });
                    currentBestMove = null;
                }
            }, 500);
        } else {
            // Agregar a la cola
            moveQueue.push({ fen: data.fen, depth: data.depth });
        }
    }

    // Detener el motor
    if (data.type === 'stop') {
        engine.postMessage('stop');
    }
};