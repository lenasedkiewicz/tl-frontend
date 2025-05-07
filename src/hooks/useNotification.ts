import { useState } from "react";

export const useNotification = () => {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => {
    setNotification({
      open: true,
      message,
      type,
    });
  };

  const hideNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  return { notification, showNotification, hideNotification };
};