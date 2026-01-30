// src/domain/value-objects/time.vo.ts

/**
 * ARCHITECTURAL DECISION:
 * - What: Value Object for time representation (HH:mm format)
 * - Why: Centralizes time validation and comparison logic in the domain
 * - Alternatives: Validation in use cases, but VO is more reusable and encapsulates business rules
 *
 * CLEAN ARCHITECTURE:
 * - Located in Domain layer (pure business logic)
 * - No framework dependencies
 * - Immutable by design
 */
export class Time {
  private static readonly TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

  private constructor(private readonly value: string) {}

  /**
   * Creates a Time value object from a string
   * @param value - Time string in HH:mm format
   * @throws Error if format is invalid
   */
  static create(value: string): Time {
    if (!Time.isValidFormat(value)) {
      throw new Error(`Invalid time format: ${value}. Expected HH:mm`);
    }
    return new Time(value);
  }

  /**
   * Creates a Time value object from a Date (extracts time part as HH:mm in local timezone).
   * Keeps time formatting in domain (DRY) and avoids duplicating format logic in use cases.
   *
   * @param date - JavaScript Date to extract time from
   * @returns Time in HH:mm format (local)
   */
  static fromDate(date: Date): Time {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const value = `${hours}:${minutes}`;
    return new Time(value);
  }

  /**
   * Creates a Time value object from a Date using UTC (getUTCHours, getUTCMinutes).
   * Use when the Date was built as UTC (e.g. from API "date + time" interpreted as UTC).
   * Ensures availability comparison uses the same time reference as the stored slots (UTC).
   *
   * @param date - JavaScript Date to extract UTC time from
   * @returns Time in HH:mm format (UTC)
   */
  static fromDateUtc(date: Date): Time {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const value = `${hours}:${minutes}`;
    return new Time(value);
  }

  /**
   * Validates if a string has valid HH:mm format
   */
  static isValidFormat(value: string): boolean {
    return Time.TIME_REGEX.test(value);
  }

  /**
   * Returns the time value as string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Compares if this time is before another time
   */
  isBefore(other: Time): boolean {
    return this.value < other.value;
  }

  /**
   * Compares if this time is after another time
   */
  isAfter(other: Time): boolean {
    return this.value > other.value;
  }

  /**
   * Compares if this time is before or equal to another time
   */
  isBeforeOrEqual(other: Time): boolean {
    return this.value <= other.value;
  }

  /**
   * Compares if this time is after or equal to another time
   */
  isAfterOrEqual(other: Time): boolean {
    return this.value >= other.value;
  }

  /**
   * Checks equality with another Time
   */
  equals(other: Time): boolean {
    return this.value === other.value;
  }

  /**
   * Gets the hour component
   */
  getHours(): number {
    return parseInt(this.value.split(':')[0], 10);
  }

  /**
   * Gets the minutes component
   */
  getMinutes(): number {
    return parseInt(this.value.split(':')[1], 10);
  }
}
