@echo off
cd /d "C:\Program Files\MariaDB 10.11\bin"

echo 1. Matando procesos mysqld huerfanos...
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 2. Deteniendo servicio MariaDB...
net stop MariaDB >nul 2>&1
timeout /t 2 /nobreak >nul

echo 3. Iniciando MariaDB en modo seguro (sin contrasena)...
start /B "" mysqld.exe --defaults-file=C:\mariadb_data\my.ini --skip-grant-tables
timeout /t 6 /nobreak >nul

echo 4. Restableciendo contrasena root a 'Wfb23.'...
mysql.exe -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'Wfb23.'; FLUSH PRIVILEGES;"
if %errorlevel% equ 0 (echo    OK) else (echo    ERROR & pause & exit /b 1)

echo 5. Verificando nueva contrasena...
mysql.exe -u root -pWfb23. -e "SELECT VERSION() AS MariaDB_Version;"
if %errorlevel% equ 0 (echo    OK) else (echo    ERROR & pause & exit /b 1)

echo 6. Deteniendo modo seguro...
mysql.exe -u root -pWfb23. -e "SHUTDOWN;"
timeout /t 4 /nobreak >nul

echo 7. Iniciando servicio MariaDB normalmente...
net start MariaDB
if %errorlevel% equ 0 (echo    OK) else (echo    ERROR & pause & exit /b 1)

echo.
echo ======================================
echo  MariaDB listo - Contrasena: Wfb23.
echo ======================================
echo  Base de datos: smartchair_db
echo.
pause
