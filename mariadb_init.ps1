$mysql = "C:\Program Files\MariaDB 10.11\bin\mysql.exe"
$mysqld = "C:\Program Files\MariaDB 10.11\bin\mysqld.exe"

Write-Host "1. Matando procesos huerfanos..." -ForegroundColor Yellow
taskkill /f /im mysqld.exe 2>$null
Start-Sleep -Seconds 2

Write-Host "2. Deteniendo servicio MariaDB..." -ForegroundColor Yellow
net stop MariaDB 2>$null
Start-Sleep -Seconds 2

Write-Host "3. Iniciando MariaDB en modo seguro..." -ForegroundColor Yellow
$proc = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=C:\mariadb_data\my.ini --skip-grant-tables" -NoNewWindow -PassThru
Start-Sleep -Seconds 6

Write-Host "4. Restableciendo contrasena root a 'Wfb23.'..." -ForegroundColor Yellow
& $mysql -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'Wfb23.'; FLUSH PRIVILEGES;"
if ($LASTEXITCODE -eq 0) { Write-Host "   OK" -ForegroundColor Green } else { Write-Host "   ERROR" -ForegroundColor Red; Read-Host "Presiona Enter"; exit 1 }

Write-Host "5. Verificando..." -ForegroundColor Yellow
& $mysql -u root -pWfb23. -e "SELECT VERSION() AS MariaDB_Version;"
if ($LASTEXITCODE -eq 0) { Write-Host "   OK" -ForegroundColor Green } else { Write-Host "   ERROR" -ForegroundColor Red; Read-Host "Presiona Enter"; exit 1 }

Write-Host "6. Deteniendo modo seguro..." -ForegroundColor Yellow
& $mysql -u root -pWfb23. -e "SHUTDOWN;"
Start-Sleep -Seconds 4

Write-Host "7. Iniciando MariaDB normalmente..." -ForegroundColor Yellow
net start MariaDB
if ($LASTEXITCODE -eq 0) { Write-Host "   OK" -ForegroundColor Green } else { Write-Host "   ERROR" -ForegroundColor Red; Read-Host "Presiona Enter"; exit 1 }

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " MariaDB listo - Contrasena: Wfb23." -ForegroundColor Green
Write-Host " Base de datos: smartchair_db" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Read-Host "Presiona Enter para salir"
