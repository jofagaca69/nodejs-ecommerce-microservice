const orderController = require('../../../src/controllers/orderController');

describe('OrderController - Dashboard Stats Calculation', () => {
  describe('calculateTimePeriod', () => {
    it('DASHBOARD-UNIT-001: should calculate day period correctly (last 24 hours)', () => {
      const { start, end } = orderController.calculateTimePeriod('day');
      const now = new Date();
      const expectedStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Allow 1 second tolerance for execution time
      expect(end.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
      expect(start.getTime()).toBeGreaterThanOrEqual(expectedStart.getTime() - 1000);
      expect(start.getTime()).toBeLessThanOrEqual(expectedStart.getTime() + 1000);
    });

    it('DASHBOARD-UNIT-002: should calculate week period correctly (last 7 days)', () => {
      const { start, end } = orderController.calculateTimePeriod('week');
      const now = new Date();
      const expectedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      expect(end.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
      expect(start.getTime()).toBeGreaterThanOrEqual(expectedStart.getTime() - 1000);
      expect(start.getTime()).toBeLessThanOrEqual(expectedStart.getTime() + 1000);
    });

    it('DASHBOARD-UNIT-003: should calculate month period correctly (last 30 days)', () => {
      const { start, end } = orderController.calculateTimePeriod('month');
      const now = new Date();
      const expectedStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      expect(end.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
      expect(start.getTime()).toBeGreaterThanOrEqual(expectedStart.getTime() - 1000);
      expect(start.getTime()).toBeLessThanOrEqual(expectedStart.getTime() + 1000);
    });

    it('DASHBOARD-UNIT-004: should default to day period for invalid period', () => {
      const { start, end } = orderController.calculateTimePeriod('invalid');
      const now = new Date();
      const expectedStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      expect(end.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
      expect(start.getTime()).toBeGreaterThanOrEqual(expectedStart.getTime() - 1000);
    });

    it('DASHBOARD-UNIT-005: should return end date as current time', () => {
      const { start, end } = orderController.calculateTimePeriod('day');
      const now = new Date();
      
      // End should be very close to now (within 1 second)
      expect(Math.abs(end.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });
});
