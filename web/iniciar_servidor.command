#!/bin/bash
cd "$(dirname "$0")"
echo "========================================="
echo "♟️  Iniciando Servidor de HistoryChess ♟️"
echo "========================================="
echo "Abriendo el navegador automáticamente..."
sleep 1
open http://localhost:8080
echo "Presiona Ctrl+C en esta ventana para detener el servidor de forma segura."
python3 -m http.server 8080
