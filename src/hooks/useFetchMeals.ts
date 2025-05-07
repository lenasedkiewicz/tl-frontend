import { useState, useCallback } from 'react';
import axios from 'axios';
import { MealData } from '../interfaces/MealInterfaces';
import { User } from '../interfaces/AuthInterfaces';

interface UseFetchMealsOptions {
  API_BASE_URL: string;
  isAuthenticated: boolean;
  getUserId: (user: User) => string | null;
  user: User;
  showNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
  trackOriginalMeals?: boolean;
}

interface UseFetchMealsReturn {
  meals: MealData[];
  loading: boolean;
  fetchMealsForDate: (date: string) => Promise<void>;
  originalMeals?: MealData[];
  hasUnsavedChanges?: boolean;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
  setMeals: React.Dispatch<React.SetStateAction<MealData[]>>;
}

export const useFetchMeals = ({
  API_BASE_URL,
  isAuthenticated,
  getUserId,
  user,
  showNotification,
  trackOriginalMeals = false,
}: UseFetchMealsOptions): UseFetchMealsReturn => {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [originalMeals, setOriginalMeals] = useState<MealData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const fetchMealsForDate = useCallback(async (date: string) => {
    if (!isAuthenticated || !getUserId(user) || !date) return;

    setLoading(true);
    try {
      const userId = getUserId(user);
      const response = await axios.get(
        `${API_BASE_URL}/meals/user/${userId}/date/${date}`,
      );

      if (response.data && Array.isArray(response.data)) {
        const formattedMeals = response.data.map((meal: any) => ({
          _id: meal._id,
          name: meal.name,
          hour: meal.hour,
          minute: meal.minute,
          content: meal.content,
          date: meal.date,
        }));

        setMeals(formattedMeals);

        if (trackOriginalMeals) {
          setOriginalMeals(JSON.parse(JSON.stringify(formattedMeals)));
          setHasUnsavedChanges(false);
        }
      } else {
        console.error("Unexpected response format:", response.data);
        if (showNotification) {
          showNotification("Received unexpected data format from server", "error");
        }
        setMeals([]);
        if (trackOriginalMeals) {
          setOriginalMeals([]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching meals:", err);

      if (err.response?.status !== 404) {
        if (showNotification) {
          showNotification(
            `Failed to load meals: ${err.message || "Unknown error"}`,
            "error",
          );
        }
      }

      setMeals([]);
      if (trackOriginalMeals) {
        setOriginalMeals([]);
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, isAuthenticated, getUserId, user, showNotification, trackOriginalMeals]);

  if (trackOriginalMeals) {
    return {
      meals,
      loading,
      fetchMealsForDate,
      originalMeals,
      hasUnsavedChanges,
      setHasUnsavedChanges,
      setMeals,
    };
  }

  return {
    meals,
    loading,
    fetchMealsForDate,
    setMeals,
  };
};