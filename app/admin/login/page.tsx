import { LoginForm } from "./LoginForm";
import { getApiUrl } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="relative z-50 min-h-screen bg-white px-6 py-24 text-black">
      <section
        className="mx-auto w-full max-w-md"
        aria-labelledby="admin-login-title"
      >
        <p className="mb-3 text-xs font-semibold tracking-[0.2em]">HAZZART</p>
        <h1 id="admin-login-title" className="text-4xl font-light italic">
          Admin Login
        </h1>
        <p className="mt-3 text-sm text-black/60">
          Sign in to manage the artist portfolio.
        </p>
        <LoginForm apiUrl={getApiUrl()} />
      </section>
    </main>
  );
}
