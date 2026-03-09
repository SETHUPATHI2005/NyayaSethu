# ⚖️ NyayaMithra — AI Legal Guidance for India

AI-powered legal assistance for every Indian citizen. Free, multilingual, always available.

---

## 📁 Project Structure

```
legalai/
├── frontend/                   # Plain HTML/CSS/JS
│   ├── index.html              # Landing page
│   ├── chat.html               # AI chat interface
│   ├── document.html           # Legal document generator
│   ├── aid.html                # Nearby legal aid finder
│   ├── css/
│   │   ├── global.css          # Shared styles, nav, buttons
│   │   ├── landing.css         # Landing page styles
│   │   ├── chat.css            # Chat interface styles
│   │   ├── document.css        # Document generator styles
│   │   └── aid.css             # Legal aid finder styles
│   └── js/
│       ├── nav.js              # Navigation behaviour
│       ├── landing.js          # Landing page animations
│       ├── chat.js             # Chat + voice + API calls
│       ├── document.js         # Document templates + generator
│       └── aid.js              # Aid search + map
│
└── backend/                    # FastAPI Python
    ├── main.py                 # App entry point
    ├── requirements.txt
    ├── .env.example            # Copy to .env and fill keys
    ├── routers/
    │   ├── chat.py             # POST /api/chat
    │   ├── document.py         # POST /api/document/generate
    │   ├── legal_aid.py        # GET  /api/legal-aid/search
    │   └── health.py           # GET  /api/health
    ├── models/
    │   └── schemas.py          # Pydantic request/response models
    ├── services/
    │   ├── rag_service.py      # Vector search (FAISS) + keyword fallback
    │   ├── llm_service.py      # Hugging Face / OpenAI / rule-based
    │   ├── language_service.py # Language detection + translation
    │   ├── document_service.py # 13 legal document templates
    │   └── legal_aid_service.py# Legal aid search (Google Places / seed)
    └── data/
        └── (place .json knowledge base files here)
```

---

## 🚀 Quick Start

### Windows one-command setup + run

```powershell
.\start.bat
```

This will automatically:
- create `.venv` if missing
- install/update dependencies from `requirements.txt`
- auto-build/refresh `data/indian_laws_en.json` from government portals when missing or stale
- start the app on `http://127.0.0.1:8000`

Optional flags:

```powershell
.\start.bat -NoInstall
.\start.bat -Reload
.\start.bat -Port 9000
.\start.bat -ForceLawsRefresh
.\start.bat -SkipLawsBuild
.\start.bat -TranslateLangs hi,bn,ta,te,mr,gu,kn,ml,or,pa,ur -TranslateMaxRecords 500
.\start.bat -EnableOfflineLanguages
.\start.bat -EnableOfflineLanguages -OfflineLangs hi,bn,ta,te,mr,gu,kn,ml,or,pa,ur
.\start.bat -EnableOfflineLanguages -ForceOfflinePackInstall
```

### Deploy Backend on Fly.io

```bash
# Install and login once
fly auth login

# Create app (if not already created)
fly launch --no-deploy

# Set Netlify frontend origin for CORS
fly secrets set ALLOWED_ORIGINS=https://nyayamithra.netlify.app

# Deploy
fly deploy
```

After deploy, update frontend backend URL once:

`https://nyayamithra.netlify.app/?api=https://<your-fly-app>.fly.dev`

### 1. Frontend (no build needed)

```bash
# Serve with any static server:
cd frontend
python -m http.server 3000
# Open http://localhost:3000
```

Or with VS Code **Live Server** extension.

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/api/docs**

---

## 🔑 API Keys Required

| Key | Purpose | Get it |
|-----|---------|--------|
| `HF_API_TOKEN` | LLM inference (Hugging Face) | https://huggingface.co/settings/tokens |
| `GOOGLE_MAPS_API_KEY` | Legal aid map search | Google Cloud Console |
| `OPENAI_API_KEY` | Optional OpenAI fallback | https://platform.openai.com |

