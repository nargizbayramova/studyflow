import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ListChecks, Clock3, CalendarDays } from "lucide-react";

const steps = [
  { title: "Courses →", subtitle: "Add your subjects", href: "/courses", icon: BookOpen },
  { title: "Tasks →", subtitle: "Capture work & deadlines", href: "/tasks", icon: ListChecks },
  { title: "Availability →", subtitle: "Choose your study hours", href: "/availability", icon: Clock3 },
  { title: "Study calendar →", subtitle: "Schedule focused sessions", href: "/calendar", icon: CalendarDays },
];

export const PlanningGuide: React.FC = () => {
  const [hidden, setHidden] = useState(() => localStorage.getItem("sf_hide_guide") === "true");

  if (hidden) return null;

  const handleHide = () => {
    localStorage.setItem("sf_hide_guide", "true");
    setHidden(true);
  };

  return (
    <div className="p-5 sm:p-6 bg-[#EFEEF9] rounded-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#5553B7]">
          Your semester, in four simple steps
        </span>
        <button
          onClick={handleHide}
          className="text-xs text-[#747683] hover:text-[#252735] transition-colors cursor-pointer"
        >
          Hide guide ×
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.title}
              to={step.href}
              className="flex items-center gap-3 group"
            >
              <div className="w-[34px] h-[34px] rounded-lg bg-white flex items-center justify-center text-[#5553B7] shadow-sm flex-shrink-0 group-hover:bg-[#5553B7] group-hover:text-white transition-colors">
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[#252735] group-hover:text-[#5553B7] transition-colors">
                  {step.title}
                </span>
                <span className="text-[11px] text-[#747683]">{step.subtitle}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
