/**
 * AURA Mobile Automation — USB to Wireless ADB Bootstrap Script
 *
 * Usage:
 * 1. Connect Android phone to PC via USB cable with USB Debugging enabled.
 * 2. Run: node setup_phone.js
 * 3. Once paired, disconnect USB cable. AURA controls phone over Wi-Fi TCP/IP port 5555.
 */
'use strict';

const phone = require('./core/phoneEngine');

async function bootstrapWireless() {
  console.log('🔍 Detecting connected USB devices...');
  const devices = await phone.getConnectedDevices();
  const usbDev = devices.find((d) => d.state === 'device' && !d.id.includes(':'));

  if (!usbDev) {
    console.error('❌ No authorized USB device found. Connect cable and authorize debugging on phone.');
    console.log('Currently detected devices:', devices);
    return;
  }

  console.log(`📱 Switching device ${usbDev.id} to TCP/IP port 5555...`);
  await phone.runAdb(['-s', usbDev.id, 'tcpip', '5555']);
  await new Promise((r) => setTimeout(r, 2000));

  // Extract IP from wlan0 interface
  const ipRes = await phone.runAdb(['-s', usbDev.id, 'shell', 'ip', '-f', 'inet', 'addr', 'show', 'wlan0']);
  const match = ipRes.stdout && ipRes.stdout.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
  const phoneIp = match ? match[1] : null;

  if (!phoneIp) {
    console.error('❌ Could not retrieve Wi-Fi IP from wlan0. Ensure phone is connected to the same Wi-Fi network.');
    return;
  }

  console.log(`🔗 Connecting to ${phoneIp}:5555 wirelessly...`);
  const connRes = await phone.connectPhone(phoneIp, 5555);
  console.log(`\n✅ ${connRes.message}`);
  console.log('You may now disconnect the USB cable. Wireless ADB is active!');
}

if (require.main === module) {
  bootstrapWireless().catch((err) => {
    console.error('Error during wireless bootstrap:', err.message);
  });
}

module.exports = { bootstrapWireless };
