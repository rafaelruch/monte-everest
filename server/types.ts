import { Request } from 'express';
import { User, Professional } from '@shared/schema';

// Extend Express Request to include user and professional
declare global {
  namespace Express {
    interface Request {
      user?: User;
      professional?: Professional;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface ProfessionalRequest extends Request {
  professional: Professional;
}