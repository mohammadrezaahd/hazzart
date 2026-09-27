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
    <form
      className="mt-10 flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div>
        <label htmlFor="admin-username" className="mb-2 block text-sm">
          Username
        </label>
        <input
          id="admin-username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "admin-username-error" : undefined}
          className="h-12 w-full rounded-lg border border-black/20 px-4 outline-none transition focus:border-black"
          {...register("username")}
        />
        {errors.username && (
          <p id="admin-username-error" className="mt-2 text-xs text-red-600">
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="admin-password" className="mb-2 block text-sm">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "admin-password-error" : undefined}
          className="h-12 w-full rounded-lg border border-black/20 px-4 outline-none transition focus:border-black"
          {...register("password")}
        />
        {errors.password && (
          <p id="admin-password-error" className="mt-2 text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      <button
        className="h-12 rounded-lg bg-black px-5 text-sm text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
