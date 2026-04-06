const { useState, useEffect } = React;

// Uso de un polyfill simple para fadeIn ya que preflight fue desactivado
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
    /* Polyfill para restaurar la utilidad 'border' de tailwind sin afectar el proyecto principal */
    #react-senet-root *, #react-go-root * {
        border-style: solid;
        border-width: 0;
    }
    @keyframes piece-bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    .piece-active {
        animation: piece-bounce 1s infinite;
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.6);
    }
    .senet-stick {
        transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform-style: preserve-3d;
    }
    .wood-bar {
        background: linear-gradient(to bottom, #5d4037, #3e2723);
        border: 2px solid #261b15;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.5), 0 5px 15px rgba(0,0,0,0.5);
    }
    .die-face {
        width: 32px;
        height: 32px;
        background: #fdfdfd;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.2rem;
        color: #1a1310;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    }
    .senet-piece-cone { ... }
    .senet-piece-cylinder {
        width: 20px;
        height: 24px;
        background: #1a1a1a;
        border-radius: 4px;
        position: relative;
        border: 1px solid #333;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
    }
    .senet-piece-cylinder::after {
        content: '';
        position: absolute;
        top: -4px;
        left: 0;
        width: 20px;
        height: 8px;
        background: #333;
        border-radius: 50%;
    }
    .p1-piece {
        width: 20px;
        height: 28px;
        background-color: #fdfdfd; 
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        border: 1px solid #ccc;
    }
    .p2-piece {
        width: 20px;
        height: 28px;
        background-color: #1a1a1a;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        border: 1px solid #333;
        position: relative;
    }
    .p2-piece::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        width: 28px;
        height: 8px;
        background: #333;
        border-radius: 50%;
    }
`;
document.head.appendChild(style);

const EducationalPanel = ({ type }) => {
    const [activeTab, setActiveTab] = useState('historia');

    const dicts = {
        senet: {
            historia: "El Senet es considerado uno de los juegos de mesa más antiguos de la historia, originario del Antiguo Egipto (aprox. 3100 a.C.). Representaba el viaje del alma a través del más allá (Duat).",
            reglas: "El objetivo es mover tus piezas a través del tablero de 3x10 y sacarlas antes que el oponente. Las casillas 26 a 30 tienen reglas especiales de descanso, peligro o renacimiento.",
            tutorial: "1. Tira las varillas y el dado.\n2. Selecciona una de tus piezas (Conos u Ojivas).\n3. Muévela la cantidad indicada. ¡Evita caer en la casilla 27 (La casa de las Aguas)!"
        },
        go: {
            historia: "El Go (Wei-qi en China, Baduk en Corea) es el juego de mesa continuo más antiguo, inventado en China hace más de 2,500 años.",
            reglas: "Los jugadores alternan colocando piedras blancas y negras en las intersecciones del tablero. El objetivo es rodear territorio vacante. Una piedra se captura cuando se queda sin 'libertades'.",
            tutorial: "1. Las negras juegan primero.\n2. Haz clic en una intersección vacía.\n3. Intenta rodear las piedras del oponente."
        },
        classic: {
            historia: "El ajedrez moderno que conocemos hoy se estandarizó en Europa alrededor del siglo XV. Derivado del Shatranj, piezas como el Visir y el Elefante se transformaron en la poderosa Reina y el Alfil de largo alcance.",
            reglas: "Se juega en un tablero de 8x8. Cada jugador cuenta con 16 piezas. El objetivo es acorralar al rey enemigo para lograr el 'Jaque Mate'.",
            tutorial: "1. Las blancas inician.\n2. Haz clic en una pieza de tu color para visualizar sus movimientos legales.\n3. Domina el centro del tablero y no descuides la defensa de tu monarca."
        },
        xiangqi: {
            historia: "Ajedrez Chino, representando el histórico combate a orillas del río Amarillo entre ejércitos. Integra artillería y reglas fluviales únicas.",
            reglas: "Las piezas (General y Asesores) son confinadas a su palacio. Los Elefantes no cruzan el río. El Cañón mueve como la torre, pero para comer obligatoriamente requiere saltar sobre una pieza exacta.",
            tutorial: "1. Las fichas rojas mueven primero.\n2. Da clic en una pieza; se indicarán los círculos de ataque válidos.\n3. Utiliza los Cañones para amenazar piezas distantes de forma inesperada."
        },
        shogi: {
            historia: "Ajedrez Japonés, su rasgo de orgullo es el honor de prisioneros. Al capturar, la madera enemiga se vuelve a tu favor, forzando partidas hiper-tácticas.",
            reglas: "Casi todas las piezas ascienden (se voltean al llegar a las últimas 3 filas). Las piezas capturadas pueden reingresar (Drop) al combate en tu turno en casi cualquier casilla libre.",
            tutorial: "1. Selecciona tus maderas pentagonales para mover.\n2. Al entrar campamento enemigo se promoverán.\n3. Utiliza tu 'banco' de prisioneros para realizar un Drop ubicando una pieza nueva en el tablero."
        },
        checkers: {
            historia: "Damas Internacionales (Reglamento FMJD). Originarias en la época medieval y jugadas masivamente en el occidente moderno en un tablero de 10x10.",
            reglas: "Se avanza de forma diagonal progresiva y la captura ES OBLIGATORIA. De haber múltiples opciones para capturar, deberás siempre tomar el camino matemático que requiera devorar más piezas enemigas.",
            tutorial: "1. Juegan las Blancas.\n2. Observarás que no se te permitirá mover a otro lado si tienes una captura a tiro.\n3. Llega al final para convertirte en Dama Voladora."
        }
    };

    const content = dicts[type] || dicts.go;

    let accentColor = 'text-egyptian-gold border-egyptian-gold';
    let badgeColor = 'bg-egyptian-gold/20 text-egyptian-gold';

    if (type === 'go' || type === 'xiangqi' || type === 'shogi') {
        accentColor = 'text-red-400 border-red-500';
        badgeColor = 'bg-red-500/20 text-red-500';
    } else if (type === 'checkers') {
        accentColor = 'text-orange-400 border-orange-500';
        badgeColor = 'bg-orange-500/20 text-orange-500';
    } else if (type === 'classic' || type === 'shatranj') {
        accentColor = 'text-yellow-500 border-yellow-500';
        badgeColor = 'bg-yellow-500/20 text-yellow-500';
    }

    return (
        <div class="bg-stone-800/50 rounded-xl border border-stone-700/50 p-6 flex flex-col h-full shadow-2xl backdrop-blur-sm min-h-[400px]">
            <div class="flex border-b border-stone-700 mb-6 flex-wrap gap-2">
                {['historia', 'reglas', 'tutorial'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        class={`px-4 py-2 capitalize transition-colors duration-300 border-b-2 font-medium text-sm rounded-t ${activeTab === tab ? accentColor : 'border-transparent text-stone-400 hover:text-stone-300 hover:bg-stone-700/30'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div class="flex-grow animate-fade-in font-serif text-stone-300 leading-relaxed overflow-y-auto" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                {activeTab === 'historia' && <p class="whitespace-pre-wrap">{content.historia}</p>}
                {activeTab === 'reglas' && <p class="whitespace-pre-wrap">{content.reglas}</p>}
                {activeTab === 'tutorial' && (
                    <ul class="space-y-3">
                        {content.tutorial.split('\n').map((step, i) => (
                            <li key={i} class="flex items-start gap-3 bg-stone-800/80 p-3 rounded-lg border border-stone-700/30">
                                <span class={`rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold ${badgeColor}`}>{i + 1}</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

const SenetSticks = ({ onThrow, disabled }) => {
    const [sticks, setSticks] = useState([false, false, false]);
    const [dieValue, setDieValue] = useState(1);
    const [rolling, setRolling] = useState(false);

    const roll = () => {
        if (disabled || rolling) return;
        setRolling(true);

        setTimeout(() => {
            const newSticks = [Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5];
            const newDie = Math.floor(Math.random() * 6) + 1;
            setSticks(newSticks);
            setDieValue(newDie);

            const flatCount = newSticks.filter(s => s).length;
            let value = flatCount + newDie;
            let extraTurn = (flatCount === 0 || value === 6 || value === 1);

            setRolling(false);
            onThrow(value, extraTurn);
        }, 800);
    };

    return (
        <div class="flex flex-col items-center gap-6">
            <div class="wood-bar p-6 rounded-xl flex items-center justify-center gap-8 min-w-[280px]">
                <div class="flex gap-4 h-16 items-center">
                    {sticks.map((isFlat, i) => (
                        <div
                            key={i}
                            class={`w-3 h-14 rounded-full border transition-all duration-500 shadow-md ${rolling ? 'animate-bounce' : ''} ${isFlat ? 'bg-egyptian-gold border-egyptian-gold/60 shadow-egyptian-gold/40' : 'bg-[#1a1310] border-stone-800'}`}
                            style={{ transform: rolling ? `rotate(${Math.random() * 720}deg)` : 'none' }}
                        ></div>
                    ))}
                </div>
                <div class="w-px h-12 bg-stone-700/50"></div>
                <div
                    class={`die-face text-2xl ${rolling ? 'animate-spin' : ''}`}
                    style={{ transform: rolling ? `rotate(${Math.random() * 360}deg)` : 'none' }}
                >
                    {dieValue}
                </div>
            </div>

            <button
                onClick={roll}
                disabled={disabled || rolling}
                class={`px-8 py-3 rounded-xl font-bold transition-all shadow-xl text-lg tracking-widest uppercase flex items-center gap-3 ${disabled || rolling ? 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed' : 'bg-gradient-to-r from-egyptian-gold to-yellow-600 text-black hover:scale-105 active:scale-95 border-2 border-yellow-400/50 font-serif'}`}
            >
                {rolling ? '✨ Invocando Fortuna...' : ' Lanzar Destino'}
            </button>
        </div>
    );
};

const SenetBoard = () => {
    const getInitialBoard = () => {
        const b = Array(30).fill(null);
        // Start with alternating pieces on the first 10 squares
        for (let i = 0; i < 10; i++) {
            b[i] = i % 2 === 0 ? 'p1' : 'ox';
        }
        return b;
    };

    const [board, setBoard] = useState(getInitialBoard());
    const [turn, setTurn] = useState('p1');
    const [throwValue, setThrowValue] = useState(null);
    const [extraTurn, setExtraTurn] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [message, setMessage] = useState("Lanza los palos para empezar");
    const [canMove, setCanMove] = useState(false);

    const specialSquares = { 14: '𓃭', 25: '𓄤', 26: '𓏴', 27: '𓁧', 28: '𓏤' };

    const getLogicIdx = (visualIdx) => {
        const row = Math.floor(visualIdx / 10);
        const col = visualIdx % 10;
        if (row === 0) return col;
        if (row === 1) return 19 - col;
        return 20 + col;
    };

    const handleThrow = (val, extra) => {
        setThrowValue(val);
        setExtraTurn(extra);
        setCanMove(true);
        setMessage(`Sacaste ${val}. ${extra ? '¡Lanza de nuevo!' : 'Mueve una pieza'}`);

        const moves = getValidMoves(val);
        if (moves.length === 0) {
            setMessage(`Sacaste ${val}. Sin movimientos. Cambio de turno.`);
            setTimeout(() => {
                setTurn(turn === 'p1' ? 'p2' : 'p1');
                setThrowValue(null);
                setCanMove(false);
                setMessage("Lanzar");
            }, 1500);
        }
    };

    const getValidMoves = (val) => {
        const moves = [];
        board.forEach((p, idx) => {
            if (p === turn && isValidMove(idx, val)) {
                moves.push(idx);
            }
        });
        return moves;
    };

    const isDefended = (idx) => {
        const player = board[idx];
        if (!player) return false;
        const prev = board[idx - 1];
        const next = board[idx + 1];
        return prev === player || next === player;
    };

    const isBlocked = (idx, steps) => {
        const opponent = turn === 'p1' ? 'p2' : 'p1';
        for (let i = 1; i <= steps; i++) {
            const checkIdx = idx + i;
            if (checkIdx >= 30) break;

            let count = 0;
            let scanIdx = checkIdx;
            while (scanIdx < 30 && board[scanIdx] === opponent) {
                count++;
                scanIdx++;
            }
            scanIdx = checkIdx - 1;
            while (scanIdx >= 0 && board[scanIdx] === opponent) { count++; scanIdx--; }
            if (count >= 3) return true;
        }
        return false;
    };

    const isValidMove = (from, val) => {
        const to = from + val;
        if (isBlocked(from, val)) return false;
        if (to > 30) return false;
        if (to === 30) {
            if ((from === 27 && val === 3) || (from === 28 && val === 2) || (from === 29 && val === 1)) return true;
            return false;
        }
        if (from < 25 && to > 25) return true;

        if (to < 0 || to >= 30) return false;
        const targetPiece = board[to];
        if (targetPiece === turn) return false;
        if (targetPiece && isDefended(to)) return false;
        return true;
    };

    const executeMove = (from, val) => {
        let to = from + val;
        const newBoard = [...board];
        if (from < 25 && to > 25) to = 25;
        const targetPiece = board[to];

        if (to >= 30 || (from === 27 && val === 3) || (from === 28 && val === 2) || (from === 29 && val === 1)) {
            newBoard[from] = null;
        } else if (targetPiece) {
            newBoard[from] = targetPiece;
            newBoard[to] = turn;
        } else {
            newBoard[from] = null;
            newBoard[to] = turn;
        }

        if (to === 26) {
            newBoard[to] = null;
            let spawnIdx = 14;
            while (spawnIdx >= 0 && newBoard[spawnIdx]) spawnIdx--;
            if (spawnIdx >= 0) newBoard[spawnIdx] = turn;
        }

        setBoard(newBoard);
        setSelectedIdx(null);
        setCanMove(false);
        setThrowValue(null);

        if (!extraTurn) {
            setTurn(turn === 'p1' ? 'p2' : 'p1');
            setMessage("Turno del oponente");
        } else {
            setMessage("¡Tiro extra! Lanza de nuevo");
            setExtraTurn(false);
        }

        const p1Pieces = newBoard.filter(p => p === 'p1').length;
        const p2Pieces = newBoard.filter(p => p === 'p2').length;
        if (p1Pieces === 0) setMessage("🏆 ¡JUGADOR 1 GANA EL DUAT!");
        if (p2Pieces === 0) setMessage("🏆 ¡EL ORDENADOR GANA EL DUAT!");
    };

    const handleSquareClick = (idx) => {
        if (!canMove) return;
        if (board[idx] === turn) {
            if (isValidMove(idx, throwValue)) executeMove(idx, throwValue);
            else setMessage("Movimiento inválido o bloqueado");
        }
    };

    const resetGame = () => {
        setBoard(getInitialBoard());
        setTurn('p1');
        setThrowValue(null);
        setExtraTurn(false);
        setSelectedIdx(null);
        setMessage("Lanza los palos para empezar");
        setCanMove(false);
    };

    return (
        <div class="flex flex-col items-center justify-center w-full h-full p-2 animate-fade-in gap-6">
            <div class="flex justify-between items-center bg-stone-800/40 p-3 rounded-lg border border-egyptian-gold/10 w-full max-w-xl">
                <div class={`flex items-center gap-3 transition-opacity duration-300 ${turn === 'p1' ? 'opacity-100' : 'opacity-40'}`}>
                    <div class="p1-piece"></div>
                    <span class="text-egyptian-gold text-xs font-serif uppercase tracking-tighter">Jugador 1</span>
                </div>
                <div class="text-egyptian-gold text-center font-serif text-sm px-4 flex-grow">{message}</div>
                <div class={`flex items-center gap-3 transition-opacity duration-300 ${turn === 'p2' ? 'opacity-100' : 'opacity-40'}`}>
                    <span class="text-stone-400 text-xs font-serif uppercase tracking-tighter">ORDENADOR</span>
                    <div class="p2-piece"></div>
                </div>
            </div>

            <div class="flex flex-col xl:flex-row gap-8 items-center w-full justify-center">
                <div class="bg-[#1a1310] p-4 rounded border-4 border-[#261b15] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                    <div class="grid gap-0.5 bg-[#0a0502] p-0.5 shadow-inner" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
                        {Array(30).fill(null).map((_, i) => {
                            const logicIdx = getLogicIdx(i);
                            const piece = board[logicIdx];
                            const isSpecial = specialSquares[logicIdx];
                            const isValid = canMove && piece === turn && isValidMove(logicIdx, throwValue);

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleSquareClick(logicIdx)}
                                    class={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center cursor-pointer transition-all duration-300 relative
                                        ${isValid ? 'bg-egyptian-gold/10 z-10' : ''}
                                        ${logicIdx % 2 === 0 ? 'bg-[#cfa169]' : 'bg-[#b88c52]'}
                                        border border-[#1a1310]/30 shadow-inner overflow-visible
                                    `}
                                >
                                    {isSpecial && !piece && <span class="text-xl md:text-2xl opacity-20 text-black font-sans pointer-events-none select-none">{isSpecial}</span>}
                                    <div class="absolute top-0.5 left-0.5 text-[7px] opacity-10 text-black pointer-events-none">{logicIdx + 1}</div>

                                    {piece === 'p1' && <div class={`p1-piece ${isValid ? 'piece-active' : ''} transition-all duration-500`}></div>}
                                    {piece === 'p2' && <div class={`p2-piece ${isValid ? 'piece-active' : ''} transition-all duration-500`}></div>}

                                    {isValid && <div class="absolute inset-0 border-2 border-egyptian-gold/30 animate-pulse pointer-events-none"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div class="flex flex-col items-center gap-4 bg-stone-900/40 p-6 rounded-xl border border-stone-800/50">
                    <SenetSticks onThrow={handleThrow} disabled={canMove} />
                    <button
                        onClick={resetGame}
                        class="mt-4 px-4 py-1.5 bg-stone-800/50 hover:bg-stone-800 text-stone-500 border border-stone-700/50 rounded text-[10px] font-bold transition-all uppercase tracking-widest"
                    >
                        Reiniciar Ritual
                    </button>
                </div>
            </div>
        </div>
    )
};

const GoBoard = () => {
    const BOARD_SIZE = 9;
    const [board, setBoard] = useState(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    const [currentPlayer, setCurrentPlayer] = useState('black');

    const resetGame = () => {
        setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
        setCurrentPlayer('black');
    };

    const handleIntersectionClick = (idx) => {
        if (board[idx] || currentPlayer !== 'black') return;

        const newBoard = [...board];
        newBoard[idx] = 'black';
        setBoard(newBoard);
        setCurrentPlayer('white');

        // Simple AI move
        setTimeout(() => {
            const emptyIndices = newBoard.map((s, i) => s === null ? i : null).filter(i => i !== null);
            if (emptyIndices.length > 0) {
                const aiIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                newBoard[aiIdx] = 'white';
                setBoard([...newBoard]);
                setCurrentPlayer('black');
            }
        }, 800);
    };

    return (
        <div class="flex flex-col items-center justify-center w-full h-full p-2 animate-fade-in relative z-0">
            <div class="absolute inset-0 bg-gradient-to-br from-[#1a1310] to-[#261b15] -z-10 opacity-50"></div>
            <div class="mb-6 text-center">
                <h2 class="text-3xl font-serif text-stone-200 mb-1 tracking-[0.3em] font-light">G O <span class="text-red-700 text-xl ml-2 font-sans opacity-80">囲碁</span></h2>
                <div class="flex items-center gap-4 justify-center py-2">
                    <div class={`flex items-center gap-2 transition-opacity duration-300 ${currentPlayer === 'black' ? 'opacity-100' : 'opacity-40'}`}>
                        <div class="w-4 h-4 rounded-full bg-black shadow-inner border border-white/10"></div>
                        <span class="text-xs uppercase tracking-tighter text-stone-400">Jugador</span>
                    </div>
                    <div class="w-px h-3 bg-stone-700"></div>
                    <div class={`flex items-center gap-2 transition-opacity duration-300 ${currentPlayer === 'white' ? 'opacity-100' : 'opacity-40'}`}>
                        <span class="text-xs uppercase tracking-tighter text-stone-400">IA</span>
                        <div class="w-4 h-4 rounded-full bg-white shadow-md border border-black/10"></div>
                    </div>
                </div>
            </div>

            <div class="bg-[#dcb35c] p-4 md:p-6 rounded-xs shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative border-b-4 border-r-4 border-[#8b5a2b]">
                <div class="grid border border-black/80 w-fit" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE - 1}, minmax(0, 1fr))` }}>
                    {Array((BOARD_SIZE - 1) * (BOARD_SIZE - 1)).fill(null).map((_, i) => (
                        <div key={i} class="w-8 h-8 md:w-10 md:h-10 border border-black/60 shadow-inner"></div>
                    ))}
                </div>

                <div class="absolute top-[16px] left-[16px] md:top-[24px] md:left-[24px] bottom-[16px] right-[16px] md:bottom-[24px] md:right-[24px] grid" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
                    {board.map((stone, i) => (
                        <div key={i} onClick={() => handleIntersectionClick(i)} class="relative flex items-center justify-center cursor-pointer group" style={{ transform: 'translate(-50%, -50%)', width: '100%', height: '100%' }}>
                            {!stone && <div class="w-3 h-3 rounded-full bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                            {stone === 'black' && <div class="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-stone-700 to-black shadow-[2px_3px_6px_rgba(0,0,0,0.8)] border border-white/5 animate-fade-in"></div>}
                            {stone === 'white' && <div class="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-white to-stone-200 shadow-[2px_3px_6px_rgba(0,0,0,0.8)] border border-black/10 animate-fade-in"></div>}
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={resetGame}
                class="mt-8 px-6 py-2 bg-stone-800/40 hover:bg-stone-800 text-stone-500 border border-stone-700/50 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest flex items-center gap-2"
            >
                Reiniciar Camino
            </button>
        </div>
    );
};

const SenetApp = () => {
    return (
        <div class="flex flex-col w-full h-[700px] bg-[#0a0502] rounded-xl overflow-hidden border border-[#261b15]">
            <div class="flex-grow flex flex-col md:flex-row p-4 sm:p-8 gap-8 overflow-hidden max-w-[1400px] mx-auto w-full">
                <div class="flex-grow flex items-center justify-center bg-black/40 rounded-lg border border-white/5 relative shadow-2xl overflow-auto p-4">
                    <SenetBoard />
                </div>
                <div class="w-full md:w-[380px] flex-shrink-0">
                    <EducationalPanel type="senet" />
                </div>
            </div>
        </div>
    );
};

const GoApp = () => {
    return (
        <div class="flex flex-col w-full h-[700px] bg-[#0a0502] rounded-xl overflow-hidden border border-[#261b15]">
            <div class="flex-grow flex flex-col md:flex-row p-4 sm:p-8 gap-8 overflow-hidden max-w-[1400px] mx-auto w-full">
                <div class="flex-grow flex items-center justify-center bg-black/40 rounded-lg border border-white/5 relative shadow-2xl overflow-auto p-4">
                    <GoBoard />
                </div>
                <div class="w-full md:w-[380px] flex-shrink-0">
                    <EducationalPanel type="go" />
                </div>
            </div>
        </div>
    );
};

const senetNode = document.getElementById('react-senet-root');
if (senetNode) {
    const root = ReactDOM.createRoot(senetNode);
    root.render(<SenetApp />);
}

const goNode = document.getElementById('react-go-root');
if (goNode) {
    const root = ReactDOM.createRoot(goNode);
    root.render(<GoApp />);
}

// Nuevos mount points para Paneles Educativos
['classic', 'shatranj', 'xiangqi', 'shogi', 'checkers'].forEach(type => {
    const node = document.getElementById(`react-${type}-panel`);
    if (node) {
        const root = ReactDOM.createRoot(node);
        root.render(<EducationalPanel type={type} />);
    }
});
