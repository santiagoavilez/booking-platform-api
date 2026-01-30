/**
 * Domain entity for a booked appointment.
 * createdAt/updatedAt are set when loaded from persistence (audit metadata).
 */
export class Appointment {
  constructor(
    public readonly id: string,
    public readonly professionalId: string,
    public readonly clientId: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {
    if (startsAt >= endsAt) {
      throw new Error('Invalid appointment duration');
    }
  }
}
