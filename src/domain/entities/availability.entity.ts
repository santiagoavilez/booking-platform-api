export class Availability {
  constructor(
    public readonly professionalId: string,
    public readonly dayOfWeek: number, // 0-6
    public readonly startTime: string, // HH:mm
    public readonly endTime: string,
  ) {
    if (startTime >= endTime) {
      throw new Error('Invalid availability range');
    }
  }
}
