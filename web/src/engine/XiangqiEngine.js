export const PIECE_TYPES = {
    GENERAL: 'general',
    ADVISOR: 'advisor',
    ELEPHANT: 'elephant',
    HORSE: 'horse',
    CHARIOT: 'chariot',
    CANNON: 'cannon',
    SOLDIER: 'soldier'
};

export const SYMBOLS = {
    general: { red: '帥', black: '將' },
    advisor: { red: '仕', black: '士' },
    elephant: { red: '相', black: '象' },
    horse: { red: '傌', black: '馬' },
    chariot: { red: '俥', black: '車' },
    cannon: { red: '炮', black: '砲' },
    soldier: { red: '兵', black: '卒' }
};

export class XiangqiEngine {
    constructor() {
        this.board = Array(10).fill(null).map(() => Array(9).fill(null));
        this.turn = 'red'; // Red usually moves first
        this.initBoard();
    }

    initBoard() {
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                this.board[r][c] = null;
            }
        }

        const setupRow = (row, side, items) => {
            items.forEach((type, col) => {
                if (type) this.board[row][col] = { type, side };
            });
        };

        // Black side (Top, rows 0-4)
        setupRow(0, 'black', [
            PIECE_TYPES.CHARIOT, PIECE_TYPES.HORSE, PIECE_TYPES.ELEPHANT, PIECE_TYPES.ADVISOR,
            PIECE_TYPES.GENERAL, PIECE_TYPES.ADVISOR, PIECE_TYPES.ELEPHANT, PIECE_TYPES.HORSE, PIECE_TYPES.CHARIOT
        ]);
        this.board[2][1] = { type: PIECE_TYPES.CANNON, side: 'black' };
        this.board[2][7] = { type: PIECE_TYPES.CANNON, side: 'black' };
        setupRow(3, 'black', [
            PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER
        ]);

        // Red side (Bottom, rows 5-9)
        setupRow(9, 'red', [
            PIECE_TYPES.CHARIOT, PIECE_TYPES.HORSE, PIECE_TYPES.ELEPHANT, PIECE_TYPES.ADVISOR,
            PIECE_TYPES.GENERAL, PIECE_TYPES.ADVISOR, PIECE_TYPES.ELEPHANT, PIECE_TYPES.HORSE, PIECE_TYPES.CHARIOT
        ]);
        this.board[7][1] = { type: PIECE_TYPES.CANNON, side: 'red' };
        this.board[7][7] = { type: PIECE_TYPES.CANNON, side: 'red' };
        setupRow(6, 'red', [
            PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER, null, PIECE_TYPES.SOLDIER
        ]);
    }

    getPiece(r, c) {
        return this.board[r][c];
    }

    isValidMove(fromR, fromC, toR, toC) {
        const piece = this.board[fromR][fromC];
        if (!piece || piece.side !== this.turn) return false;

        const target = this.board[toR][toC];
        if (target && target.side === this.turn) return false;

        const dr = toR - fromR;
        const dc = toC - fromC;
        const absDr = Math.abs(dr);
        const absDc = Math.abs(dc);

        // Common helper: Count pieces between two points on the same line
        const countBetween = (r1, c1, r2, c2) => {
            let count = 0;
            if (r1 === r2) {
                const minC = Math.min(c1, c2);
                const maxC = Math.max(c1, c2);
                for (let i = minC + 1; i < maxC; i++) if (this.board[r1][i]) count++;
            } else if (c1 === c2) {
                const minR = Math.min(r1, r2);
                const maxR = Math.max(r1, r2);
                for (let i = minR + 1; i < maxR; i++) if (this.board[i][c1]) count++;
            }
            return count;
        };

        // Flying General rule check
        const isFlyingGeneralViolated = (fromR, fromC, toR, toC) => {
            // Predict board state after move
            const oldTarget = this.board[toR][toC];
            const movingPiece = this.board[fromR][fromC];
            
            this.board[toR][toC] = movingPiece;
            this.board[fromR][fromC] = null;

            let violated = false;
            let redGen = null, blackGen = null;
            
            // Find generals
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 9; c++) {
                    const p = this.board[r][c];
                    if (p && p.type === PIECE_TYPES.GENERAL) {
                        if (p.side === 'red') redGen = {r, c};
                        else blackGen = {r, c};
                    }
                }
            }

            if (redGen && blackGen && redGen.c === blackGen.c) {
                if (countBetween(redGen.r, redGen.c, blackGen.r, blackGen.c) === 0) {
                    violated = true;
                }
            }

            // Restore state
            this.board[fromR][fromC] = movingPiece;
            this.board[toR][toC] = oldTarget;
            return violated;
        };

        if (isFlyingGeneralViolated(fromR, fromC, toR, toC)) return false;

        const inPalace = (r, c, side) => {
            const cols = [3, 4, 5];
            const rows = side === 'red' ? [7, 8, 9] : [0, 1, 2];
            return rows.includes(r) && cols.includes(c);
        };

        switch (piece.type) {
            case PIECE_TYPES.GENERAL:
                if (!inPalace(toR, toC, piece.side)) return false;
                return absDr + absDc === 1;

            case PIECE_TYPES.ADVISOR:
                if (!inPalace(toR, toC, piece.side)) return false;
                return absDr === 1 && absDc === 1;

            case PIECE_TYPES.ELEPHANT:
                if (absDr !== 2 || absDc !== 2) return false;
                // Cannot cross river
                if (piece.side === 'red' && toR < 5) return false;
                if (piece.side === 'black' && toR > 4) return false;
                // Elephant eye (cannot jump over piece)
                if (this.board[fromR + dr / 2][fromC + dc / 2]) return false;
                return true;

            case PIECE_TYPES.HORSE:
                if (!((absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2))) return false;
                // Hobbling the horse's leg
                if (absDr === 2) {
                    if (this.board[fromR + dr / 2][fromC]) return false;
                } else {
                    if (this.board[fromR][fromC + dc / 2]) return false;
                }
                return true;

            case PIECE_TYPES.CHARIOT:
                if (dr !== 0 && dc !== 0) return false;
                return countBetween(fromR, fromC, toR, toC) === 0;

            case PIECE_TYPES.CANNON:
                if (dr !== 0 && dc !== 0) return false;
                const between = countBetween(fromR, fromC, toR, toC);
                if (!target) return between === 0; // Simple move
                return between === 1; // Capture jump

            case PIECE_TYPES.SOLDIER:
                const isForward = piece.side === 'red' ? dr === -1 : dr === 1;
                const overRiver = piece.side === 'red' ? fromR <= 4 : fromR >= 5;
                if (isForward && dc === 0) return true;
                if (overRiver && dr === 0 && absDc === 1) return true; // Sideways after river
                return false;
        }

        return false;
    }

    move(fromR, fromC, toR, toC) {
        if (!this.isValidMove(fromR, fromC, toR, toC)) return false;

        this.board[toR][toC] = this.board[fromR][fromC];
        this.board[fromR][fromC] = null;
        this.turn = this.turn === 'red' ? 'black' : 'red';
        return true;
    }
}
