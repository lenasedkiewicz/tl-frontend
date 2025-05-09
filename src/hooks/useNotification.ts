import { useState } from "react";

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationMessage {
  open: boolean;
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export interface UseNotificationReturn {
  notifications: NotificationMessage[];
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  hideNotification: (id: string) => void;
}

export const useNotification = (): UseNotificationReturn => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const showNotification = (
    open: boolean,
    message: string,
    type: NotificationType,
    duration: number = 5000
  ) => {
    const id = Date.now().toString();
    const newNotification: NotificationMessage = {
      open,
      id,
      message,
      type,
      duration
    };

    setNotifications(prevNotifications => [...prevNotifications, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, duration);
    }
  };

  const hideNotification = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  return { notifications, showNotification, hideNotification };
};