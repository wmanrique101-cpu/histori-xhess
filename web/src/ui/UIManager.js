import { VisualManager } from './VisualManager.js';

export class UIManager {
    static init() {
        this.bindSplashScreen();
        this.bindTabs();
        this.bindEvolutionCards();
        this.bindThemeSwitcher();
    }

    static bindSplashScreen() {
        const btnGuest = document.getElementById('btn-enter-guest');
        const loginForm = document.getElementById('login-form');
        const splashModal = document.getElementById('splash-screen');
        const mainContent = document.getElementById('main-content');
        const loginError = document.getElementById('login-error');
        
        const enterApp = (username) => {
            splashModal.classList.remove('active');
            setTimeout(() => {
                splashModal.style.display = 'none';
                mainContent.classList.remove('hidden');
                
                // ACTIVAR PESTAÑA DE BIENVENIDA POR DEFECTO
                const welcomeTab = document.querySelector('.tab-btn[data-tab="tab-welcome"]') || { dataset: { tab: 'tab-welcome' }, click: () => {
                    const btn = document.querySelector('.tab-btn[data-tab="tab-welcome"]');
                    if (btn) btn.click();
                    else {
                        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
                        document.getElementById('tab-welcome').classList.remove('hidden');
                    }
                }};
                
                // Simular clic en la pestaña de bienvenida para asegurar que todo el sistema de tabs la reconozca
                const welcomeBtn = document.querySelector(`[data-tab="tab-welcome"]`);
                if (welcomeBtn) welcomeBtn.click();
                else {
                   document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
                   document.getElementById('tab-welcome').classList.remove('hidden');
                }

                window.dispatchEvent(new Event('resize'));
            }, 800);

            const headerLogo = document.querySelector('.header-logo');
            if (headerLogo) {
                headerLogo.textContent = `HISTORIAS - ${username}`;
                headerLogo.style.fontSize = "1.4rem"; 
            }
        };

        if (btnGuest) {
            btnGuest.addEventListener('click', (e) => {
                e.preventDefault();
                enterApp('Invitado');
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const user = document.getElementById('username').value.trim();
                const pass = document.getElementById('password').value.trim();
                
                if (user.length < 3 || pass.length < 4) {
                    loginError.classList.remove('hidden');
                    loginError.textContent = "El usuario debe tener >2 y la contraseña >3 caracteres.";
                    return;
                }

                // Cargar usuarios de LocalStorage
                let users = JSON.parse(localStorage.getItem('historychess_users') || '{}');
                
                if (users[user]) {
                    // El usuario existe, verificar contraseña
                    if (users[user].password === pass) {
                        loginError.classList.add('hidden');
                        enterApp(user);
                    } else {
                        loginError.classList.remove('hidden');
                        loginError.textContent = "Contraseña incorrecta para este usuario.";
                    }
                } else {
                    // El usuario no existe, registrarlo
                    users[user] = { password: pass, createdAt: new Date().toISOString() };
                    localStorage.setItem('historychess_users', JSON.stringify(users));
                    
                    loginError.classList.add('hidden');
                    enterApp(user);
                }
            });
        }
    }

    static bindTabs() {
        const allTabs = document.querySelectorAll('.tab-btn[data-tab], .tab-btn-sub[data-tab]');
        const panels = document.querySelectorAll('.tab-panel');

        allTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                // Avoid dropdown parent firing 
                if (e.target.classList.contains('dropbtn')) return;

                // Remove active classes
                allTabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.add('hidden'));

                // Set active tab
                const targetId = tab.dataset.tab;
                document.getElementById(targetId).classList.remove('hidden');

