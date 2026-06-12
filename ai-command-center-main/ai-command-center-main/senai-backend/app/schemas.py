from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Email Ingestion
class EmailIngest(BaseModel):
    sender: str
    subject: str
    body: str
    message_id: Optional[str] = None

# Status Update
class StatusUpdate(BaseModel):
    status: str

# Response Draft Update
class DraftUpdate(BaseModel):
    body: str

# Response Body for direct respond
class RespondBody(BaseModel):
    body: str

# Contact Response
class ContactResponse(BaseModel):
    email: str
    name: str
    company: Optional[str] = None
    status: str
    account_value: float
    churn_risk_score: float
    created_at: datetime
    last_contact_at: datetime

    class Config:
        from_attributes = True

# Thread Response
class ThreadResponse(BaseModel):
    id: str
    subject: str
    contact_email: str
    status: str
    category: Optional[str] = None
    sentiment: Optional[str] = None
    urgency: str
    confidence: float
    first_seen_at: datetime
    last_updated_at: datetime

    class Config:
        from_attributes = True

# Email Response
class EmailResponse(BaseModel):
    id: str
    thread_id: str
    sender_email: str
    body: str
    is_agent_draft: bool
    message_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Document Add Schema
class DocumentAdd(BaseModel):
    name: str
    content: str
