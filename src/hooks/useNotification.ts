import { useState, useCallback } from "react";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationState {
  open: boolean;
  message: string;
  type: NotificationType;
}

export const useNotification = (autoHideDuration = 6000) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    type: "info",
  });

  const [autoHideTimeout, setAutoHideTimeout] = useState<number | null>(
    null
  );

  const showNotification = useCallback(
    (message: string, type: NotificationType = "info") => {
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }

      setNotification({
        open: true,
        message,
        type,
      });

      if (autoHideDuration > 0) {
        const timeout = window.setTimeout(() => {
          setNotification((prev) => ({ ...prev, open: false }));
        }, autoHideDuration);

        setAutoHideTimeout(timeout);
      }
    },
    [autoHideDuration, autoHideTimeout]
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));

    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout);
      setAutoHideTimeout(null);
    }
  }, [autoHideTimeout]);

  return {
    notification,
    showNotification,
    hideNotification,
  };
};