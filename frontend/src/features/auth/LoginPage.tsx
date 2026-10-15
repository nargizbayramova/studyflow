import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Leaf, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      {/* Left editorial panel - Welcome editorial */}
      <div className="w-full lg:w-[650px] lg:min-h-screen bg-[#EFEEF9] p-8 sm:p-12 lg:p-14 flex flex-col justify-between gap-10 flex-shrink-0">
        {/* Top: Brand mark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-[#5553B7] flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-[19px] h-[19px]" />
          </div>
          <span className="font-bold text-xl text-[#252735] tracking-tight">StudyFlow</span>
        </div>

        {/* Content group */}
        <div className="flex flex-col gap-4 max-w-lg">
          <span className="text-xs font-normal tracking-wider text-[#5553B7] uppercase">
            MAKE SPACE FOR WHAT MATTERS
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#252735] leading-[1.2] tracking-tight whitespace-pre-line">
            {"A clearer week.\nA calmer semester."}
          </h1>
          <p className="text-base text-[#747683] leading-relaxed">
            Bring your courses, deadlines, and study time together. One thoughtful plan, at your own pace.
          </p>

          {/* Study desk photograph */}
          <div className="mt-4 w-full h-[280px] sm:h-[320px] lg:h-[350px] rounded-xl overflow-hidden shadow-sm">
            <img
              src="/images/study-desk.png"
              alt="Quiet study space"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Reassurance footer */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#5553B7] shadow-sm flex-shrink-0">
            <Leaf className="w-[18px] h-[18px]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-[#252735]">
              Progress, without the pressure.
            </p>
            <p className="text-[13px] text-[#747683]">
              Build a realistic routine. Leave room for life.
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel - Account access */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:px-24 lg:py-12 min-h-screen bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between text-[13px] w-full">
          <span className="text-[#747683]">New to StudyFlow?</span>
          <Link
            to="/register"
            className="font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors"
          >
            Create an account →
          </Link>
        </div>

        {/* Center content */}
        <div className="my-auto py-10 w-full max-w-[420px] mx-auto">
          <div className="flex flex-col gap-2.5 mb-8">
            <h2 className="text-[32px] font-normal text-[#252735] tracking-tight">
              Welcome back.
            </h2>
            <p className="text-sm text-[#747683]">
              Sign in to pick up where you left off.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#252735]">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="alex.morgan@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[46px] px-3.5 rounded-lg border border-[#E5E6EB] text-sm text-[#252735] placeholder-[#747683]/60 focus:outline-none focus:border-[#5553B7] focus:ring-1 focus:ring-[#5553B7] transition-all bg-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#252735]">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[46px] px-3.5 rounded-lg border border-[#E5E6EB] text-sm text-[#252735] placeholder-[#747683]/60 focus:outline-none focus:border-[#5553B7] focus:ring-1 focus:ring-[#5553B7] transition-all bg-white"
              />
            </div>

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
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between text-xs text-[#747683] w-full pt-6">
          <span>StudyFlow · Your academic workspace</span>
          <span>Fall 2026</span>
        </div>
      </div>
    </div>
  );
};
