export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?:
  | "inherit"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";
  loading?: boolean;
}
// is it used anywhere?
declare global {
  export interface Window {
    __hasMealUnsavedChanges?: boolean;
    __checkMealUnsavedChanges?: () => boolean;
    __showMealUnsavedChangesDialog?: (navigateTo: string | null) => boolean;
  }
}