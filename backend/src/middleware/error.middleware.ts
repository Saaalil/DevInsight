import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  errors?: any;

  constructor(statusCode: number, message: string, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Not found error handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

// Global error handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // If the error is an ApiError, use its status code, otherwise default to 500
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  
  // Prepare the error response
  const errorResponse: any = {
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  };

  // Add validation errors if they exist
  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  // Log the error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Send the error response
  res.status(statusCode).json(errorResponse);
};