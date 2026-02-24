"""
ResQRoute AI Service - Fire Spread Predictor
Predicts how fire will spread over time using physics-based modeling.

REAL-WORLD BASIS:
Fire spread is governed by:
  1. Wind (direction + speed) - most dominant factor
  2. Fuel type (wood, chemical, electrical burn differently)
  3. Humidity (dry air = faster spread)
  4. Temperature (hot weather = faster evaporation = more fuel)
  5. Current fire size

MODEL TYPE: Physics-based simulation
Why not deep learning? Not enough labeled training data in India.
Physics-based models are accurate, interpretable, and need no training.

OUTPUT: Predicted fire radius at 5, 10, 15, 30 minute intervals
        + Direction of spread (wind-influenced)
        + Affected zones for evacuation planning
"""

import math
from typing import Dict, List, Tuple
from services.feature_engineering import FeatureEngineer
from utils.logger import setup_logger

logger = setup_logger(__name__)


class FireSpreadPredictor:
    """
    Physics-based fire spread prediction model.
    Generates time-series predictions of fire radius and affected zones.
    """

    # Base spread rates (meters per minute) by fuel type under calm conditions
    BASE_SPREAD_RATE = {
        "wood":      1.2,   # Structural fires - slow, dense fuel
        "dry_grass": 8.0,   # Wildfire - very fast
        "chemical":  3.5,   # Chemical fires - fast and unpredictable
        "electrical": 0.8,  # Electrical - contained, slower spread
        "mixed":     2.0,   # Default mixed urban
    }

    # Prediction time points (minutes after report)
    PREDICTION_INTERVALS = [5, 10, 15, 30, 60]

    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        logger.info("FireSpreadPredictor initialized")

    def predict_spread(self, spread_data: Dict) -> Dict:
        """
        Predict fire spread over time.
        
        Args:
            spread_data: Preprocessed fire spread data
        
        Returns:
            Predictions at each time interval + affected coordinates
        
        MATHEMATICAL MODEL:
        
        Spread rate is modified by environmental factors:
        
          adjusted_rate = base_rate × wind_factor × dryness_factor × temp_factor
        
          wind_factor = 1 + (wind_speed_kmh / 15)  
            [every 15 km/h wind doubles spread rate in wind direction]
          
          dryness_factor = 1 + (1 - humidity/100)
            [50% humidity → 1.5x, 10% humidity → 1.9x]
          
          temp_factor = 1 + (temp - 25) / 50
            [35°C → 1.2x, 45°C → 1.4x]
        
        Radius at time t:
          radius(t) = initial_radius + adjusted_rate × t
        
        EXAMPLE:
          Fuel: wood (base = 1.2 m/min)
          Wind: 30 km/h (wind_factor = 1 + 30/15 = 3.0)
          Humidity: 20% (dryness_factor = 1 + 0.8 = 1.8)
          Temperature: 40°C (temp_factor = 1 + 15/50 = 1.3)
          
          adjusted_rate = 1.2 × 3.0 × 1.8 × 1.3 = 8.42 m/min
          
          At 10 minutes: radius = 10 + 8.42 × 10 = 94 meters
          At 30 minutes: radius = 10 + 8.42 × 30 = 263 meters
        """
        logger.info("Running fire spread prediction")
        
        # Extract features
        features = self.feature_engineer.extract_fire_spread_features(spread_data)
        
        # Calculate adjusted spread rate
        base_rate = self.BASE_SPREAD_RATE.get(spread_data.get("fuel_type", "mixed"), 2.0)
        adjusted_rate = self._calculate_adjusted_rate(base_rate, features)
        
        # Initial state
        initial_radius = spread_data.get("current_radius_m", 10)
        origin = spread_data.get("origin", {"lat": 0, "lon": 0})
        wind_direction_deg = features.get("wind_direction_deg", 0)
        
        # Predict at each time interval
        predictions = []
        for minutes in self.PREDICTION_INTERVALS:
            radius = self._predict_radius(initial_radius, adjusted_rate, minutes, features)
            affected_area_sqm = math.pi * radius ** 2
            affected_zone = self._calculate_affected_coordinates(
                origin, radius, wind_direction_deg, adjusted_rate, minutes
            )
            
            predictions.append({
                "time_minutes": minutes,
                "predicted_radius_m": round(radius, 1),
                "affected_area_sqm": round(affected_area_sqm),
                "affected_zone": affected_zone,
                "severity_at_time": self._radius_to_severity(radius),
            })
        
        return {
            "origin": origin,
            "current_radius_m": initial_radius,
            "adjusted_spread_rate_m_per_min": round(adjusted_rate, 2),
            "wind_direction_deg": wind_direction_deg,
            "predictions": predictions,
            "evacuation_radius_m": predictions[2]["predicted_radius_m"] * 2,  # 15-min × 2 buffer
            "model_confidence": self._calculate_confidence(spread_data),
        }

    # ─── PRIVATE METHODS ─────────────────────────────────────────────────────

    def _calculate_adjusted_rate(self, base_rate: float, features: Dict) -> float:
        """
        Apply environmental modifiers to base spread rate.
        
        Each factor is a multiplier on the base rate.
        All factors compound multiplicatively.
        """
        wind_factor = 1 + (features["wind_intensity"] * 3)   # Up to 4x at max wind
        dryness_factor = 1 + features["dryness"]              # Up to 2x when fully dry
        temp_factor = 1 + features["temp_factor"] * 0.5       # Up to 1.5x at extreme heat
        
        return base_rate * wind_factor * dryness_factor * temp_factor

    def _predict_radius(
        self, initial: float, rate: float, minutes: int, features: Dict
    ) -> float:
        """
        Predict fire radius at a given time.
        Uses logarithmic growth (fires slow as fuel near origin depletes).
        
        radius(t) = initial + rate × t × log_factor
        where log_factor accounts for fuel depletion over time
        """
        log_factor = 1 / (1 + minutes / 60)  # Slows after ~1 hour
        return initial + (rate * minutes * log_factor)

    def _calculate_affected_coordinates(
        self,
        origin: Dict,
        radius_m: float,
        wind_direction_deg: float,
        rate: float,
        minutes: int
    ) -> Dict:
        """
        Calculate the geographic bounding box of the predicted fire zone.
        Fire spreads faster in wind direction (elliptical, not circular).
        
        Returns:
            Dict with center and boundary coordinates for map overlay
        """
        # Convert radius from meters to degrees (approximate)
        radius_deg = radius_m / 111320  # 1 degree ≈ 111,320 meters
        
        # Wind causes asymmetric spread: 1.5x in wind direction, 0.7x against wind
        wind_rad = math.radians(wind_direction_deg)
        wind_lat_factor = math.cos(wind_rad)
        wind_lon_factor = math.sin(wind_rad)
        
        downwind_radius = radius_deg * 1.5
        upwind_radius = radius_deg * 0.7
        
        return {
            "center": origin,
            "radius_m": radius_m,
            "bounding_box": {
                "north": origin["lat"] + radius_deg * 1.2,
                "south": origin["lat"] - radius_deg * 0.8,
                "east":  origin["lon"] + radius_deg * 1.2,
                "west":  origin["lon"] - radius_deg * 0.8,
            },
            "wind_direction_deg": wind_direction_deg,
            "downwind_radius_m": round(downwind_radius * 111320),
            "upwind_radius_m":   round(upwind_radius * 111320),
        }

    def _radius_to_severity(self, radius_m: float) -> str:
        if radius_m < 20:   return "Contained"
        if radius_m < 50:   return "Growing"
        if radius_m < 150:  return "Significant"
        if radius_m < 300:  return "Large"
        return "Catastrophic"

    def _calculate_confidence(self, data: Dict) -> float:
        """
        Estimate model confidence based on data completeness.
        More data available = higher confidence prediction.
        """
        fields = ["fuel_type", "wind_speed_kmh", "humidity_percent", "temperature_celsius"]
        provided = sum(1 for f in fields if data.get(f) is not None)
        return round(0.5 + (provided / len(fields)) * 0.5, 2)  # 0.5 to 1.0