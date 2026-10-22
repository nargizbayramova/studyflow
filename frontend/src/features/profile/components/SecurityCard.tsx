import React, { useState } from "react";
import { Lock, Check } from "lucide-react";
import { useUpdateMe } from "@/features/auth/api/auth";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";

export const SecurityCard: React.FC = () => {
  const updateMe = useUpdateMe();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await updateMe.mutateAsync({ password });
      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    }
  };

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-4 h-4 text-[#5553B7]" />
        <h3 className="text-sm font-bold text-[#252735]">Security & Password</h3>
      </div>
      <p className="text-xs text-[#747683] mb-5">
        Ensure your account is protected with a secure password.
      </p>

      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-[#747683]" />}
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-[#747683]" />}
        />

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            size="sm"
            isLoading={updateMe.isPending}
            className="bg-[#5553B7] hover:bg-[#48469F] text-white"
          >
            Update password
          </Button>
          {success && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Password updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
