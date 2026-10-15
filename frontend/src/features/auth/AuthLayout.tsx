import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Leaf } from "lucide-react";

interface AuthLayoutProps {
  switchPrompt: string;
  switchLinkText: string;
  switchLinkTo: string;
  title: string;
  subtitle: string;
  error?: string | null;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  switchPrompt,
  switchLinkText,
  switchLinkTo,
  title,
  subtitle,
  error,
  children,
}) => {
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
          <span className="text-[#747683]">{switchPrompt}</span>
          <Link
            to={switchLinkTo}
            className="font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors"
          >
            {switchLinkText}
          </Link>
        </div>

        {/* Center content */}
        <div className="my-auto py-8 w-full max-w-[420px] mx-auto">
          <div className="flex flex-col gap-2.5 mb-7">
            <h2 className="text-[32px] font-normal text-[#252735] tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-[#747683]">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {children}
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
