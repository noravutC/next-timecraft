'use client';

interface LoaderPageProps {
    ballSize: 2 | 3 | 4 | 5 | 6 | 8; // กำหนดขนาดที่เป็นไปได้
}

// 💡 Lookup Object: เพื่อให้ Tailwind เห็นคลาสทั้งหมด
const sizeMap = {
    2: 'w-2 h-2',
    3: 'w-3 h-3',
    4: 'w-4 h-4',
    5: 'w-5 h-5',
    6: 'w-6 h-6',
    8: 'w-8 h-8',
    // เพิ่มขนาดอื่นๆ ที่คุณต้องการใช้
};

export const LoaderPage = ({
    ballSize = 4,
}: LoaderPageProps) => {
    // 💡 ดึงค่าคลาสจาก Object (หากไม่พบ ให้ใช้ 4 เป็น Default)
    const sizeClass = sizeMap[ballSize] || sizeMap[4];
    
    return (
        <div className="flex flex-row gap-2">
            <div className={`${sizeClass} rounded-full bg-blue-500 animate-bounce`}></div>
            <div className={`${sizeClass} rounded-full bg-blue-500 animate-bounce [animation-delay:-.3s]`}></div>
            <div className={`${sizeClass} rounded-full bg-blue-500 animate-bounce [animation-delay:-.5s]`}></div>
        </div>
    )
}