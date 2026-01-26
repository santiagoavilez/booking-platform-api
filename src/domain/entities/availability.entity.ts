// src/domain/entities/availability.entity.ts

import { Time } from '../value-objects/time.vo';

/**
 * ARCHITECTURAL DECISION:
 * - What: Domain entity representing a professional's availability slot
 * - Why: Encapsulates business rules for availability management
 * - Responsibilities:
 *   - Validate time ranges
 *   - Check for overlaps between slots
 *   - Provide comparison methods for business logic
 *
 * CLEAN ARCHITECTURE:
 * - Pure domain entity (no framework dependencies)
 * - Contains business logic (overlap detection, time validation)
 */
export class Availability {
  private readonly _startTime: Time;
  private readonly _endTime: Time;

  constructor(
    public readonly id: string,
    public readonly professionalId: string,
    public readonly dayOfWeek: number, // 0-6 (Sunday-Saturday)
    startTime: string, // HH:mm
    endTime: string, // HH:mm
  ) {
    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error(`Invalid day of week: ${dayOfWeek}. Must be 0-6`);
    }

    // Create Time value objects (validates format internally)
    this._startTime = Time.create(startTime);
    this._endTime = Time.create(endTime);

    // Validate time range
    if (!this._startTime.isBefore(this._endTime)) {
      throw new Error(
        `Invalid availability range: startTime (${startTime}) must be before endTime (${endTime})`,
      );
    }
  }

  /**
   * Get start time as string (HH:mm)
   */
  get startTime(): string {
    return this._startTime.toString();
  }

  /**
   * Get end time as string (HH:mm)
   */
  get endTime(): string {
    return this._endTime.toString();
  }

  /**
   * Checks if this availability slot overlaps with another
   * Two slots overlap if one starts before the other ends AND ends after the other starts
   */
  overlapsWith(other: Availability): boolean {
    // Only check overlaps for same day
    if (this.dayOfWeek !== other.dayOfWeek) {
      return false;
    }

    // Overlap condition: A.start < B.end AND A.end > B.start
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }

  /**
   * Validates that a collection of availability slots has no overlaps
   * Groups by day and checks each day's slots for overlaps
   *
   * @param slots - Array of Availability entities to validate
   * @throws Error if overlapping slots are found
   */
  static validateNoOverlaps(slots: Availability[]): void {
    // Group slots by day
    const slotsByDay = new Map<number, Availability[]>();
    for (const slot of slots) {
      if (!slotsByDay.has(slot.dayOfWeek)) {
        slotsByDay.set(slot.dayOfWeek, []);
      }
      slotsByDay.get(slot.dayOfWeek)!.push(slot);
    }

    // Check each day for overlaps
    for (const [day, daySlots] of slotsByDay.entries()) {
      // Sort by start time for efficient overlap detection
      const sortedSlots = [...daySlots].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

      // Check consecutive slots for overlaps
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];

        if (current.endTime > next.startTime) {
          throw new Error(
            `Overlapping availability slots on day ${day}: ` +
              `${current.startTime}-${current.endTime} overlaps with ${next.startTime}-${next.endTime}`,
          );
        }
      }
    }
  }

  /**
   * Checks if a specific time falls within this availability slot
   */
  containsTime(time: string): boolean {
    const checkTime = Time.create(time);
    return (
      checkTime.isAfterOrEqual(this._startTime) &&
      checkTime.isBefore(this._endTime)
    );
  }
}
