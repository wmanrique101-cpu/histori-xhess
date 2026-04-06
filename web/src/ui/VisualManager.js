export class VisualManager {
    static initHistoricBoards() {
        // Shatranj removed
    }

    static render8x8Board(containerId, isBicolor) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

    }

    /**
     * Renders a demo 8x8 board inside `containerId` that shows
     * the given pieceType placed on a central square with all its
     * possible destination squares highlighted.
     */
    static renderPieceDemoBoard(pieceType, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const CONFIGS = {
            bishop: {
                symbol: '♗', colorClass: 'white', pr: 3, pc: 3,
                moves: (r, c) => {
                    const m = [];
                    for (let d = 1; d < 8; d++) {
                        if (r - d >= 0 && c - d >= 0) m.push([r - d, c - d]);
                        if (r - d >= 0 && c + d < 8) m.push([r - d, c + d]);
                        if (r + d < 8 && c - d >= 0) m.push([r + d, c - d]);
                        if (r + d < 8 && c + d < 8) m.push([r + d, c + d]);
                    }
                    return m;
                }
            },
            queen: {
                symbol: '♕', colorClass: 'white', pr: 3, pc: 3,
                moves: (r, c) => {
                    const m = [];
                    for (let d = 1; d < 8; d++) {
                        if (r - d >= 0) m.push([r - d, c]);
                        if (r + d < 8) m.push([r + d, c]);
                        if (c - d >= 0) m.push([r, c - d]);
                        if (c + d < 8) m.push([r, c + d]);
                        if (r - d >= 0 && c - d >= 0) m.push([r - d, c - d]);
                        if (r - d >= 0 && c + d < 8) m.push([r - d, c + d]);
                        if (r + d < 8 && c - d >= 0) m.push([r + d, c - d]);
                        if (r + d < 8 && c + d < 8) m.push([r + d, c + d]);
                    }
                    return m;
                }
            },
            rook: {
                symbol: '♖', colorClass: 'white', pr: 3, pc: 3,
                moves: (r, c) => {
                    const m = [];
                    for (let d = 1; d < 8; d++) {
                        if (r - d >= 0) m.push([r - d, c]);
                        if (r + d < 8) m.push([r + d, c]);
                        if (c - d >= 0) m.push([r, c - d]);
                        if (c + d < 8) m.push([r, c + d]);
                    }
                    return m;
                }
            },
            pawn: {
                symbol: '♙', colorClass: 'white', pr: 4, pc: 3,
                moves: (r, c) => {
                    const m = [];
                    if (r - 1 >= 0) m.push([r - 1, c]);
                    if (r === 6) m.push([r - 2, c]);
                    if (r - 1 >= 0 && c - 1 >= 0) m.push([r - 1, c - 1]);
                    if (r - 1 >= 0 && c + 1 < 8) m.push([r - 1, c + 1]);
                    return m;
                }
            },
            knight: {
                symbol: '♘', colorClass: 'white', pr: 3, pc: 3,
                moves: (r, c) => {
                    const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
                    return offsets.map(([dr, dc]) => [r + dr, c + dc])
                        .filter(([nr, nc]) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8);
                }
            },
            king: {
                symbol: '♔', colorClass: 'white', pr: 3, pc: 3,
                moves: (r, c) => {
                    const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
                    return offsets.map(([dr, dc]) => [r + dr, c + dc])
                        .filter(([nr, nc]) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8);
                }
            }
        };

        const cfg = CONFIGS[pieceType];
        if (!cfg) return;

        const moveSet = new Set(cfg.moves(cfg.pr, cfg.pc).map(([r, c]) => `${r},${c}`));

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.createElement('div');
                const light = (r + c) % 2 === 0;
                let cls = `square ${light ? 'light' : 'dark'}`;

                const isPiece = r === cfg.pr && c === cfg.pc;
                const isMove = moveSet.has(`${r},${c}`);

                if (isPiece) cls += ' highlight-piece';
                else if (isMove) cls += ' highlight-move';

                sq.className = cls;

                if (isPiece) {
                    const p = document.createElement('div');
                    p.className = `piece ${cfg.colorClass}`;
                    p.textContent = cfg.symbol;
                    sq.appendChild(p);
                } else if (isMove) {
                    const dot = document.createElement('div');
                    dot.style.cssText = 'width:18px;height:18px;border-radius:50%;background:rgba(255, 255, 255, 1);pointer-events:none;';
                    sq.appendChild(dot);
                }

                container.appendChild(sq);
            }
        }
    }

}
