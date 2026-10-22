import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Header } from "@/app/layout/Header";
import { Button } from "@/shared/ui/Button";
import { ProfileInfoCard } from "./components/ProfileInfoCard";
import { AcademicPreferencesCard } from "./components/AcademicPreferencesCard";
import { SecurityCard } from "./components/SecurityCard";

export const ProfilePage: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <Header
        title="Profile & Settings"
        subtitle="Manage your student account, academic preferences, and study pacing"
      />

      <div className="space-y-5">
        <ProfileInfoCard />
        <AcademicPreferencesCard />
        <SecurityCard />

        <div className="bg-white border border-[#E5E6EB] rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-[#252735]">Sign out</h4>
            <p className="text-xs text-[#747683]">
              End your active session on this device.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};
