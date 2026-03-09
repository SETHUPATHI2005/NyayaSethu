"""NyayaMithra FastAPI app with auth, chat, document generation, and legal aid search."""
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import secrets
from typing import Any, Dict, List, Literal, Optional

import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from llm_service import LLMService
from rag_service import RAGService


app = FastAPI(
    title="NyayaMithra API",
    description="AI-powered legal guidance API for India",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").strip()
cors_origins = ["*"] if allowed_origins == "*" else [o.strip() for o in allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = RAGService()
llm_service = LLMService()

LANGUAGE_LABELS = {
    "en": "English",
    "as": "Assamese",
    "bn": "Bengali",
    "brx": "Bodo",
    "doi": "Dogri",
    "gu": "Gujarati",
    "hi": "Hindi",
    "kn": "Kannada",
    "ks": "Kashmiri",
    "kok": "Konkani",
    "mai": "Maithili",
    "ml": "Malayalam",
    "mni": "Manipuri",
    "mr": "Marathi",
    "ne": "Nepali",
    "or": "Odia",
    "pa": "Punjabi",
    "sa": "Sanskrit",
    "sat": "Santali",
    "sd": "Sindhi",
    "ta": "Tamil",
    "te": "Telugu",
    "ur": "Urdu",
}


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    language: str = "en"
    history: List[ChatHistoryItem] = Field(default_factory=list)
    user_location: Optional[str] = None


class DocumentRequest(BaseModel):
    template: str
    fields: Dict[str, Any] = Field(default_factory=dict)
    language: str = "en"


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=6, max_length=200)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=6, max_length=200)


USERS_FILE = Path("users.json")


LEGAL_AID_RESULTS = [
    {
        "type": "legal_aid",
        "name": "District Legal Services Authority",
        "addr": "Court Complex, Civil Lines",
        "hours": "Mon-Sat, 10am-5pm",
        "extra": "Free services",
        "phone": "15100",
        "dist": "2.1 km",
    },
    {
        "type": "women",
        "name": "One Stop Centre (Sakhi)",
        "addr": "Government Hospital Premises",
        "hours": "24x7",
        "extra": "Free and confidential support",
        "phone": "181",
        "dist": "1.2 km",
    },
    {
        "type": "labour",
        "name": "Office of Labour Commissioner",
        "addr": "Industrial Area, Sector 4",
        "hours": "Mon-Fri, 9:30am-5:30pm",
        "extra": "Labour disputes and wage claims",
        "phone": "14567",
        "dist": "3.4 km",
    },
    {
        "type": "consumer",
        "name": "District Consumer Disputes Redressal Commission",
        "addr": "Near Civil Court, Main Road",
        "hours": "Mon-Sat, 10am-4pm",
        "extra": "Consumer complaint filing support",
        "phone": "1800114000",
        "dist": "4.8 km",
    },
    {
        "type": "police",
        "name": "District Police Headquarters",
        "addr": "Police Lines, Main Road",
        "hours": "24x7",
        "extra": "Emergency response",
        "phone": "100",
        "dist": "5.0 km",
    },
]


def _load_users() -> Dict[str, Dict[str, str]]:
    if not USERS_FILE.exists():
        return {}
    try:
        with USERS_FILE.open("r", encoding="utf-8") as fp:
            data = json.load(fp)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_users(users: Dict[str, Dict[str, str]]) -> None:
    with USERS_FILE.open("w", encoding="utf-8") as fp:
        json.dump(users, fp, ensure_ascii=False, indent=2)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def _build_suggested_actions(answer: str) -> List[Dict[str, str]]:
    a = answer.lower()
    actions: List[Dict[str, str]] = []
    if any(k in a for k in ["termination", "wage", "labour", "dismiss"]):
        actions.append(
            {
                "type": "document",
                "label": "Generate labour complaint",
                "template": "wrongful_termination",
            }
        )
    if any(k in a for k in ["consumer", "refund", "defective", "fraud"]):
        actions.append(
            {
                "type": "document",
                "label": "Generate consumer complaint",
                "template": "consumer_complaint",
            }
        )
    if any(
        k in a
        for k in [
            "cyber",
            "online fraud",
            "upi fraud",
            "phishing",
            "otp",
            "identity theft",
            "hacking",
            "cybercrime",
            "it act",
        ]
    ):
        actions.append(
            {
                "type": "document",
                "label": "Generate cybercrime complaint",
                "template": "online_fraud",
            }
        )
    actions.append({"type": "aid", "label": "Find legal aid near you", "template": ""})
    return actions[:3]


