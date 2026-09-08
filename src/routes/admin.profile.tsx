import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, Lock, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession, getProfile, saveProfile, getDisplayIdentity, fetchProfile } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [initials, setInitials] = useState("A");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await fetchProfile();
        const session = getSession();
        const displayIdentity = getDisplayIdentity();
        if (session) setEmail(session.email);
        setName(profile.name);
        setPhone(profile.phone);
        setRole(profile.role);
        setInitials(displayIdentity.initials);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="flex flex-col items-center gap-3 p-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 w-full mb-4" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-bold">{name || "Unnamed admin"}</div>
              <div className="text-sm text-muted-foreground">{role || "No role set"}</div>
            </div>
            <div className="mt-2 flex w-full flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{email || "—"}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Role: {role || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> Profile Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSaving(true);
                  try {
                    await saveProfile({ name: name.trim(), phone: phone.trim(), role: role.trim() });
                    setInitials(getDisplayIdentity().initials);
                    toast.success("Profile updated");
                  } catch (error) {
                    console.error("Failed to save profile:", error);
                    toast.error("Failed to save profile");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add phone number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="role">Role / title</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Administrator" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-primary" /> Change Password</CardTitle>
              <CardDescription>Use a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!pw.current || !pw.next) return toast.error("All fields are required");
                  if (pw.next !== pw.confirm) return toast.error("New passwords do not match");
                  setPw({ current: "", next: "", confirm: "" });
                  toast.success("Password updated");
                }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">New password</Label>
                  <Input id="next" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm</Label>
                  <Input id="confirm" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Update password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
