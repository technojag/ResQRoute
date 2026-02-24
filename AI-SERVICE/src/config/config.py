"""
ResQRoute AI Service - Configuration
All settings loaded from environment variables
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Server
    HOST = os.getenv("AI_HOST", "0.0.0.0")
    PORT = int(os.getenv("AI_PORT", 8000))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
    
    # Google Maps API (for routing)
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    
    # Model weights/paths
    MODEL_DIR = os.getenv("MODEL_DIR", "./models/saved")
    
    # Thresholds
    MAX_AMBULANCE_RANGE_KM = float(os.getenv("MAX_AMBULANCE_RANGE_KM", 30))
    MAX_FIRETRUCK_RANGE_KM = float(os.getenv("MAX_FIRETRUCK_RANGE_KM", 25))
    
    # Hospital weights for scoring
    HOSPITAL_WEIGHT_DISTANCE = 0.35
    HOSPITAL_WEIGHT_CAPACITY = 0.30
    HOSPITAL_WEIGHT_SPECIALTY = 0.25
    HOSPITAL_WEIGHT_RATING = 0.10
    
    # Fire severity thresholds
    FIRE_SEVERITY_MINOR = 1       # 1 truck
    FIRE_SEVERITY_MODERATE = 2    # 2 trucks
    FIRE_SEVERITY_MAJOR = 3       # 3+ trucks
    
    # Ambulance matching weights
    AMBULANCE_WEIGHT_DISTANCE = 0.40
    AMBULANCE_WEIGHT_EQUIPMENT = 0.35
    AMBULANCE_WEIGHT_AVAILABILITY = 0.25
    
    # Redis (for caching predictions)
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL = int(os.getenv("CACHE_TTL", 300))  # 5 minutes
    
    # Backend Node.js URL (for fetching live data)
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")