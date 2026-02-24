"""
ResQRoute AI Service - Fire Truck Matcher
Matches fire emergencies to the best available fire trucks.

FIRE TRUCK TYPES:
- Type 1 (Water Tender): Basic water/foam, handles structural fires
- Type 2 (Aerial Platform): High-rise fires (7+ floors), ladder access
- Type 3 (Hazmat): Chemical/industrial fires with hazardous materials
- Type 4 (Rescue): People trapped, vehicle extrication

MATCHING LOGIC:
1. Classify fire → determine required truck types
2. Check available trucks that match requirements
3. Rank by distance + capability
4. Determine how many trucks to dispatch
"""

from typing import Dict, List
from utils.helpers import haversine_distance, estimate_travel_time_minutes, sort_by_score, clamp
from utils.logger import setup_logger

logger = setup_logger(__name__)


class FiretruckMatcher:
    """
    Matches fire incidents to appropriate fire trucks.
    Also determines how many trucks to dispatch based on severity.
    """

    # Required truck types by fire scenario
    REQUIRED_TRUCK_TYPES = {
        "building":    ["water_tender"],
        "high_rise":   ["aerial_platform", "water_tender"],
        "industrial":  ["hazmat", "water_tender"],
        "vehicle":     ["water_tender"],
        "wildfire":    ["water_tender", "water_tender"],  # Multiple water tenders
        "chemical":    ["hazmat", "water_tender"],
        "electrical":  ["water_tender"],  # CO2-based, not plain water
        "rescue":      ["rescue_unit", "water_tender"],
    }

    # Number of trucks to dispatch by severity level
    TRUCKS_BY_SEVERITY = {
        1: 1,  # Minor  → 1 truck
        2: 2,  # Moderate → 2 trucks
        3: 3,  # Major  → 3 trucks
        4: 5,  # Catastrophic → 5 trucks
    }

    def match_firetrucks(
        self,
        fire_request: Dict,
        available_trucks: List[Dict],
        severity_level: int
    ) -> Dict:
        """
        Find and rank fire trucks for dispatch.
        
        Args:
            fire_request: Preprocessed fire incident data
            available_trucks: All available fire trucks
            severity_level: 1 (minor) to 4 (catastrophic)
        
        Returns:
            Dict with recommended trucks and dispatch plan
        
        STEP-BY-STEP:
        
        Fire: Industrial fire, Okhla, Delhi
        Severity: 3 (Major) → Need 3 trucks
        
        Step 1 - Determine required types:
          industrial → ["hazmat", "water_tender"]
        
        Step 2 - Filter by type:
          Truck A: water_tender, 2.1km ✅
          Truck B: hazmat, 3.5km ✅
          Truck C: aerial_platform, 4.2km ✅
          Truck D: water_tender, 1.8km ✅
        
        Step 3 - Score by distance + type match:
          Truck D → 91 (water_tender, closest)
          Truck A → 87 (water_tender, 2.1km)
          Truck B → 78 (hazmat, exactly needed)
        
        Step 4 - Dispatch plan:
          Primary:   Truck D (water_tender) → dispatch immediately
          Secondary: Truck B (hazmat)       → dispatch immediately
          Tertiary:  Truck A (water_tender) → dispatch in 2 min
        """
        logger.info(f"Matching firetrucks | severity={severity_level} | fire type={fire_request.get('fire_type')}")
        
        if not available_trucks:
            logger.error("No fire trucks available!")
            return {"trucks": [], "dispatch_count": 0, "warning": "No trucks available"}
        
        # Step 1: Determine required truck types
        fire_type = fire_request.get("fire_type", "building")
        required_types = self.REQUIRED_TRUCK_TYPES.get(fire_type, ["water_tender"])
        
        # Special case: people trapped → always include rescue unit
        if fire_request.get("building_info", {}).get("people_trapped"):
            if "rescue_unit" not in required_types:
                required_types = ["rescue_unit"] + required_types
        
        # Step 2: Score all trucks
        scored_trucks = self._score_trucks(fire_request, available_trucks, required_types)
        
        # Step 3: Determine how many to dispatch
        dispatch_count = self.TRUCKS_BY_SEVERITY.get(severity_level, 2)
        
        # Step 4: Build dispatch plan
        dispatch_plan = self._build_dispatch_plan(scored_trucks, dispatch_count, required_types)
        
        return {
            "required_truck_types": required_types,
            "dispatch_count": dispatch_count,
            "severity_level": severity_level,
            "dispatch_plan": dispatch_plan,
            "all_ranked_trucks": scored_trucks,
        }

    # ─── PRIVATE METHODS ─────────────────────────────────────────────────────

    def _score_trucks(
        self, request: Dict, trucks: List[Dict], required_types: List[str]
    ) -> List[Dict]:
        """Score and rank all available fire trucks."""
        fire_lat = request["location"]["lat"]
        fire_lon = request["location"]["lon"]
        
        scored = []
        for truck in trucks:
            distance_km = haversine_distance(
                fire_lat, fire_lon,
                truck.get("current_lat", 0), truck.get("current_lon", 0)
            )
            
            # Distance score
            distance_score = clamp(1 - distance_km / 25)  # 25km = max range
            
            # Type match score
            truck_type = truck.get("type", "water_tender")
            type_score = 1.0 if truck_type in required_types else 0.5
            
            # Capacity score (water/chemical capacity)
            capacity_liters = truck.get("water_capacity_liters", 3000)
            capacity_score = clamp(capacity_liters / 10000)
            
            # Status score
            status_scores = {"available": 1.0, "returning": 0.4, "on_call": 0.0}
            status_score = status_scores.get(truck.get("status", "available"), 0.0)
            
            # Weighted final score
            final_score = (
                distance_score * 0.40 +
                type_score * 0.35 +
                capacity_score * 0.15 +
                status_score * 0.10
            ) * 100
            
            scored.append({
                **truck,
                "match_score": round(final_score, 2),
                "distance_km": round(distance_km, 2),
                "eta_minutes": estimate_travel_time_minutes(distance_km, "firetruck"),
            })
        
        return sort_by_score(scored, "match_score")

    def _build_dispatch_plan(
        self, scored_trucks: List[Dict], count: int, required_types: List[str]
    ) -> List[Dict]:
        """
        Build a prioritized dispatch plan.
        Ensures required truck types are included even if not top-scored.
        """
        # First: ensure required types are covered
        dispatched = []
        covered_types = set()
        
        # Try to get one of each required type first
        for req_type in required_types:
            for truck in scored_trucks:
                if truck.get("type") == req_type and truck not in dispatched:
                    dispatched.append(truck)
                    covered_types.add(req_type)
                    break
        
        # Fill remaining slots with highest-scored available trucks
        for truck in scored_trucks:
            if len(dispatched) >= count:
                break
            if truck not in dispatched:
                dispatched.append(truck)
        
        # Assign dispatch priorities and delays
        plan = []
        for i, truck in enumerate(dispatched[:count]):
            plan.append({
                **truck,
                "dispatch_priority": i + 1,
                "dispatch_delay_minutes": 0,  # All dispatch simultaneously for fire
                "role": self._assign_role(truck.get("type"), i),
            })
        
        return plan

    def _assign_role(self, truck_type: str, index: int) -> str:
        """Assign operational role to each truck."""
        role_map = {
            "water_tender": "Primary Attack",
            "aerial_platform": "Aerial Ladder / High-Rise Access",
            "hazmat": "Hazmat Control",
            "rescue_unit": "Search & Rescue",
        }
        base_role = role_map.get(truck_type, "Support")
        return f"{base_role} {'(Lead)' if index == 0 else f'(Unit {index+1})'}"