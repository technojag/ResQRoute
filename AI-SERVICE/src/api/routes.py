"""
ResQRoute AI Service - API Routes
Registers all endpoints for the Flask application.
"""

from flask import Flask
from api.controllers.medical.ambulance_route_controller import ambulance_bp
from api.controllers.medical.hospital_matching_controller import hospital_bp
from api.controllers.medical.triage_controller import triage_bp
from api.controllers.fire.firetruck_route_controller import firetruck_bp
from api.controllers.fire.fire_severity_controller import fire_severity_bp
from api.controllers.fire.spread_prediction_controller import spread_bp
from api.controllers.unified.coordination_controller import coordination_bp


def register_routes(app: Flask):
    """Register all API blueprints with URL prefixes."""
    
    # Health check
    @app.route("/health")
    def health():
        return {"status": "healthy", "service": "ResQRoute AI Service"}, 200
    
    # Medical endpoints
    app.register_blueprint(ambulance_bp,    url_prefix="/api/v1/medical/ambulance")
    app.register_blueprint(hospital_bp,     url_prefix="/api/v1/medical/hospital")
    app.register_blueprint(triage_bp,       url_prefix="/api/v1/medical/triage")
    
    # Fire endpoints
    app.register_blueprint(firetruck_bp,    url_prefix="/api/v1/fire/truck")
    app.register_blueprint(fire_severity_bp, url_prefix="/api/v1/fire/severity")
    app.register_blueprint(spread_bp,       url_prefix="/api/v1/fire/spread")
    
    # Unified / multi-emergency endpoints
    app.register_blueprint(coordination_bp, url_prefix="/api/v1/unified")