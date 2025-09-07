// src/accessories/_base.js
const { uuid, PlatformAccessory, Categories } = require('hap-nodejs');

function hbUUID(id) {
  return uuid.generate(`homely:${id}`);
}

function makeAccessory(platform, id, name, category) {
  const acc = new platform.api.platformAccessory(name, hbUUID(id), category);
  return acc;
}

module.exports = { makeAccessory };