import { CalendarDatePickerProps } from "../../interfaces/TimeInterfaces";
import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { formatISO, parseISO, isValid } from "date-fns";

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  fullWidth = true,
  disabled = false,
  sx,
}) => {
  const dateValue = value ? parseISO(value) : null;

  const handleDateChange = (date: Date | null) => {
    if (date && isValid(date)) {
      onChange(formatISO(date, { representation: "date" }));
    } else {
      onChange("");
    }
  };

  return (
    <DatePicker
      label={label}
      value={dateValue}
      onChange={handleDateChange}
      slotProps={{
        textField: {
          fullWidth: fullWidth,
          required: required,
          disabled: disabled,
          sx: sx,
        },
      }}
    />
  );
};
