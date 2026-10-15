import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username: email, password });
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Invalid email or password");
      } else {
        setError("Sign in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      switchPrompt="New to StudyFlow?"
      switchLinkText="Create an account →"
      switchLinkTo="/register"
      title="Welcome back."
      subtitle="Sign in to pick up where you left off."
      error={error}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="alex.morgan@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Access note */}
      <div className="mt-8 p-4 rounded-lg bg-[#F7F7F4] flex items-center gap-2.5">
        <Lock className="w-4 h-4 text-[#747683] flex-shrink-0" />
        <p className="text-xs text-[#747683] leading-relaxed">
          Your courses and study plans are private to your account.
        </p>
      </div>
    </AuthLayout>
  );
};
