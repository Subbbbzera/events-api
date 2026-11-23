import { z } from 'zod';
import { UserRole } from '../../common/errors/AppError';
import { User } from '../entities/User.entity';

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters')
    .max(100, 'Username must be at most 100 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserResponseDto;
}

export const toUserResponseDto = (user: User): UserResponseDto => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});
