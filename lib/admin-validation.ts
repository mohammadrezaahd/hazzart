import * as yup from "yup";

export const adminLoginSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(64, "Username must be at most 64 characters.")
    .matches(/^[a-zA-Z0-9_.-]+$/, "Username contains invalid characters.")
    .required("Username is required."),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters.")
    .required("Password is required."),
});

export type AdminLoginInput = yup.InferType<typeof adminLoginSchema>;
