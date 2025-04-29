import { CalendarDatePickerProps } from "../../interfaces/TimeInterfaces";
import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker"; // Calendar DatePicker
import { formatISO, parseISO, isValid } from "date-fns"; // For date handling

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
      onChange(formatISO(date, { representation: "date" })); // Format as YYYY-MM-DD
    } else {
      onChange(""); // Or handle null/invalid date appropriately
    }
  };

  return (
    <DatePicker
      label={label}
      value={dateValue}
      onChange={handleDateChange}
      // renderInput={(params) => ( // Use the new TextField slot
      //   <TextField {...params} fullWidth={fullWidth} required={required} disabled={disabled} sx={sx} />
      // )}
      slotProps={{
        textField: {
          fullWidth: fullWidth,
          required: required,
          disabled: disabled,
          sx: sx,
        },
      }}
      // Newer versions of @mui/x-date-pickers use slots instead of renderInput
      // If using an older version, uncomment renderInput and remove slotProps
    />
  );
};
