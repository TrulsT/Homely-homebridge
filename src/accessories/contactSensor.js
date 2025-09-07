// Contact sensor (door/window) -> HomeKit ContactSensor.
class ContactSensor {
  constructor(platform, device) {
    this.platform = platform;
    this.api = platform.api;
    this.device = device;
    this.name = device.name || 'Contact Sensor';

    const { Service, Categories, Characteristic } = this.api.hap;

    this.accessory = new this.api.platformAccessory(
      this.name,
      this.api.hap.uuid.generate(`homely:contact:${device.id}`),
      Categories.SENSOR
    );

    this.service = this.accessory.getService(Service.ContactSensor)
      || this.accessory.addService(Service.ContactSensor, this.name);

    this.updateFromDevice(device);
  }

  isOpen(dev) {
    return !!(dev?.features?.alarm?.states?.alarm?.value);
  }

  updateFromDevice(dev) {
    this.device = dev;
    const { Characteristic } = this.api.hap;
    this.service.updateCharacteristic(
      Characteristic.ContactSensorState,
      this.isOpen(dev)
        ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
        : Characteristic.ContactSensorState.CONTACT_DETECTED
    );
  }

  updateFromEvent(p) {
    if (p.deviceId && p.deviceId !== this.device.id) return;
    this.updateFromDevice({ ...this.device, ...p.device });
  }
}

module.exports = ContactSensor;