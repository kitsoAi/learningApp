"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { FeedWrapper } from "@/components/feed-wrapper";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth";
import { useCourseStore } from "@/store/course";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/lib/api/auth";
import { Flame } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { activeCourse } = useCourseStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user || !activeCourse) {
     return null;
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload the file
      const { url } = await userApi.uploadAvatar(file);
      
      // 2. Update user profile with new image_src
      const updatedUser = await userApi.updateProfile({ image_src: url });
      
      // 3. Update local state
      updateUser(updatedUser);
      toast.success("Avatar updated successfully");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await userApi.updateProfile({ full_name: fullName });
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={{
             title: activeCourse.title,
             imageSrc: activeCourse.image_src || "/es.svg",
          }}
          hearts={user.hearts}
          points={user.points}
          hasActiveSubscription={false}
        />
        <Promo />
        <Quests points={user.points} />
      </StickyWrapper>
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
            <div className="flex flex-col items-center gap-y-6 w-full">
                {/* Avatar Section with Upload Overlay */}
                <div className="relative group">
                    <Avatar className="bg-green-500 h-[100px] w-[100px] border-4 border-white shadow-md">
                        <AvatarImage
                            className="object-cover"
                            src={user.image_src || "/mascot.svg"}
                        />
                        <AvatarFallback className="bg-green-500 text-white font-bold text-2xl">
                            {user.full_name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                    
                    {/* Upload Label/Button */}
                    <label 
                        htmlFor="avatar-upload"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        {uploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                        <input 
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
                
                {isEditing ? (
                  <div className="w-full max-w-sm space-y-4">
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="full_name" className="text-neutral-600 font-bold">Full Name</Label>
                      <Input 
                        id="full_name" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder="Your Name"
                        className="bg-neutral-100 border-none focus-visible:ring-2 focus-visible:ring-green-500"
                      />
                    </div>
                    <div className="flex gap-x-3 mt-2">
                       <Button className="flex-1" onClick={handleSave} disabled={loading} variant="primary">
                          {loading ? "Saving..." : "Save Changes"}
                       </Button>
                       <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-neutral-500">
                          Cancel
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                      <h1 className="text-2xl font-extrabold text-neutral-800">
                          {user.full_name || user.email}
                      </h1>
                       <p className="text-muted-foreground text-md font-medium">
                          {user.email}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                          Joined {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <Button 
                        variant="primaryOutline" 
                        size="sm" 
                        className="mt-6 font-bold"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                  </div>
                )}
            </div>

            <Separator className="my-8" />
            
            <div className="w-full flex flex-col gap-y-4">
                 <h2 className="text-xl font-bold text-neutral-800 mb-2">Statistics</h2>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-x-3 p-4 border-2 border-neutral-200 rounded-2xl shadow-sm">
                         <div className="p-2 bg-orange-100 rounded-lg">
                           <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                         </div>
                         <div>
                             <p className="font-extrabold text-neutral-700 text-xl leading-none">{user.streak_count}</p>
                             <p className="text-neutral-500 text-sm font-bold uppercase tracking-tight">Day Streak</p>
                         </div>
                     </div>
                      <div className="flex items-center gap-x-3 p-4 border-2 border-neutral-200 rounded-2xl shadow-sm">
                         <Image src="/points.svg" alt="XP" height={35} width={35} />
                         <div>
                             <p className="font-extrabold text-neutral-700 text-xl leading-none">{user.xp}</p>
                             <p className="text-neutral-500 text-sm font-bold uppercase tracking-tight">Total XP</p>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
      </FeedWrapper>
    </div>
  );
}
