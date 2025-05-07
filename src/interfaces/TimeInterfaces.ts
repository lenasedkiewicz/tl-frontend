export interface CalendarDatePickerProps {
  label: string;
  value: string;
  onChange: (dateString: string) => void;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  sx?: object;
}