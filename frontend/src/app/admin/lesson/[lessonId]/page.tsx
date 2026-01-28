"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { lessonApi, courseApi } from "@/lib/api/courses";
import { Checkbox } from "@/components/ui/checkbox";
import { Challenge, ChallengeOption } from "@/types/api";

export default function LessonEditorPage() {
  const params = useParams();
  const lessonId = parseInt(params.lessonId as string);
  const router = useRouter();

  const [lesson, setLesson] = useState<{ title: string } | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const fetchLessonData = useCallback(async () => {
      try {
        const lessonData = await lessonApi.getLesson(lessonId);
        setLesson(lessonData);
        const challengesData = await lessonApi.getLessonChallenges(lessonId);
        setChallenges(challengesData);
      } catch (error) {
        console.error("Failed to load lesson", error);
        toast.error("Failed to load lesson details");
      } finally {
        setLoading(false);
      }
    }, [lessonId]);

  useEffect(() => {
    if (lessonId) {
        fetchLessonData();
    }
  }, [lessonId, fetchLessonData]);


  const onMediaUpload = async (file: File, challengeId: number, optionId: number, field: "image_src" | "audio_src") => {
      const isChallenge = optionId === -1;
      const uploadKey = isChallenge 
        ? `${challengeId}-audio` 
        : `${challengeId}-${optionId}-${field}`;

      setUploading(prev => ({ ...prev, [uploadKey]: true }));
      try {
          const { url } = await courseApi.uploadFile(file);
          if (isChallenge) {
              updateChallengeField(challengeId, field as keyof Challenge, url);
          } else {
              updateOptionField(challengeId, optionId, field as keyof ChallengeOption, url);
          }
          toast.success("File uploaded successfully");
      } catch (error) {
          console.error("Failed to upload", error);
          toast.error("Failed to upload file");
      } finally {
          setUploading(prev => ({ ...prev, [uploadKey]: false }));
      }
  };

  const handleUpdateLessonTitle = async (title: string) => {
      setLesson({ ...lesson, title });
  };

  const handleSave = async () => {
      if (!lesson) return;
      setSaving(true);
      try {
          // 1. Update Lesson Details
          await lessonApi.updateLesson(lessonId, { title: lesson.title });

          // 2. Update/Create Challenges & Options
          // This is a simplified approach. Ideally we blindly update all or track dirty state.
          // For now, let's just iterate and update everything to ensure consistency.
          
          for (const challenge of challenges) {
              if (challenge.id < 0) {
                   // New challenge (dummy ID) - Create it
                   const newChallenge = await lessonApi.createChallenge({
                       lesson_id: lessonId,
                       question: challenge.question,
                       type: challenge.type,
                       correct_text: challenge.correct_text,
                       audio_src: challenge.audio_src,
                       order_index: challenge.order_index
                   });
                   // Options for new challenge?
                   for (const option of challenge.options || []) {
                       await lessonApi.createOption(newChallenge.id, {
                           text: option.text,
                           correct: option.correct,
                           image_src: option.image_src,
                           audio_src: option.audio_src
                       });
                   }
              } else {
                  // Existing challenge - Update it
                  await lessonApi.updateChallenge(challenge.id, {
                      question: challenge.question,
                      type: challenge.type,
                      correct_text: challenge.correct_text,
                      audio_src: challenge.audio_src,
                  });

                  // Handle Options
                  for (const option of challenge.options || []) {
                      if (option.id < 0) {
                           // New option
                           await lessonApi.createOption(challenge.id, {
                               text: option.text,
                               correct: option.correct,
                               image_src: option.image_src,
                               audio_src: option.audio_src
                           });
                      } else {
                          // Existing option
                          await lessonApi.updateOption(option.id, {
                               text: option.text,
                               correct: option.correct,
                               image_src: option.image_src,
                               audio_src: option.audio_src
                          });
                      }
                  }
              }
          }
          
          toast.success("Lesson saved successfully");
          fetchLessonData(); // Refresh to clean up temp IDs/states
      } catch (error) {
          console.error("Failed to save", error);
          toast.error("Failed to save changes");
      } finally {
          setSaving(false);
      }
  };
  
  const handleAddChallenge = () => {
      setChallenges([...challenges, {
          id: -1 * Math.random(), // Temp negative ID
          lesson_id: lessonId,
          type: "SELECT",
          question: "New Question",
          correct_text: "",
          audio_src: "",
          order_index: challenges.length + 1,
          options: []
      }]);
  };

  const handleDeleteChallenge = async (id: number) => {
      if (confirm("Are you sure you want to delete this challenge?")) {
        if (id > 0) {
            await lessonApi.deleteChallenge(id);
        }
        setChallenges(challenges.filter(c => c.id !== id));
      }
  };

  const handleAddOption = (challengeId: number) => {
      setChallenges(challenges.map(c => {
          if (c.id === challengeId) {
              return {
                  ...c,
                  options: [...(c.options || []), {
                      id: -1 * Math.random(),
                      challenge_id: challengeId,
                      text: "",
                      correct: false,
                      image_src: "",
                      audio_src: ""
                  }]
              };
          }
          return c;
      }));
  };
  
  const handleDeleteOption = async (challengeId: number, optionId: number) => {
       if (optionId > 0) {
           await lessonApi.deleteOption(optionId);
       }
       setChallenges(challenges.map(c => {
           if (c.id === challengeId) {
               return {
                   ...c,
                   options: c.options?.filter(o => o.id !== optionId)
               };
           }
           return c;
       }));
  };

  const updateChallengeField = (id: number, field: keyof Challenge, value: string | number | boolean) => {
      setChallenges(challenges.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateOptionField = (challengeId: number, optionId: number, field: keyof ChallengeOption, value: string | number | boolean) => {
      setChallenges(challenges.map(c => {
          if (c.id === challengeId) {
              return {
                  ...c,
                  options: c.options?.map(o => o.id === optionId ? { ...o, [field]: value } : o)
              };
          }
          return c;
      }));
  };

  if (loading) return <div className="p-6 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!lesson) return <div className="p-6">Lesson not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Lesson</h1>
                <div className="flex items-center gap-2 mt-1">
                     <Input 
                        value={lesson.title} 
                        onChange={(e) => handleUpdateLessonTitle(e.target.value)}
                        className="h-7 text-muted-foreground w-[200px]"
                     />
                </div>
            </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Challenges</h2>
              <Button onClick={handleAddChallenge}>
                  <Plus className="mr-2 h-4 w-4" /> Add Challenge
              </Button>
          </div>

          {challenges.map((challenge, index) => (
              <Card key={challenge.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                       <CardTitle className="text-base font-semibold">
                           Challenge {index + 1}
                       </CardTitle>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteChallenge(challenge.id)}
                       >
                           <Trash className="h-4 w-4" />
                       </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid gap-2">
                          <Label>Question / Prompt</Label>
                          <Textarea 
                            value={challenge.question} 
                            onChange={(e) => updateChallengeField(challenge.id, "question", e.target.value)}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                              <Label>Type</Label>
                              <Select 
                                value={challenge.type} 
                                onValueChange={(val) => updateChallengeField(challenge.id, "type", val)}
                              >
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="SELECT">Select</SelectItem>
                                      <SelectItem value="ASSIST">Assist</SelectItem>
                                      <SelectItem value="TRANSLATE">Translate</SelectItem>
                                      <SelectItem value="MATCH">Match</SelectItem>
                                      <SelectItem value="TAP_HEAR">Tap & Hear</SelectItem>
                                      <SelectItem value="LISTEN_TYPE">Listen & Type</SelectItem>
                                      <SelectItem value="SPEAK">Speak</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                           <div className="grid gap-2">
                              <Label>Correct Text (for Translate/Listen/Speak)</Label>
                              <Input 
                                value={challenge.correct_text || ""} 
                                onChange={(e) => updateChallengeField(challenge.id, "correct_text", e.target.value)}
                                placeholder="Expected answer..."
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label>Challenge Audio (for Listen/Speak)</Label>
                              <div className="flex gap-2">
                                  <Input 
                                    value={challenge.audio_src || ""} 
                                    onChange={(e) => updateChallengeField(challenge.id, "audio_src", e.target.value)}
                                    placeholder="/assets/sound.mp3"
                                  />
                                   <Button variant="outline" size="sm" className="px-2 shrink-0" disabled={uploading[`${challenge.id}-audio`]}>
                                        <Label htmlFor={`upload-audio-chall-${challenge.id}`} className="cursor-pointer text-xs">
                                            {uploading[`${challenge.id}-audio`] ? "..." : "↑"}
                                        </Label>
                                        <input 
                                            id={`upload-audio-chall-${challenge.id}`} 
                                            type="file" 
                                            accept="audio/*" 
                                            className="hidden" 
                                            onChange={(e) => e.target.files?.[0] && onMediaUpload(e.target.files[0], challenge.id, -1, "audio_src")}
                                        />
                                    </Button>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <Label>Options</Label>
                          {challenge.options?.map((option: ChallengeOption) => (
                              <div key={option.id} className="grid grid-cols-12 gap-2 items-start border p-2 rounded-md">
                                  <div className="col-span-4">
                                      <Label className="text-xs text-muted-foreground">Text</Label>
                                      <Input 
                                        value={option.text} 
                                        onChange={(e) => updateOptionField(challenge.id, option.id, "text", e.target.value)}
                                        className="h-8" 
                                      />
                                  </div>
                                  <div className="col-span-4">
                                      <Label className="text-xs text-muted-foreground">Image</Label>
                                      <div className="flex gap-1">
                                          <Input 
                                            value={option.image_src || ""} 
                                            onChange={(e) => updateOptionField(challenge.id, option.id, "image_src", e.target.value)}
                                            className="h-8 text-xs" 
                                            placeholder="/img.svg" 
                                          />
                                          <Button variant="outline" size="sm" className="h-8 px-2 shrink-0" disabled={uploading[`${challenge.id}-${option.id}-image_src`]}>
                                              <Label htmlFor={`upload-img-${option.id}`} className="cursor-pointer text-[10px]">
                                                  {uploading[`${challenge.id}-${option.id}-image_src`] ? "..." : "↑"}
                                              </Label>
                                              <input 
                                                id={`upload-img-${option.id}`} 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => e.target.files?.[0] && onMediaUpload(e.target.files[0], challenge.id, option.id, "image_src")}
                                              />
                                          </Button>
                                      </div>
                                  </div>
                                  <div className="col-span-3">
                                      <Label className="text-xs text-muted-foreground">Audio</Label>
                                      <div className="flex gap-1">
                                          <Input 
                                            value={option.audio_src || ""} 
                                            onChange={(e) => updateOptionField(challenge.id, option.id, "audio_src", e.target.value)}
                                            className="h-8 text-xs" 
                                            placeholder="/sound.mp3" 
                                          />
                                          <Button variant="outline" size="sm" className="h-8 px-2 shrink-0" disabled={uploading[`${challenge.id}-${option.id}-audio_src`]}>
                                              <Label htmlFor={`upload-audio-${option.id}`} className="cursor-pointer text-[10px]">
                                                  {uploading[`${challenge.id}-${option.id}-audio_src`] ? "..." : "↑"}
                                              </Label>
                                              <input 
                                                id={`upload-audio-${option.id}`} 
                                                type="file" 
                                                accept="audio/*" 
                                                className="hidden" 
                                                onChange={(e) => e.target.files?.[0] && onMediaUpload(e.target.files[0], challenge.id, option.id, "audio_src")}
                                              />
                                          </Button>
                                      </div>
                                  </div>
                                  <div className="col-span-1 flex flex-col items-center justify-center h-full gap-2 pt-5">
                                      <Checkbox 
                                        checked={option.correct} 
                                        onCheckedChange={(checked) => updateOptionField(challenge.id, option.id, "correct", !!checked)}
                                      />
                                       <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-destructive"
                                            onClick={() => handleDeleteOption(challenge.id, option.id)}
                                        >
                                           <Trash className="h-3 w-3" />
                                       </Button>
                                  </div>
                              </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddOption(challenge.id)}>
                              <Plus className="mr-2 h-3 w-3" /> Add Option
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          ))}
      </div>
    </div>
  );
}
