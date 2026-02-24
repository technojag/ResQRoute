"""
ResQRoute AI Service - Government Hospital Matcher
Auto-selects the NEAREST capable government hospital for FREE treatment.

KEY DIFFERENCE FROM PRIVATE MATCHING:
- Government hospitals are auto-selected (no user choice needed)
- Priority: capability to handle emergency > distance
- Uses Ayushman Bharat / government scheme eligibility
- Goal: Fastest + most capable govt hospital, not best rated

ALGORITHM:
1. Filter hospitals by required capability (e.g., cath lab for cardiac)
2. Among capable ones, find the closest with available beds
3. Return top 3 (primary + 2 backups in case primary fills up)
"""

from typing import Dict, List, Optional
from utils.helpers import haversine_distance, estimate_travel_time_minutes, sort_by_score, clamp
from utils.logger import setup_logger

logger = setup_logger(__name__)


class GovernmentHospitalMatcher:
    """
    Selects best government hospital for emergency patients.
    Focused on capability + proximity (cost is always FREE).
    """

    # Capability requirements by emergency type
    CAPABILITY_REQUIREMENTS = {
        "cardiac_arrest": ["cath_lab", "cardiac_ICU", "24hr_cardiology"],
        "stroke":         ["CT_scan", "neuro_ICU", "24hr_neurology"],
        "trauma":         ["trauma_center", "operation_theatre", "blood_bank"],
        "obstetric":      ["maternity_ward", "neonatal_ICU"],
        "burns":          ["burn_unit", "plastic_surgery"],
        "respiratory":    ["ICU", "ventilators"],
        "general":        ["emergency_dept"],
    }

    def select_government_hospital(
        self,
        request: Dict,
        govt_hospitals: List[Dict]
    ) -> Optional[Dict]:
        """
        Auto-select the best government hospital.
        
        Args:
            request: Preprocessed request with patient location + emergency type
            govt_hospitals: All government hospitals from database
        
        Returns:
            Best government hospital with distance and ETA info
        
        STEP-BY-STEP WALKTHROUGH:
        
        Patient: Cardiac arrest at Connaught Place, Delhi
        
        Step 1 - Filter capable hospitals:
          AIIMS Delhi    → Has cath lab ✅
          Safdarjung     → Has cath lab ✅  
          RML Hospital   → No cath lab ❌ (filtered out)
          GTB Hospital   → Has cath lab ✅
        
        Step 2 - Check bed availability:
          AIIMS         → 3 cardiac ICU beds available ✅
          Safdarjung    → 0 beds ❌ (filtered out, full)
          GTB Hospital  → 2 beds ✅
        
        Step 3 - Rank by distance:
          GTB Hospital  → 8.2 km → ETA 18 min
          AIIMS Delhi   → 5.1 km → ETA 12 min  ← SELECTED
        
        Result: AIIMS Delhi (closest capable hospital with beds)
        """
        logger.info(f"Matching govt hospital for: {request.get('emergency_type')}")
        
        if not govt_hospitals:
            logger.error("No government hospitals in database!")
            return None
        
        # Step 1: Filter by capability
        required_caps = self._get_required_capabilities(request["emergency_type"])
        capable_hospitals = self._filter_by_capability(govt_hospitals, required_caps)
        
        if not capable_hospitals:
            logger.warning(f"No capable govt hospitals for {request['emergency_type']}, using all")
            capable_hospitals = govt_hospitals  # Fallback: send to any hospital
        
        # Step 2: Filter by bed availability
        available_hospitals = self._filter_by_availability(capable_hospitals)
        
        if not available_hospitals:
            logger.warning("All capable hospitals are full! Using any with partial capacity")
            available_hospitals = capable_hospitals
        
        # Step 3: Score and rank by distance (primary factor for govt)
        scored = self._score_hospitals(request, available_hospitals)
        
        if not scored:
            return None
        
        best = scored[0]
        logger.info(f"Selected govt hospital: {best.get('name')} | {best.get('distance_km')}km")
        return best

    def get_all_govt_options(self, request: Dict, govt_hospitals: List[Dict], top_n: int = 3) -> List[Dict]:
        """
        Return top N government hospitals ranked by suitability.
        Used as backup options in case primary hospital becomes unavailable.
        """
        required_caps = self._get_required_capabilities(request["emergency_type"])
        capable = self._filter_by_capability(govt_hospitals, required_caps) or govt_hospitals
        scored = self._score_hospitals(request, capable)
        return scored[:top_n]

    # ─── PRIVATE METHODS ─────────────────────────────────────────────────────

    def _get_required_capabilities(self, emergency_type: str) -> List[str]:
        """Get list of capabilities required for the emergency type."""
        return self.CAPABILITY_REQUIREMENTS.get(emergency_type, self.CAPABILITY_REQUIREMENTS["general"])

    def _filter_by_capability(self, hospitals: List[Dict], required: List[str]) -> List[Dict]:
        """
        Keep only hospitals that have at least 60% of required capabilities.
        60% threshold prevents rejecting all hospitals if one rare capability is missing.
        """
        capable = []
        for hospital in hospitals:
            hosp_capabilities = set(hospital.get("capabilities", []))
            required_set = set(required)
            
            if not required_set:
                capable.append(hospital)
                continue
            
            match_ratio = len(required_set & hosp_capabilities) / len(required_set)
            if match_ratio >= 0.6:
                capable.append(hospital)
        
        return capable

    def _filter_by_availability(self, hospitals: List[Dict]) -> List[Dict]:
        """Keep only hospitals with at least 1 emergency bed available."""
        return [h for h in hospitals if h.get("emergency_beds_available", 0) > 0]

    def _score_hospitals(self, request: Dict, hospitals: List[Dict]) -> List[Dict]:
        """
        Score government hospitals.
        
        Government hospital scoring priorities:
        - Distance: 50% (speed is everything in emergencies)
        - Capability match: 35% (must handle the emergency)
        - Bed availability: 15% (avoid sending to full hospitals)
        """
        patient_lat = request["patient_location"]["lat"]
        patient_lon = request["patient_location"]["lon"]
        required_caps = set(self._get_required_capabilities(request["emergency_type"]))
        
        scored = []
        for hospital in hospitals:
            distance_km = haversine_distance(
                patient_lat, patient_lon,
                hospital.get("lat", 0), hospital.get("lon", 0)
            )
            
            # Distance score (closer = better, 0-50km range)
            distance_score = clamp(1 - distance_km / 50)
            
            # Capability score
            hosp_caps = set(hospital.get("capabilities", []))
            cap_score = len(required_caps & hosp_caps) / len(required_caps) if required_caps else 1.0
            
            # Availability score
            beds = hospital.get("emergency_beds_available", 0)
            availability_score = clamp(beds / 10)  # 10+ beds = perfect score
            
            # Weighted composite
            final_score = (distance_score * 0.50) + (cap_score * 0.35) + (availability_score * 0.15)
            
            scored.append({
                **hospital,
                "match_score": round(final_score * 100, 2),
                "distance_km": round(distance_km, 2),
                "eta_minutes": estimate_travel_time_minutes(distance_km, "ambulance"),
                "cost": "FREE",
                "scheme": "Ayushman Bharat / Government",
            })
        
        return sort_by_score(scored, "match_score")