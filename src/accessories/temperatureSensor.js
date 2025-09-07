// Temperature -> HomeKit TemperatureSensor.
class TemperatureSensor {
  constructor(platform, device) {
    this.platform = platform;
    this.api = platform.api;
    this.device = device;
    this.name = device.name || 'Temperature';

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:temp:${device.id}`),
      Categories.SENSOR
    );

    this.service = this.accessory.getService(Service.TemperatureSensor)
      || this.accessory.addService(Service.TemperatureSensor, this.name);

    this.updateFromDevice(device);
  }

  readTemp(dev) {
    const v = dev?.features?.temperature?.states?.temperature?.value;
    return typeof v === 'number' ? v : null;
  }

  updateFromDevice(dev) {
    this.device = dev;
    const { Characteristic } = this.api.hap;
    const t = this.readTemp(dev);
    if (t != null) this.service.updateCharacteristic(Characteristic.CurrentTemperature, t);
  }

  updateFromEvent(p) {
    if (p.deviceId && p.deviceId !== this.device.id) return;
    this.updateFromDevice({ ...this.device, ...p.device });
  }
}

module.exports = TemperatureSensor;