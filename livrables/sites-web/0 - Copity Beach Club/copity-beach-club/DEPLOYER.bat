@echo off
echo Deploiement Copity Beach Club vers Vercel...
echo.
powershell -ExecutionPolicy Bypass -Command "npx vercel --prod"
echo.
echo Termine. Appuie sur une touche pour fermer.
pause > nul
