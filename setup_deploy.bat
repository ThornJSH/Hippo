@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==========================================
echo       GitHub 배포 도구
echo ==========================================
echo.

:: 0. Node.js (npm) 경로 자동 추가 (설치되어 있는데 인식 못하는 경우 대비)
if exist "C:\Program Files\nodejs\" (
    set "PATH=%PATH%;C:\Program Files\nodejs\"
)
if exist "C:\Program Files (x86)\nodejs\" (
    set "PATH=%PATH%;C:\Program Files (x86)\nodejs\"
)

:: npm 확인
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [오류] npm 명령어를 찾을 수 없습니다.
    echo Node.js가 설치되어 있는지 확인해주세요.
    echo.
    echo 설치했는데도 이 오류가 뜬다면, 컴퓨터를 재부팅해야 할 수 있습니다.
    pause
    exit /b
)

:: 1. Git 명령어 확인 및 GitHub Desktop 경로 탐색
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [탐색] 시스템에서 Git 명령어를 찾을 수 없습니다.
    echo GitHub Desktop 내장 Git을 찾고 있습니다...
    
    set "FOUND_GIT="
    for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
        if exist "%%D\resources\app\git\cmd\git.exe" (
            set "FOUND_GIT=%%D\resources\app\git\cmd"
        )
    )
    
    if defined FOUND_GIT (
        echo [성공] GitHub Desktop의 Git을 찾았습니다!
        set "PATH=%PATH%;!FOUND_GIT!"
    ) else (
        echo [!] Git을 찾을 수 없습니다.
        pause
        exit /b
    )
)

echo [정보] 현재 사용 중인 Git 버전:
git --version
echo.

:: 2. 리모트 저장소 연결 (연결 안 된 경우만)
git remote -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [알림] GitHub 레포지토리 연결이 필요합니다.
    echo.
    echo [중요] GitHub 웹사이트에서 'Hipo'라는 이름으로 '빈 레포지토리'를 먼저 만들어주세요.
    echo 주소 형식: https://github.com/사용자아이디/Hipo.git
    echo.
    
    set /p REPO_URL="만드신 레포지토리 주소를 붙여넣기 해주세요: "
    if "!REPO_URL!"=="" (
        echo 주소가 입력되지 않아 종료합니다.
        pause
        exit /b
    )
    
    echo.
    echo [알림] Git 초기화 및 연결을 시도합니다...
    git init
    git branch -M main
    
    :: 리모트 추가 시도 (이미 있으면 주소 변경)
    git remote add origin !REPO_URL! 2>nul
    if %ERRORLEVEL% NEQ 0 (
        git remote set-url origin !REPO_URL!
    )
)

:: 3. 배포 도구 설치 (gh-pages)
IF NOT EXIST "node_modules\gh-pages" (
    echo.
    echo [알림] 배포 도구 gh-pages 를 설치합니다...
    call npm install gh-pages --save-dev
)

:: 4. 소스 코드 업로드 (전체 백업)
echo.
echo [알림] GitHub에 소스 코드를 업로드합니다...
git add .
git commit -m "Update: %date% %time%"
git push origin main

:: 5. 배포 시작
echo.
echo ==========================================
echo       GitHub Pages로 배포를 시작합니다
echo ==========================================
echo.
echo [주의] 로그인 창이 뜨면 로그인을 해주세요.
echo.

call npm run deploy

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo [성공] 배포가 완료되었습니다!
    echo.
    echo 잠시 후 1~5분 뒤 GitHub 레포지토리 설정 - Pages에서 주소를 확인할 수 있습니다.
    echo 예상 주소: https://[사용자명].github.io/Hipo/
) ELSE (
    echo.
    echo [오류] 배포 중 문제가 발생했습니다.
    echo GitHub Desktop 프로그램을 열어서 직접 'Push' 하시는 것이 더 빠를 수 있습니다.
)

pause
