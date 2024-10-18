import { CircleX } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    type?: 'success' | 'info' | 'error'; // Type of notification
    duration?: number; // Duration in milliseconds (optional)
}

const Notification: React.FC<NotificationProps> = ({
    message,
    type = 'info',
    duration = 5000,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    if (!isVisible) return null;

    // Tailwind classes based on the notification type
    const typeClasses = {
        success: 'bg-green-500 border-green-100',
        info: 'bg-blue-500 border-blue-700',
        error: 'bg-red-500 border-red-700',
    };

    return (
        <div
            className={`fixed top-3 right-4 bg-opacity-20 flex items-center gap-2 border p-4 rounded shadow-lg ${typeClasses[type]}`}
        >
            <div className="flex-1">
                <p className="font-semibold text-white">{message}</p>
            </div>
            <div>
            <CircleX className="text-red-500 cursor-pointer" onClick={() => setIsVisible(false)} />
            </div>
        </div>
    );
};

export default Notification;
