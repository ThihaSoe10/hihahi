"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "@/i18n/routing";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-washi p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-10 border border-washi-panel">
        <h1 className="text-3xl font-bold text-aizome mb-8 text-center">Admin Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-sumi mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-aizome/20 focus:border-aizome focus:ring-1 focus:ring-aizome outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sumi mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-aizome/20 focus:border-aizome focus:ring-1 focus:ring-aizome outline-none"
            />
          </div>
          
          {error && (
            <div className="p-4 bg-kurenai/10 border border-kurenai/20 text-kurenai rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-aizome text-white font-bold py-3 px-4 rounded-lg hover:bg-aizome-light transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
