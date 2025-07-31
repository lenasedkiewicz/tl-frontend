import { useState, useCallback } from "react";
import axios from "axios";
import { MealData } from "../interfaces/MealInterfaces";
import { User } from "../interfaces/AuthInterfaces";
import { getUserId } from "../components/helperfunctions/AuthHelpers";
import { UseNotificationReturn } from "./useNotification";

interface UseMealDataManagerProps {
  meals: MealData[];
  setMeals: React.Dispatch<React.SetStateAction<MealData[]>>;
  selectedDate: string;
  user: User | null;
  isAuthenticated: boolean;
  API_BASE_URL: string;
  showNotification: UseNotificationReturn["showNotification"];
  fetchMealsForDate: (date: string) => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  MAX_MEALS?: number;
}

export const useMealDataManager = ({
  meals,
  setMeals,
  selectedDate,
  user,
  isAuthenticated,
  API_BASE_URL,
  showNotification,
  fetchMealsForDate,
  setLoading,
  setHasUnsavedChanges,
  MAX_MEALS = 6,
}: UseMealDataManagerProps) => {
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState<number | null>(null);
  const [deleteSingleConfirmOpen, setDeleteSingleConfirmOpen] = useState(false);
  const [mealToDeleteIndex, setMealToDeleteIndex] = useState<number | null>(null);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  const handleAddMealClick = useCallback(() => {
    if (meals.length < MAX_MEALS) {
      setCurrentMealIndex(null);
      setMealDialogOpen(true);
    } else {
      showNotification(`Maximum ${MAX_MEALS} meals are allowed`, "warning");
    }
  }, [meals.length, MAX_MEALS, showNotification]);

  const handleEditMealClick = useCallback((index: number) => {
    setCurrentMealIndex(index);
    setMealDialogOpen(true);
  }, []);

  const handleMealDialogClose = useCallback(() => {
    setMealDialogOpen(false);
    setCurrentMealIndex(null);
  }, []);

  const handleMealDialogSave = useCallback((mealData: MealData) => {
    const mealWithDate = { ...mealData, date: selectedDate };

    if (currentMealIndex !== null) {
      setMeals(prevMeals => {
        const updatedMeals = [...prevMeals];
        updatedMeals[currentMealIndex] = mealWithDate;
        return updatedMeals;
      });
    } else {
      setMeals(prevMeals => [...prevMeals, mealWithDate]);
    }

    setHasUnsavedChanges(true);
    handleMealDialogClose();
  }, [selectedDate, currentMealIndex, handleMealDialogClose, setMeals, setHasUnsavedChanges]);

  const handleSaveAllMeals = useCallback(async () => {
    if (!isAuthenticated || !user || !getUserId(user)) {
      showNotification("Cannot save meals: User information not available", "error");
      return;
    }

    setLoading(true);
    try {
      const userId = getUserId(user);
      const mealsToSave = meals.map((meal) => ({ ...meal, date: selectedDate }));

      const response = await axios.put(`${API_BASE_URL}/meals/batch/user/${userId}`, {
        meals: mealsToSave
      });

      const { results, data } = response.data;

      let successMsg = "Meals saved successfully!";
      if (results.updated > 0) successMsg += ` Updated: ${results.updated}.`;
      if (results.created > 0) successMsg += ` Created: ${results.created}.`;

      showNotification(successMsg, "success");

      if (results.errors > 0) {
        console.warn("Some meals had errors:", data.errors);
        showNotification(`${results.errors} meals had errors. Check console for details.`, "warning");
      }

      fetchMealsForDate(selectedDate);
      setHasUnsavedChanges(false);

    } catch (err: unknown) {
      console.error("Error saving meals:", err);
      const error = err as Error & { response?: { data?: { message?: string } } };
      const errorMsg = `Failed to save meals. ${error.response?.data?.message || error.message || ""}`;
      showNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, selectedDate, API_BASE_URL, showNotification, fetchMealsForDate, setLoading, setHasUnsavedChanges, meals]);

  const handleDeleteMealClick = useCallback((index: number) => {
    setMealToDeleteIndex(index);
    setDeleteSingleConfirmOpen(true);
  }, []);

  const handleConfirmDeleteSingleMeal = useCallback(async () => {
    if (mealToDeleteIndex === null || !user) return;
    const meal = meals[mealToDeleteIndex];
    const userId = getUserId(user);

    if (meal._id && userId) {
      setLoading(true);

      try {
        await axios.delete(`${API_BASE_URL}/meals/${meal._id}/user/${userId}`);
      } catch (err: unknown) {
        const error = err as Error & { response?: { data?: { message?: string } } };
        showNotification(`Failed to delete meal: ${error.message || "Unknown error"}`, "error");
        setLoading(false);
        setDeleteSingleConfirmOpen(false);
        setMealToDeleteIndex(null);
        return;
      }

      setMeals(prevMeals => prevMeals.filter((_, i) => i !== mealToDeleteIndex));
      showNotification("Meal deleted successfully", "success");
      fetchMealsForDate(selectedDate);
      setLoading(false);
    } else {
      setMeals(prevMeals => prevMeals.filter((_, i) => i !== mealToDeleteIndex));
      showNotification("Meal removed", "info");
      setHasUnsavedChanges(true);
    }

    setDeleteSingleConfirmOpen(false);
    setMealToDeleteIndex(null);
  }, [mealToDeleteIndex, user, meals, API_BASE_URL, showNotification, fetchMealsForDate, selectedDate, setLoading, setMeals, setHasUnsavedChanges]);

  const cancelDeleteSingleMeal = useCallback(() => {
    setDeleteSingleConfirmOpen(false);
    setMealToDeleteIndex(null);
  }, []);

  const handleDeleteAllMealsClick = useCallback(() => {
    if (meals.length > 0) {
      setDeleteAllConfirmOpen(true);
    } else {
      showNotification("No meals to delete for this date.", "info");
    }
  }, [meals.length, showNotification]);

  const handleConfirmDeleteAllMeals = useCallback(async () => {
    if (!isAuthenticated || !user || !getUserId(user) || !selectedDate) {
      showNotification("Cannot delete meals: User or date information missing.", "error");
      setDeleteAllConfirmOpen(false);
      return;
    }
    setLoading(true);
    const userId = getUserId(user);

    try {
      await axios.delete(`${API_BASE_URL}/meals/user/${userId}/date/${selectedDate}`);
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { message?: string } } };
      const errorMsg = `Failed to delete all meals. ${error.response?.data?.message || error.message || ""}`;
      showNotification(errorMsg, "error");
      setLoading(false);
      setDeleteAllConfirmOpen(false);
      return;
    }

    showNotification("All meals for this date deleted successfully", "success");
    fetchMealsForDate(selectedDate);
    setLoading(false);
    setDeleteAllConfirmOpen(false);
  }, [isAuthenticated, user, selectedDate, API_BASE_URL, showNotification, fetchMealsForDate, setLoading]);

  const cancelDeleteAllMeals = useCallback(() => {
    setDeleteAllConfirmOpen(false);
  }, []);

  return {
    mealDialogOpen,
    currentMeal: currentMealIndex !== null ? meals[currentMealIndex] : undefined,
    handleAddMealClick,
    handleEditMealClick,
    handleMealDialogClose,
    handleMealDialogSave,
    handleSaveAllMeals,
    deleteSingleConfirmOpen,
    handleDeleteMealClick,
    handleConfirmDeleteSingleMeal,
    cancelDeleteSingleMeal,
    deleteAllConfirmOpen,
    handleDeleteAllMealsClick,
    handleConfirmDeleteAllMeals,
    cancelDeleteAllMeals,
  };
};