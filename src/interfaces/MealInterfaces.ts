// src/interfaces/mealInterfaces.ts (or wherever your file is located)

// Interface for Meal data used within the frontend state and components
// This aligns with how the data is used and often how it comes from the backend (using _id)
export interface MealData {
  _id?: string; // Optional for new meals, required for existing meals from DB
  name: string;
  hour: number;
  minute: number;
  content: string;
  date: string; // YYYY-MM-DD format
}

// Interface for the shape of the meal object expected directly from the backend API response
// This helps ensure type safety when fetching data.
export interface MealResponse {
  _id: string; // Database ID
  user: string; // User ID associated with the meal (used in API paths)
  name: string;
  date: string; // YYYY-MM-DD format
  hour: number;
  minute: number;
  content: string;
  createdAt: string; // Backend timestamp
  updatedAt: string; // Backend timestamp
}

export interface MealCardItemProps {
  meal: MealData;
  onEdit?: () => void; // Optional for edit view
  onDelete?: () => void; // Optional for edit view
  loading?: boolean; // Optional loading state for actions
}

// Interfaces for the Notification hook state (can be kept here or defined with the hook)
export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationState {
  open: boolean;
  message: string;
  type: NotificationType;
}

// You can keep ValidationConfig if it's used elsewhere, otherwise remove it.
// export interface ValidationConfig {
//   minItems: number;
//   maxItems: number;
//   nameMaxLength: number;
//   contentMinLength: number;
//   contentMaxLength: number;
// }

// Remove BaseEntryItem, MealItem, BaseEntryFormValues, DietFormValues,
// and convertMealResponseToMealItem as they are not used by the refactored components.