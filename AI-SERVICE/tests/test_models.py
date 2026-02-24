"""
ResQRoute AI - Test Suite
Tests all major AI models with sample data.
Run: python -m pytest tests/test_models.py -v
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../src"))

from models.medical.ambulance_matcher import AmbulanceMatcher
from models.medical.government_hospital_matcher import GovernmentHospitalMatcher
from models.medical.private_hospital_matcher import PrivateHospitalMatcher
from models.medical.route_optimizer import RouteOptimizer
from models.fire.fire_classifier import FireClassifier
from models.fire.spread_predictor import FireSpreadPredictor
from models.fire.firetruck_matcher import FiretruckMatcher
from services.preprocessing import DataPreprocessor
from services.feature_engineering import FeatureEngineer
from utils.helpers import haversine_distance, normalize_score, weighted_score


# ─── SAMPLE TEST DATA ────────────────────────────────────────────────────────

CARDIAC_REQUEST = {
    "location": {"lat": 28.6139, "lon": 77.2090},
    "emergency_type": "cardiac_arrest",
    "patient": {"age": 65, "conscious": False, "breathing": True},
    "requires_icu": True,
    "requires_ventilator": False,
}

SAMPLE_AMBULANCES = [
    {"id": "AMB-01", "current_lat": 28.6200, "current_lon": 77.2100,
     "type": "ALS", "status": "available", "equipment": ["defibrillator", "oxygen", "cardiac_monitor"],
     "has_icu_support": True},
    
    {"id": "AMB-02", "current_lat": 28.6400, "current_lon": 77.2300,
     "type": "BLS", "status": "available", "equipment": ["oxygen", "stretcher"],
     "has_icu_support": False},
    
    {"id": "AMB-03", "current_lat": 28.6050, "current_lon": 77.2000,
     "type": "ALS", "status": "returning", "equipment": ["defibrillator", "oxygen", "cardiac_monitor"],
     "has_icu_support": True},
]

SAMPLE_GOVT_HOSPITALS = [
    {"id": "GH-01", "name": "AIIMS Delhi", "lat": 28.5672, "lon": 77.2100,
     "capabilities": ["cath_lab", "cardiac_ICU", "24hr_cardiology", "CT_scan"],
     "emergency_beds_available": 5, "emergency_beds_total": 20},
    
    {"id": "GH-02", "name": "Safdarjung Hospital", "lat": 28.5688, "lon": 77.2024,
     "capabilities": ["cath_lab", "cardiac_ICU", "24hr_cardiology"],
     "emergency_beds_available": 0, "emergency_beds_total": 15},
    
    {"id": "GH-03", "name": "GTB Hospital", "lat": 28.6826, "lon": 77.3082,
     "capabilities": ["cath_lab", "cardiac_ICU"],
     "emergency_beds_available": 3, "emergency_beds_total": 10},
]

SAMPLE_FIRE_DATA = {
    "location": {"lat": 28.5355, "lon": 77.3910},
    "fire_type": "building",
    "building_info": {
        "floors_total": 5, "floors_affected": 3,
        "building_type": "residential", "people_trapped": True,
        "approximate_occupants": 35
    },
    "hazmat_present": False,
    "wind_speed_kmh": 25,
    "wind_direction": "NE",
    "area_sqm": 250,
}

SAMPLE_TRUCKS = [
    {"id": "FT-01", "current_lat": 28.5300, "current_lon": 77.3800,
     "type": "water_tender", "status": "available", "water_capacity_liters": 5000},
    
    {"id": "FT-02", "current_lat": 28.5500, "current_lon": 77.4000,
     "type": "aerial_platform", "status": "available", "water_capacity_liters": 3000},
    
    {"id": "FT-03", "current_lat": 28.5200, "current_lon": 77.3700,
     "type": "rescue_unit", "status": "available", "water_capacity_liters": 1000},
]


# ─── UTILITY TESTS ────────────────────────────────────────────────────────────

class TestHelpers:
    def test_haversine_distance(self):
        """Test GPS distance calculation (Delhi to Noida ~17km)"""
        dist = haversine_distance(28.6139, 77.2090, 28.5355, 77.3910)
        assert 15 < dist < 25, f"Expected ~17-20km, got {dist:.2f}km"
        print(f"  ✅ Haversine: Delhi → fire location = {dist:.2f} km")
    
    def test_normalize_score(self):
        """Normalization should return 0-1 range"""
        assert normalize_score(5, 0, 10) == 0.5
        assert normalize_score(0, 0, 10) == 0.0
        assert normalize_score(10, 0, 10) == 1.0
        print("  ✅ Normalize score: Correct 0-1 scaling")
    
    def test_weighted_score(self):
        """Weighted score should sum correctly"""
        scores = {"a": 0.8, "b": 0.6}
        weights = {"a": 0.7, "b": 0.3}
        result = weighted_score(scores, weights)
        expected = round((0.8 * 0.7 + 0.6 * 0.3) * 100, 2)
        assert abs(result - expected) < 0.01
        print(f"  ✅ Weighted score: {result}% (expected {expected}%)")


# ─── MEDICAL MODEL TESTS ──────────────────────────────────────────────────────

class TestAmbulanceMatcher:
    def test_finds_best_ambulance(self):
        """Should return highest-scored ambulance"""
        matcher = AmbulanceMatcher()
        best = matcher.find_best_ambulance(CARDIAC_REQUEST, SAMPLE_AMBULANCES)
        
        assert best is not None
        assert "match_score" in best
        assert "eta_minutes" in best
        assert best["match_score"] > 0
        print(f"  ✅ Best ambulance: {best['id']} | Score: {best['match_score']}% | ETA: {best['eta_minutes']} min")
    
    def test_als_preferred_for_cardiac(self):
        """ALS ambulance should rank higher than BLS for cardiac emergency"""
        matcher = AmbulanceMatcher()
        top3 = matcher.find_top_ambulances(CARDIAC_REQUEST, SAMPLE_AMBULANCES, top_n=3)
        
        # Top result should be ALS type
        assert top3[0]["type"] == "ALS"
        print(f"  ✅ ALS preferred for cardiac: Top = {top3[0]['id']} ({top3[0]['type']})")
    
    def test_empty_ambulances(self):
        """Should handle no ambulances gracefully"""
        matcher = AmbulanceMatcher()
        result = matcher.find_best_ambulance(CARDIAC_REQUEST, [])
        assert result is None
        print("  ✅ Empty ambulance list: Returns None gracefully")


class TestGovernmentHospitalMatcher:
    def test_selects_hospital(self):
        """Should return a government hospital"""
        matcher = GovernmentHospitalMatcher()
        request = {
            "patient_location": {"lat": 28.6139, "lon": 77.2090},
            "emergency_type": "cardiac_arrest",
        }
        result = matcher.select_government_hospital(request, SAMPLE_GOVT_HOSPITALS)
        
        assert result is not None
        assert result["cost"] == "FREE"
        assert "eta_minutes" in result
        print(f"  ✅ Govt hospital selected: {result['name']} | {result['distance_km']} km | FREE")
    
    def test_full_hospital_skipped(self):
        """Hospital with 0 available beds should not be primary selection"""
        matcher = GovernmentHospitalMatcher()
        request = {
            "patient_location": {"lat": 28.6139, "lon": 77.2090},
            "emergency_type": "cardiac_arrest",
        }
        result = matcher.select_government_hospital(request, SAMPLE_GOVT_HOSPITALS)
        # Safdarjung has 0 beds, should not be selected as primary
        assert result["id"] != "GH-02"
        print(f"  ✅ Full hospital (0 beds) skipped: Selected {result['name']} instead")


# ─── FIRE MODEL TESTS ────────────────────────────────────────────────────────

class TestFireClassifier:
    def test_classifies_severity(self):
        """Should return severity level 1-4"""
        classifier = FireClassifier()
        result = classifier.classify(SAMPLE_FIRE_DATA)
        
        assert "severity_level" in result
        assert 1 <= result["severity_level"] <= 4
        assert result["trucks_recommended"] >= 1
        print(f"  ✅ Fire classified: Level {result['severity_level']} ({result['severity_label']}) | "
              f"{result['trucks_recommended']} trucks | Score: {result['risk_score']}")
    
    def test_people_trapped_increases_severity(self):
        """People trapped should add risk points"""
        classifier = FireClassifier()
        
        fire_no_people = {**SAMPLE_FIRE_DATA}
        fire_no_people["building_info"] = {**SAMPLE_FIRE_DATA["building_info"], "people_trapped": False}
        
        result_with = classifier.classify(SAMPLE_FIRE_DATA)
        result_without = classifier.classify(fire_no_people)
        
        assert result_with["risk_score"] > result_without["risk_score"]
        print(f"  ✅ People trapped increases risk: {result_without['risk_score']} → {result_with['risk_score']}")


class TestFireSpreadPredictor:
    def test_spread_increases_over_time(self):
        """Fire radius should grow over time"""
        predictor = FireSpreadPredictor()
        spread_data = {
            "origin": {"lat": 28.5355, "lon": 77.3910},
            "current_radius_m": 10,
            "fuel_type": "wood",
            "wind_speed_kmh": 20,
            "wind_direction_deg": 45,
            "humidity_percent": 30,
            "temperature_celsius": 35,
            "minutes_burning": 5,
        }
        result = predictor.predict_spread(spread_data)
        
        predictions = result["predictions"]
        radii = [p["predicted_radius_m"] for p in predictions]
        
        # Each interval should have larger radius than previous
        assert all(radii[i] <= radii[i+1] for i in range(len(radii)-1))
        print(f"  ✅ Fire spread prediction: 5min={radii[0]}m | 15min={radii[2]}m | 30min={radii[3]}m")
    
    def test_evacuation_radius_provided(self):
        """Should output evacuation radius"""
        predictor = FireSpreadPredictor()
        result = predictor.predict_spread({
            "origin": {"lat": 28.5355, "lon": 77.3910},
            "current_radius_m": 10, "fuel_type": "mixed",
            "wind_speed_kmh": 15, "wind_direction_deg": 0,
            "humidity_percent": 50, "temperature_celsius": 30, "minutes_burning": 5,
        })
        assert "evacuation_radius_m" in result
        assert result["evacuation_radius_m"] > 0
        print(f"  ✅ Evacuation radius: {result['evacuation_radius_m']} meters")


class TestFiretruckMatcher:
    def test_matches_trucks(self):
        """Should return dispatch plan"""
        matcher = FiretruckMatcher()
        result = matcher.match_firetrucks(SAMPLE_FIRE_DATA, SAMPLE_TRUCKS, severity_level=2)
        
        assert "dispatch_plan" in result
        assert len(result["dispatch_plan"]) > 0
        print(f"  ✅ Fire trucks matched: {len(result['dispatch_plan'])} trucks dispatched")
    
    def test_rescue_unit_for_trapped_people(self):
        """Rescue unit should be included when people are trapped"""
        matcher = FiretruckMatcher()
        result = matcher.match_firetrucks(SAMPLE_FIRE_DATA, SAMPLE_TRUCKS, severity_level=2)
        
        truck_types = [t.get("type") for t in result["dispatch_plan"]]
        assert "rescue_unit" in truck_types
        print(f"  ✅ Rescue unit included for trapped people: {truck_types}")


# ─── ROUTE OPTIMIZER TESTS ────────────────────────────────────────────────────

class TestRouteOptimizer:
    def test_generates_route(self):
        """Should return route with ETA and waypoints"""
        optimizer = RouteOptimizer()
        route = optimizer.optimize_route(
            origin={"lat": 28.6200, "lon": 77.2100},
            destination={"lat": 28.6139, "lon": 77.2090},
            vehicle_type="ambulance",
            is_critical=True
        )
        
        assert route["eta_minutes"] > 0
        assert route["distance_km"] > 0
        assert len(route["waypoints"]) > 0
        assert route["green_corridor_active"] is True
        print(f"  ✅ Route: {route['distance_km']}km | ETA: {route['eta_minutes']} min | "
              f"Saved: {route['time_saved_minutes']} min with green corridor")
    
    def test_green_corridor_signals(self):
        """Should generate traffic signal timings"""
        optimizer = RouteOptimizer()
        route = optimizer.optimize_route(
            origin={"lat": 28.6200, "lon": 77.2100},
            destination={"lat": 28.5500, "lon": 77.3000},
            vehicle_type="ambulance",
            is_critical=True
        )
        
        assert len(route["traffic_signals"]) > 0
        first_signal = route["traffic_signals"][0]
        assert "turn_green_at_minutes" in first_signal
        assert "green_duration_seconds" in first_signal
        print(f"  ✅ Green corridor: {len(route['traffic_signals'])} signals configured")


# ─── MAIN TEST RUNNER ────────────────────────────────────────────────────────

def run_all_tests():
    """Run all tests and print results."""
    test_suites = [
        ("🔧 Utility Functions", TestHelpers),
        ("🚑 Ambulance Matcher", TestAmbulanceMatcher),
        ("🏥 Government Hospital Matcher", TestGovernmentHospitalMatcher),
        ("🔥 Fire Classifier", TestFireClassifier),
        ("🌊 Fire Spread Predictor", TestFireSpreadPredictor),
        ("🚒 Fire Truck Matcher", TestFiretruckMatcher),
        ("🗺️  Route Optimizer", TestRouteOptimizer),
    ]
    
    total_passed = 0
    total_failed = 0
    
    for suite_name, TestClass in test_suites:
        print(f"\n{suite_name}")
        print("-" * 50)
        
        test_obj = TestClass()
        methods = [m for m in dir(test_obj) if m.startswith("test_")]
        
        for method_name in methods:
            try:
                getattr(test_obj, method_name)()
                total_passed += 1
            except Exception as e:
                print(f"  ❌ {method_name}: FAILED — {e}")
                total_failed += 1
    
    print(f"\n{'='*50}")
    print(f"✅ Passed: {total_passed} | ❌ Failed: {total_failed}")
    print(f"{'='*50}")
    return total_failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)