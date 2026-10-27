"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        setError("This account is not authorised to access the admin panel.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-5 py-12 text-[#22251f]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-[#77786e] transition hover:text-[#9a8458]"
        >
          <ArrowLeft size={16} />
          Back to website
        </Link>

        <div className="border border-[#e7e5df] bg-white p-7 shadow-sm sm:p-10">
          <div className="relative mx-auto mb-8 h-16 w-52">
            <Image
              src="/stecon-logo2.png"
              alt="Stecon Homes"
              fill
              priority
              sizes="208px"
              className="object-contain"
            />
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-[#272d25] text-[#d6c29a]">
              <LockKeyhole size={21} />
            </div>

            <h1 className="font-serif text-3xl">Admin Login</h1>

            <p className="mt-3 text-sm leading-6 text-[#77786e]">
              Sign in to manage Stecon Homes property listings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full border border-[#dedbd2] bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition focus:border-[#9a8458]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-[#dedbd2] bg-[#faf9f6] px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-[#9a8458]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#77786e]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center bg-[#272d25] px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[#444b3d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to dashboard"}
            </button>
          </form>

          <p className="mt-7 text-center text-xs leading-6 text-[#8a8b81]">
            Restricted access. Only authorised administrators can manage
            property listings.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#8a8b81]">
          © {new Date().getFullYear()} Stecon Homes
        </p>
      </div>
    </main>
  );
}