# ⚖️ NyayaSethu — AI Legal Guidance for India

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
- start the app on `http://127.0.0.1:8000`

Optional flags:

```powershell
.\start.bat -NoInstall
.\start.bat -Reload
.\start.bat -Port 9000
```

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

## 🌐 Multilingual Support

- Language **detection** is automatic (googletrans)
- **22 Indian languages** supported for voice input (Web Speech API)
- **Response translation** via Google Translate (free tier)
- For production: switch to **Azure Translator** or **DeepL** for accuracy

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

NyayaSethu provides **legal information**, not legal advice. For complex legal matters, consult a qualified advocate. Contact **NALSA** (National Legal Services Authority) at **15100** for free professional legal aid.

