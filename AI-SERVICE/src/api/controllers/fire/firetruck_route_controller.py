"""
ResQRoute AI - Fire Truck Route Controller
Handles /api/v1/fire/truck endpoints
"""

from flask import Blueprint, request, jsonify
from models.fire.firetruck_matcher import FiretruckMatcher
from models.fire.fire_classifier import FireClassifier
from models.medical.route_optimizer import RouteOptimizer
from services.preprocessing import DataPreprocessor
from utils.logger import setup_logger

firetruck_bp = Blueprint("firetruck", __name__)
matcher = FiretruckMatcher()
classifier = FireClassifier()
optimizer = RouteOptimizer()
preprocessor = DataPreprocessor()
logger = setup_logger(__name__)


@firetruck_bp.route("/match", methods=["POST"])
def match_firetrucks():
    """
    POST /api/v1/fire/truck/match
    
    Match and dispatch fire trucks for an incident.
    
    Request body:
        {
          "fire_lat": 28.5355,
          "fire_lon": 77.3910,
          "fire_type": "building",
          "floors_affected": 3,
          "people_trapped": true,
          "hazmat_present": false,
          "area_sqm": 200,
          "wind_speed_kmh": 20,
          "available_trucks": [ ...from database... ]
        }
    
    Response:
        { "dispatch_plan": [...], "trucks_needed": 2, "severity_level": 2 }
    """
    try:
        data = request.get_json()
        processed = preprocessor.preprocess_fire_request(data)
        trucks = data.get("available_trucks", [])
        
        # First classify to get severity
        classification = classifier.classify(processed)
        severity = classification["severity_level"]
        
        # Then match trucks
        result = matcher.match_firetrucks(processed, trucks, severity)
        result["fire_classification"] = classification
        
        return jsonify({"success": True, **result}), 200
    
    except Exception as e:
        logger.error(f"Error in match_firetrucks: {e}")
        return jsonify({"error": str(e)}), 500


@firetruck_bp.route("/route", methods=["POST"])
def optimize_firetruck_routes():
    """
    POST /api/v1/fire/truck/route
    Generate routes for multiple fire trucks with staggered timing.
    """
    try:
        data = request.get_json()
        trucks = data.get("trucks", [])
        destination = {"lat": data["fire_lat"], "lon": data["fire_lon"]}
        
        routes = optimizer.optimize_multi_vehicle_route(trucks, destination, "firetruck")
        
        return jsonify({"success": True, "routes": routes, "total_vehicles": len(routes)}), 200
    
    except Exception as e:
        logger.error(f"Error in optimize_firetruck_routes: {e}")
        return jsonify({"error": str(e)}), 500