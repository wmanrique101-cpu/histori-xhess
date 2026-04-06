export class DraughtsEngine {
    constructor() {
        this.board = Array(10).fill(null).map(() => Array(10).fill(null));
        this.currentTurn = 'white';
        this.needToContinueJump = null; // {r, c} if multi-jump in progress
        this.capturedInCurrentTurn = []; // Pieces to remove at end of turn
        this.onIllegalMove = null;
        this.init();
    }

    init() {
        this.board = Array(10).fill(null).map(() => Array(10).fill(null));
        this.currentTurn = 'white';
        this.needToContinueJump = null;
        this.capturedInCurrentTurn = [];

        // Setup Black pieces (rows 0-3) on dark squares ((r+c)%2 === 1)
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 10; c++) {
                if ((r + c) % 2 === 1) this.board[r][c] = { color: 'black', isKing: false };
            }
        }

        // Setup White pieces (rows 6-9)
        for (let r = 6; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                if ((r + c) % 2 === 1) this.board[r][c] = { color: 'white', isKing: false };
            }
        }
    }

    getPiece(r, c) {
        if (r < 0 || r > 9 || c < 0 || c > 9) return null;
        return this.board[r][c];
    }

    setPiece(r, c, piece) {
        if (r >= 0 && r <= 9 && c >= 0 && c <= 9) {
            this.board[r][c] = piece;
        }
    }

    fireIllegalMove(msg) {
        if (this.onIllegalMove) this.onIllegalMove(msg);
    }

    // Try to move from (fromR, fromC) to (toR, toC). 
    // This expects single steps. If part of a capture, it executes that single jump.
    tryMove(fromR, fromC, toR, toC) {
        const piece = this.getPiece(fromR, fromC);
        if (!piece) return false;

        if (piece.color !== this.currentTurn) {
            this.fireIllegalMove("No es tu turno.");
            return false;
        }

        if (this.needToContinueJump && (fromR !== this.needToContinueJump.r || fromC !== this.needToContinueJump.c)) {
            this.fireIllegalMove("Debes continuar la captura con la misma pieza.");
            return false;
        }

        // Generate all valid paths for current state
        const allPaths = this.getAllValidPaths(this.currentTurn);
        if (allPaths.length === 0) {
            this.fireIllegalMove("No hay movimientos posibles.");
            return false;
        }

        // Max capture rule: filter paths that represent the maximum length
        const maxLen = Math.max(...allPaths.map(p => p.captures.length));
        const validPaths = allPaths.filter(p => p.captures.length === maxLen);

        // A move is valid if it matches the first step of ANY valid path extending from the current board state
        // Wait, allPaths returns FULL paths (sequences of jumps). 
        // toR, toC must match the first 'step' of one of the valid paths starting at fromR, fromC.

        const matchingPaths = validPaths.filter(p => 
            p.steps[0].r === fromR && p.steps[0].c === fromC &&
            p.steps[1].r === toR && p.steps[1].c === toC
        );

        if (matchingPaths.length === 0) {
            if (validPaths[0].captures.length > 0) {
                this.fireIllegalMove("Captura obligatoria. Debes usar la máxima cantidad posible.");
            } else {
                this.fireIllegalMove("Movimiento no válido.");
            }
            return false;
        }

        // Execute the single step (move the piece)
        const path = matchingPaths[0]; // Take any matching path to discern if it was a capture
        const isCapture = path.captures.length > 0;
        
        // Move piece
        this.setPiece(toR, toC, piece);
        this.setPiece(fromR, fromC, null);

        if (isCapture) {
            // Find which piece was jumped in THIS step.
            // For a regular man, it's (fromR+toR)/2.
            // For a king, we iterate the diag to find the opposed piece.
            let capR, capC;
            const rDir = Math.sign(toR - fromR);
            const cDir = Math.sign(toC - fromC);
            let currR = fromR + rDir;
            let currC = fromC + cDir;
            while(currR !== toR && currC !== toC) {
                if (this.board[currR][currC]) {
                    capR = currR;
                    capC = currC;
                    break;
                }
                currR += rDir;
                currC += cDir;
            }
            
            // Mark as captured in current turn (ghost piece)
            if (capR !== undefined) {
                this.capturedInCurrentTurn.push({r: capR, c: capC});
            }

            // Check if there are more steps in this specific path (meaning more jumps required)
            // But wait, what if multiple paths share this step, but diverge?
            // The fact that maxLen is > 1 for matchingpaths means there are more jumps.
            const longestRemaining = Math.max(...matchingPaths.map(p => p.captures.length));
            if (longestRemaining > 1) {
                this.needToContinueJump = {r: toR, c: toC};
                return true; // Step successful, but turn not over
            }
        }

        // Turn ends
        this.endTurn(toR, toC, piece);
        return true;
    }

    endTurn(r, c, piece) {
        // Remove captured pieces
        for (const cap of this.capturedInCurrentTurn) {
            this.setPiece(cap.r, cap.c, null);
        }
        this.capturedInCurrentTurn = [];
        this.needToContinueJump = null;

        // Promotion (only if landing on last rank at end of all moves)
        if (piece.color === 'white' && r === 0) piece.isKing = true;
        if (piece.color === 'black' && r === 9) piece.isKing = true;

        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        // Minor: check for win/loss (if opponent has no moves next turn)
        const opponentPaths = this.getAllValidPaths(this.currentTurn);
        if (opponentPaths.length === 0) {
            // We can emit a game over event in UI
        }
    }

    // Returns an array of paths: { steps: [{r,c}, {r,c}, ...], captures: [{r,c}, ...] }
    getAllValidPaths(color) {
        let paths = [];
        // First, search for captures.
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === color) {
                    if (this.needToContinueJump) {
                        if (r !== this.needToContinueJump.r || c !== this.needToContinueJump.c) continue;
                    }
                    const pieceCapturePaths = this.getCapturePaths(r, c, piece, [], [{r, c}]);
                    paths.push(...pieceCapturePaths);
                }
            }
        }

        // If captures exist, return ONLY captures
        if (paths.length > 0) {
            // We don't filter max here, it's filtered outside so tryMove knows why it's illegal.
            return paths; 
        }

        if (this.needToContinueJump) return []; // Should not happen, but safe

        // No captures, search for normal moves
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === color) {
                    const normalMoves = this.getNormalMoves(r, c, piece);
                    for (const dest of normalMoves) {
                        paths.push({ steps: [{r, c}, dest], captures: [] });
                    }
                }
            }
        }
        return paths;
    }

    getNormalMoves(r, c, piece) {
        const moves = [];
        const dirs = piece.isKing ? [[1,1],[1,-1],[-1,1],[-1,-1]] : 
                     (piece.color === 'white' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
        
        for (const [dr, dc] of dirs) {
            let currR = r + dr;
            let currC = c + dc;
            while (currR >= 0 && currR < 10 && currC >= 0 && currC < 10) {
                if (this.board[currR][currC]) break;
                moves.push({r: currR, c: currC});
                if (!piece.isKing) break; // Men move only 1 step
                currR += dr;
                currC += dc;
            }
        }
        return moves;
    }

    clone() {
        const cloned = new DraughtsEngine();
        cloned.board = this.board.map(row => 
            row.map(piece => piece ? { color: piece.color, isKing: piece.isKing } : null)
        );
        cloned.currentTurn = this.currentTurn;
        cloned.needToContinueJump = this.needToContinueJump ? { ...this.needToContinueJump } : null;
        cloned.capturedInCurrentTurn = this.capturedInCurrentTurn.map(cap => ({ ...cap }));
        cloned.onIllegalMove = null;
        return cloned;
    }

    playPath(path) {
        if (!path || !path.steps || path.steps.length < 2) return false;
        for (let i = 0; i < path.steps.length - 1; i++) {
            const success = this.tryMove(path.steps[i].r, path.steps[i].c, path.steps[i+1].r, path.steps[i+1].c);
            if (!success) return false;
        }
        return true;
    }

    // Recursive search for all capture sequences
    getCapturePaths(r, c, piece, currentCaptures, currentSteps) {
        let paths = [];
        const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]]; // Always can capture backwards

        let foundCapture = false;

        for (const [dr, dc] of dirs) {
            let currR = r + dr;
            let currC = c + dc;
            let passedOpponent = null;

            while (currR >= 0 && currR < 10 && currC >= 0 && currC < 10) {
                const squarePiece = this.board[currR][currC];
                
                // If it's a previously "ghost" captured piece in this tree branch, we cannot jump it again.
                // Or if it was captured in previous steps of the turn
                const alreadyCapturedTree = currentCaptures.some(cap => cap.r === currR && cap.c === currC);
                const alreadyCapturedTurn = this.capturedInCurrentTurn.some(cap => cap.r === currR && cap.c === currC);
                
                if (squarePiece && !alreadyCapturedTree && !alreadyCapturedTurn) {
                    if (squarePiece.color === piece.color) {
                        break; // Blocked by friendly piece
                    } else {
                        if (passedOpponent) break; // Cannot jump two pieces in a row
                        passedOpponent = {r: currR, c: currC};
                    }
                } else if (squarePiece && (alreadyCapturedTree || alreadyCapturedTurn)) {
                    // FMJD rule: you CANNOT jump over the same piece twice.
                    // If you encounter an already captured piece, you must stop searching in this direction.
                    break;
                } else if (passedOpponent) {
                    // Empty square after an opponent! We can land here.
                    foundCapture = true;
                    
                    const newCaptures = [...currentCaptures, passedOpponent];
                    const newSteps = [...currentSteps, {r: currR, c: currC}];
                    
                    // Recursive call from this new landing spot
                    const subPaths = this.getCapturePaths(currR, currC, piece, newCaptures, newSteps);
                    
                    if (subPaths.length === 0) {
                        paths.push({steps: newSteps, captures: newCaptures});
                    } else {
                        paths.push(...subPaths);
                    }

                    if (!piece.isKing) break; // Man lands immediately.
                } else {
                    if (!piece.isKing) break; // Man only checks adjacent
                }
                currR += dr;
                currC += dc;
            }
        }

        return paths;
    }
}
