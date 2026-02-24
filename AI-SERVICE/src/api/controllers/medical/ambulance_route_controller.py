"""
ResQRoute AI - Ambulance Route Controller
Handles /api/v1/medical/ambulance endpoints
"""

from flask import Blueprint, request, jsonify
from models.medical.ambulance_matcher import AmbulanceMatcher
from models.medical.route_optimizer import RouteOptimizer
from services.preprocessing import DataPreprocessor
from utils.logger import setup_logger

ambulance_bp = Blueprint("ambulance", __name__)
matcher = AmbulanceMatcher()
optimizer = RouteOptimizer()
preprocessor = DataPreprocessor()
logger = setup_logger(__name__)


@ambulance_bp.route("/match", methods=["POST"])
def match_ambulance():
    """
    POST /api/v1/medical/ambulance/match
    
    Find the best ambulance for an emergency.
    
    Request body:
        {
          "patient_lat": 28.6139,
          "patient_lon": 77.2090,
          "emergency_type": "cardiac_arrest",
          "patient_age": 65,
          "conscious": false,
          "available_ambulances": [ ...from database... ]
        }
    
    Response:
        {
          "best_ambulance": { id, name, eta_minutes, match_score, ... },
          "alternatives": [ ...top 3... ]
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400
        
        # Preprocess raw input
        processed_request = preprocessor.preprocess_ambulance_request(data)
        ambulances = data.get("available_ambulances", [])
        
        if not ambulances:
            return jsonify({"error": "No ambulances data provided"}), 400
        
        # Match
        best = matcher.find_best_ambulance(processed_request, ambulances)
        top3 = matcher.find_top_ambulances(processed_request, ambulances, top_n=3)
        
        return jsonify({
            "success": True,
            "best_ambulance": best,
            "alternatives": top3[1:],  # Exclude the best from alternatives
        }), 200
    
    except Exception as e:
        logger.error(f"Error in match_ambulance: {e}")
        return jsonify({"error": str(e)}), 500


@ambulance_bp.route("/route", methods=["POST"])
def optimize_ambulance_route():
    """
    POST /api/v1/medical/ambulance/route
    
    Generate optimized route + green corridor signals for dispatched ambulance.
    
    Request body:
        {
          "ambulance_lat": 28.6200,
          "ambulance_lon": 77.2100,
          "patient_lat": 28.6139,
          "patient_lon": 77.2090,
          "is_critical": true
        }
    
    Response:
        {
          "route": { distance_km, eta_minutes, waypoints, traffic_signals }
        }
    """
    try:
        data = request.get_json()
        
        origin = {"lat": data["ambulance_lat"], "lon": data["ambulance_lon"]}
        destination = {"lat": data["patient_lat"], "lon": data["patient_lon"]}
        
        route = optimizer.optimize_route(
            origin=origin,
            destination=destination,
            vehicle_type="ambulance",
            is_critical=data.get("is_critical", True)
        )
        
        return jsonify({"success": True, "route": route}), 200
    
    except Exception as e:
        logger.error(f"Error in optimize_ambulance_route: {e}")
        return jsonify({"error": str(e)}), 500