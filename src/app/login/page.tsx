"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userRole", data.user.role);
      router.push("/bookshelf");
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#E1A591]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="w-full bg-[#52796F] text-white py-2 rounded hover:bg-[#3A5A40]">Login</button>
        <div className="mt-4 text-center">
          <span>Don't have an account? </span>
          <a href="/register" className="text-[#C76E77] hover:underline">Register</a>
        </div>
      </form>
    </div>
  );
} 