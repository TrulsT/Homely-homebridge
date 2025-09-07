# homebridge-homely

**Homebridge plugin for the Homely / Onesti SDK** — Yale Doorman, security system, and optional sensors in Apple HomeKit.

—

## Features
- Yale Doorman (lock status, read-only)
- Security system (read-only)
- Optional: motion, contact (door/window), leak, temperature, thermostat (read-only), HAN/power meter
- Uses REST API for discovery and Socket.IO WebSocket for live updates
- Enable or disable modules in plugin config

—

## Installation

Clone directly from GitHub (public repo):

```bash
# Install the plugin
sudo npm install -g git+https://github.com/TrulsT/Homely-homebridge.git

# Initialize config.json with your Homely credentials
npx homely-init —username you@example.com —password your-password

# Restart Homebridge
sudo hb-service restart      # or: sudo systemctl restart homebridge