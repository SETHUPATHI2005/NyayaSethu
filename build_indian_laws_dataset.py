"""
Build a RAG-ready Indian laws dataset from government act portals.

Primary sources:
- https://www.mha.gov.in/en/acts
- https://www.legislative.gov.in/

Outputs:
- data/indian_laws_en.json
- data/indian_laws_multilingual.json (optional)
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader


SEED_URLS = [
    "https://www.mha.gov.in/en/acts",
    "https://www.legislative.gov.in/",
]

USER_AGENT = "NyayaSethu-LawDatasetBuilder/1.0 (+research use)"

LANGUAGE_MAP = {
    "hi": "Hindi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "or": "Odia",
    "pa": "Punjabi",
    "ta": "Tamil",
    "te": "Telugu",
    "ur": "Urdu",
}


@dataclass
class LawDoc:
    title: str
    url: str
    source_site: str
    year: Optional[int]
    text: str


class Translator:
    """Optional translator using OpenAI Chat Completions API."""

    def __init__(self) -> None:
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()

    def available(self) -> bool:
        return bool(self.openai_api_key)

    def translate(self, text: str, target_lang_code: str, target_lang_name: str) -> str:
        if target_lang_code == "en":
            return text
        if not self.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not set. Translation is unavailable.")

        payload = {
            "model": "gpt-4o-mini",
            "temperature": 0,
            "messages": [
                {
                    "role": "system",
                    "content": "Translate legal text faithfully. Keep section numbers and legal citations unchanged.",
                },
                {
                    "role": "user",
                    "content": (
                        f"Translate the following Indian legal text to {target_lang_name} "
                        f"({target_lang_code}). Return only translated text.\n\n{text}"
                    ),
                },
            ],
        }
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=90,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


def get_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    return session


def fetch_html(session: requests.Session, url: str) -> Optional[str]:
    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
        if "text/html" not in resp.headers.get("Content-Type", ""):
            return None
        return resp.text
    except Exception:
        return None


def sanitize_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def looks_like_law_link(link_text: str, href: str) -> bool:
    blob = f"{link_text} {href}".lower()
    keywords = [
        "act",
        "rules",
        "regulation",
        "ordinance",
        "constitution",
        "code",
        ".pdf",
    ]
    return any(k in blob for k in keywords)


def extract_year(text: str) -> Optional[int]:
    m = re.search(r"\b(18|19|20)\d{2}\b", text)
    return int(m.group(0)) if m else None


def collect_document_links(session: requests.Session, seed_url: str) -> List[Tuple[str, str]]:
    html = fetch_html(session, seed_url)
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    out: List[Tuple[str, str]] = []
    base_domain = urlparse(seed_url).netloc

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        title = sanitize_text(a.get_text(" ", strip=True))
        if not href:
            continue
        full = urljoin(seed_url, href)
        parsed = urlparse(full)
        if not parsed.scheme.startswith("http"):
            continue
        if not parsed.netloc.endswith(".gov.in") and parsed.netloc != base_domain:
            continue
        if not looks_like_law_link(title, full):
            continue
        if len(title) < 4:
            title = Path(parsed.path).name or full
        out.append((title, full))

    # De-duplicate while preserving order.
    seen = set()
    deduped = []
    for item in out:
        if item[1] in seen:
            continue
        seen.add(item[1])
        deduped.append(item)
    return deduped


def extract_text_from_pdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    pages = []
    for page in reader.pages:
        txt = page.extract_text() or ""
        pages.append(txt)
    return sanitize_text("\n".join(pages))


def extract_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    candidates = []
    for selector in ["article", "main", ".content", "#content", "body"]:
        node = soup.select_one(selector)
        if node:
            candidates.append(node.get_text(" ", strip=True))
    text = max(candidates, key=len) if candidates else soup.get_text(" ", strip=True)
    return sanitize_text(text)


def download_law_text(session: requests.Session, url: str) -> str:
    resp = session.get(url, timeout=45)
    resp.raise_for_status()
    ctype = resp.headers.get("Content-Type", "").lower()
    is_pdf = url.lower().endswith(".pdf") or "application/pdf" in ctype
    if is_pdf:
        return extract_text_from_pdf(resp.content)
    return extract_text_from_html(resp.text)


def chunk_text(text: str, chunk_chars: int, overlap_chars: int) -> List[str]:
    if not text:
        return []
    chunks = []
    i = 0
    n = len(text)
    while i < n:
        chunk = text[i : i + chunk_chars]
        chunks.append(chunk.strip())
        if i + chunk_chars >= n:
            break
        i += max(1, chunk_chars - overlap_chars)
    return [c for c in chunks if c]


def scrape_laws(session: requests.Session, max_docs: int, sleep_s: float) -> List[LawDoc]:
    all_links: List[Tuple[str, str, str]] = []
    for seed in SEED_URLS:
        source_site = urlparse(seed).netloc
        for title, url in collect_document_links(session, seed):
            all_links.append((title, url, source_site))

    seen = set()
    docs: List[LawDoc] = []
    for title, url, source_site in all_links:
        if len(docs) >= max_docs:
            break
        if url in seen:
            continue
        seen.add(url)
        try:
            text = download_law_text(session, url)
            if len(text) < 400:
                continue
            year = extract_year(f"{title} {text[:300]}")
            docs.append(
                LawDoc(
                    title=title[:300],
                    url=url,
                    source_site=source_site,
                    year=year,
                    text=text,
                )
            )
            print(f"[ok] {len(docs):03d} {title[:80]} -> {url}")
        except Exception as exc:
            print(f"[skip] {title[:80]} ({url}) :: {exc}")
        if sleep_s > 0:
            time.sleep(sleep_s)
    return docs


def build_rag_records(
    docs: List[LawDoc], chunk_chars: int, overlap_chars: int, language: str = "en"
) -> List[Dict]:
    records = []
    for doc in docs:
        chunks = chunk_text(doc.text, chunk_chars=chunk_chars, overlap_chars=overlap_chars)
        for idx, chunk in enumerate(chunks, start=1):
            source_title = f"{doc.title} ({doc.year})" if doc.year else doc.title
            records.append(
                {
                    "text": chunk,
                    "source": f"{source_title} - chunk {idx}",
                    "topic": "statute",
                    "acts": [doc.title],
                    "language": language,
                    "source_url": doc.url,
                    "source_site": doc.source_site,
                }
            )
    return records


def translate_records(
    records_en: List[Dict],
    lang_codes: List[str],
    translator: Translator,
    max_records: int,
) -> List[Dict]:
    if not translator.available():
        raise RuntimeError("Translation requested, but OPENAI_API_KEY is missing.")

    translated: List[Dict] = []
    selected = records_en[:max_records] if max_records > 0 else records_en

    for lang_code in lang_codes:
        lang_name = LANGUAGE_MAP.get(lang_code)
        if not lang_name:
            print(f"[warn] Unsupported language code: {lang_code} (skipped)")
            continue

        print(f"[info] Translating to {lang_name} ({lang_code}) ...")
        for i, rec in enumerate(selected, start=1):
            text = rec["text"]
            try:
                t_text = translator.translate(text, target_lang_code=lang_code, target_lang_name=lang_name)
                new_rec = dict(rec)
                new_rec["text"] = t_text
                new_rec["language"] = lang_code
                translated.append(new_rec)
                if i % 10 == 0:
                    print(f"  [ok] {lang_code}: {i}/{len(selected)}")
            except Exception as exc:
                print(f"  [skip] {lang_code} record {i}: {exc}")
    return translated


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build Indian laws dataset for NyayaSethu RAG.")
    p.add_argument("--max-docs", type=int, default=150, help="Maximum documents to download.")
    p.add_argument("--chunk-chars", type=int, default=2200, help="Chunk size in characters.")
    p.add_argument("--overlap-chars", type=int, default=250, help="Chunk overlap in characters.")
    p.add_argument("--sleep", type=float, default=0.25, help="Delay between downloads (seconds).")
    p.add_argument("--translate-langs", type=str, default="", help="Comma-separated language codes (e.g. hi,bn,ta).")
    p.add_argument(
        "--translate-max-records",
        type=int,
        default=0,
        help="Translate only first N English records (0 = all). Useful for cost control.",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)

    session = get_session()
    docs = scrape_laws(session, max_docs=args.max_docs, sleep_s=args.sleep)
    records_en = build_rag_records(
        docs, chunk_chars=args.chunk_chars, overlap_chars=args.overlap_chars, language="en"
    )

    en_path = data_dir / "indian_laws_en.json"
    en_path.write_text(json.dumps(records_en, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[done] Wrote {len(records_en)} English records to {en_path}")

    langs_raw = args.translate_langs.strip()
    if not langs_raw:
        return

    lang_codes = [x.strip() for x in langs_raw.split(",") if x.strip()]
    translator = Translator()
    translated = translate_records(
        records_en,
        lang_codes=lang_codes,
        translator=translator,
        max_records=args.translate_max_records,
    )
    if translated:
        multi_records = records_en + translated
        multi_path = data_dir / "indian_laws_multilingual.json"
        multi_path.write_text(json.dumps(multi_records, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[done] Wrote {len(multi_records)} multilingual records to {multi_path}")


if __name__ == "__main__":
    main()
