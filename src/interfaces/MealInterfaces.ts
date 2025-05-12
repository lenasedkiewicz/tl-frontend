import { NotificationType } from "../types/MealTypes.types";

export interface MealData {
  _id?: string;
  name: string;
  hour: number;
  minute: number;
  content: string;
  date: string;
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

export interface MealCardItemProps {
  meal: MealData;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
}

export interface NotificationState {
  open: boolean;
  message: string;
  type: NotificationType;
}