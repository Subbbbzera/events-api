import { Request, Response } from 'express';
import { HttpStatus, UnauthorizedError } from '../../common/errors/AppError';
import { LoginInput, RegisterInput } from '../dto/auth.dto';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService = new AuthService()) {
    this.authService = authService;
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as RegisterInput;
    const result = await this.authService.register(input);
    res.status(HttpStatus.CREATED).json(result);
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LoginInput;
    const result = await this.authService.login(input);
    res.status(HttpStatus.OK).json(result);
  };

  public me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const profile = await this.authService.getProfile(req.user.id);
    res.status(HttpStatus.OK).json(profile);
  };
}
