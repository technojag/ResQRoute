"""
ResQRoute AI Service - Main Flask Application
Handles all AI/ML predictions for emergency response
"""

from flask import Flask
from flask_cors import CORS
from api.routes import register_routes
from config.config import Config
from utils.logger import setup_logger

# Initialize logger
logger = setup_logger(__name__)

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend/backend communication
    CORS(app, origins=Config.ALLOWED_ORIGINS)
    
    # Register all API routes
    register_routes(app)
    
    logger.info("🚀 ResQRoute AI Service initialized successfully")
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )