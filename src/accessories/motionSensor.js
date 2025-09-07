// Motion sensor -> HomeKit MotionSensor.
class MotionSensor {
  constructor(platform, device) {
    this.platform = platform;
    this.api = platform.api;
    this.device = device;
    this.name = device.name || 'Motion Sensor';

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:motion:${device.id}`),
      Categories.SENSOR
    );

    this.service = this.accessory.getService(Service.MotionSensor)
      || this.accessory.addService(Service.MotionSensor, this.name);

    this.updateFromDevice(device);
  }

  isMotion(dev) {
    return !!(dev?.features?.alarm?.states?.alarm?.value);
  }

  updateFromDevice(dev) {
    this.device = dev;
    const { Characteristic } = this.api.hap;
    this.service.updateCharacteristic(Characteristic.MotionDetected, this.isMotion(dev));
  }

  updateFromEvent(p) {
    if (p.deviceId && p.deviceId !== this.device.id) return;
    this.updateFromDevice({ ...this.device, ...p.device });
  }
}

module.exports = MotionSensor;