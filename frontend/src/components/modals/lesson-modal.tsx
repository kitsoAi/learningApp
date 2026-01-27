"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lesson } from "@/types/api";

interface LessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Lesson>) => Promise<void>;
  initialData?: Lesson | null;
}

export const LessonModal = ({ open, onOpenChange, onSubmit, initialData }: LessonModalProps) => {
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setOrderIndex(initialData.order_index || 0);
    } else {
      setTitle("");
      setOrderIndex(0);
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ title, order_index: orderIndex });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Lesson" : "Create Lesson"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update lesson details." : "Add a new lesson to the unit."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Present Tense"
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
