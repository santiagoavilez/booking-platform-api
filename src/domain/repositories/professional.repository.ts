import { Professional } from '../entities/professional.entity';

export interface IProfessionalRepository {
  create(professional: Professional): Promise<Professional>;
  findByUserId(userId: string): Promise<Professional | null>;
  findById(userId: string): Promise<Professional | null>;
  findAll(): Promise<Professional[]>;
  update(professional: Professional): Promise<Professional>;
}
