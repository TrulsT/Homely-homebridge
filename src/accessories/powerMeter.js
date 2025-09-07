// Power meter: quick mapping using LightSensor as a numeric display (Lux as Watts).
class PowerMeter {
  constructor(platform, device) {
    this.platform = platform;
    this.api = platform.api;
    this.device = device;
    this.name = device.name || 'Power Meter';

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:pow:${device.id}`),
      Categories.SENSOR
    );

    // Using LightSensor for a single numeric value display
    this.service = this.accessory.getService(Service.LightSensor)
      || this.accessory.addService(Service.LightSensor, `${this.name} (W)`);

    this.updateFromDevice(device);
  }

  readDemand(dev) {
    return dev?.features?.metering?.states?.demand?.value; // Watts
  }

  updateFromDevice(dev) {
    this.device = dev;
    const { Characteristic } = this.api.hap;
    const w = this.readDemand(dev);
    if (typeof w === 'number') {
      this.service.updateCharacteristic(Characteristic.CurrentAmbientLightLevel, Math.max(0.0001, w));
    }
  }

  updateFromEvent(p) {
    if (p.deviceId && p.deviceId !== this.device.id) return;
    this.updateFromDevice({ ...this.device, ...p.device });
  }
}

module.exports = PowerMeter;