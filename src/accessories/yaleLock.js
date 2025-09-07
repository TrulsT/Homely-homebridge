// Yale Doorman as a read-only LockMechanism (until write endpoints exist).
class YaleLock {
  constructor(platform, device) {
    this.platform = platform;
    this.api = platform.api;
    this.log = platform.log;
    this.device = device;
    this.name = device.name || 'Yale Doorman';

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:lock:${device.id}`),
      Categories.DOOR_LOCK
    );

    this.service = this.accessory.getService(Service.LockMechanism)
      || this.accessory.addService(Service.LockMechanism, this.name);

    // Target state setter (blocked unless allowWrites=true and API supports it)
    this.service.getCharacteristic(Characteristic.LockTargetState).onSet(async () => {
      if (!this.platform.allowWrites) throw new Error('Lock control disabled (read-only).');
      this.log('[Yale] allowWrites enabled, but no public write endpoint documented.');
    });

    this.updateFromDevice(device);
  }

  // Heuristic: door open => unsecured
  computeStates(dev) {
    const { Characteristic } = this.api.hap;
    const openLike = !!(dev?.features?.alarm?.states?.alarm?.value);
    const secured = !openLike;
    return {
      current: secured ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED,
      target: secured ? Characteristic.LockTargetState.SECURED : Characteristic.LockTargetState.UNSECURED
    };
  }

  updateFromDevice(dev) {
    this.device = dev;
    const { Characteristic } = this.api.hap;
    const s = this.computeStates(dev);
    this.service.updateCharacteristic(Characteristic.LockCurrentState, s.current);
    this.service.updateCharacteristic(Characteristic.LockTargetState, s.target);
  }

  updateFromEvent(payload) {
    if (payload.deviceId && payload.deviceId !== this.device.id) return;
    this.updateFromDevice({ ...this.device, ...payload.device });
  }
}

module.exports = YaleLock;