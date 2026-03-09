param(
  [int]$Port = 8000,
  [switch]$NoInstall,
  [switch]$Reload,
  [switch]$SkipLawsBuild,
  [switch]$ForceLawsRefresh,
  [int]$LawsRefreshDays = 7,
  [int]$LawsMaxDocs = 200,
  [string]$TranslateLangs = "",
  [int]$TranslateMaxRecords = 0
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

function Ensure-LawsDataset {
  param(
    [string]$PythonExe
  )

  if ($SkipLawsBuild) {
    Write-Step "Skipping laws dataset build (--SkipLawsBuild)"
    return
  }

  $builder = "build_indian_laws_dataset.py"
  if (-not (Test-Path $builder)) {
    Write-Host "Dataset builder not found: $builder. Continuing startup without auto-build." -ForegroundColor Yellow
    return
  }

  $dataDir = "data"
  $datasetPath = Join-Path $dataDir "indian_laws_en.json"
  $shouldBuild = $ForceLawsRefresh -or -not (Test-Path $datasetPath)

  if (-not $shouldBuild) {
    $lastWrite = (Get-Item $datasetPath).LastWriteTime
    $staleCutoff = (Get-Date).AddDays(-1 * $LawsRefreshDays)
    if ($lastWrite -lt $staleCutoff) {
      $shouldBuild = $true
    }
  }

  if (-not $shouldBuild) {
    Write-Step "Laws dataset is up to date: $datasetPath"
    return
  }

  Write-Step "Building laws dataset from government portals"
  $args = @(
    $builder,
    "--max-docs", "$LawsMaxDocs"
  )

  if ($TranslateLangs -and $TranslateLangs.Trim().Length -gt 0) {
    $args += @("--translate-langs", $TranslateLangs.Trim())
  }

  if ($TranslateMaxRecords -gt 0) {
    $args += @("--translate-max-records", "$TranslateMaxRecords")
  }

  & $PythonExe @args
  if ($LASTEXITCODE -ne 0) {
    throw "Laws dataset build failed with exit code $LASTEXITCODE."
  }
}

New-VenvIfMissing
$pythonExe = (Resolve-Path ".venv\Scripts\python.exe").Path

if (-not $NoInstall) {
  Write-Step "Installing dependencies"
  & $pythonExe -m pip install --upgrade pip
  & $pythonExe -m pip install -r requirements.txt
}

Ensure-LawsDataset -PythonExe $pythonExe

Write-Step "Starting API server on http://127.0.0.1:$Port"
if ($Reload) {
  & $pythonExe -m uvicorn main:app --host 127.0.0.1 --port $Port --loop asyncio --reload
} else {
  & $pythonExe -m uvicorn main:app --host 127.0.0.1 --port $Port --loop asyncio
}