> **Without keys:** The app works in fallback mode — RAG keyword search + rule-based answers + demo map data. All 4 pages are fully functional.

---

## 🧠 RAG Pipeline

To enable full vector search:

```bash
pip install faiss-cpu sentence-transformers
```

Add legal knowledge JSON files to `backend/data/`:

```json
[
  {
    "text": "Under Section 25F of the Industrial Disputes Act...",
    "source": "Industrial Disputes Act, 1947 — Section 25F",
    "topic": "labour",
    "acts": ["Industrial Disputes Act, 1947"]
  }
]
```

The RAG service auto-loads all `.json` files from `data/` on startup and builds a FAISS index.

---

## 📚 Build Full Indian Laws Dataset

To ingest laws from:
- `https://www.mha.gov.in/en/acts`
- `https://www.legislative.gov.in/`

Run:

```bash
python build_indian_laws_dataset.py --max-docs 200
```

This writes:
- `data/indian_laws_en.json` (English corpus)

Optional multilingual export (uses OpenAI translation API):

```bash
# Set key first
export OPENAI_API_KEY=your_key_here     # Windows PowerShell: $env:OPENAI_API_KEY="your_key_here"

python build_indian_laws_dataset.py \
  --max-docs 200 \
  --translate-langs hi,bn,ta,te,mr,gu,kn,ml,or,pa,ur \
  --translate-max-records 500
```

Additional controls:
- `--chunk-chars 2200` and `--overlap-chars 250` tune chunking for RAG.
- `--sleep 0.25` adds polite delay between downloads.
- `--translate-max-records` helps control translation cost.

After files are generated, restart backend and it will auto-load these JSON files from `data/`.

---

## 🌐 Multilingual Support

- Language **detection** is automatic (googletrans)
- **22 Indian languages** supported for voice input (Web Speech API)
- **Response translation** via Google Translate (free tier)
- For production: switch to **Azure Translator** or **DeepL** for accuracy

### Offline Language Mode

NyayaMithra now supports offline-first translation for chat responses using Argos Translate.

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Install offline language packs once (requires internet only during installation):

```bash
python install_offline_language_packs.py --langs hi,bn,ta,te,mr,gu,kn,ml,or,pa,ur
```

3. Force offline translation mode:

```bash
# Windows PowerShell
$env:TRANSLATION_MODE="offline"
.\start.bat
```

Automated option:

```powershell
.\start.bat -EnableOfflineLanguages
```

This automatically:
- sets `TRANSLATION_MODE=offline`
- installs only missing local language packs
- stores a marker in `data/offline_packs_marker.json` to skip repeated installs

Modes:
- `offline`: only local Argos translation (no network translation fallback)
- `hybrid` (default): local Argos first, then online fallback if local pack missing
- `online`: use online translator only

---

## 📄 Document Templates (13 total)

| Category | Templates |
|----------|-----------|
| Labour | Wrongful Termination, Unpaid Wages, PF/ESI Grievance, Maternity Leave |
| Consumer | Consumer Court Complaint, Refund Notice, Online Fraud Complaint |
| Women's Rights | Domestic Violence Application, POSH Complaint |
| RTI & Civic | RTI Application, Police Complaint/FIR |
| Property | Eviction Notice, Rent Dispute |

---

## 🗺 Legal Aid Finder

- Uses **Google Places API** for live nearby results
- Falls back to curated **national database** of legal aid centres
- Filter by type: Legal Aid / Labour / Consumer / Women / Police
- Emergency helplines always shown (no API needed)

---

## 🔧 Production Deployment

```bash
# Backend — Gunicorn + Uvicorn workers
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend — Nginx static serving
# Point nginx root to frontend/ directory
# Update API_BASE in js/ files to your production domain
```

---

## ⚠️ Legal Disclaimer

NyayaMithra provides **legal information**, not legal advice. For complex legal matters, consult a qualified advocate. Contact **NALSA** (National Legal Services Authority) at **15100** for free professional legal aid.

