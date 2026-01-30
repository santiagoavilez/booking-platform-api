import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;

  /**
   * Returns paginated list of users with role PROFESSIONAL, optionally filtered by full name.
   *
   * @param search - Optional case-insensitive search on firstName + lastName
   * @param page - 1-based page number
   * @param limit - Page size
   * @returns items (User[]) and total count matching the search
   */
  findProfessionalsPaginated(
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ items: User[]; total: number }>;
}
