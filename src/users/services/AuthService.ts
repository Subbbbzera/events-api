import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../../common/errors/AppError';
import { env } from '../../config/env';
import {
  AuthResponseDto,
  LoginInput,
  RegisterInput,
  toUserResponseDto,
  UserResponseDto,
} from '../dto/auth.dto';
import { User } from '../entities/User.entity';
import { UserRepository } from '../repositories/UserRepository';

const SALT_ROUNDS = 10;

export class AuthService {
  private readonly userRepository: UserRepository;

  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  public async register(input: RegisterInput): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await this.userRepository.createAndSave({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user: toUserResponseDto(user),
    };
  }

  public async login(input: LoginInput): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user: toUserResponseDto(user),
    };
  }

  public async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return toUserResponseDto(user);
  }

  private generateAccessToken(user: User): string {
    const options: SignOptions = {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    return jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      options,
    );
  }
}
