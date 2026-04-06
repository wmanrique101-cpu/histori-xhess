export const PIECE_TYPES = {
    PAWN: 'pawn',
    LANCE: 'lance',
    KNIGHT: 'knight',
    SILVER: 'silver',
    GOLD: 'gold',
    BISHOP: 'bishop',
    ROOK: 'rook',
    KING: 'king'
};

export const SYMBOLS = {
    pawn: { black: '步', blackPromoted: 'と', white: '步', whitePromoted: 'と' },
    lance: { black: '香', blackPromoted: '杏', white: '香', whitePromoted: '杏' },
    knight: { black: '桂', blackPromoted: '圭', white: '桂', whitePromoted: '圭' },
    silver: { black: '銀', blackPromoted: '全', white: '銀', whitePromoted: '全' },
    gold: { black: '金', white: '金' },
    bishop: { black: '角', blackPromoted: '馬', white: '角', whitePromoted: '馬' },
    rook: { black: '飛', blackPromoted: '龍', white: '飛', whitePromoted: '龍' },
    king: { black: '玉', white: '王' }
};

export class ShogiEngine {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(null));
        this.turn = 'black'; // Black (Sente) moves first
        this.captured = { black: [], white: [] };
        this.initBoard();
    }

    initBoard() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                this.board[r][c] = null;
            }
        }

        const setup = (row, side, items) => {
            items.forEach((type, col) => {
                this.board[row][col] = { type, side, promoted: false };
            });
        };

        // White (Gote) - Top side
        setup(0, 'white', [
            PIECE_TYPES.LANCE, PIECE_TYPES.KNIGHT, PIECE_TYPES.SILVER, PIECE_TYPES.GOLD,
            PIECE_TYPES.KING, PIECE_TYPES.GOLD, PIECE_TYPES.SILVER, PIECE_TYPES.KNIGHT, PIECE_TYPES.LANCE
        ]);
        this.board[1][1] = { type: PIECE_TYPES.ROOK, side: 'white', promoted: false };
        this.board[1][7] = { type: PIECE_TYPES.BISHOP, side: 'white', promoted: false };
        setup(2, 'white', Array(9).fill(PIECE_TYPES.PAWN));

        // Black (Sente) - Bottom side
        setup(8, 'black', [
            PIECE_TYPES.LANCE, PIECE_TYPES.KNIGHT, PIECE_TYPES.SILVER, PIECE_TYPES.GOLD,
            PIECE_TYPES.KING, PIECE_TYPES.GOLD, PIECE_TYPES.SILVER, PIECE_TYPES.KNIGHT, PIECE_TYPES.LANCE
        ]);
        this.board[7][1] = { type: PIECE_TYPES.BISHOP, side: 'black', promoted: false };
        this.board[7][7] = { type: PIECE_TYPES.ROOK, side: 'black', promoted: false };
        setup(6, 'black', Array(9).fill(PIECE_TYPES.PAWN));
    }

    getPiece(r, c) {
        return this.board[r][c];
    }

    isPathClear(fromR, fromC, toR, toC) {
        const dr = Math.sign(toR - fromR);
        const dc = Math.sign(toC - fromC);
        let r = fromR + dr;
        let c = fromC + dc;
        while (r !== toR || c !== toC) {
            if (this.board[r][c]) return false;
            r += dr;
            c += dc;
        }
        return true;
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

        const sideSign = piece.side === 'black' ? -1 : 1; 

        // Gold movement logic
        const movesAsGold = (dr === sideSign && absDc <= 1) || (dr === 0 && absDc === 1) || (dr === -sideSign && absDc === 0);

        if (piece.promoted) {
            if (piece.type === PIECE_TYPES.BISHOP) {
                if (absDr === absDc) return this.isPathClear(fromR, fromC, toR, toC);
                return absDr <= 1 && absDc <= 1;
            } else if (piece.type === PIECE_TYPES.ROOK) {
                if (dr === 0 || dc === 0) return this.isPathClear(fromR, fromC, toR, toC);
                return absDr <= 1 && absDc <= 1;
            } else {
                return movesAsGold;
            }
        }

        switch (piece.type) {
            case PIECE_TYPES.PAWN:
                return dr === sideSign && dc === 0;
            case PIECE_TYPES.LANCE:
                return dc === 0 && dr * sideSign > 0 && this.isPathClear(fromR, fromC, toR, toC);
            case PIECE_TYPES.KNIGHT:
                return dr === sideSign * 2 && absDc === 1;
            case PIECE_TYPES.SILVER:
                return (dr === sideSign && absDc <= 1) || (absDr === 1 && absDc === 1 && dr === -sideSign);
            case PIECE_TYPES.GOLD:
                return movesAsGold;
            case PIECE_TYPES.BISHOP:
                return absDr === absDc && this.isPathClear(fromR, fromC, toR, toC);
            case PIECE_TYPES.ROOK:
                return (dr === 0 || dc === 0) && this.isPathClear(fromR, fromC, toR, toC);
            case PIECE_TYPES.KING:
                return absDr <= 1 && absDc <= 1;
        }

        return false;
    }

    move(fromR, fromC, toR, toC) {
        if (!this.isValidMove(fromR, fromC, toR, toC)) return false;

        const piece = this.board[fromR][fromC];
        const target = this.board[toR][toC];

        if (target) {
            // Captured pieces change side and lose promotion
            this.captured[this.turn].push({ type: target.type, side: this.turn, promoted: false });
        }

        this.board[toR][toC] = piece;
        this.board[fromR][fromC] = null;

        // Auto-promotion entry logic
        const isPromotionZone = piece.side === 'black' ? [0, 1, 2].includes(toR) : [6, 7, 8].includes(toR);
        const wasPromotionZone = piece.side === 'black' ? [0, 1, 2].includes(fromR) : [6, 7, 8].includes(fromR);
        
        if (!piece.promoted && (isPromotionZone || wasPromotionZone) && 
            piece.type !== PIECE_TYPES.KING && piece.type !== PIECE_TYPES.GOLD) {
            piece.promoted = true; 
        }

        this.turn = this.turn === 'black' ? 'white' : 'black';
        return true;
    }

    drop(pieceIdx, toR, toC) {
        if (this.board[toR][toC]) return false;
        const piece = this.captured[this.turn][pieceIdx];

        // 1. Nifu (Two Pawns in same column)
        if (piece.type === PIECE_TYPES.PAWN) {
            for (let r = 0; r < 9; r++) {
                const p = this.board[r][toC];
                if (p && p.type === PIECE_TYPES.PAWN && p.side === this.turn && !p.promoted) {
                    return false;
                }
            }
        }

        // 2. Piece must have a legal move from that square
        if (piece.type === PIECE_TYPES.PAWN || piece.type === PIECE_TYPES.LANCE) {
            const lastRank = piece.side === 'black' ? 0 : 8;
            if (toR === lastRank) return false;
        }
        if (piece.type === PIECE_TYPES.KNIGHT) {
            const dangerRanks = piece.side === 'black' ? [0, 1] : [7, 8];
            if (dangerRanks.includes(toR)) return false;
        }

        this.board[toR][toC] = { ...piece };
        this.captured[this.turn].splice(pieceIdx, 1);
        this.turn = this.turn === 'black' ? 'white' : 'black';
        return true;
    }
}
