@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==========================================
echo       아기 하마 구하기 게임 실행기
echo ==========================================
echo.

:: 0. 일반적인 설치 경로 확인 및 PATH 추가 시도
if exist "C:\Program Files\nodejs\" (
    set "PATH=%PATH%;C:\Program Files\nodejs\"
)
if exist "C:\Program Files (x86)\nodejs\" (
    set "PATH=%PATH%;C:\Program Files (x86)\nodejs\"
)

:: 1. Node.js (npm) 설치 확인
echo [확인 중] Node.js 설치 상태를 확인하고 있습니다...
call npm --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] npm 명령어를 찾을 수 없습니다.
    echo.
    echo 하지만 사용자분께서 설치하셨다고 하니, 
    echo 환경 변수 문제일 수 있습니다.
    echo.
    echo 1. 'Y'를 누르면 강제로 진행을 시도합니다.
    echo 2. 'N'을 누르면 중단하고 다운로드 페이지를 엽니다.
    echo.
    set /p "user_choice=강제로 진행하시겠습니까? (Y/N): "
    
    if /i "!user_choice!" NEQ "Y" (
        echo.
        echo [안내] 취소하셨습니다. Node.js 설치 페이지를 엽니다.
        start https://nodejs.org/
        pause
        exit /b
    )
    echo.
    echo [알림] 강제로 진행합니다. 오류가 발생할 수 있습니다.
    echo.
) else (
    echo [성공] Node.js가 감지되었습니다.
)

:: 2. 필요한 도구(node_modules) 설치 확인
IF NOT EXIST "node_modules" (
    echo.
    echo [알림] 게임 실행에 필요한 도구를 설치 중입니다...
    echo 필요한 파일이 많아 1~2분 정도 걸릴 수 있습니다.
    echo.
    call npm install
)

:: 3. 게임 서버 실행 및 브라우저 열기
echo.
echo [알림] 게임 서버를 시작합니다!
echo 잠시 후 브라우저가 자동으로 열립니다.
echo.
echo 게임을 종료하려면 이 검은색 창을 닫아주세요.
echo.

:: 백그라운드에서 4초 뒤에 브라우저를 여는 명령 예약
start /b cmd /c "timeout /t 4 > nul & start http://localhost:3000"

:: 서버 실행
npm run dev
pause
