import { OptionType } from "../../types/TimeTypes.types";

export const formatTime = (hour: number, minute: number): string => {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const generateTimeOptions = (): OptionType[] => {
  const options: OptionType[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      options.push({
        label: `${hourStr}:${minuteStr}`,
        value: `${hourStr}:${minuteStr}`,
        hour,
        minute,
      });
    }
  }
  return options;
};