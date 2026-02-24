"""
ResQRoute AI - Fire Severity Controller
Handles /api/v1/fire/severity endpoints
"""

from flask import Blueprint, request, jsonify
from models.fire.fire_classifier import FireClassifier
from services.preprocessing import DataPreprocessor
from utils.logger import setup_logger

fire_severity_bp = Blueprint("fire_severity", __name__)
classifier = FireClassifier()
preprocessor = DataPreprocessor()
logger = setup_logger(__name__)


@fire_severity_bp.route("/classify", methods=["POST"])
def classify_fire():
    """
    POST /api/v1/fire/severity/classify
    
    Classify fire severity level (1-4) and get response recommendations.
    
    Request body:
        {
          "fire_type": "building",
          "area_sqm": 300,
          "floors_affected": 4,
          "people_trapped": true,
          "approximate_occupants": 40,
          "hazmat_present": false,
          "wind_speed_kmh": 25,
          "building_type": "residential"
        }
    
    Response:
        {
          "severity_level": 3,
          "severity_label": "Major",
          "trucks_recommended": 3,
          "requires_evacuation": true,
          "recommendations": [...]
        }
    """
    try:
        data = request.get_json()
        processed = preprocessor.preprocess_fire_request(data)
        result = classifier.classify(processed)
        
        return jsonify({"success": True, **result}), 200
    
    except Exception as e:
        logger.error(f"Error in classify_fire: {e}")
        return jsonify({"error": str(e)}), 500