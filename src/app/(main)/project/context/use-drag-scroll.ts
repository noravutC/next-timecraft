import { useRef, useEffect, useCallback } from 'react';

type ScrollElement = HTMLDivElement;

export const useDragScroll = () => {
  const scrollRef = useRef<ScrollElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = useCallback((e: globalThis.MouseEvent) => {
    const element = scrollRef.current;
    if (element) {
      const target = e.target as HTMLElement;
      if (target.closest('.board-column') || target.closest('.task-card')) {
        return; 
      }

      isDown.current = true;
      element.classList.add('cursor-grabbing', 'dragging');
      startX.current = e.pageX - element.offsetLeft;
      scrollLeft.current = element.scrollLeft;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDown.current = false;
    const element = scrollRef.current;
    if (element) {
      element.classList.remove('cursor-grabbing', 'dragging');
    }
  }, []);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    const element = scrollRef.current;
    if (!isDown.current || !element) return;
    
    e.preventDefault(); 
    const x = e.pageX - element.offsetLeft;
    const walk = (x - startX.current) * 1.5; // ปรับความเร็วการเลื่อน
    element.scrollLeft = scrollLeft.current - walk;
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // ผูก Event Listeners เข้ากับ element
    element.addEventListener('mousedown', handleMouseDown as EventListener);
    // ผูก Event Listener บน window เพื่อให้สามารถปล่อยเมาส์นอกพื้นที่บอร์ดได้
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    // เพิ่ม handleMouseUp ใน mouseleave ด้วย (เพื่อความชัวร์)
    element.addEventListener('mouseleave', handleMouseUp); 

    return () => {
      // Clean up ทุกครั้งเมื่อ Component Unmount
      element.removeEventListener('mousedown', handleMouseDown as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseUp); 
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove]); // Dependencies

  return scrollRef;
};