// Thermostat (read values) -> HomeKit Thermostat.
class Thermostat {
  constructor(platform, device) {
    this.platform = platform;
    this.api = platform.api;
    this.device = device;
    this.name = device.name || 'Thermostat';

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:thermo:${device.id}`),
      Categories.THERMOSTAT
    );

    this.service = this.accessory.getService(Service.Thermostat)
      || this.accessory.addService(Service.Thermostat, this.name);

    this.updateFromDevice(device);
  }

  // Some devices report LocalTemperature as x100 (e.g. 2370 = 23.7°C)
  readTemp(dev) {
    const raw = dev?.features?.thermostat?.states?.LocalTemperature?.value;
    if (typeof raw !== 'number') return null;
    return raw > 100 ? raw / 100 : raw;
  }

  updateFromDevice(dev) {
    this.device = dev;
    const { Characteristic } = this.api.hap;
    const t = this.readTemp(dev);
    if (t == null) return;
    this.service.updateCharacteristic(Characteristic.CurrentTemperature, t);
    this.service.updateCharacteristic(Characteristic.TargetTemperature, t);
    this.service.updateCharacteristic(Characteristic.TemperatureDisplayUnits, Characteristic.TemperatureDisplayUnits.CELSIUS);
    this.service.updateCharacteristic(Characteristic.CurrentHeatingCoolingState, Characteristic.CurrentHeatingCoolingState.HEAT);
    this.service.updateCharacteristic(Characteristic.TargetHeatingCoolingState, Characteristic.TargetHeatingCoolingState.HEAT);
  }

  updateFromEvent(p) {
    if (p.deviceId && p.deviceId !== this.device.id) return;
    this.updateFromDevice({ ...this.device, ...p.device });
  }
}

module.exports = Thermostat;