// src/domain/value-objects/time.vo.spec.ts

import { Time } from './time.vo';

describe('Time', () => {
  describe('create', () => {
    it('should create Time from valid HH:mm format', () => {
      const time = Time.create('09:00');
      expect(time.toString()).toBe('09:00');
    });

    it('should create Time for midnight', () => {
      const time = Time.create('00:00');
      expect(time.toString()).toBe('00:00');
    });

    it('should create Time for end of day', () => {
      const time = Time.create('23:59');
      expect(time.toString()).toBe('23:59');
    });

    it('should throw for invalid format - missing colon', () => {
      expect(() => Time.create('0900')).toThrow(
        'Invalid time format: 0900. Expected HH:mm',
      );
    });

    it('should throw for invalid format - invalid hours', () => {
      expect(() => Time.create('25:00')).toThrow(
        'Invalid time format: 25:00. Expected HH:mm',
      );
    });

    it('should throw for invalid format - invalid minutes', () => {
      expect(() => Time.create('09:60')).toThrow(
        'Invalid time format: 09:60. Expected HH:mm',
      );
    });

    it('should throw for empty string', () => {
      expect(() => Time.create('')).toThrow(
        'Invalid time format: . Expected HH:mm',
      );
    });
  });

  describe('fromDate', () => {
    it('should extract time from Date in local timezone', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      const time = Time.fromDate(date);
      expect(time.toString()).toBe('14:30');
    });

    it('should pad single digit hours and minutes', () => {
      const date = new Date(2026, 0, 15, 9, 5);
      const time = Time.fromDate(date);
      expect(time.toString()).toBe('09:05');
    });
  });

  describe('fromDateUtc', () => {
    it('should extract time from Date in UTC', () => {
      const date = new Date(Date.UTC(2026, 0, 15, 14, 30));
      const time = Time.fromDateUtc(date);
      expect(time.toString()).toBe('14:30');
    });

    it('should pad single digit hours and minutes in UTC', () => {
      const date = new Date(Date.UTC(2026, 0, 15, 9, 5));
      const time = Time.fromDateUtc(date);
      expect(time.toString()).toBe('09:05');
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid format', () => {
      expect(Time.isValidFormat('09:00')).toBe(true);
      expect(Time.isValidFormat('00:00')).toBe(true);
      expect(Time.isValidFormat('23:59')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(Time.isValidFormat('24:00')).toBe(false);
      expect(Time.isValidFormat('09:60')).toBe(false);
      expect(Time.isValidFormat('9:00')).toBe(false);
      expect(Time.isValidFormat('')).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the time value as string', () => {
      const time = Time.create('12:30');
      expect(time.toString()).toBe('12:30');
    });
  });

  describe('isBefore', () => {
    it('should return true when this time is before other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(earlier.isBefore(later)).toBe(true);
    });

    it('should return false when this time is after or equal to other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(later.isBefore(earlier)).toBe(false);
      expect(earlier.isBefore(Time.create('09:00'))).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should return true when this time is after other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(later.isAfter(earlier)).toBe(true);
    });

    it('should return false when this time is before or equal to other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(earlier.isAfter(later)).toBe(false);
      expect(earlier.isAfter(Time.create('09:00'))).toBe(false);
    });
  });

  describe('isBeforeOrEqual', () => {
    it('should return true when this time is before other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(earlier.isBeforeOrEqual(later)).toBe(true);
    });

    it('should return true when times are equal', () => {
      const time = Time.create('09:00');
      expect(time.isBeforeOrEqual(Time.create('09:00'))).toBe(true);
    });

    it('should return false when this time is after other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(later.isBeforeOrEqual(earlier)).toBe(false);
    });
  });

  describe('isAfterOrEqual', () => {
    it('should return true when this time is after other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(later.isAfterOrEqual(earlier)).toBe(true);
    });

    it('should return true when times are equal', () => {
      const time = Time.create('09:00');
      expect(time.isAfterOrEqual(Time.create('09:00'))).toBe(true);
    });

    it('should return false when this time is before other', () => {
      const earlier = Time.create('09:00');
      const later = Time.create('10:00');
      expect(earlier.isAfterOrEqual(later)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true when times are equal', () => {
      const time1 = Time.create('09:00');
      const time2 = Time.create('09:00');
      expect(time1.equals(time2)).toBe(true);
    });

    it('should return false when times are different', () => {
      const time1 = Time.create('09:00');
      const time2 = Time.create('10:00');
      expect(time1.equals(time2)).toBe(false);
    });
  });

  describe('getHours', () => {
    it('should return the hour component', () => {
      const time = Time.create('14:30');
      expect(time.getHours()).toBe(14);
    });

    it('should return 0 for midnight', () => {
      const time = Time.create('00:30');
      expect(time.getHours()).toBe(0);
    });
  });

  describe('getMinutes', () => {
    it('should return the minutes component', () => {
      const time = Time.create('14:30');
      expect(time.getMinutes()).toBe(30);
    });

    it('should return 0 when minutes are 00', () => {
      const time = Time.create('14:00');
      expect(time.getMinutes()).toBe(0);
    });
  });
});
