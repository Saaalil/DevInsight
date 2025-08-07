import { Request, Response, NextFunction } from 'express';

// Type for an async Express request handler
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async Express route handler to automatically catch errors and pass them to next()
 * This eliminates the need for try/catch blocks in every controller function
 * 
 * @param fn The async Express route handler to wrap
 * @returns A wrapped function that catches errors and passes them to next()
 */
const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;