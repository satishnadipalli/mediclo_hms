"use client";

import { useState, useEffect, FormEvent, ReactElement } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage(): ReactElement {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    console.log("Hello");
    e.preventDefault();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      console.log(response);
      console.log(process.env.NEXT_PUBLIC_API_URL);

      if (!response.ok) {
        console.log("success")
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const {
        token,
        user,
      }: { token: string; user: { role: "therapist" | "receptionist" } } =
        await response.json();

      console.log(user);

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminDetails", JSON.stringify(user));

      if (user.role === "therapist") {
        router.push("/doctorDashboard");
      } else if (user.role === "receptionist") {
        router.push("/dashboard");
      } else {
        throw new Error("Unknown user role");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred during login";
      setError(message);
    }
  };
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login
        </h1>
        {error && (
          <div className="mb-4 p-2 text-red-500 bg-red-100 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} autoComplete="off" data-lpignore="true">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border rounded-lg text-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border rounded-lg text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
