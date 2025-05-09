import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { MealData } from '../interfaces/MealInterfaces';
import { User } from '../interfaces/AuthInterfaces';

interface UseFetchMealsOptions {
  API_BASE_URL: string;
  isAuthenticated: boolean;
  getUserId: (user: User) => string;
  user: User | undefined;
  showNotification?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  trackOriginalMeals?: boolean;
}

export interface UseFetchMealsReturn {
  meals: MealData[];
  setMeals: React.Dispatch<React.SetStateAction<MealData[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchMealsForDate: (date: string) => Promise<void>;
  originalMeals: MealData[] | undefined;
  hasUnsavedChanges: boolean | undefined;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean | undefined>> | undefined;
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
  const [originalMealsState, setOriginalMealsState] = useState<MealData[] | undefined>(trackOriginalMeals ? [] : undefined);
  const [hasUnsavedChangesState, setHasUnsavedChangesState] = useState<boolean | undefined>(trackOriginalMeals ? false : undefined);

  const userIdRef = useRef<string | null>(null);
  const activeRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && isAuthenticated) {
      try {
        const id = getUserId(user);
        userIdRef.current = id || null;
      } catch (error) {
        console.error("Error getting user ID in useFetchMeals:", error);
        userIdRef.current = null;
      }
    } else {
      userIdRef.current = null;
    }
  }, [user, isAuthenticated, getUserId]);

  const fetchMealsForDate = useCallback(async (date: string) => {
    if (!isAuthenticated || !date) {
      setMeals([]);
      if (trackOriginalMeals) {
        setOriginalMealsState([]);
        if (setHasUnsavedChangesState) setHasUnsavedChangesState(false);
      }
      return;
    }

    const currentUserId = userIdRef.current;
    if (!currentUserId) {
      setMeals([]);
      if (trackOriginalMeals) {
        setOriginalMealsState([]);
        if (setHasUnsavedChangesState) setHasUnsavedChangesState(false);
      }
      return;
    }

    const requestKey = `${currentUserId}-${date}`;

    if (activeRequestRef.current === requestKey && loading) {
      return;
    }

    activeRequestRef.current = requestKey;
    setLoading(true);

    try {
      const response = await axios.get<MealData[]>(
        `${API_BASE_URL}/meals/user/${currentUserId}/date/${date}`
      );

      if (activeRequestRef.current !== requestKey) {
        return;
      }

      if (response.data && Array.isArray(response.data)) {
        const fetchedMeals: MealData[] = response.data.map(meal => ({
          _id: meal._id,
          name: meal.name,
          hour: meal.hour,
          minute: meal.minute,
          content: meal.content,
          date: meal.date,
        }));

        setMeals(fetchedMeals);

        if (trackOriginalMeals) {
          setOriginalMealsState(JSON.parse(JSON.stringify(fetchedMeals)));
          if (setHasUnsavedChangesState) setHasUnsavedChangesState(false);
        }
      } else {
        if (showNotification) {
          showNotification("Received unexpected data format from server.", "error");
        }
        setMeals([]);
        if (trackOriginalMeals) {
          setOriginalMealsState([]);
        }
      }
    } catch (err: any) {

      if (activeRequestRef.current !== requestKey) {
        return;
      }

      if (err.response?.status === 404) {
        setMeals([]);
        if (trackOriginalMeals) {
          setOriginalMealsState([]);
          if (setHasUnsavedChangesState) setHasUnsavedChangesState(false);
        }
      } else if (showNotification) {
        showNotification(
          `Failed to load meals: ${err.message || "Unknown server error."}`,
          "error"
        );
        setMeals([]);
        if (trackOriginalMeals) {
          setOriginalMealsState([]);
        }
      } else {
        setMeals([]);
        if (trackOriginalMeals) {
          setOriginalMealsState([]);
        }
      }
    } finally {

      if (activeRequestRef.current === requestKey) {
        activeRequestRef.current = null;
      }
      setLoading(false);
    }
  }, [
    API_BASE_URL,
    isAuthenticated,
    showNotification,
    trackOriginalMeals,
    loading,
  ]);

  const returnValues: UseFetchMealsReturn = {
    meals,
    setMeals,
    loading,
    setLoading,
    fetchMealsForDate,
    originalMeals: trackOriginalMeals ? originalMealsState : undefined,
    hasUnsavedChanges: trackOriginalMeals ? hasUnsavedChangesState : undefined,
    setHasUnsavedChanges: trackOriginalMeals ? setHasUnsavedChangesState : undefined,
  };

  return returnValues;
};