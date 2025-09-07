// Homebridge platform: discovers devices and creates accessories.
const { HomelyClient } = require('./homelyClient');
const YaleLock = require('./accessories/yaleLock');
const SecuritySystem = require('./accessories/securitySystem');
const MotionSensor = require('./accessories/motionSensor');
const ContactSensor = require('./accessories/contactSensor');
const FloodSensor = require('./accessories/floodSensor');
const TemperatureSensor = require('./accessories/temperatureSensor');
const Thermostat = require('./accessories/thermostat');
const PowerMeter = require('./accessories/powerMeter');

class HomelyPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.api = api;
    this.config = config || {};

    // What to expose
    this.expose = {
      yaleDoorman: this.config.expose?.yaleDoorman !== false,
      securitySystem: this.config.expose?.securitySystem !== false,
      motion: !!this.config.expose?.motion,
      contacts: !!this.config.expose?.contacts,
      flood: !!this.config.expose?.flood,
      temperature: !!this.config.expose?.temperature,
      thermostat: !!this.config.expose?.thermostat,
      han: !!this.config.expose?.han
    };

    this.includeModels = this.config.includeModels || null;
    this.excludeModels = this.config.excludeModels || null;

    this.pollInterval = Math.max(15, this.config.pollInterval || 60);
    this.allowWrites = !!this.config.allowWrites;

    this.locationId = this.config.locationId || null;
    this.accessories = new Map(); // id -> accessory wrapper

    this.client = new HomelyClient(this.log, {
      username: this.config.username,
      password: this.config.password,
      baseUrl: this.config.baseUrl || 'https://sdk.iotiliti.cloud/homely',
      wsUrl: this.config.wsUrl || '//sdk.iotiliti.cloud',
      logVerbose: !!this.config.logVerbose
    });

    if (api) api.on('didFinishLaunching', () => this.start());
  }

  async start() {
    try {
      const locations = await this.client.getLocations();
      if (!locations?.length) return this.log('No locations for this account');
      if (!this.locationId) {
        this.locationId = locations[0].locationId;
        this.log(`Using locationId=${this.locationId} (${locations[0].name || ''})`);
      }

      await this.syncOnce();
      this.client.connectWebSocket(this.locationId, (evt) => this.onEvent(evt));
      setInterval(() => this.syncOnce().catch(() => {}), this.pollInterval * 1000);
    } catch (e) {
      this.log('Startup failed:', e.message || e);
    }
  }

  async syncOnce() {
    const home = await this.client.getHome(this.locationId);

    // Security system is location-level
    if (this.expose.securitySystem) {
      this.upsert('sec', () => new SecuritySystem(this, home), (acc) => acc.updateFrom(home));
    }

    // Devices
    for (const d of home.devices || []) {
      if (!this.shouldInclude(d)) continue;
      const model = (d.modelName || '').toLowerCase();
      const name = (d.name || '').toLowerCase();

      if (this.expose.yaleDoorman && (/yale/.test(model) || /doorman/.test(model) || /yale/.test(name))) {
        this.upsert(`lock-${d.id}`, () => new YaleLock(this, d), (acc) => acc.updateFromDevice(d));
        continue;
      }
      if (this.expose.motion && /motion|beveg/.test(model)) {
        this.upsert(`motion-${d.id}`, () => new MotionSensor(this, d), (acc) => acc.updateFromDevice(d));
      }
      if (this.expose.contacts && (/window|door|contact|sensor/.test(model) || d.features?.alarm?.states?.alarm !== undefined)) {
        this.upsert(`contact-${d.id}`, () => new ContactSensor(this, d), (acc) => acc.updateFromDevice(d));
      }
      if (this.expose.flood && /flood|water|vann/.test(model)) {
        this.upsert(`flood-${d.id}`, () => new FloodSensor(this, d), (acc) => acc.updateFromDevice(d));
      }
      if (this.expose.temperature && (d.features?.temperature?.states?.temperature?.value != null)) {
        this.upsert(`temp-${d.id}`, () => new TemperatureSensor(this, d), (acc) => acc.updateFromDevice(d));
      }
      if (this.expose.thermostat && /thermostat|elko/.test(model)) {
        this.upsert(`thermo-${d.id}`, () => new Thermostat(this, d), (acc) => acc.updateFromDevice(d));
      }
      if (this.expose.han && /han|meter|emi/.test(model)) {
        this.upsert(`pow-${d.id}`, () => new PowerMeter(this, d), (acc) => acc.updateFromDevice(d));
      }
    }
  }

  // Create or update accessory wrapper
  upsert(key, createFn, updateFn) {
    let wrapper = this.accessories.get(key);
    if (!wrapper) {
      wrapper = createFn();
      this.accessories.set(key, wrapper);
      this.api.registerPlatformAccessories('homebridge-homely', 'Homely', [wrapper.accessory]);
      this.log(`Registered: ${wrapper.name}`);
    }
    updateFn(wrapper);
  }

  // Handle live events (payload structure may vary)
  onEvent(evt) {
    const p = evt?.payload || {};
    const id = p.deviceId || p.id || p.device?.id;
    if (!id) return;
    for (const [key, w] of this.accessories) {
      if (key.endsWith(id)) w.updateFromEvent(p);
    }
  }

  // Optional cache support (not used here)
  configureAccessory() {}

  // Include/exclude filters by modelName
  shouldInclude(device) {
    const model = (device.modelName || '').trim();
    if (this.includeModels?.length && !this.includeModels.includes(model)) return false;
    if (this.excludeModels?.length && this.excludeModels.includes(model)) return false;
    return true;
  }
}

module.exports = { HomelyPlatform };