export interface BaseEntryItem {
  id?: string;
  name: string;
}

export interface MealItem extends BaseEntryItem {
  hour: number;
  minute: number;
  content: string;
  userId?: string;
}

export interface BaseEntryFormValues<T extends BaseEntryItem> {
  date: string;
  items: T[];
  userId?: string;
}

export type DietFormValues = BaseEntryFormValues<MealItem>;

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  open: boolean;
  message: string;
  type: NotificationType;
}

export interface ValidationConfig {
  minItems: number;
  maxItems: number;
  nameMaxLength: number;
  contentMinLength: number;
  contentMaxLength: number;
}

export interface MealResponse {
  _id: string;
  user: string;
  name: string;
  date: string;
  hour: number;
  minute: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const convertMealResponseToMealItem = (meal: MealResponse): MealItem => {
  return {
    id: meal._id,
    name: meal.name,
    hour: meal.hour,
    minute: meal.minute,
    content: meal.content,
    userId: meal.user,
  };
};