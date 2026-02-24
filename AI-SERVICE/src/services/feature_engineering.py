"""
ResQRoute AI Service - Feature Engineering
Transforms preprocessed data into numerical features for ML models.

WHAT IS FEATURE ENGINEERING?
Raw data (strings, GPS coords) can't go directly into ML models.
We convert them into meaningful numbers the model can learn from.

Example:
  "cardiac_arrest" → [1, 0, 0, 0]  (one-hot encoded)
  distance = 5.2 km → urgency_score = 0.85  (inverse relationship)
"""

import math
from typing import Dict, List, Any
from utils.helpers import haversine_distance, normalize_score, clamp
from utils.logger import setup_logger

logger = setup_logger(__name__)


class FeatureEngineer:
    """
    Converts preprocessed data into feature vectors for ML models.
    
    STEP-BY-STEP FOR EACH FEATURE:
    1. Extract raw value from data
    2. Apply mathematical transformation
    3. Normalize to 0-1 range
    4. Return named feature dict
    """

    # ─── AMBULANCE FEATURES ──────────────────────────────────────────────────

    def extract_ambulance_features(self, request: Dict, ambulance: Dict) -> Dict[str, float]:
        """
        Extract features to score how well an ambulance matches a request.
        
        Args:
            request: Preprocessed emergency request
            ambulance: Ambulance data from database
        
        Returns:
            Feature dict with normalized values (0 to 1)
        
        FEATURES EXPLAINED:
        - distance_score: How close is the ambulance? Closer = higher score
        - equipment_score: Does it have required equipment?
        - availability_score: Is it free? Partially busy? Unavailable?
        - urgency_match: Does ambulance tier match emergency urgency?
        """
        amb_lat = ambulance.get("current_lat", 0)
        amb_lon = ambulance.get("current_lon", 0)
        req_lat = request["location"]["lat"]
        req_lon = request["location"]["lon"]
        
        # Feature 1: Distance Score
        # Closer ambulance = better. We invert so closer = higher score.
        distance_km = haversine_distance(req_lat, req_lon, amb_lat, amb_lon)
        distance_score = clamp(1 - (distance_km / 30))  # 30km = max range
        
        # Feature 2: Equipment Score
        # Check if ambulance has equipment needed for this emergency
        required_equipment = self._get_required_equipment(request["emergency_type"])
        ambulance_equipment = set(ambulance.get("equipment", []))
        if required_equipment:
            matched = len(required_equipment & ambulance_equipment)
            equipment_score = matched / len(required_equipment)
        else:
            equipment_score = 1.0  # No special equipment needed
        
        # Feature 3: Availability Score
        # Fully available > on minor call > busy
        status_map = {"available": 1.0, "returning": 0.5, "on_call": 0.0}
        availability_score = status_map.get(ambulance.get("status", "available"), 0.0)
        
        # Feature 4: Ambulance Type Match
        # ALS (Advanced Life Support) better for critical, BLS (Basic) okay for minor
        urgency_match = self._get_urgency_match(
            request["emergency_type"],
            ambulance.get("type", "BLS")
        )
        
        # Feature 5: ICU requirement match
        icu_score = 1.0
        if request.get("requires_icu") and not ambulance.get("has_icu_support"):
            icu_score = 0.3  # Penalize heavily if ICU needed but not available
        
        return {
            "distance_score": distance_score,
            "equipment_score": equipment_score,
            "availability_score": availability_score,
            "urgency_match": urgency_match,
            "icu_score": icu_score,
            "distance_km": distance_km,  # Raw value for ETA calculation
        }

    # ─── HOSPITAL FEATURES ──────────────────────────────────────────────────

    def extract_hospital_features(self, request: Dict, hospital: Dict) -> Dict[str, float]:
        """
        Extract features to score a private hospital for an emergency.
        
        FEATURES:
        - distance_score: Travel time to hospital
        - capacity_score: Available beds/ICU
        - specialty_score: Right department available?
        - rating_score: Quality indicator
        - response_score: How fast do they respond to emergency cases?
        """
        hosp_lat = hospital.get("lat", 0)
        hosp_lon = hospital.get("lon", 0)
        req_lat = request["patient_location"]["lat"]
        req_lon = request["patient_location"]["lon"]
        
        # Feature 1: Distance Score
        distance_km = haversine_distance(req_lat, req_lon, hosp_lat, hosp_lon)
        preferred_km = request.get("preferred_distance_km", 20)
        distance_score = clamp(1 - (distance_km / (preferred_km * 1.5)))
        
        # Feature 2: Capacity Score
        # Real-time bed availability from hospital API
        total_beds = hospital.get("emergency_beds_total", 1)
        available_beds = hospital.get("emergency_beds_available", 0)
        capacity_score = clamp(available_beds / total_beds) if total_beds > 0 else 0
        
        # Feature 3: Specialty Match Score
        required = set(request.get("required_specialties", []))
        available = set(hospital.get("specialties", []))
        specialty_score = len(required & available) / len(required) if required else 1.0
        
        # Feature 4: Rating Score
        rating = float(hospital.get("rating", 3.0))  # Scale: 1-5
        rating_score = (rating - 1) / 4  # Normalize to 0-1
        
        # Feature 5: Emergency Response Score
        avg_response_min = hospital.get("avg_emergency_response_min", 30)
        response_score = clamp(1 - (avg_response_min / 60))  # 60 min = worst case
        
        return {
            "distance_score": distance_score,
            "capacity_score": capacity_score,
            "specialty_score": specialty_score,
            "rating_score": rating_score,
            "response_score": response_score,
            "distance_km": distance_km,
        }

    # ─── FIRE FEATURES ──────────────────────────────────────────────────────

    def extract_fire_classification_features(self, fire_data: Dict) -> Dict[str, float]:
        """
        Extract features for classifying fire severity (Minor / Moderate / Major).
        
        FEATURES:
        - area_score: How much area is burning?
        - floor_ratio: Floors affected vs total floors
        - people_risk: Are people trapped?
        - hazmat_risk: Hazardous materials present?
        - spread_risk: Wind + temperature combination
        """
        building = fire_data.get("building_info", {})
        
        # Feature 1: Area Score
        area = fire_data.get("area_sqm", 100)
        # 0-100 sqm = minor, 100-500 = moderate, 500+ = major
        area_score = clamp(area / 500)
        
        # Feature 2: Floor Ratio
        floors_total = max(building.get("floors_total", 1), 1)
        floors_affected = building.get("floors_affected", 1)
        floor_ratio = clamp(floors_affected / floors_total)
        
        # Feature 3: People at Risk
        people_trapped = 1.0 if building.get("people_trapped", False) else 0.0
        occupants = building.get("approximate_occupants", 0)
        occupant_score = clamp(occupants / 100)  # 100+ people = max score
        people_risk = max(people_trapped, occupant_score)
        
        # Feature 4: Hazmat Risk
        hazmat_score = 1.0 if fire_data.get("hazmat_present", False) else 0.0
        
        # Feature 5: Environmental Spread Risk
        wind_speed = fire_data.get("wind_speed_kmh", 10)
        wind_score = clamp(wind_speed / 50)  # 50+ km/h = max risk
        spread_risk = wind_score
        
        # Feature 6: Building Type Risk
        building_risk_map = {
            "residential": 0.7,
            "commercial": 0.6,
            "industrial": 0.9,
            "hospital": 1.0,
            "school": 1.0,
            "warehouse": 0.5,
        }
        btype = building.get("building_type", "residential")
        building_risk = building_risk_map.get(btype, 0.6)
        
        return {
            "area_score": area_score,
            "floor_ratio": floor_ratio,
            "people_risk": people_risk,
            "hazmat_score": hazmat_score,
            "spread_risk": spread_risk,
            "building_risk": building_risk,
        }

    def extract_fire_spread_features(self, spread_data: Dict) -> Dict[str, float]:
        """
        Extract features for predicting fire spread radius over time.
        
        Physics-based features:
        - Wind vector (speed + direction)
        - Fuel combustibility
        - Atmospheric conditions (humidity, temperature)
        - Current fire size
        """
        wind_speed = spread_data.get("wind_speed_kmh", 10)
        humidity = spread_data.get("humidity_percent", 50)
        temperature = spread_data.get("temperature_celsius", 30)
        minutes = spread_data.get("minutes_burning", 5)
        
        # Feature 1: Wind Intensity
        wind_intensity = clamp(wind_speed / 60)
        
        # Feature 2: Dryness Factor (inverse of humidity)
        # Low humidity = faster spread
        dryness = clamp(1 - (humidity / 100))
        
        # Feature 3: Temperature Factor
        # Higher temperature = drier air = faster spread
        temp_factor = clamp((temperature - 20) / 40)  # 20°C baseline, 60°C max
        
        # Feature 4: Fuel Type Combustibility
        fuel_scores = {"wood": 0.7, "chemical": 1.0, "electrical": 0.6, "mixed": 0.75, "dry_grass": 0.9}
        fuel_score = fuel_scores.get(spread_data.get("fuel_type", "mixed"), 0.7)
        
        # Feature 5: Time Factor (fire grows faster initially, then slows if fuel depletes)
        time_factor = clamp(math.log1p(minutes) / math.log1p(120))  # Logarithmic growth
        
        return {
            "wind_intensity": wind_intensity,
            "dryness": dryness,
            "temp_factor": temp_factor,
            "fuel_score": fuel_score,
            "time_factor": time_factor,
            "current_radius_m": spread_data.get("current_radius_m", 10),
            "wind_direction_deg": spread_data.get("wind_direction_deg", 0),
        }

    # ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    def _get_required_equipment(self, emergency_type: str) -> set:
        """Return set of required equipment tags for an emergency type."""
        equipment_map = {
            "cardiac_arrest": {"defibrillator", "oxygen", "cardiac_monitor"},
            "stroke": {"oxygen", "neuro_kit"},
            "trauma": {"trauma_kit", "blood_transfusion", "stretcher"},
            "obstetric": {"delivery_kit", "neonatal_kit"},
            "burns": {"burn_kit", "IV_fluids"},
            "respiratory": {"oxygen", "nebulizer", "ventilator"},
        }
        return equipment_map.get(emergency_type, set())

    def _get_urgency_match(self, emergency_type: str, ambulance_type: str) -> float:
        """
        Score how well ambulance type matches emergency urgency.
        ALS = Advanced Life Support (has paramedics, defibrillator, etc.)
        BLS = Basic Life Support (first aid, oxygen, stretcher)
        """
        critical_types = {"cardiac_arrest", "stroke", "severe_trauma", "respiratory_failure"}
        is_critical = emergency_type in critical_types
        
        if is_critical and ambulance_type == "ALS":
            return 1.0   # Perfect match
        elif is_critical and ambulance_type == "BLS":
            return 0.4   # Can help but not ideal
        elif not is_critical and ambulance_type == "ALS":
            return 0.9   # ALS can always help, slight overuse
        else:
            return 0.8   # BLS for non-critical, good enough