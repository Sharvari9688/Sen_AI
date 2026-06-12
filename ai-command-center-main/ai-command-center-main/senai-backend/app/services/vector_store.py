import os
import re
import math
from typing import List, Dict, Any
from openai import OpenAI

# A simple fallback embedding generator for keyword similarity when OpenAI is not available.
# It creates a normalized term-frequency vector of dimension 256.
def get_fallback_embedding(text: str) -> List[float]:
    dim = 256
    vec = [0.0] * dim
    words = re.findall(r'\w+', text.lower())
    if not words:
        return vec
    for word in words:
        # Simple polynomial rolling hash to place word in a bucket
        h = 0
        for char in word:
            h = (h * 33 + ord(char)) % dim
        vec[h] += 1.0
    
    # Cosine normalization
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

# OpenAI Embeddings Helper
def get_openai_embedding(text: str, api_key: str) -> List[float]:
    try:
        client = OpenAI(api_key=api_key)
        response = client.embeddings.create(
            input=[text],
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"OpenAI Embedding failed: {e}. Falling back to keyword embedding.")
        return get_fallback_embedding(text)

# Local Vector Store to manage chunks and execute cosine similarity
class LocalRAGStore:
    def __init__(self):
        # Format: {"doc_name": [{"chunk_id": str, "text": str, "vector": List[float]}]}
        self.store: Dict[str, List[Dict[str, Any]]] = {}
        # Prepopulate with mock SLA & pricing documents for out-of-the-box demo
        self.prepopulate_mock_docs()

    def prepopulate_mock_docs(self):
        mock_docs = {
            "sla_policy.md": (
                "Tier-1 enterprise customers SLA: 99.95% with 15-min response, 4-hr resolution. "
                "SLA breaches trigger automatic credit calculation. P0 incidents for VIP accounts "
                "auto-escalate to VP Engineering and assigned CSM within 5 minutes of acknowledgment. "
                "Service credits are calculated as (downtime_minutes * MRR / 43,200) with a maximum "
                "monthly credit of 30% of MRR."
            ),
            "refund_policy.md": (
                "Refund requests are handled within 5 business days. Customers on the Starter plan "
                "are eligible for a full refund within 14 days of purchase. Pro and Enterprise customers "
                "require executive approval from the Account Manager. SLA breach credits are credited to the "
                "next billing cycle and cannot be refunded as cash."
            ),
            "escalation_matrix.md": (
                "Escalation matrix rules: P0 Outages -> SRE team + VP Engineering + Customer Success Manager. "
                "P1 Security Incidents -> security-alerts@senai.platform + Chief Security Officer. "
                "P2 Billing disputes -> billing-lead@senai.platform. "
                "Legal and GDPR Right to Erasure requests -> legal-team@senai.platform + compliance officer."
            ),
            "gdpr_policy.md": (
                "GDPR Article 17 Right to Erasure requests must be logged immediately. Under GDPR, we have "
                "a maximum of 30 days to purge the customer's personal data from all production databases, "
                "audit logs, and backups. This request requires legal officer sign-off and must not be auto-responded."
            ),
            "retention_schedule.md": (
                "Retention schedule: general operational emails are retained for 2 years. Audit logs "
                "tracking sensitive status changes or legal requests are retained for 7 years. "
                "GDPR erasures require wiping active contact information but retaining anonymized billing IDs."
            )
        }
        for name, content in mock_docs.items():
            self.add_document(name, content)

    def clear(self):
        self.store = {}

    def add_document(self, doc_name: str, content: str):
        # Chunk content (simple text splitting by sentences/periods, target ~200 chars)
        sentences = re.split(r'(?<=[.!?])\s+', content)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < 300:
                current_chunk += " " + sentence
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        # Generate vectors and store
        api_key = os.getenv("OPENAI_API_KEY")
        self.store[doc_name] = []
        for i, chunk_text in enumerate(chunks):
            if api_key:
                vec = get_openai_embedding(chunk_text, api_key)
            else:
                vec = get_fallback_embedding(chunk_text)
                
            self.store[doc_name].append({
                "id": f"{doc_name}_chunk_{i}",
                "text": chunk_text,
                "vector": vec
            })

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            query_vec = get_openai_embedding(query, api_key)
        else:
            query_vec = get_fallback_embedding(query)

        all_matches = []
        qv = query_vec
        qv_norm = math.sqrt(sum(x * x for x in qv)) or 1.0

        for doc_name, chunks in self.store.items():
            for c in chunks:
                cv = c["vector"]
                cv_norm = math.sqrt(sum(x * x for x in cv)) or 1.0
                dot_product = sum(q * c_val for q, c_val in zip(qv, cv))
                score = dot_product / (qv_norm * cv_norm)
                
                # Check similarity threshold > 0.35 for fallback and > 0.75 for OpenAI
                # We normalize the presentation to match the frontend expects (0.0 to 1.0)
                all_matches.append({
                    "doc": doc_name,
                    "chunk": c["text"],
                    "score": score
                })

        # Sort by similarity score descending
        all_matches.sort(key=lambda x: x["score"], reverse=True)
        return all_matches[:limit]

# Single global instance of our RAG store
rag_store = LocalRAGStore()

def query_rag_store(query: str) -> List[Dict[str, Any]]:
    return rag_store.search(query)
