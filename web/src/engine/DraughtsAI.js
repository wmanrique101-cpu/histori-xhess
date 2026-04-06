export class DraughtsAI {
    /**
     * Evaluates the board state from the perspective of the maximizing player.
     * Man = 10, King = 30.
     * Position bonus = 1 point per row advanced.
     */
    static evaluateBoard(engine, maximizingColor) {
        const minimizingColor = maximizingColor === 'white' ? 'black' : 'white';
        let score = 0;

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const piece = engine.board[r][c];
                if (piece) {
                    let pieceValue = piece.isKing ? 30 : 10;
                    
                    // Positional bonus: Encourage moving forward
                    if (!piece.isKing) {
                        let advanceBonus = piece.color === 'white' ? (9 - r) : r;
                        pieceValue += advanceBonus * 0.5;
                    }

                    if (piece.color === maximizingColor) {
                        score += pieceValue;
                    } else {
                        score -= pieceValue;
                    }
                }
            }
        }
        return score;
    }

    /**
     * Minimax algorithm with Alpha-Beta Pruning.
     * Returns { score, bestPath }.
     */
    static minimax(engine, depth, alpha, beta, maximizingColor, currentColor) {
        // Base case: game over or max depth reached
        const allPaths = engine.getAllValidPaths(currentColor);
        
        let isGameOver = false;
        if (allPaths.length === 0) {
            isGameOver = true;
        }

        if (depth === 0 || isGameOver) {
            const evalScore = this.evaluateBoard(engine, maximizingColor);
            // If game over, adjust score heavily to prefer winning/avoiding loss
            if (isGameOver) {
                if (currentColor === maximizingColor) {
                    return { score: -10000, bestPath: null }; // Max player has no moves, loses
                } else {
                    return { score: 10000, bestPath: null }; // Min player has no moves, max wins
                }
            }
            return { score: evalScore, bestPath: null };
        }

        // Apply FMJD forced maximum captures rule to filter paths
        const maxCaptures = Math.max(0, ...allPaths.map(p => p.captures.length));
        const validPaths = allPaths.filter(p => p.captures.length === maxCaptures);

        let bestPath = validPaths[0] || null;

        if (currentColor === maximizingColor) {
            let maxEval = -Infinity;
            for (const path of validPaths) {
                // Simulate move
                const clonedEngine = engine.clone();
                clonedEngine.playPath(path);
                
                // Recurse
                // If the turn did not change (e.g., path is somehow incomplete, which shouldn't happen),
                // we keep current player. But playPath finishes the turn.
                const nextColor = clonedEngine.currentTurn;
                
                const evaluation = this.minimax(clonedEngine, depth - 1, alpha, beta, maximizingColor, nextColor);
                
                if (evaluation.score > maxEval) {
                    maxEval = evaluation.score;
                    bestPath = path;
                }
                alpha = Math.max(alpha, evaluation.score);
                if (beta <= alpha) break; // Beta pruning
            }
            return { score: maxEval, bestPath: bestPath };
        } else {
            let minEval = Infinity;
            for (const path of validPaths) {
                // Simulate move
                const clonedEngine = engine.clone();
                clonedEngine.playPath(path);
                
                const nextColor = clonedEngine.currentTurn;
                
                const evaluation = this.minimax(clonedEngine, depth - 1, alpha, beta, maximizingColor, nextColor);
                
                if (evaluation.score < minEval) {
                    minEval = evaluation.score;
                    bestPath = path;
                }
                beta = Math.min(beta, evaluation.score);
                if (beta <= alpha) break; // Alpha pruning
            }
            return { score: minEval, bestPath: bestPath };
        }
    }

    static getBestMove(engine, aiColor, depth = 4) {
        // Find best path using minimax
        const result = this.minimax(engine, depth, -Infinity, Infinity, aiColor, aiColor);
        return result.bestPath;
    }
}
