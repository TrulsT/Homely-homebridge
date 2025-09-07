// Water leak -> HomeKit LeakSensor.
class FloodSensor {
  constructor(platform, device) {
    this.platform = platform;
    this.api = platform.api;
    this.device = device;
    this.name = device.name || 'Leak Sensor';

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:flood:${device.id}`),
      Categories.SENSOR
    );

    this.service = this.accessory.getService(Service.LeakSensor)
      || this.accessory.addService(Service.LeakSensor, this.name);

    this.updateFromDevice(device);
  }

  hasLeak(dev) {
    return !!(dev?.features?.alarm?.states?.flood?.value);
  }

  updateFromDevice(dev) {
    this.device = dev;
    const { Characteristic } = this.api.hap;
    this.service.updateCharacteristic(
      Characteristic.LeakDetected,
      this.hasLeak(dev) ? Characteristic.LeakDetected.LEAK_DETECTED : Characteristic.LeakDetected.LEAK_NOT_DETECTED
    );
  }

  updateFromEvent(p) {
    if (p.deviceId && p.deviceId !== this.device.id) return;
    this.updateFromDevice({ ...this.device, ...p.device });
  }
}

module.exports = FloodSensor;