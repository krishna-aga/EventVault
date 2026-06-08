import type { RequestHandler } from "express";

export type Validator<T> = (input: unknown) => T;

export const validateBody = <T>(validator: Validator<T>): RequestHandler => {
  return (req, _res, next) => {
    try {
      req.body = validator(req.body) as never;
      next();
    } catch (error) {
      next(error);
    }
  };
};
