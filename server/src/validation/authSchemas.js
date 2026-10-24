import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(72).regex(/[A-Za-z]/, "Password needs a letter").regex(/\d/, "Password needs a number");
export const registerSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(80), email, password, role: z.unknown().optional() }), params: z.any(), query: z.any() });
export const loginSchema = z.object({ body: z.object({ email, password: z.string().min(1).max(72) }), params: z.any(), query: z.any() });
export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(1).max(72), newPassword: password }), params: z.any(), query: z.any() });
