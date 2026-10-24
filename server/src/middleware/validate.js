import { AppError } from "../utils/AppError.js";

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.slice(1).join("."), message: issue.message }));
    return next(new AppError(422, "VALIDATION_ERROR", "Invalid request data", details));
  }
  req.validated = result.data;
  next();
};
