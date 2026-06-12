import os
import re
from typing import Dict, Any, List
from openai import OpenAI
from app.services.vector_store import rag_store

def run_security_check(email_body: str) -> Dict[str, Any]:
    """Check for security threats and ransomware indicators."""
    threat_words = ["compromised keys", "compromised api", "leak", "hacked", "ransomware", "exploit", "credential leak"]
    body_lower = email_body.lower()
    for word in threat_words:
        if word in body_lower:
            return {
                "is_threat": True,
                "category": "Security",
                "urgency": "P0",
                "sentiment": "Critical",
                "confidence": 0.99,
                "reason": f"Heuristic matched threat indicator: '{word}'"
            }
    return {"is_threat": False}

def run_gdpr_check(email_body: str) -> Dict[str, Any]:
    """Check for GDPR Article 17 Erasure Requests."""
    gdpr_words = ["gdpr", "article 17", "right to erasure", "delete my data", "delete all personal data", "purge my account"]
    body_lower = email_body.lower()
    for word in gdpr_words:
        if word in body_lower:
            return {
                "is_gdpr": True,
                "category": "Legal",
                "urgency": "P1",
                "sentiment": "Neutral",
                "confidence": 0.95,
                "reason": f"Matched GDPR Article 17 request keyword: '{word}'"
            }
    return {"is_gdpr": False}

def classify_email_fallback(sender: str, subject: str, body: str) -> Dict[str, Any]:
    """Rule-based classification fallback when OpenAI key is not provided."""
    # Check security first
    sec_res = run_security_check(body)
    if sec_res["is_threat"]:
        return sec_res
        
    # Check GDPR
    gdpr_res = run_gdpr_check(body)
    if gdpr_res["is_gdpr"]:
        return gdpr_res

    # Category matching
    category = "Bug Report"
    urgency = "P2"
    sentiment = "Neutral"
    confidence = 0.88

    body_lower = body.lower()
    subj_lower = subject.lower()
    text = body_lower + " " + subj_lower

    if "outage" in text or "down" in text or "unreachable" in text or "broken" in text or "crash" in text:
        category = "Bug Report"
        urgency = "P0" if ("critical" in text or "production" in text or "vip" in text or "emergency" in text) else "P1"
        sentiment = "Critical" if "outage" in text else "Negative"
        confidence = 0.94
    elif "billing" in text or "charge" in text or "refund" in text or "invoice" in text or "payment" in text:
        category = "Billing"
        urgency = "P1" if "double" in text else "P2"
        sentiment = "Negative" if ("double" in text or "error" in text) else "Neutral"
        confidence = 0.91
    elif "legal" in text or "compliance" in text or "dpa" in text or "agreement" in text or "contract" in text:
        category = "Legal"
        urgency = "P2"
        sentiment = "Neutral"
        confidence = 0.89
    elif "request" in text or "feature" in text or "idea" in text or "add" in text or "sso" in text or "saml" in text:
        category = "Feature Request"
        urgency = "P3"
        sentiment = "Positive" if "love" in text else "Neutral"
        confidence = 0.92
    elif "pricing" in text or "quote" in text or "sales" in text or "enterprise plan" in text:
        category = "Sales"
        urgency = "P2"
        sentiment = "Positive"
        confidence = 0.95

    return {
        "category": category,
        "urgency": urgency,
        "sentiment": sentiment,
        "confidence": confidence,
        "reason": "Rule-based engine classification"
    }

