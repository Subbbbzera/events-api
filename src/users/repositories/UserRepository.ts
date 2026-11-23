import { Repository } from 'typeorm';
import { UserRole } from '../../common/errors/AppError';
import { AppDataSource } from '../../db/data-source';
import { User } from '../entities/User.entity';

export interface CreateUserParams {
  username: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export class UserRepository {
  private readonly repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  public async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async createAndSave(params: CreateUserParams): Promise<User> {
    const user = this.repo.create({
      username: params.username,
      email: params.email,
      passwordHash: params.passwordHash,
      role: params.role ?? UserRole.USER,
    });
    return this.repo.save(user);
  }
}
