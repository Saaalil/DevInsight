import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Types } from 'mongoose';

/**
 * Generate JWT token and set it in HTTP-only cookie
 * @param res Express response object
 * @param userId User ID to include in token
 */
export const generateToken = (res: Response, userId: Types.ObjectId): void => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
  );

  // Set JWT as HTTP-only cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Generate refresh token and set it in HTTP-only cookie
 * @param res Express response object
 * @param userId User ID to include in token
 */
export const generateRefreshToken = (res: Response, userId: Types.ObjectId): void => {
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear JWT cookies
 * @param res Express response object
 */
export const clearTokens = (res: Response): void => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};