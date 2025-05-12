import { User } from './AuthInterfaces';
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

export interface UseFetchMealsOptions {
  API_BASE_URL: string;
  isAuthenticated: boolean;
  getUserId: (user: User) => string;
  user: User;
  showNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
  trackOriginalMeals?: boolean;
}

export interface UseFetchMealsReturn {
  meals: MealData[];
  loading: boolean;
  fetchMealsForDate: (date: string) => Promise<void>;
  originalMeals?: MealData[];
  hasUnsavedChanges?: boolean;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
  setMeals: React.Dispatch<React.SetStateAction<MealData[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}