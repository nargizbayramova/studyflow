import React, { useState } from "react";
import { User, Lock, Check, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpdateMe } from "@/api/auth";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const updateMe = useUpdateMe();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameSuccess, setNameSuccess] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMe.mutateAsync({ full_name: fullName });
    setNameSuccess(true);
    setTimeout(() => setNameSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (password.length < 8) {
      setPassError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPassError("Passwords do not match");
      return;
    }
    await updateMe.mutateAsync({ password });
    setPassword("");
    setConfirmPassword("");
    setPassSuccess(true);
    setTimeout(() => setPassSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <Header
        title="Student Profile & Settings"
        subtitle="Manage your personal credentials, university email, and security settings."
      />

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-primary-500/20">
              {user?.full_name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="mt-6 space-y-4 max-w-md">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" isLoading={updateMe.isPending}>
                Update Profile
              </Button>
              {nameSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Updated successfully
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-1">Security & Password</h3>
          <p className="text-xs text-slate-500 mb-6">
            Ensure your account is using a long, random password to stay secure.
          </p>

          {passError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-medium rounded-xl">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" size="sm" isLoading={updateMe.isPending}>
                Change Password
              </Button>
              {passSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Password changed
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* Account actions */}
        <Card className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Sign Out</h4>
            <p className="text-xs text-slate-500">Sign out of your StudyFlow account on this device.</p>
          </div>
          <Button variant="danger" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
};
