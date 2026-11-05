@echo off
title StockMaster - Servidor Flask y Frontend
echo ========================================================
echo   StockMaster - Sistema de Gestion de Inventario (ORM)
echo ========================================================
echo.
echo Iniciando el backend Flask...
echo Verificando conexion con MySQL y creando tablas si es necesario...
echo.

cd /d "%~dp0backend"

start "" http://127.0.0.1:5000

py -3.14 main.py || python main.py

pause

