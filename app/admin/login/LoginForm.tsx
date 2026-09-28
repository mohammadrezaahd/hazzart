"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { AdminLoginInput } from "@/lib/admin-validation";
import { adminLoginSchema } from "@/lib/admin-validation";
import { getApiErrorMessage } from "@/components/api/client";
import { loginAdmin } from "@/components/api/auth";

interface LoginFormProps {
  apiUrl: string;
}

export function LoginForm({ apiUrl }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: yupResolver(adminLoginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: AdminLoginInput) => {
    setServerError(null);

    try {
      await loginAdmin(apiUrl, values);

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to connect to the authentication service."));
    }
  };

  return (
    <form className="admin-login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="admin-field">
        <label htmlFor="admin-username">Username</label>
        <div className="admin-input-wrap">
          <input
            id="admin-username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? "admin-username-error" : undefined}
            placeholder="Enter your username"
            {...register("username")}
          />
        </div>
        {errors.username && (
          <p id="admin-username-error" className="admin-field-error">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="admin-field">
        <div className="admin-field-label-row">
          <label htmlFor="admin-password">Password</label>
        </div>
        <div className="admin-input-wrap">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            maxLength={128}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "admin-password-error" : undefined}
            placeholder="Enter your password"
            {...register("password")}
          />
          <button
            type="button"
            className="admin-password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && (
          <p id="admin-password-error" className="admin-field-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="admin-server-error" role="alert">
          {serverError}
        </p>
      )}

      <button className="admin-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
