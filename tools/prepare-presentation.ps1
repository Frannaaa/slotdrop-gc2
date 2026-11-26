param([switch]$NoBrowser, [switch]$SkipLiveProbe, [switch]$OpenCode,
      [ValidateRange(1,65535)][int]$LocalPort = 3000)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localBase = "http://127.0.0.1:$LocalPort"
$liveBase = 'https://slotdrop-gc2-group-zx8j.onrender.com'
$stateDirectory = Join-Path $projectRoot '.local-data'
New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null

try { $health = Invoke-RestMethod -Uri "$localBase/api/health" -TimeoutSec 3 }
catch { $health = $null }
if ($null -eq $health) {
    $nodePath = (Get-Command node -ErrorAction Stop).Source
    $demoPath = Join-Path $projectRoot 'tools\demo.mjs'
    $previousPort = $env:PORT
    try {
        $env:PORT = [string]$LocalPort
        $startedServer = Start-Process -FilePath $nodePath -ArgumentList ('"{0}"' -f $demoPath) -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $stateDirectory 'presentation-server.log') -RedirectStandardError (Join-Path $stateDirectory 'presentation-server-error.log')
    } finally { $env:PORT = $previousPort }
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($startedServer.HasExited) { break }
        Start-Sleep -Milliseconds 500
        try { $health = Invoke-RestMethod -Uri "$localBase/api/health" -TimeoutSec 2; break }
        catch { $health = $null }
    }
}
if ($health.app -ne 'SlotDrop' -or $health.status -ne 'ok') {
    if ($startedServer -and -not $startedServer.HasExited) { $startedServer | Stop-Process }
    throw "The local SlotDrop backup could not be reached on port $LocalPort. Check .local-data/presentation-server-error.log or run npm run demo in your own terminal. Only a server started by this invocation is stopped on startup failure."
}
Push-Location $projectRoot
try {
    & node tools/check-gc2-readiness.mjs $localBase
    if ($LASTEXITCODE -ne 0) { throw 'Local read-only readiness checks did not pass.' }
} finally { Pop-Location }

$liveWarm = $false
if (-not $SkipLiveProbe) {
    try {
        $live = Invoke-RestMethod -Uri "$liveBase/api/health" -TimeoutSec 90
        $liveWarm = $live.status -eq 'ok' -and $live.app -eq 'SlotDrop'
    } catch { Write-Warning 'The live warm-up could not be confirmed. The checked local backup is ready.' }
}
$status = [pscustomobject]@{
    CheckedAt = (Get-Date).ToUniversalTime().ToString('o')
    LocalBase = $localBase
    LocalReadOnlyChecksPassed = $true
    LiveWarmConfirmed = $liveWarm
    LiveProbeSkipped = [bool]$SkipLiveProbe
    ReleaseNote = 'Use the reviewed integrated release for the defense. This local snapshot does not prove the countdown/conversion is integrated.'
}
$status | Format-List

if (-not $NoBrowser) {
    $chosenBase = if ($liveWarm) { $liveBase } else { $localBase }
    Start-Process "$chosenBase/"
    Start-Process "$chosenBase/owner.html"
}
if ($OpenCode) {
    $codePath = Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\bin\code.cmd'
    if (Test-Path -LiteralPath $codePath) {
        & $codePath --reuse-window $projectRoot (Join-Path $projectRoot 'server\services\holds.js') (Join-Path $projectRoot 'server\repositories\slots.js') (Join-Path $projectRoot 'server\services\bookings.js')
    } else { Write-Warning 'VS Code CLI was not found; open the three source files manually.' }
}
