import { UIManager } from './ui/UIManager.js';
import { FideBoard } from './engine/FideBoard.js';
import { VisualManager } from './ui/VisualManager.js';
import { DraughtsUI } from './ui/DraughtsUI.js';
import { ShogiUI } from './ui/ShogiUI.js';
import { XiangqiUI } from './ui/XiangqiUI.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar la navegación visual (Pestañas, Modal)
    UIManager.init();

    // 2. Tableros estáticos históricos
    VisualManager.initHistoricBoards();

    // 3. Inicializar el Tablero Clásico (FIDE vs Stockfish)
    const fideBoard = new FideBoard('fide-board');
    fideBoard.init();

    // 4. Inicializar Damas (FMJD)
    DraughtsUI.init();

    // 5. Inicializar Shogi
    const shogi = new ShogiUI('shogi-board');

    // 6. Inicializar Xiangqi
    const xiangqi = new XiangqiUI('xiangqi-board');

    // Reload game buttons
    document.getElementById('btn-new-fide').addEventListener('click', () => {
        fideBoard.resetGame();
    });

    document.getElementById('btn-new-shogi').addEventListener('click', () => {
        shogi.engine.initBoard();
        shogi.engine.turn = 'black';
        shogi.engine.captured = { black: [], white: [] };
        shogi.selectedSquare = null;
        shogi.selectedCapturedIdx = null;
        shogi.render();
    });

    document.getElementById('btn-new-xiangqi').addEventListener('click', () => {
        xiangqi.engine.initBoard();
        xiangqi.engine.turn = 'red';
        xiangqi.selectedSquare = null;
        xiangqi.render();
    });
});
