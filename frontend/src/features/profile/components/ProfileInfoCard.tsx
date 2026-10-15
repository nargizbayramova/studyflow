import React, { useState } from "react";
import { User, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpdateMe } from "@/api/auth";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

export const ProfileInfoCard: React.FC = () => {
  const { user } = useAuth();
  const updateMe = useUpdateMe();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateMe.mutateAsync({ full_name: fullName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile name");
    }
  };

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4 pb-6 border-b border-[#F0F1F5]">
        <div className="w-14 h-14 rounded-full bg-[#EFEEF9] text-[#5553B7] font-bold text-lg flex items-center justify-center border border-[#DEDCF5]">
          {user?.full_name?.charAt(0).toUpperCase() || "S"}
        </div>
        <div>
          <h2 className="text-base font-bold text-[#252735]">{user?.full_name}</h2>
          <p className="text-xs text-[#747683]">{user?.email}</p>
          <p className="text-[11px] text-[#A0A2B1] mt-0.5">
            Student account &bull; Active in Fall 2026
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="mt-5 max-w-md flex flex-col gap-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-[#747683]" />}
        />

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            size="sm"
            isLoading={updateMe.isPending}
            className="bg-[#5553B7] hover:bg-[#48469F] text-white"
          >
            Save changes
          </Button>
          {success && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Updated successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
