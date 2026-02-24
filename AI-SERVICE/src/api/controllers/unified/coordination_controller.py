"""
ResQRoute AI - Multi-Emergency Coordination Controller
Handles /api/v1/unified endpoints
"""

from flask import Blueprint, request, jsonify
from models.unified.emergency_coordinator import EmergencyCoordinator
from services.preprocessing import DataPreprocessor
from utils.logger import setup_logger

coordination_bp = Blueprint("coordination", __name__)
coordinator = EmergencyCoordinator()
preprocessor = DataPreprocessor()
logger = setup_logger(__name__)


@coordination_bp.route("/coordinate", methods=["POST"])
def coordinate_emergency():
    """
    POST /api/v1/unified/coordinate
    
    Coordinate a multi-emergency response (fire + medical combined).
    
    Request body:
        {
          "emergency_type": "accident_with_fire",
          "location": { "lat": 28.5, "lon": 77.2 },
          "has_fire": true,
          "fire_data": { ...fire details... },
          "estimated_casualties": 3,
          "has_critical_patients": true,
          "available_ambulances": [...],
          "available_trucks": [...],
          "nearby_hospitals": [...]
        }
    
    Response:
        Full coordination plan with dispatch sequence, routes, hospital alerts, etc.
    """
    try:
        data = request.get_json()
        
        # Preprocess fire component if present
        if data.get("has_fire") and data.get("fire_data"):
            data["fire_data"] = preprocessor.preprocess_fire_request(data["fire_data"])
            data["fire_data"]["location"] = data.get("location", {})
        
        result = coordinator.coordinate_multi_emergency(
            emergency=data,
            available_ambulances=data.get("available_ambulances", []),
            available_trucks=data.get("available_trucks", []),
            nearby_hospitals=data.get("nearby_hospitals", [])
        )
        
        return jsonify({"success": True, **result}), 200
    
    except Exception as e:
        logger.error(f"Error in coordinate_emergency: {e}")
        return jsonify({"error": str(e)}), 500