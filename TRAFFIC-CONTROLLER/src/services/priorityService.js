class PriorityService {
  getPriority(vehicleType, customPriority) {
    if (customPriority !== undefined) return customPriority;
    
    const priorities = {
      'AMBULANCE': 10,
      'FIRE_TRUCK': 10,
      'POLICE': 8,
      'VIP': 5,
      'PUBLIC_TRANSPORT': 3
    };
    
    return priorities[vehicleType?.toUpperCase()] || 1;
  }

  comparePriority(vehicle1, vehicle2) {
    const p1 = this.getPriority(vehicle1.type, vehicle1.priority);
    const p2 = this.getPriority(vehicle2.type, vehicle2.priority);
    return p2 - p1;
  }
}

module.exports = new PriorityService();