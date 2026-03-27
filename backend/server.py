import json
import os
from datetime import datetime

import firebase_admin
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from firebase_admin import auth as firebase_auth, credentials
from sqlalchemy.orm import Session, joinedload

from fastapi_db import Base, SessionLocal, engine, get_db
from fastapi_models import Camera, Challan, Evidence, ReviewAction, Violation, Zone
from fastapi_schemas import ChallanOut, ChallanReview, HealthResponse

DATA_DIR = "data/output"

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


app = FastAPI(title="TrafficVision FastAPI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)
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


@app.get("/challans", response_model=list[ChallanOut])
def get_challans(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Challan).options(joinedload(Challan.violation).joinedload(Violation.evidence))
    if status:
        query = query.filter(Challan.status == status)
    challans = query.order_by(Challan.created_at.desc()).all()
    return [serialize_challan(challan) for challan in challans]


@app.post("/challans/{challan_id}/review", response_model=ChallanOut)
def review_challan(
    challan_id: int,
    review: ChallanReview,
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db),
):
    if review.status not in {"approved", "rejected", "pending"}:
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
