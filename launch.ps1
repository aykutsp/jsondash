param(
  [ValidateSet("React", "Angular", "Flask", "WPF")]
  [string]$Stack
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Select-Stack {
  Write-Host ""
  Write-Host "jsondash baslatiliyor" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. React"
  Write-Host "2. Angular"
  Write-Host "3. Flask"
  Write-Host "4. WPF"
  Write-Host ""

  do {
    $choice = Read-Host "Bir secenek girin (1-4)"
  } until ($choice -in @("1", "2", "3", "4"))

  switch ($choice) {
    "1" { return "React" }
    "2" { return "Angular" }
    "3" { return "Flask" }
    "4" { return "WPF" }
  }
}

function Ensure-NodeProject {
  param([string]$ProjectPath)

  $nodeModulesPath = Join-Path $ProjectPath "node_modules"
  $packageJsonPath = Join-Path $ProjectPath "package.json"
  $packageLockPath = Join-Path $ProjectPath "package-lock.json"
  $needsInstall = -not (Test-Path $nodeModulesPath)

  if (-not $needsInstall -and Test-Path $packageLockPath) {
    $packageJsonTime = (Get-Item $packageJsonPath).LastWriteTimeUtc
    $packageLockTime = (Get-Item $packageLockPath).LastWriteTimeUtc
    $needsInstall = $packageJsonTime -gt $packageLockTime
  }

  if (-not $needsInstall -and -not (Test-Path $packageLockPath)) {
    $needsInstall = $true
  }

  if ($needsInstall) {
    Push-Location $ProjectPath
    try {
      npm install
    }
    finally {
      Pop-Location
    }
  }
}

function Start-ReactApp {
  $projectPath = Join-Path $root "react"
  Ensure-NodeProject -ProjectPath $projectPath
  Push-Location $projectPath
  try {
    npm run dev -- --host 0.0.0.0
  }
  finally {
    Pop-Location
  }
}

function Start-AngularApp {
  $projectPath = Join-Path $root "angular"
  Ensure-NodeProject -ProjectPath $projectPath
  Push-Location $projectPath
  try {
    npm run live-demo
  }
  finally {
    Pop-Location
  }
}

function Start-FlaskApp {
  $projectPath = Join-Path $root "flask"
  $venvPath = Join-Path $projectPath ".venv"
  $pythonPath = Join-Path $venvPath "Scripts\\python.exe"
  $requirementsPath = Join-Path $projectPath "requirements.txt"
  $stampPath = Join-Path $venvPath ".jsondash-ready"
  $needsInstall = -not (Test-Path $pythonPath)

  if (-not $needsInstall -and Test-Path $stampPath) {
    $requirementsTime = (Get-Item $requirementsPath).LastWriteTimeUtc
    $stampTime = (Get-Item $stampPath).LastWriteTimeUtc
    $needsInstall = $requirementsTime -gt $stampTime
  }

  if (-not $needsInstall -and -not (Test-Path $stampPath)) {
    $needsInstall = $true
  }

  if ($needsInstall) {
    Push-Location $projectPath
    try {
      if (-not (Test-Path $pythonPath)) {
        python -m venv .venv
      }

      & $pythonPath -m pip install --upgrade pip
      & $pythonPath -m pip install -r requirements.txt
      Set-Content -Path $stampPath -Value "ready" -NoNewline
    }
    finally {
      Pop-Location
    }
  }

  Push-Location $projectPath
  try {
    & $pythonPath app.py
  }
  finally {
    Pop-Location
  }
}

function Start-WpfApp {
  $projectPath = Join-Path $root "wpf"
  Push-Location $projectPath
  try {
    dotnet run
  }
  finally {
    Pop-Location
  }
}

if (-not $Stack) {
  $Stack = Select-Stack
}

switch ($Stack) {
  "React" { Start-ReactApp }
  "Angular" { Start-AngularApp }
  "Flask" { Start-FlaskApp }
  "WPF" { Start-WpfApp }
}
