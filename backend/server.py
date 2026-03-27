import json
import os
from datetime import datetime
from pathlib import Path

import firebase_admin
from fastapi import Depends, FastAPI, File, HTTPException, Query, Security, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from firebase_admin import auth as firebase_auth, credentials
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from fastapi_db import Base, SessionLocal, engine, get_db
from fastapi_models import Camera, Challan, Evidence, ProcessingJob, ReviewAction, UserRole, Violation, Zone
from fastapi_schemas import AnalyticsSummary, ChallanOut, ChallanReview, HealthResponse, JobOut, ViolationOut

DATA_DIR = "data/output"
UPLOAD_DIR = "data/uploads"
ALLOWED_REVIEW_STATUS = {"approved", "rejected", "pending"}
security = HTTPBearer()


def initialize_firebase() -> bool:
    if firebase_admin._apps:
        return True

    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    try:
        if cred_json:
            firebase_admin.initialize_app(credentials.Certificate(json.loads(cred_json)))
            return True

        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
        if os.path.exists(cred_path):
            firebase_admin.initialize_app(credentials.Certificate(cred_path))
            return True
    except Exception as exc:
        print(f"Firebase init warning: {exc}")

    return False


FIREBASE_READY = initialize_firebase()


def api_error(status_code: int, code: str, message: str, details=None):
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
            }
        },
    )


async def verify_firebase_token(
    authorization: HTTPAuthorizationCredentials = Security(security),
):
    if not FIREBASE_READY:
        raise HTTPException(status_code=503, detail="Firebase authentication is not configured")

    token = authorization.credentials
    try:
        return firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {exc}")


def require_role(decoded_token: dict, db: Session, allowed_roles: set[str]):
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Token missing uid")

    role_obj = db.query(UserRole).filter(UserRole.firebase_uid == uid).first()
    if not role_obj:
        role_obj = UserRole(firebase_uid=uid, role="reviewer")
        db.add(role_obj)
        db.commit()
        db.refresh(role_obj)

    if role_obj.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return role_obj


app = FastAPI(title="TrafficVision FastAPI Backend", version="1.1.0")


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    return api_error(exc.status_code, "http_error", str(exc.detail))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return api_error(422, "validation_error", "Request validation failed", {"errors": exc.errors()})


app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for folder in (DATA_DIR, UPLOAD_DIR):
    if not os.path.exists(folder):
        os.makedirs(folder)

app.mount("/images", StaticFiles(directory=DATA_DIR), name="images")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data_if_empty(db)
    finally:
        db.close()


@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}


