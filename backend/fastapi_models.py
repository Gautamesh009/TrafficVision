from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from fastapi_db import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    city = Column(String(120), nullable=False, default="Nashik")

    cameras = relationship("Camera", back_populates="zone")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(40), unique=True, nullable=False, index=True)
    location = Column(String(255), nullable=False)
    ward = Column(String(120), nullable=False)
    status = Column(String(20), nullable=False, default="online")
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)

    zone = relationship("Zone", back_populates="cameras")
    violations = relationship("Violation", back_populates="camera")


class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    violation_type = Column(String(120), nullable=False, index=True)
    plate = Column(String(40), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    detected_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    location = Column(String(255), nullable=False)
    ward = Column(String(120), nullable=False, index=True)
    zone = Column(String(120), nullable=False)
    model_version = Column(String(120), nullable=False, default="yolov8n")
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)

    camera = relationship("Camera", back_populates="violations")
    evidence = relationship("Evidence", back_populates="violation", cascade="all, delete-orphan")
    challan = relationship("Challan", back_populates="violation", uselist=False, cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    frame_ref = Column(String(120), nullable=True)

    violation = relationship("Violation", back_populates="evidence")


class Challan(Base):
    __tablename__ = "challans"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False, unique=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    fine = Column(Integer, nullable=False, default=2000)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    violation = relationship("Violation", back_populates="challan")
    reviews = relationship("ReviewAction", back_populates="challan", cascade="all, delete-orphan")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)
    role = Column(String(40), nullable=False, default="reviewer")


class ReviewAction(Base):
    __tablename__ = "review_actions"

    id = Column(Integer, primary_key=True, index=True)
    challan_id = Column(Integer, ForeignKey("challans.id"), nullable=False)
    reviewer_uid = Column(String(128), nullable=False)
    reviewer_email = Column(String(255), nullable=True)
    action = Column(String(20), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    challan = relationship("Challan", back_populates="reviews")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    source_file = Column(String(500), nullable=False)
    status = Column(String(30), nullable=False, default="queued", index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    result_summary = Column(Text, nullable=True)
