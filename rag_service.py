"""
services/rag_service.py â€” Retrieval Augmented Generation
Embeds queries and retrieves relevant legal context from vector DB.
"""
import os
import json
import logging
import re
from typing import List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "i", "in", "is", "it", "me", "my", "of", "on", "or", "the", "to", "was",
    "what", "when", "where", "which", "who", "with", "can", "do", "does",
    "please", "about", "under", "law", "legal", "india", "indian"
}

TOKEN_ALIASES = {
    "murder": {"homicide", "bns", "ipc"},
    "theft": {"steal", "stolen", "bns", "ipc"},
    "fir": {"bnss", "crpc", "police"},
    "arrest": {"bnss", "crpc"},
    "evidence": {"bsa", "sakshya"},
    "contract": {"agreement"},
    "constitution": {"article", "fundamental", "rights"},
    "wages": {"salary", "labour"},
    "consumer": {"refund", "defective"},
    "domestic": {"violence", "women"},
    "rti": {"information"},
    "cyber": {"cybercrime", "it", "online", "hacking", "phishing"},
    "fraud": {"cheating", "scam", "66d", "it"},
    "upi": {"payment", "banking", "fraud", "1930"},
    "phishing": {"otp", "identity", "66c", "66d"},
    "company": {"corporate", "companies", "director", "board", "roc"},
    "corporate": {"company", "companies", "board", "compliance"},
    "insolvency": {"ibc", "bankruptcy", "cirp", "nclt"},
    "sebi": {"securities", "listing", "insider", "trading"},
    "llp": {"limited", "liability", "partnership"},
    "fema": {"foreign", "exchange", "rbi", "cross", "border"},
    "competition": {"cartel", "dominant", "cci", "antitrust"},
    "ip": {"intellectual", "property", "copyright", "trademark", "patent"},
    "copyright": {"ip", "author", "infringement"},
    "trademark": {"ip", "brand", "mark", "passing", "off"},
    "patent": {"ip", "invention", "novelty"},
    "environment": {"pollution", "epa", "air", "water", "ecology"},
    "family": {"marriage", "divorce", "maintenance", "inheritance", "succession"},
    "tax": {"income", "gst", "tds", "assessment", "penalty"},
    "gst": {"tax", "cgst", "sgst", "igst", "return", "filing"},
    "administrative": {"writ", "authority", "tribunal", "natural", "justice"},
    "bns": {"bharatiya", "nyaya", "sanhita", "ipc"},
    "bnss": {"bharatiya", "nagarik", "suraksha", "sanhita", "crpc"},
    "bsa": {"bharatiya", "sakshya", "adhiniyam", "evidence"},
}

TOPIC_HINTS = {
    "criminal": {"bns", "ipc", "murder", "theft", "offence", "offense", "assault"},
    "criminal_procedure": {"bnss", "crpc", "fir", "arrest", "bail", "chargesheet", "trial"},
    "evidence": {"bsa", "evidence", "admissible", "witness", "burden"},
    "constitutional": {"constitution", "article", "fundamental", "rights", "speech", "equality"},
    "civil": {"contract", "agreement", "breach", "damages", "consideration"},
    "labour": {"wages", "salary", "termination", "retrenchment", "employment", "pf", "esi"},
    "consumer": {"consumer", "refund", "defective", "complaint", "service"},
    "women": {"domestic", "violence", "posh", "harassment", "maternity"},
    "rti": {"rti", "information", "pio"},
    "property": {"rent", "tenant", "landlord", "eviction", "property"},
    "cybercrime": {
        "cyber",
        "cybercrime",
        "hacking",
        "phishing",
        "otp",
        "upi",
        "online",
        "fraud",
        "identity",
        "theft",
        "it",
        "computer",
        "malware",
        "portal",
        "1930",
    },
    "corporate": {
        "company",
        "companies",
        "corporate",
        "director",
        "board",
        "roc",
        "llp",
        "sebi",
        "insider",
        "securities",
        "fema",
        "foreign",
        "exchange",
        "ibc",
        "insolvency",
        "bankruptcy",
        "nclt",
        "competition",
        "cartel",
        "cci",
        "compliance",
    },
    "ip": {"ip", "intellectual", "property", "copyright", "trademark", "patent", "infringement"},
    "environment": {"environment", "pollution", "epa", "air", "water", "hazardous", "waste"},
    "family": {"family", "marriage", "divorce", "maintenance", "alimony", "succession", "inheritance"},
    "tax": {"tax", "income", "gst", "tds", "assessment", "refund", "demand", "penalty"},
    "administrative": {"administrative", "authority", "tribunal", "writ", "natural", "justice", "delegated"},
}

