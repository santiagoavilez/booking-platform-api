export class Appointment {
  constructor(
    public readonly id: string,
    public readonly professionalId: string,
    public readonly clientId: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
  ) {
    if (startsAt >= endsAt) {
      throw new Error('Invalid appointment duration');
    }
  }
}
