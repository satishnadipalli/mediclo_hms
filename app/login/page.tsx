"use client"

import { useState, useEffect, type FormEvent, type ReactElement } from "react"
import { useRouter } from "next/navigation"
import { TriangleAlert } from "lucide-react"

export default function AdminLoginPage(): ReactElement {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])


  useEffect(() => {
    if (localStorage.getItem("receptionToken")) {
      router.replace("/dashboard")
    }
  }, [router])

  useEffect(() => {
    if (localStorage.getItem("receptionToken")) {
      router.replace("/dashboard")
    }
  }, [router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    console.log("Hello")
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      console.log(response)
      console.log(process.env.NEXT_PUBLIC_API_URL)
      if (!response.ok) {
        console.log("success")
        const errorData = await response.json()
        throw new Error(errorData.message || "Login failed")
      }
      const { token, user }: { token: string; user: { role: "therapist" | "receptionist" } } = await response.json()
      localStorage.setItem("receptionToken", token)
      localStorage.setItem("receptionDetails", JSON.stringify(user))
      if (user.role === "therapist") {
        router.push("/doctorDashboard")
      } else if (user.role === "receptionist") {
        window.location.replace("/hms/dashboard")
      } else {
        throw new Error("Unknown user role")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during login"
      setError(message)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-lg dark:border-gray-800">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900 ">Loading...</h1>
          </div>
          <div className="flex h-24 items-center justify-center">
            <svg
              className="h-8 w-8 animate-spin text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center font-sans text-black justify-center bg-white">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-lg dark:border-gray-800">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900 ">Login</h1>
          <p className="text-sm text-black">
            Enter your email and password to access your account.
          </p>
        </div>
        <div className="mt-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-400 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              <TriangleAlert className="h-4 w-4 flex-shrink-0" />
              <div className="font-medium">Error</div>
              <div className="ml-auto">{error}</div>
            </div>
          )}
          <form onSubmit={handleSubmit} autoComplete="off" data-lpignore="true">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 ">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 ">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-gray-50 ring-offset-white transition-colors  focus-visible:outline-none focus-visible:ring-2  focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50   w-full text-white bg-[#C83C92]"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
