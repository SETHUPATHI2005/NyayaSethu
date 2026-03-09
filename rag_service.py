"""
services/rag_service.py â€” Retrieval Augmented Generation
Embeds queries and retrieves relevant legal context from vector DB.
"""
import os
import json
import logging
from typing import List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

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
        self.corpus    = self._load_corpus()
        self._init_vector_index()

    # â”€â”€ Corpus â”€â”€
    def _load_corpus(self) -> List[Dict]:
        """Load legal knowledge base from JSON files."""
        data_dir = Path(__file__).parent.parent / "data"
        corpus = []

        for json_file in data_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    entries = json.load(f)
                    corpus.extend(entries)
                logger.info(f"Loaded {len(entries)} entries from {json_file.name}")
            except Exception as e:
                logger.error(f"Error loading {json_file}: {e}")

        if not corpus:
            # Seed with built-in fallback corpus
            corpus = FALLBACK_CORPUS

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
        """Simple TF-style keyword matching fallback."""
        q_words = set(query.lower().split())
        scored = []
        for entry in self.corpus:
            text_words = set(entry["text"].lower().split())
            overlap = len(q_words & text_words)
            if overlap > 0:
                scored.append((overlap, entry))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [e for _, e in scored[:top_k]]


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
]

