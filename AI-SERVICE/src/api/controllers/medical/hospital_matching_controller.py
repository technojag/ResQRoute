"""
ResQRoute AI - Hospital Matching Controller
Handles /api/v1/medical/hospital endpoints
"""

from flask import Blueprint, request, jsonify
from models.medical.government_hospital_matcher import GovernmentHospitalMatcher
from models.medical.private_hospital_matcher import PrivateHospitalMatcher
from services.preprocessing import DataPreprocessor
from utils.logger import setup_logger

hospital_bp = Blueprint("hospital", __name__)
govt_matcher = GovernmentHospitalMatcher()
private_matcher = PrivateHospitalMatcher()
preprocessor = DataPreprocessor()
logger = setup_logger(__name__)


@hospital_bp.route("/government/select", methods=["POST"])
def select_government_hospital():
    """
    POST /api/v1/medical/hospital/government/select
    
    Auto-select the nearest capable government hospital (FREE).
    
    Request body:
        {
          "patient_lat": 28.6139,
          "patient_lon": 77.2090,
          "emergency_type": "cardiac_arrest",
          "government_hospitals": [ ...from database... ]
        }
    
    Response:
        {
          "selected_hospital": { name, distance_km, eta_minutes, cost: "FREE", capabilities },
          "backup_options": [ ...2 more govt hospitals... ]
        }
    """
    try:
        data = request.get_json()
        processed = preprocessor.preprocess_hospital_request(data)
        hospitals = data.get("government_hospitals", [])
        
        selected = govt_matcher.select_government_hospital(processed, hospitals)
        all_options = govt_matcher.get_all_govt_options(processed, hospitals, top_n=3)
        
        return jsonify({
            "success": True,
            "selected_hospital": selected,
            "backup_options": all_options[1:] if len(all_options) > 1 else [],
        }), 200
    
    except Exception as e:
        logger.error(f"Error in select_government_hospital: {e}")
        return jsonify({"error": str(e)}), 500


@hospital_bp.route("/private/recommend", methods=["POST"])
def recommend_private_hospitals():
    """
    POST /api/v1/medical/hospital/private/recommend
    
    Get AI-ranked private hospital recommendations.
    
    Request body:
        {
          "patient_lat": 28.6139,
          "patient_lon": 77.2090,
          "emergency_type": "cardiac_arrest",
          "insurance_provider": "Star Health",
          "budget_range": "medium",
          "private_hospitals": [ ...from database... ]
        }
    
    Response:
        {
          "recommendations": [
            { name, match_score, distance_km, eta_minutes, estimated_cost_inr, match_reason }
          ]
        }
    """
    try:
        data = request.get_json()
        processed = preprocessor.preprocess_hospital_request(data)
        hospitals = data.get("private_hospitals", [])
        top_n = data.get("top_n", 5)
        
        recommendations = private_matcher.get_recommendations(processed, hospitals, top_n=top_n)
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "total_found": len(recommendations),
        }), 200
    
    except Exception as e:
        logger.error(f"Error in recommend_private_hospitals: {e}")
        return jsonify({"error": str(e)}), 500