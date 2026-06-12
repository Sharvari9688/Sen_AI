from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Contact(Base):
    __tablename__ = "contacts"
    
    email = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String)
    status = Column(String, default="Active")  # VIP, Blocked, Active, Churned
    account_value = Column(Float, default=0.0)  # ARR
    churn_risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_contact_at = Column(DateTime, default=datetime.utcnow)
    
    threads = relationship("Thread", back_populates="contact")

class Thread(Base):
    __tablename__ = "threads"
    
    id = Column(String, primary_key=True)
    subject = Column(String, nullable=False)
    contact_email = Column(String, ForeignKey("contacts.email", ondelete="CASCADE"))
    status = Column(String, default="Open")  # Open, Resolved, Escalated, Ignored, Needs Review, Spam, Security, Legal, Compliance
    category = Column(String)  # Billing, Bug Report, Legal, Feature Request, Security, SSO, Spam, Compliance
    sentiment = Column(String)  # Positive, Neutral, Negative, Critical
    urgency = Column(String, default="P3")  # P0, P1, P2, P3
    confidence = Column(Float, default=1.0)
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow)
    
    contact = relationship("Contact", back_populates="threads")
    emails = relationship("Email", back_populates="thread")

class Email(Base):
    __tablename__ = "emails"
    
    id = Column(String, primary_key=True)
    thread_id = Column(String, ForeignKey("threads.id", ondelete="CASCADE"))
    sender_email = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    is_agent_draft = Column(Boolean, default=False)
    message_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    thread = relationship("Thread", back_populates="emails")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True)
    entity_type = Column(String, nullable=False)  # thread, contact, email
    entity_id = Column(String, nullable=False)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    
    name = Column(String, primary_key=True)
    size = Column(String)
    chunks = Column(Integer, default=0)
    embedded = Column(Boolean, default=True)
    retrievals = Column(Integer, default=0)
    accuracy = Column(Float, default=95.0)
    content = Column(Text, nullable=False)
    updated = Column(DateTime, default=datetime.utcnow)
