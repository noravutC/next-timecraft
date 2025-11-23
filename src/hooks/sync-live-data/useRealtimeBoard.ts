'use client';

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useBoardStore, useTaskStore } from "@/hooks";
import { Task } from "@/types"; // ต้อง Import Type Task ด้วย

export const useRealtimeBoard = (projectId?: string | null) => {
    const { updateTaskFromRealtime } = useTaskStore(); 

    useEffect(() => {
        if (!projectId) return;

        const channelName = `project-${projectId}`; 

        const channel = pusherClient.subscribe(channelName);

        channel.bind('task-updated', (updatedTask: Task) => {
            // เรียก Action ใน Zustand เพื่ออัปเดต State ทันที
            console.log(`Pusher Event: Task ${updatedTask._id} updated/moved in project ${projectId}`);
            updateTaskFromRealtime(updatedTask);
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
        };

    }, [projectId, updateTaskFromRealtime]);
};