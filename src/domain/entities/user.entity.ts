import { Role } from '../enums/role.enum';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    private passwordHash: string,
    public readonly role: Role,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}

  /**
   * Returns the full name of the user
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isProfessional(): boolean {
    return this.role === Role.PROFESSIONAL;
  }

  /**
   * Method to get password hash
   * Should only be used by repositories for persistence
   */
  getPasswordHash(): string {
    return this.passwordHash;
  }
}
