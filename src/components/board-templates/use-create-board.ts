'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store';
import { useColumnStore } from '@/store/use-column.store';
import {
  findBoardTemplate,
  templateColumnsPayload,
} from '@/helper/utils/board-templates';

type CreateBoardInput = {
  name: string;
  templateId: string;
  coverImage?: string | null;
};

/**
 * สร้างบอร์ดจาก template: create project แล้วสร้าง column ตาม template
 * ใช้ร่วมกันระหว่าง Create board dialog กับหน้าบอร์ดแรก
 */
export function useCreateBoard() {
  const createProject = useProjectStore((s) => s.createProject);
  const createColumns = useColumnStore((s) => s.createColumns);
  const [creating, setCreating] = useState(false);

  /** true เมื่อสร้างสำเร็จ (บอร์ดใหม่กลายเป็นบอร์ดที่เปิดอยู่) */
  const createBoard = async ({
    name,
    templateId,
    coverImage = null,
  }: CreateBoardInput): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed || creating) return false;
    setCreating(true);
    try {
      const created = await createProject({ name: trimmed, coverImage });
      if (!created) {
        toast.error('Unable to create board');
        return false;
      }
      await createColumns(
        templateColumnsPayload(findBoardTemplate(templateId), created.id),
      );
      toast.success('Board created');
      return true;
    } catch {
      toast.error('Unable to create board');
      return false;
    } finally {
      setCreating(false);
    }
  };

  return { creating, createBoard };
}
