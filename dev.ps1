param(
  [int]$Port = 8000,
  [switch]$NoInstall,
  [switch]$Reload
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Resolve-PythonLauncher {
  if (Get-Command py -ErrorAction SilentlyContinue) {
    return "py"
  }
  if (Get-Command python -ErrorAction SilentlyContinue) {
    return "python"
  }
  throw "Python launcher not found. Install Python 3.12+ first."
}

function New-VenvIfMissing {
  if (Test-Path ".venv\Scripts\python.exe") {
    return
  }

  Write-Step "Creating virtual environment (.venv)"
  $launcher = Resolve-PythonLauncher

  if ($launcher -eq "py") {
    try {
      & py -3.12 -m venv .venv
      return
    } catch {
      Write-Host "Python 3.12 not found via py launcher. Falling back to default python." -ForegroundColor Yellow
      & py -m venv .venv
      return
    }
  }

  & python -m venv .venv
}

New-VenvIfMissing
$pythonExe = (Resolve-Path ".venv\Scripts\python.exe").Path

if (-not $NoInstall) {
  Write-Step "Installing dependencies"
  & $pythonExe -m pip install --upgrade pip
  & $pythonExe -m pip install -r requirements.txt
}

Write-Step "Starting API server on http://127.0.0.1:$Port"
if ($Reload) {
  & $pythonExe -m uvicorn main:app --host 127.0.0.1 --port $Port --loop asyncio --reload
} else {
  & $pythonExe -m uvicorn main:app --host 127.0.0.1 --port $Port --loop asyncio
}
