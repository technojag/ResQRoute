"""
ResQRoute AI Service - Helper Functions
Shared utilities across all AI models
"""

import math
from typing import Tuple, List, Dict, Any


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate straight-line distance between two GPS coordinates using Haversine formula.
    
    Args:
        lat1, lon1: Source coordinates
        lat2, lon2: Destination coordinates
    
    Returns:
        Distance in kilometers
    
    Formula:
        a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
        c = 2 * atan2(√a, √(1-a))
        distance = R * c   (R = Earth's radius = 6371 km)
    """
    R = 6371  # Earth's radius in km
    
    # Convert degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def normalize_score(value: float, min_val: float, max_val: float) -> float:
    """
    Normalize a value to a 0-1 scale.
    
    Args:
        value: Raw value to normalize
        min_val: Minimum possible value
        max_val: Maximum possible value
    
    Returns:
        Normalized score between 0 and 1
    """
    if max_val == min_val:
        return 1.0
    return (value - min_val) / (max_val - min_val)


def weighted_score(scores: Dict[str, float], weights: Dict[str, float]) -> float:
    """
    Calculate weighted average of multiple scores.
    
    Args:
        scores: Dict of {metric_name: score_value}
        weights: Dict of {metric_name: weight}
    
    Returns:
        Final weighted score (0-100)
    
    Example:
        scores  = {"distance": 0.8, "capacity": 0.9, "rating": 0.7}
        weights = {"distance": 0.4, "capacity": 0.4, "rating": 0.2}
        result  = 0.8*0.4 + 0.9*0.4 + 0.7*0.2 = 0.82 → 82%
    """
    total = sum(scores[k] * weights[k] for k in scores if k in weights)
    return round(total * 100, 2)  # Return as percentage


def estimate_travel_time_minutes(distance_km: float, vehicle_type: str = "ambulance") -> float:
    """
    Estimate travel time based on distance and vehicle type.
    Uses average speeds with traffic assumptions for Indian roads.
    
    Args:
        distance_km: Distance to cover
        vehicle_type: "ambulance" or "firetruck"
    
    Returns:
        Estimated time in minutes
    """
    # Average speeds (km/h) with green corridor / siren
    speeds = {
        "ambulance": 45,    # City roads with siren
        "firetruck": 40,    # Slightly slower due to vehicle size
    }
    speed = speeds.get(vehicle_type, 40)
    
    # Base time + buffer for traffic signals, turns etc.
    base_time = (distance_km / speed) * 60  # Convert to minutes
    buffer = base_time * 0.15  # 15% buffer
    
    return round(base_time + buffer, 1)


def sort_by_score(items: List[Dict[str, Any]], score_key: str = "match_score") -> List[Dict]:
    """Sort list of dicts by score, highest first."""
    return sorted(items, key=lambda x: x.get(score_key, 0), reverse=True)


def clamp(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))