@app.post("/api/videos/upload", response_model=JobOut)
async def upload_video(video: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = Path(video.filename or "upload.bin").suffix.lower()
    if ext not in {".mp4", ".avi", ".mov", ".mkv"}:
        raise HTTPException(status_code=400, detail="Unsupported video format")

    filename = f"{int(datetime.utcnow().timestamp())}_{video.filename}"
    destination = Path(UPLOAD_DIR) / filename
    content = await video.read()
    destination.write_bytes(content)

    job = ProcessingJob(source_file=str(destination), status="queued", result_summary=None)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@app.get("/api/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def seed_data_if_empty(db: Session):
    if db.query(Challan).count() > 0:
        return

    zone = Zone(name="Nashik Zone", city="Nashik")
    db.add(zone)
    db.flush()

    locations = [
        ("CAM-01", "Sadar Junction", "Sadar"),
        ("CAM-03", "Panchavati Circle", "Panchavati"),
        ("CAM-07", "College Road Junction", "College Road"),
        ("CAM-04", "MG Road Signal", "MG Road"),
        ("CAM-06", "Gangapur Road Flyover", "Gangapur Road"),
    ]
    cameras = {}
    for code, location, ward in locations:
        cam = Camera(code=code, location=location, ward=ward, zone_id=zone.id)
        db.add(cam)
        db.flush()
        cameras[code] = cam

    images = sorted([f for f in os.listdir(DATA_DIR) if f.endswith(".jpg")])
    for image_name in images:
        raw_id = image_name.replace("violation_", "").replace(".jpg", "")
        image_numeric = sum(ord(ch) for ch in raw_id)
        code, location, ward = locations[image_numeric % len(locations)]
        camera = cameras[code]

        violation = Violation(
            violation_type="Triple Riding",
            plate=f"MH-15-AB-{1000 + image_numeric % 9000}",
            confidence=round(85 + (image_numeric % 15) + (image_numeric % 10) / 10, 1),
            detected_at=datetime.utcnow(),
            location=location,
            ward=ward,
            zone="Nashik Zone",
            model_version="yolov8n",
            camera_id=camera.id,
        )
        db.add(violation)
        db.flush()

        db.add(Evidence(violation_id=violation.id, image_url=f"http://localhost:8000/images/{image_name}", frame_ref=raw_id))
        db.add(Challan(violation_id=violation.id, status="pending", fine=2000))

    db.commit()


def serialize_challan(challan: Challan) -> ChallanOut:
    violation = challan.violation
    evidence_url = violation.evidence[0].image_url if violation.evidence else ""

    return ChallanOut(
        id=str(challan.id),
        image=evidence_url,
        type=violation.violation_type,
        location=violation.location,
        ward=violation.ward,
        zone=violation.zone,
        status=challan.status,
        plate=violation.plate,
        time=violation.detected_at.strftime("%H:%M:%S"),
        fine=challan.fine,
        conf=round(violation.confidence, 1),
        detected_at=violation.detected_at,
    )


def serialize_violation(violation: Violation) -> ViolationOut:
    return ViolationOut(
        id=violation.id,
        type=violation.violation_type,
        plate=violation.plate,
        confidence=round(violation.confidence, 1),
        detected_at=violation.detected_at,
        location=violation.location,
        ward=violation.ward,
        zone=violation.zone,
        model_version=violation.model_version,
        challan_status=violation.challan.status if violation.challan else None,
        evidence=[e.image_url for e in violation.evidence],
    )


@app.get("/api/violations", response_model=list[ViolationOut])
def get_violations(
    ward: str | None = None,
    violation_type: str | None = Query(default=None, alias="type"),
    plate: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("detected_at:desc"),
    db: Session = Depends(get_db),
):
    query = db.query(Violation).options(joinedload(Violation.evidence), joinedload(Violation.challan))

    if ward:
        query = query.filter(Violation.ward == ward)
    if violation_type:
        query = query.filter(Violation.violation_type == violation_type)
    if plate:
        query = query.filter(Violation.plate.ilike(f"%{plate}%"))

    sort_field, _, direction = sort.partition(":")
    sort_column = Violation.detected_at if sort_field != "confidence" else Violation.confidence
    query = query.order_by(sort_column.desc() if direction != "asc" else sort_column.asc())

    offset = (page - 1) * page_size
    rows = query.offset(offset).limit(page_size).all()
    return [serialize_violation(row) for row in rows]


@app.get("/api/violations/{violation_id}", response_model=ViolationOut)
def get_violation(violation_id: int, db: Session = Depends(get_db)):
    violation = (
        db.query(Violation)
        .options(joinedload(Violation.evidence), joinedload(Violation.challan))
        .filter(Violation.id == violation_id)
        .first()
    )
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    return serialize_violation(violation)


@app.get("/api/challans", response_model=list[ChallanOut])
def get_challans(
    status: str | None = None,
    ward: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Challan).join(Violation).options(joinedload(Challan.violation).joinedload(Violation.evidence))
    if status:
        query = query.filter(Challan.status == status)
    if ward:
        query = query.filter(Violation.ward == ward)

    rows = query.order_by(Challan.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return [serialize_challan(row) for row in rows]


@app.post("/api/challans/{challan_id}/review", response_model=ChallanOut)
def review_challan(
    challan_id: int,
    review: ChallanReview,
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
):
    require_role(decoded_token, db, {"admin", "reviewer"})

    if review.status not in ALLOWED_REVIEW_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status")

    challan = (
        db.query(Challan)
        .options(joinedload(Challan.violation).joinedload(Violation.evidence))
        .filter(Challan.id == challan_id)
        .first()
    )
    if not challan:
        raise HTTPException(status_code=404, detail="Challan not found")

    challan.status = review.status
    db.add(
        ReviewAction(
            challan_id=challan.id,
            reviewer_uid=decoded_token.get("uid", "unknown"),
            reviewer_email=decoded_token.get("email"),
            action=review.status,
            notes=review.notes,
        )
    )
    db.commit()
    db.refresh(challan)

    return serialize_challan(challan)


@app.get("/api/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary(db: Session = Depends(get_db)):
    total_violations = db.query(func.count(Violation.id)).scalar() or 0
    pending_challans = db.query(func.count(Challan.id)).filter(Challan.status == "pending").scalar() or 0
    approved_challans = db.query(func.count(Challan.id)).filter(Challan.status == "approved").scalar() or 0
    rejected_challans = db.query(func.count(Challan.id)).filter(Challan.status == "rejected").scalar() or 0

    return AnalyticsSummary(
        total_violations=total_violations,
        pending_challans=pending_challans,
        approved_challans=approved_challans,
        rejected_challans=rejected_challans,
    )


# Backward-compatible aliases
@app.get("/challans", response_model=list[ChallanOut])
def legacy_get_challans(status: str | None = None, db: Session = Depends(get_db)):
    return get_challans(status=status, ward=None, page=1, page_size=100, db=db)


@app.post("/challans/{challan_id}/review", response_model=ChallanOut)
def legacy_review_challan(
    challan_id: int,
    review: ChallanReview,
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
):
    return review_challan(challan_id=challan_id, review=review, decoded_token=decoded_token, db=db)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
