"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
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

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { activeCourse } = useCourseStore();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [loading, setLoading] = useState(false);

  if (!user || !activeCourse) {
     return null;
  }

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
                 <Avatar className="bg-green-500 h-[100px] w-[100px]">
                    <AvatarImage
                        className="object-cover"
                        src={user.image_src || "/mascot.svg"}
                    />
                    <AvatarFallback className="bg-green-500 text-white font-bold text-2xl">
                        {user.full_name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                
                {isEditing ? (
                  <div className="w-full max-w-sm space-y-4">
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input 
                        id="full_name" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="flex gap-x-2">
                       <Button className="flex-1" onClick={handleSave} disabled={loading}>
                          {loading ? "Saving..." : "Save Changes"}
                       </Button>
                       <Button variant="ghost" onClick={() => setIsEditing(false)}>
                          Cancel
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                      <h1 className="text-2xl font-bold text-neutral-800">
                          {user.full_name || user.email}
                      </h1>
                       <p className="text-muted-foreground text-md">
                          {user.email}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                          Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}
                      </p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-4"
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
                     <div className="flex items-center gap-x-3 p-4 border rounded-xl shadow-sm">
                         <Image src="/flame.svg" alt="Streak" height={30} width={30} />
                         <div>
                             <p className="font-bold text-neutral-700 text-lg">{user.streak_count}</p>
                             <p className="text-neutral-500 text-sm">Day Streak</p>
                         </div>
                     </div>
                      <div className="flex items-center gap-x-3 p-4 border rounded-xl shadow-sm">
                         <Image src="/flash.svg" alt="XP" height={30} width={30} />
                         <div>
                             <p className="font-bold text-neutral-700 text-lg">{user.xp}</p>
                             <p className="text-neutral-500 text-sm">Total XP</p>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
      </FeedWrapper>
    </div>
  );
}