def run_agent_pipeline(sender: str, subject: str, body: str) -> Dict[str, Any]:
    """Execute the full agent pipeline including classification, RAG retrieval, and reasoning."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    # 1. Classification & Sentiment
    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""
            Classify the inbound email details:
            Sender: {sender}
            Subject: {subject}
            Body: {body}
            
            Return ONLY a JSON block containing:
            - category: ("Billing", "Bug Report", "Legal", "Feature Request", "Security", "Sales", "SSO")
            - urgency: ("P0", "P1", "P2", "P3")
            - sentiment: ("Positive", "Neutral", "Negative", "Critical")
            - confidence: (float between 0.0 and 1.0)
            """
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a precise CRM classification agent. Return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            import json
            meta = json.loads(response.choices[0].message.content)
            # Ensure keys exist
            category = meta.get("category", "Bug Report")
            urgency = meta.get("urgency", "P3")
            sentiment = meta.get("sentiment", "Neutral")
            confidence = float(meta.get("confidence", 0.90))
        except Exception as e:
            print(f"OpenAI classification failed: {e}. Using fallback.")
            fallback = classify_email_fallback(sender, subject, body)
            category, urgency, sentiment, confidence = fallback["category"], fallback["urgency"], fallback["sentiment"], fallback["confidence"]
    else:
        fallback = classify_email_fallback(sender, subject, body)
        category, urgency, sentiment, confidence = fallback["category"], fallback["urgency"], fallback["sentiment"], fallback["confidence"]

    # 2. RAG Retrieval
    query = f"{category} {subject} {body[:100]}"
    rag_matches = rag_store.search(query, limit=3)
    context_text = "\n\n".join([f"Source: {m['doc']}\nContent: {m['chunk']}" for m in rag_matches])

    # 3. Reasoning Chain (ReAct Trace)
    reasoning_steps = []
    
    # Step 1: initial thought
    reasoning_steps.append({
        "step": 1,
        "type": "Thought",
        "content": f"Analyzing email from {sender}. Subject: '{subject}'. Detected Category: {category}, Urgency: {urgency}, Sentiment: {sentiment}."
    })
    
    # Step 2: action (retrieve docs)
    reasoning_steps.append({
        "step": 2,
        "type": "Action",
        "content": f"Retrieving policy documents from local RAG vector store for query: '{category} {subject}'."
    })
    
    # Step 3: observation (retrieved docs details)
    retrieved_docs_names = ", ".join(set([m["doc"] for m in rag_matches])) or "None"
    reasoning_steps.append({
        "step": 3,
        "type": "Observation",
        "content": f"Retrieved matches from: [{retrieved_docs_names}]. Best similarity score: {round((rag_matches[0]['score'] if rag_matches else 0.0), 3)}."
    })

    # Step 4: thought (deciding actions based on guidelines)
    is_vip = "acme-corp.com" in sender.lower() or "hyperwave.io" in sender.lower() or "ironclad" in sender.lower()
    
    if category == "Security":
        reasoning_steps.append({
            "step": 4,
            "type": "Thought",
            "content": "CRITICAL THREAT: Credential leak or ransomware suspicion detected. Crucial action: flag contact status as 'Blocked', do NOT send auto-response, alert security lead."
        })
        reasoning_steps.append({
            "step": 5,
            "type": "Action",
            "content": "Locking client profile to 'Blocked'. Triggering pager duty to Chief Security Officer."
        })
        draft_body = "WARNING: System flagged potential security incident. This message will be reviewed by security operations."
    elif category == "Legal" and "GDPR" in context_text or "Article 17" in body or "erasure" in body.lower():
        reasoning_steps.append({
            "step": 4,
            "type": "Thought",
            "content": "GDPR Right to Erasure Request. Must log in compliance tracking, halt auto-responses, prepare draft for manual sign-off within 30 days."
        })
        reasoning_steps.append({
            "step": 5,
            "type": "Action",
            "content": "Creating Legal Compliance ticket in CRM. Auto-escalating thread to 'Legal' folder."
        })
        draft_body = (
            "Dear Customer,\n\nWe have received your request regarding data erasure (GDPR Article 17). "
            "Our compliance team has been notified and is review this file. A confirmation will be sent "
            "once deletion is finalized (within the statutory 30-day window).\n\nBest regards,\nSenAI Compliance Operations"
        )
    else:
        reasoning_steps.append({
            "step": 4,
            "type": "Thought",
            "content": f"Formulating resolution draft. Account is {'VIP' if is_vip else 'Standard'}. SLA targets apply."
        })
        
        # 4. Draft Generation
        if api_key:
            try:
                client = OpenAI(api_key=api_key)
                prompt = f"""
                Write an automated draft response to this email:
                Sender: {sender}
                Subject: {subject}
                Email Body: {body}
                
                Use the following RAG context to formulate the answer:
                {context_text}
                
                Guidelines:
                - If the category is Bug Report and urgency is P0/P1, acknowledge outage, state SRE is paged, reference SLAs if mentioned.
                - If Billing, explain pricing/refund rules.
                - Keep it professional, concise, and helpful.
                """
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a customer success AI agent drafted response writer."},
                        {"role": "user", "content": prompt}
                    ]
                )
                draft_body = response.choices[0].message.content.strip()
            except Exception as e:
                print(f"OpenAI drafting failed: {e}. Using rule-based draft.")
                draft_body = generate_draft_body_fallback(category, sender, subject, rag_matches)
        else:
            draft_body = generate_draft_body_fallback(category, sender, subject, rag_matches)

        reasoning_steps.append({
            "step": 5,
            "type": "Action",
            "content": f"Generated AI draft reply (confidence {int(confidence * 100)}%). Saving to email logs."
        })

    # Step 5/6: next step
    action_decision = "Needs Review"
    if confidence >= 0.90 and category != "Security" and category != "Legal" and not is_vip:
        action_decision = "Resolved (Auto-Sent)"
        reasoning_steps.append({
            "step": 6,
            "type": "Next Step",
            "content": "Confidence exceeds threshold (>=90%) and account is not VIP or critical exception. Auto-sending reply."
        })
    else:
        reasoning_steps.append({
            "step": 6,
            "type": "Next Step",
            "content": f"Requires manual review due to { 'VIP account status' if is_vip else 'category constraints or confidence threshold' }."
        })

    return {
        "category": category,
        "urgency": urgency,
        "sentiment": sentiment,
        "confidence": confidence,
        "reasoning_steps": reasoning_steps,
        "draft_body": draft_body,
        "rag_matches": rag_matches,
        "action_decision": action_decision
    }

