@echo off
setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

if not defined JAVA_HOME goto fail

set JAVA_EXE=%JAVA_HOME%/bin/java.exe
if not exist "%JAVA_EXE%" goto fail

@rem Setup the command line
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

goto end

:fail
if not defined JAVA_HOME echo ERROR: JAVA_HOME is not set
echo Please set the JAVA_HOME variable to match your Java installation location
goto end

:end
endlocal
