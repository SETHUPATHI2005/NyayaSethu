"""
LLM integration (Hugging Face + OpenAI-compatible fallback).
"""
import logging
import os
import re
from typing import Dict, List, Tuple

import requests

logger = logging.getLogger(__name__)

HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL_ID}"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
TRANSLATION_MODE = os.getenv("TRANSLATION_MODE", "hybrid").strip().lower()

SYSTEM_PROMPT = """You are NyayaSethu, an AI legal assistant specialising in Indian law.
Your role is to help ordinary citizens understand their legal rights and options.

Guidelines:
- Answer clearly and simply. Avoid legal jargon.
- Always cite the specific Act and Section where possible.
- Include punishment and fine details where available from the provided legal context.
- Provide practical next steps.
- If uncertain, say so and recommend consulting a lawyer.
- Keep answers concise (3-5 paragraphs).
- Respond in the requested language.

You provide legal information, not legal advice.
"""

LANGUAGE_TO_CODE = {
    "English": "en",
    "Assamese": "as",
    "Bengali": "bn",
    "Bodo": "hi",
    "Dogri": "hi",
    "Gujarati": "gu",
    "Hindi": "hi",
    "Kannada": "kn",
    "Kashmiri": "ur",
    "Konkani": "hi",
    "Maithili": "hi",
    "Malayalam": "ml",
    "Manipuri": "bn",
    "Marathi": "mr",
    "Nepali": "ne",
    "Odia": "or",
    "Punjabi": "pa",
    "Sanskrit": "hi",
    "Santali": "hi",
    "Sindhi": "ur",
    "Tamil": "ta",
    "Telugu": "te",
    "Urdu": "ur",
}


PENALTY_GUIDE = {
    "Bharatiya Nyaya Sanhita, 2023": [
        "BNS Section 103 (murder): punishment may extend to death or imprisonment for life, and fine.",
        "BNS theft provisions (commonly cited in Sections 303-310 range): punishment and fine depend on type/value/circumstances of theft.",
    ],
    "Indian Penal Code, 1860": [
        "IPC Section 300 defines murder; punishment is generally under IPC Section 302: death or life imprisonment, and fine.",
        "IPC Section 378 defines theft; punishment is generally under IPC Section 379: imprisonment up to 3 years, or fine, or both.",
    ],
    "Bharatiya Nagarik Suraksha Sanhita, 2023": [
        "BNSS is primarily procedural; punishments are mainly defined in substantive criminal law (BNS/special Acts).",
    ],
    "Bharatiya Sakshya Adhiniyam, 2023": [
        "BSA is evidentiary; punishments and fines are generally provided under BNS/other substantive laws.",
    ],
    "Consumer Protection Act, 2019": [
        "Consumer forums mainly grant compensation/refund/replacement and corrective directions; statutory penalties vary by contravention and section.",
    ],
    "Industrial Disputes Act, 1947": [
        "Wrongful retrenchment can trigger reinstatement/back wages/compensation; penal consequences depend on specific section violations.",
    ],
    "Payment of Wages Act, 1936": [
        "Delayed/unpaid wages can attract recovery directions and statutory penalties depending on the violation.",
    ],
    "Minimum Wages Act, 1948": [
        "Non-payment of minimum wages can attract imprisonment and/or fine under the Act.",
    ],
    "Protection of Women from Domestic Violence Act, 2005": [
        "Breach of a protection order is punishable (typically imprisonment and/or fine) under the framework linked with criminal law.",
    ],
    "Sexual Harassment of Women at Workplace Act, 2013": [
        "Non-compliance by employer/committee can attract penalties under the Act and service rules.",
    ],
    "Right to Information Act, 2005": [
        "RTI penalty can be imposed on PIO (per-day monetary penalty up to statutory cap) for delay/refusal/mala fide conduct.",
    ],
    "Indian Contract Act, 1872": [
        "Contract Act is primarily civil; remedies are usually damages/compensation/specific relief, not criminal punishment unless other laws apply.",
    ],
}


