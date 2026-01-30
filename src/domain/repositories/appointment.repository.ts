import { Appointment } from '../entities/appointment.entity';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findByProfessionalId(professionalId: string): Promise<Appointment[]>;
  findByProfessionalIdAndDate(
    professionalId: string,
    date: string,
  ): Promise<Appointment[]>;
  findByClientId(clientId: string): Promise<Appointment[]>;
  findOverlapping(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]>;
}
