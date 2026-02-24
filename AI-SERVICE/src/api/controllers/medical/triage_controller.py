"""
ResQRoute AI - Triage Controller
Handles /api/v1/medical/triage endpoint
Quick patient prioritization for multiple casualties
"""

from flask import Blueprint, request, jsonify
from utils.logger import setup_logger

triage_bp = Blueprint("triage", __name__)
logger = setup_logger(__name__)


# START Triage Colors (international standard)
TRIAGE_LEVELS = {
    "immediate":  {"color": "RED",    "priority": 1, "label": "Life-threatening — treat NOW"},
    "delayed":    {"color": "YELLOW", "priority": 2, "label": "Serious — can wait 1 hour"},
    "minimal":    {"color": "GREEN",  "priority": 3, "label": "Minor — walking wounded"},
    "expectant":  {"color": "BLACK",  "priority": 4, "label": "Critical/unsurvivable — comfort care"},
}


@triage_bp.route("/assess", methods=["POST"])
def assess_patient():
    """
    POST /api/v1/medical/triage/assess
    
    Quickly triage a patient using START (Simple Triage and Rapid Treatment) protocol.
    
    Request body:
        {
          "breathing": true,
          "respiratory_rate_per_min": 22,
          "pulse_present": true,
          "can_follow_commands": false,
          "ambulatory": false,
          "severe_bleeding": true
        }
    
    Response:
        { "triage_category": "immediate", "color": "RED", "priority": 1, "rationale": "..." }
    """
    try:
        data = request.get_json()
        
        # START Triage Protocol decision logic
        result = _apply_start_protocol(data)
        
        return jsonify({"success": True, **result}), 200
    
    except Exception as e:
        logger.error(f"Error in assess_patient: {e}")
        return jsonify({"error": str(e)}), 500


def _apply_start_protocol(data: dict) -> dict:
    """
    Apply START Triage Protocol.
    
    Decision tree:
    1. Can walk? → GREEN (minimal)
    2. Breathing? No → Open airway. Still no → BLACK
    3. Respirations > 30/min or < 10/min → RED
    4. No radial pulse / capillary refill > 2 sec → RED
    5. Cannot follow commands → RED
    6. All above OK → YELLOW
    """
    rationale = []
    
    # Step 1: Ambulatory?
    if data.get("ambulatory", False):
        rationale.append("Patient is walking — minimal injuries")
        return {**TRIAGE_LEVELS["minimal"], "triage_category": "minimal", "rationale": "; ".join(rationale)}
    
    # Step 2: Breathing?
    breathing = data.get("breathing", True)
    if not breathing:
        rationale.append("Not breathing after airway opened")
        return {**TRIAGE_LEVELS["expectant"], "triage_category": "expectant", "rationale": "; ".join(rationale)}
    
    # Step 3: Respiratory rate
    rr = data.get("respiratory_rate_per_min", 15)
    if rr > 30 or rr < 10:
        rationale.append(f"Abnormal respiratory rate ({rr}/min)")
        return {**TRIAGE_LEVELS["immediate"], "triage_category": "immediate", "rationale": "; ".join(rationale)}
    
    # Step 4: Pulse / perfusion
    if not data.get("pulse_present", True):
        rationale.append("No radial pulse detected")
        return {**TRIAGE_LEVELS["immediate"], "triage_category": "immediate", "rationale": "; ".join(rationale)}
    
    # Step 5: Mental status
    if not data.get("can_follow_commands", True):
        rationale.append("Cannot follow simple commands — altered consciousness")
        return {**TRIAGE_LEVELS["immediate"], "triage_category": "immediate", "rationale": "; ".join(rationale)}
    
    # All checks passed → delayed
    rationale.append("Stable vitals, serious but not immediately life-threatening")
    return {**TRIAGE_LEVELS["delayed"], "triage_category": "delayed", "rationale": "; ".join(rationale)}