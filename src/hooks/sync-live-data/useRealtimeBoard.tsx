'use client';

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useTaskStore } from "@/hooks";
import { Task } from "@/types";

export const useRealtimeBoard = (projectId?: string | null) => {
    const { updateTaskFromRealtime } = useTaskStore(); 

    useEffect(() => {
        if (!projectId) return;

        const channelName = `project-${projectId}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('task-updated', (updatedTask: Task) => {
            console.log(`Pusher Event: Task ${updatedTask._id} updated in project ${projectId}`);
            updateTaskFromRealtime(updatedTask);
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
        };
    }, [projectId, updateTaskFromRealtime]);
};
