import { DraughtsEngine } from '../engine/DraughtsEngine.js';
import { DraughtsAI } from '../engine/DraughtsAI.js';

export class DraughtsUI {
    static init() {
        const draughtsBoardElement = document.getElementById('draughts-board');
        const btnNewDraughts = document.getElementById('btn-new-draughts');
        const draughtsTurnIndicator = document.getElementById('draughts-turn-indicator');
        
        if (!draughtsBoardElement) return;

        let draughtsGame = new DraughtsEngine();
        let selectedDraughtsSquare = null;
        let isAITurn = false;

        draughtsGame.onIllegalMove = (msg) => {
            if (draughtsTurnIndicator) {
                draughtsTurnIndicator.textContent = `❌ ${msg}`;
                setTimeout(() => {
                    renderDraughtsBoard();
                }, 2000);
            }
        };

        function playAITurn() {
            if (draughtsGame.currentTurn !== 'black') return;
            isAITurn = true;
            
            if (draughtsTurnIndicator) {
                draughtsTurnIndicator.textContent = "Turno: Negras ⬛ (La IA está pensando...)";
            }
            
            setTimeout(() => {
                const bestPath = DraughtsAI.getBestMove(draughtsGame, 'black', 4);
                
                if (bestPath) {
                    for (let i = 0; i < bestPath.steps.length - 1; i++) {
                         setTimeout(() => {
                             draughtsGame.tryMove(bestPath.steps[i].r, bestPath.steps[i].c, bestPath.steps[i+1].r, bestPath.steps[i+1].c);
                             renderDraughtsBoard();
                             
                             // If it was the last step of the AI path
                             if (i === bestPath.steps.length - 2) {
                                 isAITurn = false;
                                 renderDraughtsBoard(); // Final update to show white's turn
                             }
                         }, i * 600);
                    }
                } else {
                     if (draughtsTurnIndicator) draughtsTurnIndicator.textContent = "El juego terminó. ¡Las Blancas ganan!";
                     isAITurn = false;
                }
            }, 100);
        }

        function handleDraughtsSquareClick(r, c) {
            if (isAITurn || draughtsGame.currentTurn === 'black') return; // Block human interaction during AI turn

            if (selectedDraughtsSquare) {
                if (selectedDraughtsSquare.r === r && selectedDraughtsSquare.c === c) {
                    selectedDraughtsSquare = null;
                } else {
                     const success = draughtsGame.tryMove(selectedDraughtsSquare.r, selectedDraughtsSquare.c, r, c);
                     if (success) {
                         if (draughtsGame.needToContinueJump) {
                             selectedDraughtsSquare = draughtsGame.needToContinueJump;
                             if(draughtsTurnIndicator) draughtsTurnIndicator.textContent = "¡Sigue saltando!";
                         } else {
                             selectedDraughtsSquare = null;
                             if (draughtsGame.currentTurn === 'black') {
                                 renderDraughtsBoard();
                                 playAITurn();
                             }
                         }
                     }
                }
            } else {
                const piece = draughtsGame.getPiece(r, c);
                if (piece && piece.color === draughtsGame.currentTurn) {
                    if (draughtsGame.needToContinueJump && (r !== draughtsGame.needToContinueJump.r || c !== draughtsGame.needToContinueJump.c)) {
                        if(draughtsTurnIndicator) draughtsTurnIndicator.textContent = "❌ Continúa la captura.";
                    } else {
                        selectedDraughtsSquare = { r, c };
                    }
                }
            }
            if(!draughtsGame.onIllegalMoveMsgShowing) {
                 renderDraughtsBoard();
            }
        }

        function renderDraughtsBoard() {
            if (!draughtsBoardElement) return;
            draughtsBoardElement.innerHTML = '';
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    const square = document.createElement('div');
                    square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark draughts-dark'}`;
                    
                    const piece = draughtsGame.getPiece(r, c);
                    if (piece) {
                        const pieceEl = document.createElement('div');
                        pieceEl.className = `piece draughts ${piece.color} ${piece.isKing ? 'king' : ''}`;
                        square.appendChild(pieceEl);
                        
                        if (draughtsGame.capturedInCurrentTurn.some(cap => cap.r === r && cap.c === c)) {
                            pieceEl.style.opacity = '0.3';
                        }
                    }

                    if (selectedDraughtsSquare && selectedDraughtsSquare.r === r && selectedDraughtsSquare.c === c) {
                        square.classList.add('selected');
                    }

                    square.addEventListener('click', () => handleDraughtsSquareClick(r, c));
                    draughtsBoardElement.appendChild(square);
                }
            }
            if (draughtsTurnIndicator && !draughtsGame.needToContinueJump && !isAITurn) {
                draughtsTurnIndicator.textContent = `Turno: ${draughtsGame.currentTurn === 'white' ? 'Blancas ⬜' : 'Negras ⬛'}`;
            }
        }

        if (btnNewDraughts) {
            btnNewDraughts.addEventListener('click', () => {
                draughtsGame.init();
                selectedDraughtsSquare = null;
                isAITurn = false;
                renderDraughtsBoard();
            });
        }

        renderDraughtsBoard();
    }
}
