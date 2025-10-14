'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ColumnColor } from "@/types/kanban";

interface CreateColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateColumn: (title: string, color: ColumnColor) => void;
}

const colors: { value: ColumnColor; label: string; class: string }[] = [
  { value: "purple", label: "Purple", class: "bg-[hsl(var(--column-purple))]" },
  { value: "pink", label: "Pink", class: "bg-[hsl(var(--column-pink))]" },
  { value: "blue", label: "Blue", class: "bg-[hsl(var(--column-blue))]" },
  { value: "yellow", label: "Yellow", class: "bg-[hsl(var(--column-yellow))]" },
  { value: "green", label: "Green", class: "bg-[hsl(var(--column-green))]" },
  { value: "indigo", label: "Indigo", class: "bg-[hsl(var(--column-indigo))]" },
  { value: "orange", label: "Orange", class: "bg-[hsl(var(--column-orange))]" },
  { value: "teal", label: "Teal", class: "bg-[hsl(var(--column-teal))]" },
];

export function CreateColumnDialog({
  open,
  onOpenChange,
  onCreateColumn,
}: CreateColumnDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<ColumnColor>("purple");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateColumn(title.trim(), selectedColor);
      setTitle("");
      setSelectedColor("purple");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <DialogDescription>
              Add a new column to your Kanban board. Choose a name and color.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Column Title</Label>
              <Input
                id="title"
                placeholder="e.g., To Do, In Progress, Done"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`h-10 rounded-md ${color.class} ${
                      selectedColor === color.value
                        ? "ring-2 ring-ring ring-offset-2"
                        : "hover:opacity-80"
                    } transition-all`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
