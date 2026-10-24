import bcrypt from "bcryptjs";
import { AppError } from "./AppError.js";

export const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export function assertStrongPassword(password) {
  if (!passwordPattern.test(password)) throw new AppError(422, "VALIDATION_ERROR", "Password must be 8–72 characters and contain a letter and number", [{ field: "password", message: "Use 8–72 characters with at least one letter and one number" }]);
}
export const hashPassword = (password) => bcrypt.hash(password, 12);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);