# â”€â”€ Lazy imports so the app starts even without GPU deps â”€â”€
def _try_import_faiss():
    try:
        import faiss
        return faiss
    except ImportError:
        logger.warning("faiss-cpu not installed. Using fallback keyword search.")
        return None

def _try_import_sentence_transformers():
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer
    except ImportError:
        logger.warning("sentence-transformers not installed. Using fallback search.")
        return None


class RAGService:
    """
    Retrieves relevant legal passages for a query.

    Production: uses FAISS vector index + sentence-transformers embeddings.
    Fallback: keyword BM25-style search over in-memory corpus.
    """

    def __init__(self):
        self.faiss     = _try_import_faiss()
        self.ST        = _try_import_sentence_transformers()
        self.model     = None
        self.index     = None
        self.loaded_files: List[str] = []
        self.using_fallback: bool = False
        self.corpus    = self._load_corpus()
        self._init_vector_index()

    # â”€â”€ Corpus â”€â”€
    def _load_corpus(self) -> List[Dict]:
        """Load legal knowledge base from JSON files."""
        data_dir = Path(__file__).parent.parent / "data"
        corpus = []
        loaded_files = []

        for json_file in data_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    entries = json.load(f)
                    corpus.extend(entries)
                loaded_files.append(json_file.name)
                logger.info(f"Loaded {len(entries)} entries from {json_file.name}")
            except Exception as e:
                logger.error(f"Error loading {json_file}: {e}")

        if not corpus:
            # Seed with built-in fallback corpus
            corpus = FALLBACK_CORPUS
            self.using_fallback = True
            self.loaded_files = []
        else:
            self.using_fallback = False
            self.loaded_files = loaded_files

        logger.info(f"Total corpus size: {len(corpus)} entries")
        return corpus

    def _init_vector_index(self):
        """Build FAISS index from corpus embeddings (if deps available)."""
        if not self.faiss or not self.ST:
            return
        try:
            import numpy as np
            self.model = self.ST("all-MiniLM-L6-v2")
            texts = [entry["text"] for entry in self.corpus]
            embeddings = self.model.encode(texts, show_progress_bar=False)
            embeddings = np.array(embeddings).astype("float32")
            dim = embeddings.shape[1]
            self.index = self.faiss.IndexFlatIP(dim)   # Inner product (cosine after normalise)
            self.faiss.normalize_L2(embeddings)
            self.index.add(embeddings)
            logger.info(f"FAISS index built with {self.index.ntotal} vectors")
        except Exception as e:
            logger.warning(f"Could not build FAISS index: {e}")
            self.index = None

    # â”€â”€ Retrieval â”€â”€
    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Return top_k most relevant legal passages for the query."""
        if self.index and self.model:
            return self._vector_search(query, top_k)
        return self._keyword_search(query, top_k)

    def _vector_search(self, query: str, top_k: int) -> List[Dict]:
        import numpy as np
        q_emb = self.model.encode([query])
        q_emb = np.array(q_emb).astype("float32")
        self.faiss.normalize_L2(q_emb)
        scores, indices = self.index.search(q_emb, top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.corpus):
                entry = dict(self.corpus[idx])
                entry["score"] = float(score)
                results.append(entry)
        return results

    def _keyword_search(self, query: str, top_k: int) -> List[Dict]:
        """Keyword fallback with token normalization and topic fallback."""
        q_tokens = self._expand_tokens(self._tokenize(query))
        scored = []

        for entry in self.corpus:
            search_blob = " ".join(
                [
                    entry.get("text", ""),
                    entry.get("source", ""),
                    " ".join(entry.get("acts", [])),
                    entry.get("topic", ""),
                ]
            )
            e_tokens = self._tokenize(search_blob)
            overlap = q_tokens & e_tokens
            if not overlap:
                continue
            # Favor stronger overlap and exact phrase containment.
            score = float(len(overlap))
            q_lower = query.lower()
            source_lower = entry.get("source", "").lower()
            if q_lower and q_lower in source_lower:
                score += 4.0
            if "section" in q_lower and "section" in entry.get("text", "").lower():
                score += 1.0
            scored.append((score, entry))

        scored.sort(key=lambda x: x[0], reverse=True)
        ranked = [e for _, e in scored[:top_k]]
        if ranked:
            return ranked
        return self._topic_fallback(query, top_k)

    def _tokenize(self, text: str) -> set:
        tokens = set(re.findall(r"[a-z0-9]+", text.lower()))
        return {t for t in tokens if len(t) > 1 and t not in STOPWORDS}

    def _expand_tokens(self, tokens: set) -> set:
        expanded = set(tokens)
        for token in list(tokens):
            expanded |= TOKEN_ALIASES.get(token, set())
        return expanded

    def _topic_fallback(self, query: str, top_k: int) -> List[Dict]:
        q_tokens = self._expand_tokens(self._tokenize(query))
        # Try topic detection first.
        for topic, hints in TOPIC_HINTS.items():
            if q_tokens & hints:
                topic_entries = [e for e in self.corpus if e.get("topic") == topic]
                if topic_entries:
                    return topic_entries[:top_k]
        # Last resort: return foundational entries to avoid empty context.
        return self.corpus[:top_k]

    def get_coverage_stats(self) -> Dict[str, Any]:
        """Return summary coverage stats for currently loaded legal corpus."""
        topics: Dict[str, int] = {}
        languages: Dict[str, int] = {}
        source_sites: Dict[str, int] = {}
        unique_acts = set()
        unique_sources = set()

        for entry in self.corpus:
            topic = str(entry.get("topic", "unknown")).strip() or "unknown"
            topics[topic] = topics.get(topic, 0) + 1

            language = str(entry.get("language", "en")).strip() or "en"
            languages[language] = languages.get(language, 0) + 1

            source_site = str(entry.get("source_site", "fallback")).strip() or "fallback"
            source_sites[source_site] = source_sites.get(source_site, 0) + 1

            source = str(entry.get("source", "")).strip()
            if source:
                unique_sources.add(source)

            for act in entry.get("acts", []):
                act_name = str(act).strip()
                if act_name:
                    unique_acts.add(act_name)

        sorted_topics = dict(sorted(topics.items(), key=lambda kv: kv[1], reverse=True))
        sorted_languages = dict(sorted(languages.items(), key=lambda kv: kv[1], reverse=True))
        sorted_sites = dict(sorted(source_sites.items(), key=lambda kv: kv[1], reverse=True))

        return {
            "total_records": len(self.corpus),
            "unique_acts": len(unique_acts),
            "unique_sources": len(unique_sources),
            "topics": sorted_topics,
            "languages": sorted_languages,
            "source_sites": sorted_sites,
            "loaded_files": self.loaded_files,
            "using_fallback_corpus": self.using_fallback,
            "coverage_note": (
                "This reports currently loaded corpus coverage, not a legal guarantee "
                "that all Indian central/state laws are present."
            ),
        }


# â”€â”€ Fallback in-memory legal corpus â”€â”€
FALLBACK_CORPUS = [
    {
        "text": "Under the Industrial Disputes Act 1947 Section 25F, a workman who has been in continuous service for not less than one year must be given one month notice or wages in lieu of notice before termination. The employer must also pay retrenchment compensation at the rate of 15 days average pay for every completed year of service.",
        "source": "Industrial Disputes Act, 1947 â€” Section 25F",
        "topic": "labour",
        "acts": ["Industrial Disputes Act, 1947"]
    },
    {
        "text": "The Payment of Wages Act 1936 requires that wages must be paid before the 7th day following the last day of the wage period if less than 1000 workers are employed, and before the 10th day if more than 1000 workers are employed. Unpaid wages can be recovered by filing Form A before the Authority under the Act within 1 year.",
        "source": "Payment of Wages Act, 1936",
        "topic": "labour",
        "acts": ["Payment of Wages Act, 1936"]
    },
    {
        "text": "Under the Minimum Wages Act 1948, every employer must pay at least the minimum wage fixed by the State Government for the scheduled employment. Violation is punishable with imprisonment up to 5 years or fine up to Rs 10,000. Workers can file complaints with the Inspector under the Act.",
        "source": "Minimum Wages Act, 1948",
        "topic": "labour",
        "acts": ["Minimum Wages Act, 1948"]
    },
    {
        "text": "Under the Consumer Protection Act 2019 Section 35, a consumer can file a complaint before the District Consumer Disputes Redressal Commission for goods or services valued up to Rs 1 crore. The complaint must be filed within 2 years from the date of cause of action. Filing fee is minimal.",
        "source": "Consumer Protection Act, 2019 â€” Section 35",
        "topic": "consumer",
        "acts": ["Consumer Protection Act, 2019"]
    },
    {
        "text": "Article 19(1)(a) of the Indian Constitution guarantees the Right to Freedom of Speech and Expression. Article 21 guarantees the Right to Life and Personal Liberty. These fundamental rights are enforceable against the State through writ petitions under Article 32 (Supreme Court) or Article 226 (High Court).",
        "source": "Constitution of India â€” Articles 19, 21, 32, 226",
        "topic": "constitutional",
        "acts": ["Constitution of India"]
    },
    {
        "text": "Under the Protection of Women from Domestic Violence Act 2005, an aggrieved woman can file an application before the Magistrate for a Protection Order, Residence Order, Monetary Relief, Custody Order, or Compensation Order. A Protection Officer or NGO can assist in filing. No court fee is payable.",
        "source": "Protection of Women from Domestic Violence Act, 2005",
        "topic": "women",
        "acts": ["PWDVA 2005"]
    },
    {
        "text": "The Right to Information Act 2005 Section 6 allows any citizen to request information from any public authority by submitting an application with Rs 10 fee. The PIO must respond within 30 days. If denied, appeal can be made to First Appellate Authority within 30 days, and then to Central/State Information Commission.",
        "source": "Right to Information Act, 2005 â€” Section 6",
        "topic": "rti",
        "acts": ["Right to Information Act, 2005"]
    },
    {
        "text": "Under the Maternity Benefit Act 1961 (amended 2017), women employees who have worked for at least 80 days in the preceding 12 months are entitled to 26 weeks of paid maternity leave for first two children. The employer cannot dismiss a woman during her maternity leave. Creche facility is mandatory for establishments with 50 or more employees.",
        "source": "Maternity Benefit Act, 1961 (Amended 2017)",
        "topic": "labour",
        "acts": ["Maternity Benefit Act, 1961"]
    },
    {
        "text": "Under the Sexual Harassment of Women at Workplace Act 2013 (POSH Act), every organization with 10 or more employees must constitute an Internal Complaints Committee. A complaint must be filed within 3 months of the incident. The Committee must complete enquiry within 90 days. The employer must take action within 60 days of receiving the report.",
        "source": "Sexual Harassment of Women at Workplace Act, 2013",
        "topic": "women",
        "acts": ["POSH Act, 2013"]
    },
    {
        "text": "Under PM-KISAN scheme, eligible farmer families receive financial benefit of Rs 6000 per year in three equal installments of Rs 2000 each every four months. Small and marginal farmer families owning cultivable land up to 2 hectares are eligible. Applications can be made through the state/UT government or Common Service Centres.",
        "source": "PM-KISAN Scheme â€” Government of India",
        "topic": "schemes",
        "acts": ["PM-KISAN"]
    },
    {
        "text": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana provides health coverage up to Rs 5 lakh per family per year for secondary and tertiary hospitalization. Families listed in SECC 2011 data are automatically eligible. Beneficiaries can use this at empanelled government and private hospitals.",
        "source": "Ayushman Bharat PM-JAY",
        "topic": "schemes",
        "acts": ["Ayushman Bharat"]
    },
    {
        "text": "Under the Employees Provident Funds and Miscellaneous Provisions Act 1952, every employer with 20 or more employees must register with EPFO. Both employer and employee contribute 12% of basic wages each month. The employee can file a grievance online at epfigms.gov.in or call 14470.",
        "source": "EPF Act, 1952",
        "topic": "labour",
        "acts": ["EPF Act, 1952"]
    },
    {
        "text": "A tenant has the right to peaceful possession of the rented premises. The landlord cannot forcibly evict a tenant without a court order. Under State Rent Control Acts, a landlord must file an eviction petition before the Rent Controller. Non-payment of rent is grounds for eviction, but the tenant must be given a notice period.",
        "source": "Transfer of Property Act & State Rent Control Acts",
        "topic": "property",
        "acts": ["Transfer of Property Act, 1882"]
    },
    {
        "text": "Under Section 154 CrPC, a police officer must register an FIR for a cognizable offence. If police refuse to register FIR, the complainant can approach the Superintendent of Police under Section 154(3) or file a complaint directly before the Magistrate under Section 156(3) CrPC.",
        "source": "Code of Criminal Procedure, 1973 â€” Section 154",
        "topic": "criminal",
        "acts": ["CrPC, 1973"]
    },
    {
        "text": "The Bharatiya Nyaya Sanhita, 2023 is the current substantive criminal law replacing most IPC provisions from 1 July 2024. It covers offences against body, sexual offences, theft and related property offences. In common legal references, murder and culpable homicide are discussed under Sections 101 and 103, while theft related provisions are discussed in the Section 303 to 310 range.",
        "source": "Bharatiya Nyaya Sanhita, 2023 (BNS)",
        "topic": "criminal",
        "acts": ["Bharatiya Nyaya Sanhita, 2023"]
    },
    {
        "text": "The Bharatiya Nagarik Suraksha Sanhita, 2023 replaced the Code of Criminal Procedure from 1 July 2024 and governs criminal procedure including FIR registration, arrest safeguards, investigation, charge sheet process, bail, trial and appeals.",
        "source": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
        "topic": "criminal_procedure",
        "acts": ["Bharatiya Nagarik Suraksha Sanhita, 2023"]
    },
    {
        "text": "The Bharatiya Sakshya Adhiniyam, 2023 replaced the Indian Evidence Act from 1 July 2024. It governs relevancy of facts, admissibility of evidence, documentary and electronic records, witness testimony, presumptions and burden of proof.",
        "source": "Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
        "topic": "evidence",
        "acts": ["Bharatiya Sakshya Adhiniyam, 2023"]
    },
    {
        "text": "The Indian Penal Code, 1860 was the earlier substantive criminal code with 511 sections before replacement by BNS in 2024. Frequently cited provisions include Section 121 (waging war against the Government of India), Section 300 (murder), and Section 378 (theft). Legacy matters may still refer to IPC section numbers depending on date of offence.",
        "source": "Indian Penal Code, 1860 (legacy reference)",
        "topic": "criminal",
        "acts": ["Indian Penal Code, 1860"]
    },
    {
        "text": "The Constitution of India is the supreme law and currently contains 395 Articles across 22 Parts in the original framework, with later amendments and schedules. Article 14 guarantees equality before law and equal protection of laws. Article 19(1)(a) guarantees freedom of speech and expression subject to reasonable restrictions.",
        "source": "Constitution of India - Articles 14 and 19",
        "topic": "constitutional",
        "acts": ["Constitution of India"]
    },
    {
        "text": "The Indian Contract Act, 1872 (Sections 1 to 266) lays down principles of contracts including proposal and acceptance, lawful consideration and object, void and voidable agreements, contingent contracts, performance, breach, indemnity, guarantee, bailment, pledge and agency.",
        "source": "Indian Contract Act, 1872 - Sections 1 to 266",
        "topic": "civil",
        "acts": ["Indian Contract Act, 1872"]
    },
    {
        "text": "Under the Information Technology Act, 2000, Section 43 deals with unauthorized access, downloading, introducing malware, and damaging computer systems, with civil liability by way of compensation. Section 66 criminalizes dishonest or fraudulent acts referred in Section 43 and can attract imprisonment and fine.",
        "source": "Information Technology Act, 2000 - Sections 43 and 66",
        "topic": "cybercrime",
        "acts": ["Information Technology Act, 2000"]
    },
    {
        "text": "Under the Information Technology Act, 2000, Section 66C addresses identity theft (for example misuse of password, digital signature, or unique identification features), and Section 66D addresses cheating by personation using computer resources, commonly used in phishing, OTP scams and fake online profile frauds.",
        "source": "Information Technology Act, 2000 - Sections 66C and 66D",
        "topic": "cybercrime",
        "acts": ["Information Technology Act, 2000"]
    },
    {
        "text": "For cyber fraud response in India, immediate reporting should be made to the National Cyber Crime Reporting Portal (cybercrime.gov.in) and helpline 1930, especially for financial frauds. Early reporting can help freezing suspicious transactions through coordinated banking and law-enforcement workflow.",
        "source": "National Cyber Crime Reporting Workflow - cybercrime.gov.in / 1930",
        "topic": "cybercrime",
        "acts": ["Information Technology Act, 2000", "Bharatiya Nyaya Sanhita, 2023"]
    },
    {
        "text": "Digital evidence preservation is critical in cybercrime cases: keep screenshots, transaction IDs, UPI references, chat logs, email headers, URLs, caller numbers, and device logs. Do not delete messages or reset devices before making a complaint and giving statements to police/cyber cell.",
        "source": "Cybercrime Evidence Preservation - Practical Procedure",
        "topic": "cybercrime",
        "acts": ["Bharatiya Sakshya Adhiniyam, 2023", "Information Technology Act, 2000"]
    },
    {
        "text": "Online obscenity and sexually explicit electronic content may attract provisions under Information Technology Act Section 67 and Section 67A, apart from applicable offences under Bharatiya Nyaya Sanhita, 2023 depending on facts. Child sexual abuse material and related conduct involve stricter legal consequences under special laws.",
        "source": "Information Technology Act, 2000 - Sections 67 and 67A",
        "topic": "cybercrime",
        "acts": ["Information Technology Act, 2000", "Bharatiya Nyaya Sanhita, 2023"]
    },
    {
        "text": "The Companies Act, 2013 governs incorporation, governance, board responsibilities, audit, disclosure and shareholder protection. Corporate non-compliance can attract penalties for the company and officers in default, and serious fraud can invoke stricter punishment under fraud provisions and related laws.",
        "source": "Companies Act, 2013 - Corporate Governance and Compliance",
        "topic": "corporate",
        "acts": ["Companies Act, 2013"]
    },
    {
        "text": "Companies Act, 2013 Section 447 addresses fraud involving company affairs and provides stringent punishment including imprisonment and fine, with higher consequences in public-interest or large-value fraud cases. Proceedings may involve SFIO, Registrar of Companies and criminal courts/NCLT context based on facts.",
        "source": "Companies Act, 2013 - Section 447 (Fraud)",
        "topic": "corporate",
        "acts": ["Companies Act, 2013"]
    },
    {
        "text": "The Limited Liability Partnership Act, 2008 regulates LLP formation, partner responsibilities, filings and compliance. LLP combines partnership flexibility with limited liability. Non-filing and statutory defaults can lead to penalties on LLP and designated partners.",
        "source": "Limited Liability Partnership Act, 2008",
        "topic": "corporate",
        "acts": ["Limited Liability Partnership Act, 2008"]
    },
    {
        "text": "The Insolvency and Bankruptcy Code, 2016 provides time-bound insolvency resolution and liquidation framework for corporate persons through CIRP before NCLT. Creditors may initiate insolvency for payment defaults, and management control can shift to insolvency professionals during resolution.",
        "source": "Insolvency and Bankruptcy Code, 2016 - CIRP Framework",
        "topic": "corporate",
        "acts": ["Insolvency and Bankruptcy Code, 2016"]
    },
    {
        "text": "FEMA, 1999 governs foreign exchange transactions, capital account/current account rules and cross-border remittances. Contraventions are generally civil in nature with monetary penalties, adjudication process, and possible compounding depending on RBI/ED framework and applicable regulations.",
        "source": "Foreign Exchange Management Act, 1999 (FEMA)",
        "topic": "corporate",
        "acts": ["Foreign Exchange Management Act, 1999"]
    },
    {
        "text": "SEBI Act, 1992 and SEBI regulations govern securities market conduct including disclosure, listing obligations and insider trading controls. Violations can attract monetary penalties, market-access restrictions, disgorgement directions and prosecution depending on breach severity.",
        "source": "SEBI Act, 1992 and Securities Compliance Framework",
        "topic": "corporate",
        "acts": ["SEBI Act, 1992"]
    },
    {
        "text": "Competition Act, 2002 prohibits anti-competitive agreements and abuse of dominant position, and regulates combinations (mergers/acquisitions). The Competition Commission of India may investigate and impose significant penalties including turnover-linked fines for cartels and other contraventions.",
        "source": "Competition Act, 2002 - Anti-Competitive Conduct",
        "topic": "corporate",
        "acts": ["Competition Act, 2002"]
    },
    {
        "text": "The Copyright Act, 1957 protects original literary, dramatic, musical, artistic works, cinematograph films and sound recordings. Unauthorized reproduction, distribution or communication to the public can amount to infringement and may attract civil remedies and criminal consequences under the Act.",
        "source": "Copyright Act, 1957",
        "topic": "ip",
        "acts": ["Copyright Act, 1957"]
    },
    {
        "text": "The Trade Marks Act, 1999 protects registered marks and provides remedies against infringement and passing off. Courts may grant injunctions, damages/accounts of profits, and seizure/destruction orders depending on facts and evidence of misuse.",
        "source": "Trade Marks Act, 1999",
        "topic": "ip",
        "acts": ["Trade Marks Act, 1999"]
    },
    {
        "text": "The Patents Act, 1970 governs patentability, filing, grant, opposition and infringement for inventions meeting novelty, inventive step and industrial applicability. Infringement generally leads to civil remedies such as injunction and damages or accounts of profits.",
        "source": "Patents Act, 1970",
        "topic": "ip",
        "acts": ["Patents Act, 1970"]
    },
    {
        "text": "The Environment (Protection) Act, 1986 provides umbrella powers to protect and improve environment, regulate emissions/discharges and prescribe safeguards for hazardous substances. Violations can attract imprisonment and fine under the Act, including continuing offence consequences.",
        "source": "Environment (Protection) Act, 1986",
        "topic": "environment",
        "acts": ["Environment (Protection) Act, 1986"]
    },
    {
        "text": "The Water (Prevention and Control of Pollution) Act, 1974 and Air (Prevention and Control of Pollution) Act, 1981 regulate consent requirements, pollution control standards and enforcement through pollution control boards. Non-compliance may attract prosecution, imprisonment and fine.",
        "source": "Water Act, 1974 and Air Act, 1981",
        "topic": "environment",
        "acts": ["Water (Prevention and Control of Pollution) Act, 1974", "Air (Prevention and Control of Pollution) Act, 1981"]
    },
    {
        "text": "Family law in India is religion/community specific in many areas and includes marriage, divorce, maintenance, guardianship and succession. Key statutes include Hindu Marriage Act, 1955, Hindu Succession Act, 1956, Special Marriage Act, 1954 and Muslim personal law principles, alongside maintenance remedies under criminal/civil framework.",
        "source": "Indian Personal and Family Law Framework",
        "topic": "family",
        "acts": ["Hindu Marriage Act, 1955", "Special Marriage Act, 1954", "Hindu Succession Act, 1956"]
    },
    {
        "text": "Under the Hindu Marriage Act, 1955, parties may seek judicial remedies including divorce on statutory grounds and related reliefs. Maintenance rights may also arise through Section 24 and Section 25 (interim/permanent alimony) and through parallel remedies under other laws where applicable.",
        "source": "Hindu Marriage Act, 1955",
        "topic": "family",
        "acts": ["Hindu Marriage Act, 1955"]
    },
    {
        "text": "Income-tax Act, 1961 governs taxable income, deductions, assessment, return filing and penalties for non-compliance. Depending on default type, consequences can include interest, monetary penalties and prosecution in serious cases such as willful evasion or false verification.",
        "source": "Income-tax Act, 1961",
        "topic": "tax",
        "acts": ["Income-tax Act, 1961"]
    },
    {
        "text": "GST law in India is administered primarily through the Central Goods and Services Tax Act, 2017 and related GST statutes/rules. Non-filing of GST returns and other non-compliance may lead to tax demand, interest, penalties, cancellation of registration and prosecution for specified offences.",
        "source": "CGST Act, 2017 - GST Compliance Framework",
        "topic": "tax",
        "acts": ["Central Goods and Services Tax Act, 2017"]
    },
    {
        "text": "Administrative law in India controls exercise of public power through constitutional principles, statutory limits and judicial review. Key doctrines include natural justice, reasonableness, proportionality and non-arbitrariness, with remedies through writ jurisdiction under Articles 32 and 226.",
        "source": "Indian Administrative Law - Judicial Review and Natural Justice",
        "topic": "administrative",
        "acts": ["Constitution of India"]
    },
    {
        "text": "Indian legal system follows a common-law tradition where judicial precedents of constitutional courts play a binding/persuasive role alongside statutes. Statutory law enacted by Parliament/State legislatures co-exists with case-law principles that interpret and apply statutes.",
        "source": "Common Law Tradition in India - Precedent and Statutory Interpretation",
        "topic": "administrative",
        "acts": ["Constitution of India"]
    },
]

