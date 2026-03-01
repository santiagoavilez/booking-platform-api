// src/domain/entities/professional.entity.spec.ts

import { Professional } from './professional.entity';

describe('Professional', () => {
  it('should create a professional with userId, fullName and specialty', () => {
    const professional = new Professional(
      'user-123',
      'John Doe',
      'Software Engineer',
    );

    expect(professional.userId).toBe('user-123');
    expect(professional.fullName).toBe('John Doe');
    expect(professional.specialty).toBe('Software Engineer');
  });

  it('should allow reading all properties', () => {
    const professional = new Professional('uuid-456', 'Jane Smith', 'Designer');

    expect(professional.userId).toBe('uuid-456');
    expect(professional.fullName).toBe('Jane Smith');
    expect(professional.specialty).toBe('Designer');
  });
});
