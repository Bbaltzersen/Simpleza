@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

REM --- Configuration ---
SET "SOURCE_PARENT_FOLDER=simp-database-init"
SET "MODELS_SUBFOLDER_NAME=models"
REM Add other folders to exclude (space-separated, case-insensitive check below)
SET "EXCLUDE_FOLDERS= %SOURCE_PARENT_FOLDER% .git .vscode __pycache__ "
REM ---------------------

REM Get the directory where this batch script is located (Project Root)
SET "PROJECT_ROOT=%~dp0"
REM Remove trailing backslash from project root if it exists
IF "%PROJECT_ROOT:~-1%"=="\" SET "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

ECHO Project Root: %PROJECT_ROOT%

REM Define the source models directory path
SET "SOURCE_MODELS_DIR=%PROJECT_ROOT%\%SOURCE_PARENT_FOLDER%\%MODELS_SUBFOLDER_NAME%"

REM Check if the source models directory exists
IF NOT EXIST "%SOURCE_MODELS_DIR%\" (
    ECHO Error: Source directory not found: %SOURCE_MODELS_DIR%
    EXIT /B 1
)

ECHO Source Models Directory: %SOURCE_MODELS_DIR%
ECHO ---------------------------------------------

SET synchronized_count=0

REM Iterate through directories in the project root
FOR /D %%d IN ("%PROJECT_ROOT%\*") DO (
    SET "FOLDER_NAME=%%~nxd"
    SET "CURRENT_FOLDER_PATH=%%d"

    REM Check if the current folder should be excluded (case-insensitive)
    SET "EXCLUDE=FALSE"
    ECHO !EXCLUDE_FOLDERS! | FIND /I " !FOLDER_NAME! " > NUL
    IF !ERRORLEVEL! == 0 SET "EXCLUDE=TRUE"

    IF "!EXCLUDE!"=="FALSE" (
        ECHO Checking target folder: !FOLDER_NAME!

        REM Define the potential target models directory path
        SET "TARGET_MODELS_DIR=!CURRENT_FOLDER_PATH!\!MODELS_SUBFOLDER_NAME!"

        REM --- Synchronization Logic ---
        REM 1. Delete the existing target models directory if it exists
        IF EXIST "!TARGET_MODELS_DIR!\" (
            ECHO   - Removing existing target: !TARGET_MODELS_DIR!
            RMDIR /S /Q "!TARGET_MODELS_DIR!"
            IF ERRORLEVEL 1 (
                ECHO   - Error removing !TARGET_MODELS_DIR! - Check permissions or locks.
            ) ELSE (
                REM 2. Copy the source models directory to the target location (only if remove was successful or dir didn't exist)
                ECHO   - Copying source to: !TARGET_MODELS_DIR!
                XCOPY "%SOURCE_MODELS_DIR%" "!TARGET_MODELS_DIR!\" /E /I /Y /Q /H /K > NUL
                IF ERRORLEVEL 1 (
                     ECHO   - Error copying source to !TARGET_MODELS_DIR!
                ) ELSE (
                    ECHO   - Successfully synchronized !FOLDER_NAME!\!MODELS_SUBFOLDER_NAME!
                    SET /A synchronized_count+=1
                )
            )
        ) 
        
        IF NOT EXIST "!TARGET_MODELS_DIR!\" (
             REM Target didn't exist, just copy
             ECHO   - Target models folder does not exist. Creating and copying...
             ECHO   - Copying source to: !TARGET_MODELS_DIR!
             XCOPY "%SOURCE_MODELS_DIR%" "!TARGET_MODELS_DIR!\" /E /I /Y /Q /H /K > NUL
             IF ERRORLEVEL 1 (
                 ECHO   - Error copying source to !TARGET_MODELS_DIR!
             ) ELSE (
                 ECHO   - Successfully synchronized !FOLDER_NAME!\!MODELS_SUBFOLDER_NAME!
                 SET /A synchronized_count+=1
             )
        )
        ECHO   ----------
    )
)

ECHO ---------------------------------------------
ECHO Synchronization complete. !synchronized_count! target(s) updated.

ENDLOCAL
EXIT /B 0