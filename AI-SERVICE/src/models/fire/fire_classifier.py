"""
ResQRoute AI Service - Fire Classifier
Classifies fire severity level (1-4) using ML-inspired decision logic.

SEVERITY SCALE:
  Level 1 - MINOR:        Small fire, controlled area, no casualties
  Level 2 - MODERATE:     Spreading fire, possible casualties, multiple rooms
  Level 3 - MAJOR:        Large fire, confirmed casualties, multi-floor
  Level 4 - CATASTROPHIC: Massive fire, multiple buildings, mass casualties

HOW CLASSIFICATION WORKS:
Uses a scoring system where each fire characteristic adds risk points.
Total risk score maps to a severity level.

This is essentially a Decision Tree encoded as rules —
same as what an ML model learns from data, but interpretable.
"""

from typing import Dict, Tuple
from services.feature_engineering import FeatureEngineer
from utils.logger import setup_logger

logger = setup_logger(__name__)


class FireClassifier:
    """
    Classifies fire emergency severity and determines resource requirements.
    
    RISK SCORING SYSTEM:
    Each factor contributes points to total risk score.
    Score → Severity Level mapping:
      0-25:  Level 1 (Minor)
      26-50: Level 2 (Moderate)
      51-75: Level 3 (Major)
      76+:   Level 4 (Catastrophic)
    """

    # Point values for each risk factor
    RISK_POINTS = {
        # Area size
        "area_lt_50sqm":     5,
        "area_50_200sqm":   15,
        "area_200_500sqm":  25,
        "area_gt_500sqm":   35,
        
        # Floors affected
        "floors_1":          5,
        "floors_2_3":       15,
        "floors_4_7":       25,
        "floors_gt_7":      35,
        
        # Human factors
        "people_trapped":   25,
        "occupants_lt_10":   5,
        "occupants_10_50":  15,
        "occupants_gt_50":  25,
        
        # Hazards
        "hazmat_present":   20,
        "wind_gt_30kmh":    15,
        "wind_gt_50kmh":    25,
        
        # Building type
        "hospital_school":  20,
        "industrial":       15,
        "residential":       5,
        
        # Fire type special cases
        "chemical_fire":    20,
        "wildfire":         25,
    }

    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        logger.info("FireClassifier initialized")

    def classify(self, fire_data: Dict) -> Dict:
        """
        Classify fire severity and generate response recommendation.
        
        Args:
            fire_data: Preprocessed fire incident data
        
        Returns:
            Classification result with severity, score, and recommendations
        
        WALKTHROUGH EXAMPLE:
        
        Incident: 5-story residential building fire, 30 people inside, high wind
        
        Scoring:
          Area (300 sqm)          → +25 points
          Floors affected (5)     → +25 points
          People trapped (yes)    → +25 points
          Occupants (30)          → +15 points
          Wind speed (35 km/h)    → +15 points
          Building: residential   → +5 points
          ─────────────────────────────────
          TOTAL                   = 110 points → Level 4 (Catastrophic)
        
        Recommendation: Dispatch 5 fire trucks, notify hospitals, evacuate block
        """
        logger.info("Classifying fire severity")
        
        # Calculate risk score
        risk_score, score_breakdown = self._calculate_risk_score(fire_data)
        
        # Map to severity level
        severity_level = self._score_to_severity(risk_score)
        severity_label = self._get_severity_label(severity_level)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(severity_level, fire_data)
        
        result = {
            "severity_level": severity_level,           # 1-4
            "severity_label": severity_label,           # "Minor", "Major", etc.
            "risk_score": risk_score,                   # Raw risk score
            "score_breakdown": score_breakdown,          # Which factors contributed
            "trucks_recommended": self._trucks_needed(severity_level),
            "recommendations": recommendations,
            "requires_evacuation": severity_level >= 3,
            "requires_hospital_alert": severity_level >= 2,
            "requires_police_cordon": severity_level >= 3,
        }
        
        logger.info(f"Fire classified: Level {severity_level} ({severity_label}) | Score: {risk_score}")
        return result

    # ─── PRIVATE METHODS ─────────────────────────────────────────────────────

    def _calculate_risk_score(self, fire_data: Dict) -> Tuple[int, Dict]:
        """Calculate total risk score and return breakdown."""
        points = self.RISK_POINTS
        score = 0
        breakdown = {}
        
        building = fire_data.get("building_info", {})
        area = fire_data.get("area_sqm", 100)
        floors_affected = building.get("floors_affected", 1)
        wind = fire_data.get("wind_speed_kmh", 0)
        fire_type = fire_data.get("fire_type", "building")
        btype = building.get("building_type", "residential")
        occupants = building.get("approximate_occupants", 0)
        
        # Area scoring
        if area < 50:
            s = points["area_lt_50sqm"];      score += s; breakdown["area"] = s
        elif area < 200:
            s = points["area_50_200sqm"];     score += s; breakdown["area"] = s
        elif area < 500:
            s = points["area_200_500sqm"];    score += s; breakdown["area"] = s
        else:
            s = points["area_gt_500sqm"];     score += s; breakdown["area"] = s
        
        # Floor scoring
        if floors_affected <= 1:
            s = points["floors_1"];           score += s; breakdown["floors"] = s
        elif floors_affected <= 3:
            s = points["floors_2_3"];         score += s; breakdown["floors"] = s
        elif floors_affected <= 7:
            s = points["floors_4_7"];         score += s; breakdown["floors"] = s
        else:
            s = points["floors_gt_7"];        score += s; breakdown["floors"] = s
        
        # People factors
        if building.get("people_trapped"):
            s = points["people_trapped"];     score += s; breakdown["people_trapped"] = s
        
        if occupants > 50:
            s = points["occupants_gt_50"];    score += s; breakdown["occupants"] = s
        elif occupants >= 10:
            s = points["occupants_10_50"];    score += s; breakdown["occupants"] = s
        else:
            s = points["occupants_lt_10"];    score += s; breakdown["occupants"] = s
        
        # Hazmat
        if fire_data.get("hazmat_present"):
            s = points["hazmat_present"];     score += s; breakdown["hazmat"] = s
        
        # Wind
        if wind > 50:
            s = points["wind_gt_50kmh"];      score += s; breakdown["wind"] = s
        elif wind > 30:
            s = points["wind_gt_30kmh"];      score += s; breakdown["wind"] = s
        
        # Building type
        if btype in ("hospital", "school"):
            s = points["hospital_school"];    score += s; breakdown["building_type"] = s
        elif btype == "industrial":
            s = points["industrial"];         score += s; breakdown["building_type"] = s
        else:
            s = points["residential"];        score += s; breakdown["building_type"] = s
        
        # Fire type special cases
        if fire_type == "chemical":
            s = points["chemical_fire"];      score += s; breakdown["fire_type_special"] = s
        elif fire_type == "wildfire":
            s = points["wildfire"];           score += s; breakdown["fire_type_special"] = s
        
        return score, breakdown

    def _score_to_severity(self, score: int) -> int:
        if score <= 25: return 1
        if score <= 50: return 2
        if score <= 75: return 3
        return 4

    def _get_severity_label(self, level: int) -> str:
        return {1: "Minor", 2: "Moderate", 3: "Major", 4: "Catastrophic"}.get(level, "Unknown")

    def _trucks_needed(self, level: int) -> int:
        return {1: 1, 2: 2, 3: 3, 4: 5}.get(level, 2)

    def _generate_recommendations(self, level: int, fire_data: Dict) -> list:
        recs = []
        if level >= 2:
            recs.append("Alert nearby hospitals for potential burn casualties")
        if level >= 3:
            recs.append("Initiate public evacuation of surrounding 500m radius")
            recs.append("Notify police for traffic and crowd control")
        if level == 4:
            recs.append("Activate city emergency management center")
            recs.append("Request mutual aid from neighboring fire stations")
        if fire_data.get("hazmat_present"):
            recs.append("Deploy hazmat team and establish chemical exclusion zone")
        if fire_data.get("building_info", {}).get("people_trapped"):
            recs.append("Prioritize search and rescue before fire suppression")
        return recs