def _generate_document_text(template: str, fields: Dict[str, Any], language: str) -> str:
    today = datetime.now().strftime("%d %B %Y")
    lines = [f"Date: {today}", "", f"Template: {template}", ""]
    lines.append("Details:")
    for key, value in fields.items():
        cleaned = str(value).strip()
        if cleaned:
            lines.append(f"- {key}: {cleaned}")
    lines.extend(
        [
            "",
            "Declaration:",
            "I state that the above information is true to the best of my knowledge.",
            "",
            "Signature:",
            fields.get("name", "[Applicant Name]"),
            "",
            f"Language requested: {language}",
        ]
    )
    return "\n".join(lines)


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/laws/coverage")
def laws_coverage() -> Dict[str, Any]:
    return rag_service.get_coverage_stats()


@app.post("/api/auth/register")
def register(req: RegisterRequest) -> JSONResponse:
    email = _normalize_email(req.email)
    users = _load_users()
    if email in users:
        return JSONResponse(
            {"success": False, "message": "Email already registered."},
            status_code=409,
        )

    salt = secrets.token_hex(16)
    users[email] = {
        "full_name": req.full_name.strip(),
        "email": email,
        "salt": salt,
        "password_hash": _hash_password(req.password, salt),
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _save_users(users)
    return JSONResponse(
        {"success": True, "message": "Registration successful.", "user": {"full_name": users[email]["full_name"], "email": email}}
    )


@app.post("/api/auth/login")
def login(req: LoginRequest) -> JSONResponse:
    email = _normalize_email(req.email)
    users = _load_users()
    user = users.get(email)
    if not user:
        return JSONResponse(
            {"success": False, "message": "Invalid email or password."},
            status_code=401,
        )

    expected = user.get("password_hash", "")
    computed = _hash_password(req.password, user.get("salt", ""))
    if computed != expected:
        return JSONResponse(
            {"success": False, "message": "Invalid email or password."},
            status_code=401,
        )

    return JSONResponse(
        {
            "success": True,
            "message": "Login successful.",
            "user": {"full_name": user.get("full_name", ""), "email": email},
        }
    )


@app.post("/api/chat")
def chat(req: ChatRequest) -> JSONResponse:
    context = rag_service.retrieve(req.message, top_k=5)
    history_text = "\n".join(
        f"{'User' if item.role == 'user' else 'Assistant'}: {item.content}"
        for item in req.history[-10:]
    )
    answer, laws_cited, confidence = llm_service.generate_answer(
        question=req.message,
        context=context,
        history=history_text,
        user_location=req.user_location,
        response_language=LANGUAGE_LABELS.get(req.language, "English"),
    )
    return JSONResponse(
        {
            "answer": answer,
            "laws_cited": laws_cited,
            "suggested_actions": _build_suggested_actions(answer),
            "confidence": round(float(confidence), 2),
        }
    )


@app.post("/api/document/generate")
def generate_document(req: DocumentRequest) -> Dict[str, str]:
    document = _generate_document_text(req.template, req.fields, req.language)
    return {"document": document}


@app.get("/api/legal-aid/search")
def search_legal_aid(
    location: str = Query(..., min_length=2),
    type: str = Query("all"),
) -> Dict[str, Any]:
    if type == "all":
        results = LEGAL_AID_RESULTS
    else:
        results = [item for item in LEGAL_AID_RESULTS if item["type"] == type]
    return {"location": location, "results": results}


app.mount("/", StaticFiles(directory=".", html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

