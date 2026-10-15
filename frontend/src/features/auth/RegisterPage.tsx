import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, User as UserIcon } from "lucide-react";
import { useRegister } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-primary-600 items-center justify-center text-white shadow-md shadow-primary-500/20 mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create your StudyFlow account
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Get started with AI-powered study timetables and workload balancing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="Alex Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              helperText="Must be between 8 and 72 characters"
            />

            <Button type="submit" className="w-full mt-2" isLoading={loading}>
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
