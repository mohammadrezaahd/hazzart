"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { AdminLoginInput } from "@/lib/admin-validation";
import { adminLoginSchema } from "@/lib/admin-validation";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

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
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setServerError(data.message || "Unable to sign in.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setServerError("Unable to connect to the authentication service.");
    }
  };

  return (
    <form className="admin-login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="admin-field">
        <label htmlFor="admin-username">Username</label>
        <input
          id="admin-username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "admin-username-error" : undefined}
          {...register("username")}
        />
        {errors.username && (
          <p id="admin-username-error" className="admin-field-error">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="admin-field">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "admin-password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="admin-password-error" className="admin-field-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="admin-form-error" role="alert">
          {serverError}
        </p>
      )}

      <button className="admin-submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
