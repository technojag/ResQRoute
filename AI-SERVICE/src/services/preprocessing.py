"""
ResQRoute AI Service - Data Preprocessing
Cleans and standardizes raw input data before feeding into ML models
"""

from typing import Dict, Any, List
from utils.logger import setup_logger

logger = setup_logger(__name__)


class DataPreprocessor:
    """
    Handles all preprocessing of incoming emergency request data.
    
    STEP-BY-STEP FLOW:
    Raw JSON from app → validate → clean → normalize → ready for model
    """

    # ─── MEDICAL PREPROCESSING ──────────────────────────────────────────────

    def preprocess_ambulance_request(self, raw_data: Dict) -> Dict:
        """
        Prepare ambulance booking data for the matching model.
        
        Args:
            raw_data: Raw JSON from mobile app containing emergency details
        
        Returns:
            Cleaned, structured dict ready for ambulance_matcher.py
        
        Input example:
            {
              "patient_lat": 28.6139,
              "patient_lon": 77.2090,
              "emergency_type": "cardiac_arrest",
              "patient_age": 65,
              "conscious": false
            }
        """
        logger.info("Preprocessing ambulance request")
        
        return {
            "location": {
                "lat": float(raw_data.get("patient_lat", 0)),
                "lon": float(raw_data.get("patient_lon", 0)),
            },
            "emergency_type": self._clean_emergency_type(raw_data.get("emergency_type", "general")),
            "patient": {
                "age": int(raw_data.get("patient_age", 30)),
                "conscious": bool(raw_data.get("conscious", True)),
                "breathing": bool(raw_data.get("breathing", True)),
            },
            "requires_icu": self._needs_icu(raw_data.get("emergency_type", "")),
            "requires_ventilator": self._needs_ventilator(raw_data.get("emergency_type", "")),
        }

    def preprocess_hospital_request(self, raw_data: Dict) -> Dict:
        """
        Prepare hospital matching data (used for private hospital AI selection).
        
        Args:
            raw_data: Patient details + location + preferences
        
        Returns:
            Structured dict for private_hospital_matcher.py
        """
        logger.info("Preprocessing hospital matching request")
        
        return {
            "patient_location": {
                "lat": float(raw_data.get("patient_lat", 0)),
                "lon": float(raw_data.get("patient_lon", 0)),
            },
            "emergency_type": self._clean_emergency_type(raw_data.get("emergency_type", "general")),
            "required_specialties": self._get_required_specialties(raw_data.get("emergency_type", "")),
            "insurance": raw_data.get("insurance_provider", None),
            "budget_range": raw_data.get("budget_range", "any"),   # "low", "medium", "high", "any"
            "preferred_distance_km": float(raw_data.get("preferred_distance_km", 20)),
        }

    # ─── FIRE PREPROCESSING ─────────────────────────────────────────────────

    def preprocess_fire_request(self, raw_data: Dict) -> Dict:
        """
        Prepare fire incident data for classification and truck matching.
        
        Args:
            raw_data: Fire incident report from mobile app
        
        Returns:
            Structured dict for fire_classifier.py and firetruck_matcher.py
        
        Input example:
            {
              "fire_lat": 28.5355,
              "fire_lon": 77.3910,
              "fire_type": "building",
              "floors_affected": 3,
              "people_trapped": true,
              "hazmat_present": false
            }
        """
        logger.info("Preprocessing fire emergency request")
        
        raw_type = raw_data.get("fire_type", "unknown")
        
        return {
            "location": {
                "lat": float(raw_data.get("fire_lat", 0)),
                "lon": float(raw_data.get("fire_lon", 0)),
            },
            "fire_type": self._clean_fire_type(raw_type),
            "building_info": {
                "floors_total": int(raw_data.get("floors_total", 1)),
                "floors_affected": int(raw_data.get("floors_affected", 1)),
                "building_type": raw_data.get("building_type", "residential"),
                "people_trapped": bool(raw_data.get("people_trapped", False)),
                "approximate_occupants": int(raw_data.get("approximate_occupants", 0)),
            },
            "hazmat_present": bool(raw_data.get("hazmat_present", False)),
            "wind_speed_kmh": float(raw_data.get("wind_speed_kmh", 10)),
            "wind_direction": raw_data.get("wind_direction", "N"),
            "area_sqm": float(raw_data.get("area_sqm", 100)),
        }

    def preprocess_spread_request(self, raw_data: Dict) -> Dict:
        """
        Prepare data for fire spread prediction model.
        Includes environmental factors that affect fire behavior.
        """
        logger.info("Preprocessing fire spread prediction request")
        
        return {
            "origin": {
                "lat": float(raw_data.get("fire_lat", 0)),
                "lon": float(raw_data.get("fire_lon", 0)),
            },
            "current_radius_m": float(raw_data.get("current_radius_m", 10)),
            "wind_speed_kmh": float(raw_data.get("wind_speed_kmh", 10)),
            "wind_direction_deg": self._direction_to_degrees(raw_data.get("wind_direction", "N")),
            "humidity_percent": float(raw_data.get("humidity_percent", 50)),
            "temperature_celsius": float(raw_data.get("temperature_celsius", 30)),
            "fuel_type": raw_data.get("fuel_type", "mixed"),  # wood, chemical, electrical, mixed
            "minutes_burning": int(raw_data.get("minutes_burning", 5)),
        }

    # ─── PRIVATE HELPER METHODS ──────────────────────────────────────────────

    def _clean_emergency_type(self, raw_type: str) -> str:
        """Normalize emergency type strings to standard values."""
        mapping = {
            "heart attack": "cardiac_arrest",
            "cardiac": "cardiac_arrest",
            "accident": "trauma",
            "road accident": "trauma",
            "accident victim": "trauma",
            "breathing": "respiratory",
            "difficulty breathing": "respiratory",
            "stroke": "stroke",
            "delivery": "obstetric",
            "labor": "obstetric",
        }
        cleaned = raw_type.lower().strip()
        return mapping.get(cleaned, cleaned)

    def _clean_fire_type(self, raw_type: str) -> str:
        """Normalize fire type strings."""
        mapping = {
            "residential": "building",
            "house fire": "building",
            "apartment": "building",
            "industrial fire": "industrial",
            "factory": "industrial",
            "vehicle fire": "vehicle",
            "car fire": "vehicle",
            "forest fire": "wildfire",
            "jungle fire": "wildfire",
        }
        cleaned = raw_type.lower().strip()
        return mapping.get(cleaned, cleaned)

    def _needs_icu(self, emergency_type: str) -> bool:
        """Determine if emergency type typically requires ICU."""
        icu_types = {"cardiac_arrest", "stroke", "severe_trauma", "respiratory_failure", "sepsis"}
        return emergency_type.lower() in icu_types

    def _needs_ventilator(self, emergency_type: str) -> bool:
        """Determine if emergency type may need ventilator support."""
        ventilator_types = {"cardiac_arrest", "respiratory", "respiratory_failure", "coma"}
        return emergency_type.lower() in ventilator_types

    def _get_required_specialties(self, emergency_type: str) -> List[str]:
        """Map emergency type to required hospital specialties."""
        specialty_map = {
            "cardiac_arrest": ["cardiology", "ICU", "cath_lab"],
            "stroke": ["neurology", "ICU", "CT_scan"],
            "trauma": ["orthopedics", "surgery", "ICU", "blood_bank"],
            "obstetric": ["gynecology", "neonatal_ICU"],
            "burns": ["burn_unit", "plastic_surgery"],
            "respiratory": ["pulmonology", "ICU"],
        }
        return specialty_map.get(emergency_type, ["emergency", "general"])

    def _direction_to_degrees(self, direction: str) -> float:
        """Convert compass direction string to degrees."""
        compass = {"N": 0, "NE": 45, "E": 90, "SE": 135,
                   "S": 180, "SW": 225, "W": 270, "NW": 315}
        return float(compass.get(direction.upper(), 0))