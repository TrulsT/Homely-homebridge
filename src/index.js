// Entry point: register the platform with Homebridge.
const { HomelyPlatform } = require('./platform');

module.exports = (api) => {
  api.registerPlatform('homebridge-homely', 'Homely', HomelyPlatform);
};