class LLMService:
    def __init__(self):
        self.use_hf = bool(HF_API_TOKEN)
        self.use_openai = bool(OPENAI_API_KEY)
        self.argos_translate = None
        self._init_offline_translation()
        if self.use_hf:
            logger.info("LLM: Using Hugging Face API - %s", HF_MODEL_ID)
        elif self.use_openai:
            logger.info("LLM: Using OpenAI API")
        else:
            logger.warning("LLM: No API key found. Using rule-based fallback.")

    def _init_offline_translation(self) -> None:
        try:
            import argostranslate.translate as argos_translate

            self.argos_translate = argos_translate
            logger.info("Translation: Argos offline translator available.")
        except Exception:
            self.argos_translate = None
            logger.info("Translation: Argos offline translator not installed.")

    def generate_answer(
        self,
        question: str,
        context: List[Dict],
        history: str = "",
        user_location: str = None,
        response_language: str = "English",
    ) -> Tuple[str, List[str], float]:
        """Returns (answer_text, laws_cited, confidence_score)."""
        if self.use_hf:
            return self._hf_generate(question, context, history, user_location, response_language)
        if self.use_openai:
            return self._openai_generate(question, context, history, user_location, response_language)
        return self._fallback_generate(question, context, response_language)

    def _hf_generate(self, question, context, history, user_location, response_language):
        context_text = self._format_context(context)
        prompt = self._build_prompt(question, context_text, history, user_location, response_language)

        try:
            resp = requests.post(
                HF_API_URL,
                headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 600,
                        "temperature": 0.3,
                        "do_sample": True,
                        "return_full_text": False,
                    },
                },
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()

            if isinstance(data, list) and data:
                answer = data[0].get("generated_text", "").strip()
            elif isinstance(data, dict):
                answer = data.get("generated_text", "").strip()
            else:
                raise ValueError("Unexpected HF response format")

            laws = self._extract_laws(answer)
            confidence = 0.82 if laws else 0.65
            return answer, laws, confidence
        except Exception as exc:
            logger.error("HF API error: %s", exc)
            return self._fallback_generate(question, context)

    def _openai_generate(self, question, context, history, user_location, response_language):
        try:
            import openai

            openai.api_key = OPENAI_API_KEY
            context_text = self._format_context(context)

            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            if history:
                for line in history.strip().split("\n"):
                    if line.startswith("User:"):
                        messages.append({"role": "user", "content": line[5:].strip()})
                    elif line.startswith("Assistant:"):
                        messages.append({"role": "assistant", "content": line[10:].strip()})

            user_msg = (
                f"LEGAL CONTEXT:\n{context_text}\n\n"
                f"RESPONSE LANGUAGE: {response_language}\n\n"
                f"QUESTION: {question}"
            )
            if user_location:
                user_msg += f"\n\nUser is in: {user_location}"
            messages.append({"role": "user", "content": user_msg})

            resp = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.3,
                max_tokens=600,
            )
            answer = resp.choices[0].message.content.strip()
            laws = self._extract_laws(answer)
            return answer, laws, 0.88
        except Exception as exc:
            logger.error("OpenAI API error: %s", exc)
            return self._fallback_generate(question, context)

    def _fallback_generate(self, question: str, context: List[Dict], response_language: str = "English") -> Tuple[str, List[str], float]:
        if not context:
            msg = (
                "I could not find specific information for this legal question. "
                "Please consult a lawyer or call NALSA helpline at 15100 for free legal aid.",
            )
            return self._translate_if_needed(msg, response_language), [], 0.3

        top = context[0]
        text = top.get("text", "")
        source = top.get("source", "")
        acts = top.get("acts", [])

        extra = ""
        if len(context) > 1:
            extra = "\n\nAdditional relevant law: " + context[1].get("text", "")[:300] + "..."

        penalty_notes = self._build_penalty_notes(question, context)
        penalty_block = ""
        if penalty_notes:
            penalty_block = "\n\nPunishment and Fine (indicative):\n- " + "\n- ".join(penalty_notes)

        answer = (
            f"{text}{extra}{penalty_block}\n\nSource: {source}\n\n"
            "Next steps: Contact your nearest Legal Services Authority or call 15100."
        )
        return self._translate_if_needed(answer, response_language), acts, 0.7

    def _format_context(self, context: List[Dict]) -> str:
        if not context:
            return "No specific legal context found."
        parts = []
        for i, item in enumerate(context, 1):
            parts.append(f"[{i}] {item.get('source', '')}\n{item.get('text', '')}")
        return "\n\n".join(parts)

    def _build_prompt(self, question, context_text, history, user_location, response_language):
        loc_note = f"\nUser location: {user_location}" if user_location else ""
        return f"""<s>[INST] {SYSTEM_PROMPT}

LEGAL CONTEXT:
{context_text}
{loc_note}

RESPONSE LANGUAGE: {response_language}

CONVERSATION HISTORY:
{history}

USER QUESTION: {question} [/INST]"""

    def _extract_laws(self, text: str) -> List[str]:
        patterns = [
            r"(?:Section \d+[A-Z]? of )?(?:the )?[A-Z][A-Za-z\s]+ Act,? \d{4}",
            r"(?:Section \d+[A-Z]? of )?(?:the )?Bharatiya [A-Za-z\s]+,? \d{4}",
            r"Article \d+ of the (?:Indian )?Constitution",
            r"IPC Section \d+",
            r"CrPC Section \d+",
            r"BNS Section \d+[A-Z]?",
            r"BNSS Section \d+[A-Z]?",
            r"BSA Section \d+[A-Z]?",
        ]
        found = set()
        for pattern in patterns:
            for match in re.findall(pattern, text):
                found.add(match.strip())
        return list(found)[:5]

    def _build_penalty_notes(self, question: str, context: List[Dict]) -> List[str]:
        q = question.lower()
        notes: List[str] = []

        for item in context:
            for act in item.get("acts", []):
                for key, lines in PENALTY_GUIDE.items():
                    if key.lower() in act.lower():
                        notes.extend(lines)

        # Keyword-level safety net for common criminal queries.
        if any(k in q for k in ["murder", "homicide"]):
            notes.append(
                "For homicide/murder classification, exact punishment depends on proved ingredients and the specific section applied by court."
            )
        if "theft" in q or "stolen" in q:
            notes.append(
                "For theft, punishment/fine vary based on value, aggravating facts, and the exact section invoked."
            )
        if "fir" in q or "arrest" in q:
            notes.append(
                "FIR/arrest provisions are procedural; final punishment flows from charges proved under substantive law."
            )

        # De-duplicate while preserving order.
        seen = set()
        unique = []
        for n in notes:
            if n in seen:
                continue
            seen.add(n)
            unique.append(n)
        return unique[:5]

    def _translate_if_needed(self, text: str, response_language: str) -> str:
        lang_code = LANGUAGE_TO_CODE.get(response_language, "en")
        if lang_code == "en":
            return text
        if TRANSLATION_MODE in {"offline", "hybrid"}:
            translated = self._translate_offline(text, from_code="en", to_code=lang_code)
            if translated:
                return translated
            if TRANSLATION_MODE == "offline":
                return text
        if TRANSLATION_MODE == "offline":
            return text
        try:
            resp = requests.get(
                "https://translate.googleapis.com/translate_a/single",
                params={
                    "client": "gtx",
                    "sl": "auto",
                    "tl": lang_code,
                    "dt": "t",
                    "q": text,
                },
                timeout=12,
            )
            resp.raise_for_status()
            data = resp.json()
            translated = "".join(part[0] for part in data[0] if part and part[0])
            return translated or text
        except Exception as exc:
            logger.warning("Fallback translation failed (%s): %s", response_language, exc)
            return text

    def _translate_offline(self, text: str, from_code: str, to_code: str) -> str:
        """Translate using local Argos packages. Returns empty string if unavailable."""
        if not self.argos_translate:
            return ""
        try:
            langs = self.argos_translate.get_installed_languages()
            from_lang = next((l for l in langs if l.code == from_code), None)
            to_lang = next((l for l in langs if l.code == to_code), None)
            if not from_lang or not to_lang:
                return ""
            translation = from_lang.get_translation(to_lang)
            return (translation.translate(text) or "").strip()
        except Exception as exc:
            logger.warning("Offline translation failed (%s -> %s): %s", from_code, to_code, exc)
            return ""

