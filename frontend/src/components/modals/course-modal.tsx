"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseApi } from "@/lib/api/courses";
import { Course } from "@/types/api";
import { formatAssetUrl } from "@/lib/utils";

interface CourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Course>) => Promise<void>;
  initialData?: Course | null;
}

export const CourseModal = ({ open, onOpenChange, onSubmit, initialData }: CourseModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setImageSrc(initialData.image_src || "");
      setOrderIndex(initialData.order_index || 0);
    } else {
      setTitle("");
      setDescription("");
      setImageSrc("");
      setOrderIndex(0);
    }
  }, [initialData, open]);

  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
          const { url } = await courseApi.uploadFile(file);
          setImageSrc(url);
      } catch (error) {
          console.error("Failed to upload image", error);
      } finally {
          setUploading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ title, description, image_src: imageSrc, order_index: orderIndex });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Course" : "Create Course"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update course details." : "Add a new course to the catalog."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Spanish for Beginners"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Course description..."
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Order Index</Label>
            <Input 
              type="number"
              value={orderIndex} 
              onChange={(e) => setOrderIndex(parseInt(e.target.value))} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <div className="flex gap-2">
                <Input 
                    value={imageSrc} 
                    onChange={(e) => setImageSrc(e.target.value)} 
                    placeholder="/course-image.svg"
                    required 
                />
                <Button variant="outline" type="button" className="shrink-0" disabled={uploading}>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                        {uploading ? "Uploading..." : "Upload"}
                    </Label>
                    <input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={onImageUpload}
                        disabled={uploading}
                    />
                </Button>
            </div>
            {imageSrc && (
              <div className="mt-2 relative w-[120px] aspect-[4/3] rounded-md overflow-hidden border">
                <img 
                  src={formatAssetUrl(imageSrc) || ""} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
