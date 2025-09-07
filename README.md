# homebridge-homely

**Homebridge plugin for the Homely / Onesti SDK** — Yale Doorman, security system, and optional sensors in Apple HomeKit.

## Features
- Yale Doorman (lock status, read-only)
- Security system (read-only)
- Optional: motion, contact (door/window), leak, temperature, thermostat (read), HAN/power meter
- REST for discovery; WebSocket (Socket.IO) for live updates
- Module selection via config (enable only what you want)

## Installation
```bash
npm install -g homebridge-homely
# or from source:
npm install
npm link