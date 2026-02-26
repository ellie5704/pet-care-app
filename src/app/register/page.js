"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef3e8] via-[#f8faf6] to-[#dce6d2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#d5decb] p-8">
        <h1 className="text-3xl text-[#4f5a4c] mb-2">Create an account</h1>
        <p className="text-sm text-[#70806c] mb-6">
          Register to access your pet household dashboard.
        </p>

        {error && (
          <p className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-3 py-2.5 border border-[#d6ddd0] rounded-lg"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            className="w-full px-3 py-2.5 border border-[#d6ddd0] rounded-lg"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            type="email"
          />

          <input
            type="password"
            className="w-full px-3 py-2.5 border border-[#d6ddd0] rounded-lg"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />

          <button className="w-full py-2.5 rounded-lg bg-[#5f735b] text-white hover:bg-[#4e614b] transition">
            Register
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-[#6f7f6c]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#4e614b] underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
