// src/domain/entities/availability.entity.spec.ts

import { Availability } from './availability.entity';

describe('Availability', () => {
  describe('constructor', () => {
    it('should create availability with valid range', () => {
      const availability = new Availability(
        'id-1',
        'prof-1',
        1,
        '09:00',
        '17:00',
      );

      expect(availability.id).toBe('id-1');
      expect(availability.professionalId).toBe('prof-1');
      expect(availability.dayOfWeek).toBe(1);
      expect(availability.startTime).toBe('09:00');
      expect(availability.endTime).toBe('17:00');
    });

    it('should throw for invalid day of week (negative)', () => {
      expect(
        () => new Availability('id-1', 'prof-1', -1, '09:00', '17:00'),
      ).toThrow('Invalid day of week: -1. Must be 0-6');
    });

    it('should throw for invalid day of week (greater than 6)', () => {
      expect(
        () => new Availability('id-1', 'prof-1', 7, '09:00', '17:00'),
      ).toThrow('Invalid day of week: 7. Must be 0-6');
    });

    it('should throw when startTime is after endTime', () => {
      expect(
        () => new Availability('id-1', 'prof-1', 1, '17:00', '09:00'),
      ).toThrow(
        'Invalid availability range: startTime (17:00) must be before endTime (09:00)',
      );
    });

    it('should throw when startTime equals endTime', () => {
      expect(
        () => new Availability('id-1', 'prof-1', 1, '09:00', '09:00'),
      ).toThrow(
        'Invalid availability range: startTime (09:00) must be before endTime (09:00)',
      );
    });

    it('should throw for invalid time format', () => {
      expect(
        () => new Availability('id-1', 'prof-1', 1, '25:00', '17:00'),
      ).toThrow('Invalid time format');
    });
  });

  describe('overlapsWith', () => {
    it('should return true when slots overlap on same day', () => {
      const slot1 = new Availability('id-1', 'prof-1', 1, '09:00', '12:00');
      const slot2 = new Availability('id-2', 'prof-1', 1, '11:00', '14:00');

      expect(slot1.overlapsWith(slot2)).toBe(true);
      expect(slot2.overlapsWith(slot1)).toBe(true);
    });

    it('should return false when slots do not overlap on same day', () => {
      const slot1 = new Availability('id-1', 'prof-1', 1, '09:00', '12:00');
      const slot2 = new Availability('id-2', 'prof-1', 1, '12:00', '14:00');

      expect(slot1.overlapsWith(slot2)).toBe(false);
      expect(slot2.overlapsWith(slot1)).toBe(false);
    });

    it('should return false when slots are on different days', () => {
      const slot1 = new Availability('id-1', 'prof-1', 1, '09:00', '12:00');
      const slot2 = new Availability('id-2', 'prof-1', 2, '09:00', '12:00');

      expect(slot1.overlapsWith(slot2)).toBe(false);
      expect(slot2.overlapsWith(slot1)).toBe(false);
    });

    it('should return true when one slot contains another', () => {
      const outer = new Availability('id-1', 'prof-1', 1, '08:00', '18:00');
      const inner = new Availability('id-2', 'prof-1', 1, '09:00', '12:00');

      expect(outer.overlapsWith(inner)).toBe(true);
      expect(inner.overlapsWith(outer)).toBe(true);
    });
  });

  describe('validateNoOverlaps', () => {
    it('should not throw when slots have no overlaps', () => {
      const slots = [
        new Availability('id-1', 'prof-1', 1, '09:00', '12:00'),
        new Availability('id-2', 'prof-1', 1, '12:00', '17:00'),
        new Availability('id-3', 'prof-1', 3, '10:00', '16:00'),
      ];

      expect(() => Availability.validateNoOverlaps(slots)).not.toThrow();
    });

    it('should throw when slots overlap on same day', () => {
      const slots = [
        new Availability('id-1', 'prof-1', 1, '09:00', '12:00'),
        new Availability('id-2', 'prof-1', 1, '11:00', '14:00'),
      ];

      expect(() => Availability.validateNoOverlaps(slots)).toThrow(
        'Overlapping availability slots on day 1',
      );
    });

    it('should not throw for empty array', () => {
      expect(() => Availability.validateNoOverlaps([])).not.toThrow();
    });

    it('should not throw for single slot', () => {
      const slots = [new Availability('id-1', 'prof-1', 1, '09:00', '17:00')];

      expect(() => Availability.validateNoOverlaps(slots)).not.toThrow();
    });
  });

  describe('containsTime', () => {
    it('should return true when time is inside range', () => {
      const availability = new Availability(
        'id-1',
        'prof-1',
        1,
        '09:00',
        '17:00',
      );

      expect(availability.containsTime('10:00')).toBe(true);
      expect(availability.containsTime('12:30')).toBe(true);
      expect(availability.containsTime('16:59')).toBe(true);
    });

    it('should return true when time is at start boundary (inclusive)', () => {
      const availability = new Availability(
        'id-1',
        'prof-1',
        1,
        '09:00',
        '17:00',
      );

      expect(availability.containsTime('09:00')).toBe(true);
    });

    it('should return false when time is at end boundary (exclusive)', () => {
      const availability = new Availability(
        'id-1',
        'prof-1',
        1,
        '09:00',
        '17:00',
      );

      expect(availability.containsTime('17:00')).toBe(false);
    });

    it('should return false when time is before range', () => {
      const availability = new Availability(
        'id-1',
        'prof-1',
        1,
        '09:00',
        '17:00',
      );

      expect(availability.containsTime('08:59')).toBe(false);
    });

    it('should return false when time is after range', () => {
      const availability = new Availability(
        'id-1',
        'prof-1',
        1,
        '09:00',
        '17:00',
      );

      expect(availability.containsTime('17:01')).toBe(false);
    });
  });
});
