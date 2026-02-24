"""
ResQRoute AI Service - Emergency Coordinator
Handles multi-emergency scenarios where ambulances AND fire trucks are needed.

SCENARIOS:
1. Road accident with vehicle fire → 2 ambulances + 2 fire trucks
2. Building collapse with fire → multiple fire trucks + multiple ambulances
3. Chemical plant explosion → hazmat trucks + ambulances + police alert

COORDINATION LOGIC:
- Sequence vehicles correctly (fire trucks secure scene before ambulances enter)
- Allocate resources across multiple incidents competing for same trucks
- Alert all nearby hospitals preemptively
- Broadcast evacuation zone to public
"""

from typing import Dict, List
from models.medical.ambulance_matcher import AmbulanceMatcher
from models.fire.firetruck_matcher import FiretruckMatcher
from models.fire.fire_classifier import FireClassifier
from models.medical.route_optimizer import RouteOptimizer
from utils.helpers import haversine_distance
from utils.logger import setup_logger

logger = setup_logger(__name__)


class EmergencyCoordinator:
    """
    Coordinates multi-agency response to complex emergencies.
    Orchestrates ambulances, fire trucks, hospitals, and traffic signals.
    """

    def __init__(self):
        self.ambulance_matcher = AmbulanceMatcher()
        self.firetruck_matcher = FiretruckMatcher()
        self.fire_classifier = FireClassifier()
        self.route_optimizer = RouteOptimizer()
        logger.info("EmergencyCoordinator initialized")

    def coordinate_multi_emergency(
        self,
        emergency: Dict,
        available_ambulances: List[Dict],
        available_trucks: List[Dict],
        nearby_hospitals: List[Dict]
    ) -> Dict:
        """
        Generate a coordinated response plan for a multi-emergency scenario.
        
        Args:
            emergency: Combined emergency data (location, type, details)
            available_ambulances: Available ambulances
            available_trucks: Available fire trucks
            nearby_hospitals: Hospitals to pre-alert
        
        Returns:
            Full coordination plan with sequencing, routes, and hospital alerts
        
        STEP-BY-STEP WALKTHROUGH:
        
        Scenario: Vehicle accident with fire at NH-48, Gurgaon
        
        Step 1 - Classify fire severity → Level 2 (Moderate)
          → 2 fire trucks needed
        
        Step 2 - Determine medical needs
          → Vehicle accident → likely trauma + burns
          → 2 ambulances needed (one for each vehicle)
        
        Step 3 - Sequence dispatch
          → Fire trucks dispatched FIRST (scene must be safe)
          → Ambulances dispatched 3 minutes later (after fire contained)
        
        Step 4 - Route all vehicles
          → Green corridor planned for all 4 vehicles
          → Signal timings staggered to avoid conflicts
        
        Step 5 - Alert hospitals
          → Trauma centers alerted for burn + accident victims
          → Blood bank alerted
        
        Step 6 - Public broadcast
          → "Emergency vehicles on NH-48, please clear lane"
        """
        logger.info(f"Coordinating multi-emergency: {emergency.get('emergency_type')}")
        
        location = emergency.get("location", {})
        
        # ── Step 1: Classify fire component ─────────────────────
        fire_classification = None
        fire_dispatch = None
        if emergency.get("has_fire"):
            fire_classification = self.fire_classifier.classify(emergency.get("fire_data", {}))
            fire_severity = fire_classification["severity_level"]
            
            fire_dispatch = self.firetruck_matcher.match_firetrucks(
                fire_request=emergency.get("fire_data", {}),
                available_trucks=available_trucks,
                severity_level=fire_severity
            )
        
        # ── Step 2: Determine ambulance needs ────────────────────
        ambulance_count = self._determine_ambulance_count(emergency)
        ambulance_request = self._build_ambulance_request(emergency)
        
        top_ambulances = self.ambulance_matcher.find_top_ambulances(
            request=ambulance_request,
            available_ambulances=available_ambulances,
            top_n=ambulance_count
        )
        
        # ── Step 3: Calculate dispatch sequence ──────────────────
        dispatch_sequence = self._calculate_dispatch_sequence(
            has_fire=emergency.get("has_fire", False),
            fire_severity=fire_classification["severity_level"] if fire_classification else 0,
            ambulances=top_ambulances,
            fire_trucks=fire_dispatch.get("dispatch_plan", []) if fire_dispatch else []
        )
        
        # ── Step 4: Route all vehicles ───────────────────────────
        routes = self._route_all_vehicles(dispatch_sequence, location)
        
        # ── Step 5: Alert hospitals ──────────────────────────────
        hospital_alerts = self._generate_hospital_alerts(emergency, nearby_hospitals, ambulance_count)
        
        # ── Step 6: Generate public broadcast ───────────────────
        public_broadcast = self._generate_public_broadcast(emergency, location)
        
        return {
            "emergency_id": emergency.get("id", "EMG-001"),
            "emergency_type": emergency.get("emergency_type"),
            "location": location,
            "fire_classification": fire_classification,
            "ambulances_dispatched": top_ambulances,
            "fire_trucks_dispatched": fire_dispatch,
            "dispatch_sequence": dispatch_sequence,
            "routes": routes,
            "hospital_alerts": hospital_alerts,
            "public_broadcast": public_broadcast,
            "coordination_summary": self._generate_summary(
                fire_classification, len(top_ambulances),
                fire_dispatch.get("dispatch_count", 0) if fire_dispatch else 0
            )
        }

    # ─── PRIVATE METHODS ─────────────────────────────────────────────────────

    def _determine_ambulance_count(self, emergency: Dict) -> int:
        """Determine how many ambulances to send."""
        base = emergency.get("estimated_casualties", 1)
        if emergency.get("emergency_type") == "major_accident":
            return max(2, base)
        if emergency.get("emergency_type") == "building_collapse":
            return max(4, base)
        return max(1, base)

    def _build_ambulance_request(self, emergency: Dict) -> Dict:
        """Build ambulance matching request from multi-emergency data."""
        return {
            "location": emergency.get("location", {}),
            "emergency_type": emergency.get("primary_medical_type", "trauma"),
            "requires_icu": emergency.get("has_critical_patients", False),
            "requires_ventilator": False,
            "patient": {"age": 35, "conscious": True, "breathing": True}  # Defaults
        }

    def _calculate_dispatch_sequence(
        self,
        has_fire: bool,
        fire_severity: int,
        ambulances: List[Dict],
        fire_trucks: List[Dict]
    ) -> List[Dict]:
        """
        Determine the order and timing of vehicle dispatch.
        
        RULES:
        - If fire present: trucks first, ambulances after scene secured
        - No fire: ambulances immediately
        - Higher fire severity = longer delay before ambulances
        """
        sequence = []
        delay_map = {0: 0, 1: 2, 2: 3, 3: 5, 4: 10}  # fire severity → ambulance delay (min)
        
        # Add fire trucks first
        for truck in fire_trucks:
            sequence.append({
                **truck,
                "vehicle_category": "fire_truck",
                "dispatch_at_minutes": 0,
                "reason": "Secure scene and suppress fire before medical team arrives"
            })
        
        # Add ambulances with appropriate delay
        amb_delay = delay_map.get(fire_severity, 0) if has_fire else 0
        for amb in ambulances:
            sequence.append({
                **amb,
                "vehicle_category": "ambulance",
                "dispatch_at_minutes": amb_delay,
                "reason": f"Medical team dispatched {'after fire scene secured' if has_fire else 'immediately'}"
            })
        
        # Sort by dispatch time
        return sorted(sequence, key=lambda x: x["dispatch_at_minutes"])

    def _route_all_vehicles(self, dispatch_sequence: List[Dict], destination: Dict) -> List[Dict]:
        """Generate routes for all dispatched vehicles."""
        routes = []
        for vehicle in dispatch_sequence:
            if vehicle.get("current_lat") and vehicle.get("current_lon"):
                route = self.route_optimizer.optimize_route(
                    origin={"lat": vehicle["current_lat"], "lon": vehicle["current_lon"]},
                    destination=destination,
                    vehicle_type=vehicle.get("vehicle_category", "ambulance"),
                    is_critical=True
                )
                route["vehicle_id"] = vehicle.get("id")
                routes.append(route)
        return routes

    def _generate_hospital_alerts(
        self, emergency: Dict, hospitals: List[Dict], count: int
    ) -> List[Dict]:
        """Generate pre-alerts to send to hospitals."""
        alerts = []
        location = emergency.get("location", {})
        
        for hospital in hospitals[:count]:
            distance = haversine_distance(
                location.get("lat", 0), location.get("lon", 0),
                hospital.get("lat", 0), hospital.get("lon", 0)
            )
            
            alerts.append({
                "hospital_id": hospital.get("id"),
                "hospital_name": hospital.get("name"),
                "alert_type": "INCOMING_EMERGENCY",
                "emergency_type": emergency.get("primary_medical_type", "trauma"),
                "estimated_patients": emergency.get("estimated_casualties", 1),
                "eta_minutes": round((distance / 40) * 60),  # Approximate
                "message": f"Incoming emergency: {emergency.get('emergency_type')}. "
                          f"Prepare emergency bay for {emergency.get('estimated_casualties', 1)} patient(s).",
            })
        
        return alerts

    def _generate_public_broadcast(self, emergency: Dict, location: Dict) -> Dict:
        """Generate the public lane-clear notification message."""
        return {
            "message_type": "LANE_CLEAR_ALERT",
            "broadcast_radius_km": 3,
            "location": location,
            "message": (
                "🚨 EMERGENCY VEHICLES IN AREA — Please move to the left and clear the road. "
                "Multiple emergency vehicles responding to an incident."
            ),
            "channels": ["push_notification", "sms", "app_alert"],
        }

    def _generate_summary(
        self, fire_class: Dict, ambulance_count: int, truck_count: int
    ) -> str:
        """Generate a human-readable coordination summary."""
        severity = fire_class.get("severity_label", "Unknown") if fire_class else "N/A"
        return (
            f"Multi-emergency response coordinated: "
            f"{ambulance_count} ambulance(s) + {truck_count} fire truck(s). "
            f"Fire severity: {severity}. "
            f"Green corridor activated for all vehicles."
        )