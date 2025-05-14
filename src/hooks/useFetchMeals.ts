import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { MealData, UseFetchMealsOptions, UseFetchMealsReturn } from '../interfaces/MealInterfaces';

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

  const userIdRef = useRef<string | null>(null);
  const activeRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && isAuthenticated) {
      const id = getUserId(user);
      userIdRef.current = id || null;
    } else {
      userIdRef.current = null;
    }
  }, [user, isAuthenticated, getUserId]);

  const fetchMealsForDate = useCallback(async (date: string) => {
    if (!isAuthenticated || !date) {
      console.log("Fetch skipped: Missing authentication or date");
      return;
    }

    const userId = userIdRef.current;
    if (!userId) {
      console.log("Fetch skipped: No user ID available");
      return;
    }

    const requestKey = `${userId}-${date}`;
    if (activeRequestRef.current === requestKey) {
      console.log("Duplicate request prevented:", requestKey);
      return;
    }

    activeRequestRef.current = requestKey;
    setLoading(true);

    let responseData = null;
    let fetchError = null;

    try {
      console.log(`Fetching meals from: ${API_BASE_URL}/meals/user/${userId}/date/${date}`);
      const response = await axios.get(`${API_BASE_URL}/meals/user/${userId}/date/${date}`);
      responseData = response.data;
    } catch (err: any) {
      fetchError = err;
      console.error("Error fetching meals:", err);
    } finally {
      setTimeout(() => {
        if (activeRequestRef.current === requestKey) {
          activeRequestRef.current = null;
        }
      }, 100);
    }

    if (fetchError) {
      if (fetchError.response?.status !== 404 && showNotification) {
        showNotification(
          `Failed to load meals: ${fetchError.message || "Unknown error"}`,
          "error"
        );
      }

      setMeals([]);
      if (trackOriginalMeals) {
        setOriginalMeals([]);
      }
    } else if (responseData && Array.isArray(responseData)) {
      const formattedMeals = responseData.map((meal: any) => ({
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
      console.error("Unexpected response format:", responseData);
      if (showNotification) {
        showNotification("Received unexpected data format from server", "error");
      }

      setMeals([]);
      if (trackOriginalMeals) {
        setOriginalMeals([]);
      }
    }

    setLoading(false);
  }, [API_BASE_URL, isAuthenticated, showNotification, trackOriginalMeals]);

  const returnObj: UseFetchMealsReturn = {
    meals,
    loading,
    fetchMealsForDate,
    setMeals,
    setLoading,
  };

  if (trackOriginalMeals) {
    returnObj.originalMeals = originalMeals;
    returnObj.hasUnsavedChanges = hasUnsavedChanges;
    returnObj.setHasUnsavedChanges = setHasUnsavedChanges;
  }

  return returnObj;
};