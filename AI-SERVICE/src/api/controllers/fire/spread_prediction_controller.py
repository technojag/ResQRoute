"""
ResQRoute AI - Fire Spread Prediction Controller
Handles /api/v1/fire/spread endpoints
"""

from flask import Blueprint, request, jsonify
from models.fire.spread_predictor import FireSpreadPredictor
from services.preprocessing import DataPreprocessor
from utils.logger import setup_logger

spread_bp = Blueprint("spread", __name__)
predictor = FireSpreadPredictor()
preprocessor = DataPreprocessor()
logger = setup_logger(__name__)


@spread_bp.route("/predict", methods=["POST"])
def predict_spread():
    """
    POST /api/v1/fire/spread/predict
    
    Predict fire spread radius and affected zones over time.
    Used to determine evacuation zones and resource positioning.
    
    Request body:
        {
          "fire_lat": 28.5355,
          "fire_lon": 77.3910,
          "current_radius_m": 15,
          "fuel_type": "wood",
          "wind_speed_kmh": 30,
          "wind_direction": "NE",
          "humidity_percent": 25,
          "temperature_celsius": 38,
          "minutes_burning": 10
        }
    
    Response:
        {
          "predictions": [
            { time_minutes: 5,  predicted_radius_m: 52, affected_area_sqm: 8495 },
            { time_minutes: 10, predicted_radius_m: 89, affected_area_sqm: 24857 },
            ...
          ],
          "evacuation_radius_m": 178,
          "model_confidence": 0.95
        }
    """
    try:
        data = request.get_json()
        processed = preprocessor.preprocess_spread_request(data)
        result = predictor.predict_spread(processed)
        
        return jsonify({"success": True, **result}), 200
    
    except Exception as e:
        logger.error(f"Error in predict_spread: {e}")
        return jsonify({"error": str(e)}), 500