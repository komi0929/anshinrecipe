from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Session feedback and telemetry endpoints
@api_router.post("/v1/telemetry")
async def submit_telemetry(telemetry_data: dict):
    """
    Submit session feedback telemetry
    Expected payload: {
        type: "session_feedback",
        value: "ideal_match" | "not_found" | "allergen_included",
        reasons?: string[],
        note?: string,
        query: string,
        context: string,
        setIds: string[],
        anonId: string,
        ts: string
    }
    """
    logging.info(f"Telemetry received: {telemetry_data}")
    
    # Store in database
    telemetry_entry = {
        **telemetry_data,
        "created_at": datetime.utcnow()
    }
    
    result = await db.session_telemetry.insert_one(telemetry_entry)
    
    return {
        "status": "success", 
        "message": "Telemetry submitted successfully",
        "id": str(result.inserted_id)
    }

@api_router.post("/v1/feedback")  
async def submit_feedback(feedback_data: dict):
    """
    Submit allergen mismatch feedback
    Expected payload: {
        event: "report_allergen_mismatch",
        recipeId?: string,
        context: string,
        query: string,
        anonId: string,
        ts: string
    }
    """
    logging.info(f"Allergen feedback received: {feedback_data}")
    
    # Store in database
    feedback_entry = {
        **feedback_data,
        "created_at": datetime.utcnow()
    }
    
    result = await db.allergen_feedback.insert_one(feedback_entry)
    
    return {
        "status": "success",
        "message": "Allergen feedback submitted successfully", 
        "id": str(result.inserted_id)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