                // Add active state to clicked button (if it's a sub-tab, we might want to highlight the dropdown parent, but simple active class is ok)
                if (tab.classList.contains('tab-btn')) {
                    tab.classList.add('active');
                } else if (tab.classList.contains('tab-btn-sub')) {
                    tab.closest('.dropdown').querySelector('.dropbtn').classList.add('active');
                }
            });
        });
    }

    static bindEvolutionCards() {
        const btnReadMore = document.querySelectorAll('.btn-read-more');
        const modal = document.getElementById('piece-modal');
        const btnClose = document.getElementById('piece-modal-close');

        const PIECE_DATA = {
            bishop: {
                title: "El Elefante ➔ Alfil (♗/♝)",
                context: "Originalmente llamado Gaja en sánscrito y Al-Fil en árabe (el elefante). Su movimiento asiático era un salto lento y diagonal de exactamente dos casillas. Al llegar a la frenética Europa, se convirtió en el 'Obispo' de largo alcance, capaz de cruzar todo el tablero de un solo movimiento, acelerando drásticamente el ritmo de la partida.",
                move: "Se mueve en diagonal todas las casillas que quiera. Siempre se mantiene en casillas del mismo color."
            },
            queen: {
                title: "El Visir ➔ Reina (♕/♛)",
                context: "En el juego oriental, junto al Rey se sentaba su consejero masculino de confianza, el Visir (o Firzán), que solo podía moverse un pequeño paso en diagonal. La transformación en la poderosa 'Dama' o Reina sucedió a finales del siglo XV en España, reflejando la influencia de mujeres monarcas poderosas como Isabel la Católica.",
                move: "Es la pieza más poderosa. Combina el movimiento de la torre y el alfil, pudiendo moverse en cualquier dirección (recto o diagonal)."
            },
            rook: {
                title: "El Carro ➔ Torre (♖/♜)",
                context: "En la India, esta pieza era el Carro de Guerra (Ratha). En persa se le llamó Rukh. Cuando llegó a Europa occidental, el término 'Rukh' sonaba parecido a la palabra italiana para fortaleza ('Rocca'), lo que llevó a su eventual visualización europea como un sólido bloque de piedra o Torre defensiva.",
                move: "Se mueve en línea recta (horizontal o vertical) tantas casillas como desee. Es fundamental para el enroque."
            },
            pawn: {
                title: "El Soldado: El Peón (♙/♟)",
                context: "Representando a la infantería (Padati en sánscrito), forman la línea frontal de defensa y ataque. En la Edad Media europea se inventó su avance inicial doble para agilizar las aperturas. Su habilidad de 'promoción' o coronación al llegar a la última fila ha dado lugar a las historias más heroicas del tablero.",
                move: "Avanza un paso hacia adelante (dos en su primera jugada), pero captura en diagonal. ¡Es la única pieza que no puede retroceder!"
            },
            knight: {
                title: "El Caballero: El Caballo (♘/♞)",
                context: "Representa a la caballería montada (Ashva). Notablemente, es la única pieza cuyo movimiento complejo (dos pasos en una dirección y uno ortogonal) no ha cambiado desde el siglo VI. Su habilidad única para 'saltar' piezas lo convierte en un guerrero táctico esencial.",
                move: "Su movimiento es una 'L' (2 pasos en una dirección y 1 al lado). Es el único capaz de saltar por encima de otras piezas."
            },
            king: {
                title: "La Importancia del Rey (♔/♚)",
                context: "El centro del universo del ajedrez (Rajá en la India, Shah en Persia). Aunque su rango de movimiento es limitado para simular su necesidad de ser protegido, su importancia es absoluta. Perder al Rey es perder la guerra (Jaque Mate), por lo que las verdaderas batallas se libran en su nombre.",
                move: "Se mueve solo una casilla en cualquier dirección. Debe evitar a toda costa ser amenazado."
            }
        };

        btnReadMore.forEach(btn => {
            btn.addEventListener('click', () => {
                const pieceType = btn.dataset.piece;
                const data = PIECE_DATA[pieceType];

                if (!data) return;

                // Actualizar UI del modal
                document.getElementById('piece-modal-title').textContent = data.title;
                document.getElementById('piece-modal-context-text').textContent = data.context;
                document.getElementById('piece-modal-move-text').textContent = data.move;

                // Renderizar tablero de ejemplo
                VisualManager.renderPieceDemoBoard(pieceType, 'piece-demo-board');

                // Abrir modal
                modal.classList.add('open');
            });
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.classList.remove('open');
            });
        }

        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });
    }

    static bindThemeSwitcher() {
        const themeBtns = document.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                // Eliminar temas previos
                document.body.classList.remove('theme-old', 'theme-future', 'theme-neutral');
                // Añadir nuevo
                document.body.classList.add(`theme-${theme}`);
            });
        });
    }
}
