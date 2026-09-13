/**
 * Tests for PhoneEngine
 */

const { PhoneEngine, KEYCODE_DIGITS } = require('../src/automation/phoneEngine');

describe('PhoneEngine', () => {
  let phone;

  beforeEach(() => {
    phone = new PhoneEngine();
  });

  it('1. Maps PIN digits to valid Android hardware keycodes (7-16)', () => {
    expect(KEYCODE_DIGITS['0']).toBe('7');
    expect(KEYCODE_DIGITS['1']).toBe('8');
    expect(KEYCODE_DIGITS['9']).toBe('16');
  });

  it('2. Returns battery level and temperature telemetry', async () => {
    const res = await phone.getBattery();
    expect(res.success).toBe(true);
    expect(res.batteryPercent).toBeGreaterThan(0);
    expect(res.batteryPercent).toBeLessThanOrEqual(100);
    expect(res.temperatureC).toBeGreaterThan(0);
  });

  it('3. Formats and dispatches alarm intent parameters', async () => {
    const res = await phone.setAlarm(7, 30, 'Morning Workout');
    expect(res.success).toBe(true);
    expect(res.time).toBe('07:30');
    expect(res.message).toContain('07:30');
  }, 15000);

  it('4. Handles wireless socket cooldown properly', async () => {
    phone.lastReconnectFailTime = Date.now();
    const res = await phone.connectWireless('192.168.1.100', 5555);
    expect(res.status).toBe('COOLDOWN_ACTIVE');
    expect(res.connected).toBe(false);
  });

  it('5. Dispatches rapid camera photo sequence without crashing', async () => {
    const res = await phone.takePhoto(true);
    expect(res.success).toBe(true);
    expect(res.type).toBe('selfie_front');
  }, 15000);
});
