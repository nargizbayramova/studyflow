import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useRegister } from "@/features/auth/api/auth";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Input } from "@/shared/ui/Input";
import { Spinner } from "@/shared/ui/Spinner";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await registerMutation.mutateAsync({
        email,
        password,
        full_name: fullName,
      });
      // Automatically log in after registration
      await login({ username: email, password });
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create account");
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      switchPrompt="Already have an account?"
      switchLinkText="Sign in →"
      switchLinkTo="/login"
      title="Start with a little clarity."
      subtitle="Create your account. Your semester starts here."
      error={error}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          type="text"
          required
          placeholder="Alex Morgan"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Choose a strong password with at least 8 characters."
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Helpful guidance card */}
      <div className="mt-7 p-4 rounded-lg bg-[#EFEEF9] flex flex-col gap-1.5">
        <h4 className="text-[13px] font-semibold text-[#5553B7]">
          A simple first step
        </h4>
        <p className="text-[13px] text-[#747683] leading-relaxed">
          After signing up, add your courses and tasks, then choose when you have time to study.
        </p>
      </div>
    </AuthLayout>
  );
};
