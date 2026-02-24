"""
ResQRoute AI Service - Ambulance Matching Model
Finds the BEST ambulance for a given emergency using multi-criteria scoring.

HOW IT WORKS (Step by Step):
1. Receive emergency request (location + type)
2. Fetch all available ambulances from database
3. For each ambulance, compute a weighted score across 5 factors
4. Return the top-ranked ambulance + alternatives

SCORING FORMULA:
  Final Score = (distance × 0.40) + (equipment × 0.35) + 
                (availability × 0.10) + (urgency × 0.10) + (icu × 0.05)

Why these weights?
  - Distance is most critical (saves the most time)
  - Equipment must match (wrong equipment = useless)
  - Availability matters but less (distant free > nearby busy)
"""

from typing import Dict, List, Optional
from services.feature_engineering import FeatureEngineer
from utils.helpers import weighted_score, estimate_travel_time_minutes, sort_by_score
from utils.logger import setup_logger
from config.config import Config

logger = setup_logger(__name__)


class AmbulanceMatcher:
    """
    Core ML model for ambulance-to-emergency matching.
    Uses rule-based scoring (interpretable, reliable, no training data needed).
    """

    # Weight configuration for scoring each factor
    WEIGHTS = {
        "distance_score":    Config.AMBULANCE_WEIGHT_DISTANCE,    # 0.40
        "equipment_score":   Config.AMBULANCE_WEIGHT_EQUIPMENT,   # 0.35
        "availability_score": Config.AMBULANCE_WEIGHT_AVAILABILITY, # 0.25
        "urgency_match":     0.10,
        "icu_score":         0.05,
    }

    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        logger.info("AmbulanceMatcher initialized")

    def find_best_ambulance(
        self,
        request: Dict,
        available_ambulances: List[Dict]
    ) -> Optional[Dict]:
        """
        Find the single best ambulance for an emergency request.
        
        Args:
            request: Preprocessed emergency request dict
            available_ambulances: List of ambulance records from MongoDB
        
        Returns:
            Best ambulance dict with added match_score and eta_minutes,
            or None if no ambulances available
        
        ALGORITHM WALKTHROUGH:
        
        Request: { location: Delhi, type: "cardiac_arrest", requires_icu: True }
        
        Ambulance A: 2km away, ALS, has defibrillator + ICU support → Score: 92
        Ambulance B: 5km away, BLS, no ICU support               → Score: 61
        Ambulance C: 8km away, ALS, has all equipment + ICU       → Score: 74
        
        Winner: Ambulance A (closest + best equipped for cardiac case)
        """
        if not available_ambulances:
            logger.warning("No ambulances available for matching")
            return None

        scored = self._score_all_ambulances(request, available_ambulances)
        if not scored:
            return None
        
        best = scored[0]
        logger.info(f"Best ambulance: ID={best.get('id')} | Score={best['match_score']}%")
        return best

    def find_top_ambulances(
        self,
        request: Dict,
        available_ambulances: List[Dict],
        top_n: int = 3
    ) -> List[Dict]:
        """
        Return ranked list of top N ambulances.
        Used for dispatcher override and fallback options.
        
        Args:
            request: Preprocessed emergency request
            available_ambulances: All available ambulances
            top_n: How many results to return (default: 3)
        
        Returns:
            List of ambulances sorted by match_score (descending)
        """
        scored = self._score_all_ambulances(request, available_ambulances)
        return scored[:top_n]

    def _score_all_ambulances(self, request: Dict, ambulances: List[Dict]) -> List[Dict]:
        """
        Score every ambulance and return sorted results.
        
        STEP BY STEP:
        For each ambulance:
          1. Extract features (distance, equipment, etc.)
          2. Compute weighted score
          3. Add ETA estimate
          4. Attach score to ambulance record
        
        Then sort by score (highest first).
        """
        scored_ambulances = []
        
        for ambulance in ambulances:
            try:
                # Step 1: Extract numerical features
                features = self.feature_engineer.extract_ambulance_features(request, ambulance)
                
                # Step 2: Calculate weighted composite score (returns 0-100)
                score = weighted_score(features, self.WEIGHTS)
                
                # Step 3: Estimate arrival time
                distance_km = features["distance_km"]
                eta = estimate_travel_time_minutes(distance_km, "ambulance")
                
                # Step 4: Attach results to ambulance data
                scored_ambulance = {
                    **ambulance,
                    "match_score": score,
                    "eta_minutes": eta,
                    "distance_km": round(distance_km, 2),
                    "feature_breakdown": {  # Useful for debugging/UI
                        "distance_score": round(features["distance_score"] * 100, 1),
                        "equipment_score": round(features["equipment_score"] * 100, 1),
                        "availability_score": round(features["availability_score"] * 100, 1),
                    }
                }
                scored_ambulances.append(scored_ambulance)
                
            except Exception as e:
                logger.error(f"Error scoring ambulance {ambulance.get('id')}: {e}")
                continue
        
        # Sort: highest match_score first
        return sort_by_score(scored_ambulances, "match_score")