@echo off
echo Starting leagues data fetch...
echo.

echo Fetching Fotmob leagues...
node fetch-fotmob-leagues.js
if %errorlevel% neq 0 (
    echo Error fetching Fotmob leagues
    pause
    exit /b 1
)

echo.
echo Fetching Unibet leagues...
node fetch-unibet-leagues.js
if %errorlevel% neq 0 (
    echo Error fetching Unibet leagues
    pause
    exit /b 1
)

echo.
echo All leagues data fetched successfully!
echo Check the generated JSON files in this directory.
pause
