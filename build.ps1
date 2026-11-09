# build.ps1
$ErrorActionPreference = 'Stop'

try {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if (-not $isAdmin) {
        Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
        $argList = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit", "-File", "`"$PSCommandPath`"")
        Start-Process powershell.exe -ArgumentList $argList -Verb RunAs
        Exit
    }

    Set-Location -Path $PSScriptRoot

    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "              Compiling AI_report" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan

    $source = "ai_report.cpp"
    $target = "ai_report.exe"
    # 注意这里：去掉了 -lwininet，加上了 -liphlpapi
    $libs = "-lole32 -loleaut32 -luuid -lwbemuuid -lshell32 -lcurl -liphlpapi"

    Write-Host "g++ is compiling, please wait..." -ForegroundColor Yellow
    $compileProcess = Start-Process -FilePath "g++" -ArgumentList "-std=c++20 `"$source`" -o `"$target`" $libs" -NoNewWindow -Wait -PassThru

    if ($compileProcess.ExitCode -eq 0) {
        Write-Host "`n[BUILD SUCCESS] Starting program...`n" -ForegroundColor Green
        & ".\$target"
    } else {
        Write-Host "`n[BUILD FAILED] Check g++ error messages above." -ForegroundColor Red
    }
} catch {
    Write-Host "`n[ERROR] Exception occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    Write-Host "`nPress Enter to close this window..." -ForegroundColor DarkGray
    $null = Read-Host
}