import { z } from "zod";

// Better Auth request fields used by the web client. Passwords are never trimmed.
export const SignInRequest = z.object({ email: z.email(), password: z.string().min(1).max(128) });
export const SignUpRequest = SignInRequest.extend({
  name: z.string().min(1).max(100),
  password: z.string().min(12).max(128),
});
export const AuthEmailRequest = SignInRequest.pick({ email: true });
export const NewPasswordRequest = SignUpRequest.pick({ password: true });
