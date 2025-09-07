// Security system mapped to HomeKit SecuritySystem (read-only).
class SecuritySystem {
  constructor(platform, home) {
    this.platform = platform;
    this.api = platform.api;
    this.log = platform.log;
    this.name = `Homely Security (${home.name || home.locationId})`;

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:sec:${home.locationId}`),
      Categories.SECURITY_SYSTEM
    );

    this.service = this.accessory.getService(Service.SecuritySystem)
      || this.accessory.addService(Service.SecuritySystem, this.name);

    // Block writes unless supported
    this.service.getCharacteristic(Characteristic.SecuritySystemTargetState).onSet(async () => {
      if (!this.platform.allowWrites) throw new Error('Arm/disarm disabled (read-only).');
    });

    this.updateFrom(home);
  }

  mapState(s) {
    const C = this.api.hap.Characteristic.SecuritySystemCurrentState;
    switch (String(s || '').toUpperCase()) {
      case 'DISARMED': return C.DISARMED;
      case 'ARMED_AWAY':
      case 'ARMED_PARTLY':
      case 'ARMED_NIGHT': return C.AWAY_ARM;
      case 'BREACHED':
      case 'ALARM_PENDING':
      case 'ARMED_NIGHT_PENDING':
      case 'ARMED_AWAY_PENDING': return C.ALARM_TRIGGERED;
      default: return C.DISARMED;
    }
  }

  updateFrom(home) {
    const { Characteristic } = this.api.hap;
    const cur = this.mapState(home.alarmState);
    this.service.updateCharacteristic(Characteristic.SecuritySystemCurrentState, cur);
    this.service.updateCharacteristic(
      Characteristic.SecuritySystemTargetState,
      cur === Characteristic.SecuritySystemCurrentState.DISARMED
        ? Characteristic.SecuritySystemTargetState.DISARM
        : Characteristic.SecuritySystemTargetState.AWAY_ARM
    );
  }

  updateFromEvent(payload) {
    if (!payload?.locationId) return;
    this.updateFrom({ alarmState: payload.alarmState });
  }
}

module.exports = SecuritySystem;