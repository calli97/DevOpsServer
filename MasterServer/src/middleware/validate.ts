import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError, ZodIssue } from "zod";

type ValidationTarget = "body" | "params" | "query";

export const validate = (schema: ZodType, target: ValidationTarget = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[target]);
      Object.defineProperty(req, target, {
        value: data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: errors,
        });
      }
      next(error);
    }
  };
};