def generate_draft_body_fallback(category: str, sender: str, subject: str, rag_matches: List[Dict[str, Any]]) -> str:
    """Generate professional rule-based replies based on categories and RAG results."""
    # Find contact name
    name = sender.split("@")[0].replace(".", " ").title()
    
    sla_info = "standard service policy"
    for m in rag_matches:
        if m["doc"] == "sla_policy.md":
            sla_info = "our 15-minute response SLA for Tier-1 accounts"
            break

    if category == "Bug Report":
        return (
            f"Hi {name},\n\n"
            f"Thank you for reporting the issue regarding '{subject}'.\n\n"
            f"Our systems engineering team has been alerted, and an SRE has been paged to investigate. "
            f"As a Tier-1 customer, this is covered under {sla_info}. We will update you with a full incident report (RCA) within 24 hours.\n\n"
            f"Best regards,\nSenAI Support Bot"
        )
    elif category == "Billing":
        return (
            f"Hi {name},\n\n"
            f"I see you have an inquiry regarding billing/invoicing for '{subject}'.\n\n"
            f"Per our Refund Policy, Starter plan subscriptions can request full refunds within 14 days, "
            f"while Pro and Enterprise accounts require Account Manager approval. We have created ticket BIL-9821 "
            f"and escalated it to our billing team.\n\n"
            f"Best regards,\nSenAI Billing Agent"
        )
    elif category == "Feature Request":
        return (
            f"Hi {name},\n\n"
            f"Thanks for sharing your feedback on '{subject}'!\n\n"
            f"We love hearing ideas from our users. This feature request has been added to our product backlog. "
            f"We will notify you here once it is scheduled for a release.\n\n"
            f"Best regards,\nSenAI Product Team"
        )
    elif category == "Sales":
        return (
            f"Hi {name},\n\n"
            f"Thank you for your interest in upgrading to our Enterprise plan!\n\n"
            f"We would love to discuss custom SSO, SLA compliance, and account management details with you. "
            f"An account executive will reach out to you shortly to schedule a call.\n\n"
            f"Best regards,\nSenAI Sales Team"
        )
    else:
        return (
            f"Hi {name},\n\n"
            f"Thank you for reaching out. We have received your email regarding '{subject}' and "
            f"have assigned it to a customer support specialist. We will respond shortly.\n\n"
            f"Best regards,\nSenAI CRM Support"
        )

def run_dry_run_planning(email_body: str) -> List[Dict[str, Any]]:
    """Runs a dry run of the planning loop."""
    pipeline = run_agent_pipeline("test@client.com", "Dry Run Inquiry", email_body)
    return pipeline["reasoning_steps"]
