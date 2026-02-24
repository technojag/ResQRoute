"""
ResQRoute AI Service - Private Hospital Matcher
AI-powered matching of emergency patients to private hospitals.

DIFFERENCE FROM GOVERNMENT MATCHER:
- Multiple options shown to user (AI ranked)
- Considers insurance, budget preferences, quality ratings
- Shows pricing estimates
- Patient/family can accept recommendation or choose manually

SCORING FORMULA:
  Score = (distance × 0.35) + (capacity × 0.30) + 
          (specialty × 0.25) + (rating × 0.10)
"""

from typing import Dict, List
from services.feature_engineering import FeatureEngineer
from utils.helpers import weighted_score, estimate_travel_time_minutes, sort_by_score
from utils.logger import setup_logger
from config.config import Config

logger = setup_logger(__name__)


class PrivateHospitalMatcher:
    """
    AI model for recommending private hospitals to emergency patients.
    Returns ranked list with scores, pricing, and rationale.
    """

    WEIGHTS = {
        "distance_score":  Config.HOSPITAL_WEIGHT_DISTANCE,   # 0.35
        "capacity_score":  Config.HOSPITAL_WEIGHT_CAPACITY,    # 0.30
        "specialty_score": Config.HOSPITAL_WEIGHT_SPECIALTY,   # 0.25
        "rating_score":    Config.HOSPITAL_WEIGHT_RATING,      # 0.10
        "response_score":  0.0,  # Informational only, not in main score
    }

    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        logger.info("PrivateHospitalMatcher initialized")

    def get_recommendations(
        self,
        request: Dict,
        private_hospitals: List[Dict],
        top_n: int = 5
    ) -> List[Dict]:
        """
        Get AI-powered hospital recommendations for private selection.
        
        Args:
            request: Preprocessed patient request
            private_hospitals: All private hospitals from database
            top_n: Number of recommendations to return
        
        Returns:
            Ranked list of hospitals with scores, ETA, pricing, and explanation
        
        EXAMPLE OUTPUT:
        [
          {
            "name": "Apollo Hospitals",
            "match_score": 94.2,
            "distance_km": 3.8,
            "eta_minutes": 9,
            "estimated_cost_inr": 25000,
            "match_reason": "Nearest hospital with Cardiology ICU",
            "insurance_accepted": ["Star Health", "HDFC Ergo"],
          },
          ...
        ]
        """
        logger.info(f"Generating private hospital recommendations for: {request.get('emergency_type')}")
        
        if not private_hospitals:
            logger.error("No private hospitals in database!")
            return []
        
        # Filter by insurance if specified
        if request.get("insurance"):
            hospitals = self._filter_by_insurance(private_hospitals, request["insurance"])
            if not hospitals:
                logger.warning("No hospitals accept this insurance, showing all")
                hospitals = private_hospitals
        else:
            hospitals = private_hospitals
        
        # Score all hospitals
        scored = self._score_all_hospitals(request, hospitals)
        
        # Add human-readable match reasons
        for hospital in scored:
            hospital["match_reason"] = self._generate_match_reason(hospital, request)
        
        logger.info(f"Returning top {top_n} private hospital recommendations")
        return scored[:top_n]

    # ─── PRIVATE METHODS ─────────────────────────────────────────────────────

    def _score_all_hospitals(self, request: Dict, hospitals: List[Dict]) -> List[Dict]:
        """Score every hospital and return sorted results."""
        scored = []
        
        for hospital in hospitals:
            try:
                # Extract numerical features
                features = self.feature_engineer.extract_hospital_features(request, hospital)
                
                # Calculate weighted composite score
                score = weighted_score(features, self.WEIGHTS)
                
                # Estimate travel time
                eta = estimate_travel_time_minutes(features["distance_km"], "ambulance")
                
                scored.append({
                    **hospital,
                    "match_score": score,
                    "distance_km": round(features["distance_km"], 2),
                    "eta_minutes": eta,
                    "feature_breakdown": {
                        "distance": round(features["distance_score"] * 100, 1),
                        "capacity": round(features["capacity_score"] * 100, 1),
                        "specialty_match": round(features["specialty_score"] * 100, 1),
                        "rating": round(features["rating_score"] * 100, 1),
                    }
                })
                
            except Exception as e:
                logger.error(f"Error scoring hospital {hospital.get('name')}: {e}")
                continue
        
        return sort_by_score(scored, "match_score")

    def _filter_by_insurance(self, hospitals: List[Dict], insurance: str) -> List[Dict]:
        """Keep only hospitals that accept the patient's insurance provider."""
        return [
            h for h in hospitals
            if insurance.lower() in [i.lower() for i in h.get("insurance_accepted", [])]
        ]

    def _generate_match_reason(self, hospital: Dict, request: Dict) -> str:
        """
        Generate a short human-readable reason for the recommendation.
        This helps patients/dispatchers understand why AI chose this hospital.
        
        Examples:
          "Nearest hospital with 24hr Cardiology ICU"
          "Highest rated trauma center within 10km"
          "Only hospital with burn unit in range"
        """
        emergency = request.get("emergency_type", "emergency")
        distance = hospital.get("distance_km", 0)
        specialties = hospital.get("specialties", [])
        score = hospital.get("match_score", 0)
        
        if score >= 90:
            return f"Best match — {distance:.1f}km with full {emergency} capability"
        elif score >= 75:
            return f"Strong match — {distance:.1f}km, has required specialties"
        elif score >= 60:
            return f"Good option — {distance:.1f}km, {len(specialties)} departments available"
        else:
            return f"Available option — {distance:.1f}km from patient"