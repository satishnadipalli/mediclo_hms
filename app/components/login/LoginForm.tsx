"use client"
import { useState } from 'react';

interface AdminLoginFormProps {
  onSubmit: (email: string, password: string) => void;
}

export default function AdminLoginForm({ onSubmit }: AdminLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
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
        className="w-full bg-[#C83C92] text-white py-2 px-4 rounded-lg hover:bg-[#c83c92cb] transition"
        suppressHydrationWarning
      >
        Login
      </button>
    </form>
  );
}