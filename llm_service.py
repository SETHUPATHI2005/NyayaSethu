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

SYSTEM_PROMPT = """You are NyayaSethu, an AI legal assistant specialising in Indian law.
Your role is to help ordinary citizens understand their legal rights and options.

Guidelines:
- Answer clearly and simply. Avoid legal jargon.
- Always cite the specific Act and Section where possible.
- Provide practical next steps.
- If uncertain, say so and recommend consulting a lawyer.
- Keep answers concise (3-5 paragraphs).
- Respond in the requested language.

You provide legal information, not legal advice.
"""


class LLMService:
    def __init__(self):
        self.use_hf = bool(HF_API_TOKEN)
        self.use_openai = bool(OPENAI_API_KEY)
        if self.use_hf:
            logger.info("LLM: Using Hugging Face API - %s", HF_MODEL_ID)
        elif self.use_openai:
            logger.info("LLM: Using OpenAI API")
        else:
            logger.warning("LLM: No API key found. Using rule-based fallback.")

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
        return self._fallback_generate(question, context)

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

    def _fallback_generate(self, question: str, context: List[Dict]) -> Tuple[str, List[str], float]:
        if not context:
            return (
                "I could not find specific information for this legal question. "
                "Please consult a lawyer or call NALSA helpline at 15100 for free legal aid.",
                [],
                0.3,
            )

        top = context[0]
        text = top.get("text", "")
        source = top.get("source", "")
        acts = top.get("acts", [])

        extra = ""
        if len(context) > 1:
            extra = "\n\nAdditional relevant law: " + context[1].get("text", "")[:300] + "..."

        answer = (
            f"{text}{extra}\n\nSource: {source}\n\n"
            "Next steps: Contact your nearest Legal Services Authority or call 15100."
        )
        return answer, acts, 0.7

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

