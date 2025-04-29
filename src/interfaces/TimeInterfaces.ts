export interface CalendarDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD string
  onChange: (dateString: string) => void;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  sx?: object;
}