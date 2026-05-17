"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Camera, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/components/providers/trpc-provider";
import { initials } from "@/lib/utils/format";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function ProfileForm() {
  const router = useRouter();
  const me = trpc.user.me.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated");
      await utils.user.me.invalidate();
      // Re-render the server-side dashboard layout so the navbar avatar refreshes
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (me.data && name === "" && designation === "" && imageUrl === null) {
    setName(me.data.name);
    setDesignation(me.data.designation ?? "");
    setImageUrl(me.data.image ?? null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Cloudinary upload failed");
      const json = (await res.json()) as { secure_url: string };
      setImageUrl(json.secure_url);
      toast.success("Avatar uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    update.mutate({
      name: name.trim() || undefined,
      designation: designation.trim() || null,
      image: imageUrl,
    });
  }

  if (me.isLoading) return <p className="text-muted-foreground">Loading profile...</p>;
  if (!me.data) return <p className="text-destructive">Failed to load profile.</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Your profile</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Update your display name, designation, and avatar.</p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-20">
              {imageUrl ? (
                <AvatarImage asChild src={imageUrl} alt={name || me.data.name}>
                  <Image src={imageUrl} alt={name || me.data.name} width={80} height={80} className="aspect-square size-full object-cover" />
                </AvatarImage>
              ) : null}
              <AvatarFallback className="text-lg">{initials(name || me.data.name)}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin" /> : <Camera />}
                {uploading ? "Uploading..." : imageUrl ? "Change avatar" : "Upload avatar"}
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl(null)} className="text-destructive">
                  Remove avatar
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. Max 5 MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-designation">Designation</Label>
            <Input id="profile-designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={me.data.email} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Input value={me.data.role} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Department</Label>
            <Input value={me.data.department ?? "—"} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Employee code</Label>
            <Input value={me.data.employeeCode ?? "—"} disabled />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
