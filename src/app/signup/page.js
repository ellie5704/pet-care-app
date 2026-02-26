"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef3e8] via-[#f8faf6] to-[#dce6d2] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#d5decb] grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-[#5f735b] to-[#8fa08b] text-white">
          <div>
            <p className="text-sm tracking-[0.2em] uppercase text-[#eaf0e4]">
              PetCare
            </p>
            <h2 className="text-4xl mt-5 leading-tight">
              One account for your whole pet household.
            </h2>
          </div>
          <p className="text-sm text-[#eaf0e4]">
            Create an account to manage pets, care plans, shopping, and updates.
          </p>
        </div>

        <div className="p-8 md:p-10">
          <h1 className="text-3xl text-[#4f5a4c] mb-2">Create Account</h1>
          <p className="text-sm text-[#70806c] mb-6">
            Start organizing your pet care in one place.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm text-[#586553]">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-3 py-2.5 border border-[#d6ddd0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b7a3]"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-[#586553]">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-3 py-2.5 border border-[#d6ddd0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b7a3]"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-[#586553]">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-[#d6ddd0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b7a3]"
              />
              <p className="text-xs text-[#8a9586] mt-1">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#5f735b] text-white hover:bg-[#4e614b] transition disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="my-6 text-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#d9e0d3]" />
            <span className="relative bg-white px-4 text-xs text-[#8a9586]">
              OR
            </span>
          </div>

          <button
            onClick={handleGoogleSignup}
            className="w-full py-2.5 rounded-lg border border-[#d6ddd0] hover:bg-[#f3f7ee] transition flex items-center justify-center gap-2 text-[#3e473b]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
              />
              <path
                fill="#34A853"
                d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
              />
              <path
                fill="#FBBC05"
                d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
              />
              <path
                fill="#EA4335"
                d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-sm text-center mt-6 text-[#6f7f6c]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#4e614b] underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
