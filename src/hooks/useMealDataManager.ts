import { useState } from "react";
import axios from "axios";
import { MealData } from "../interfaces/MealInterfaces";
import { User } from "../interfaces/AuthInterfaces";
import { getUserId } from "../components/helperfunctions/AuthHelpers";
import { UseNotificationReturn } from "./useNotification";


interface UseMealDataManagerProps {
  meals: MealData[];
  setMeals: React.Dispatch<React.SetStateAction<MealData[]>>;
  originalMeals: MealData[] | null;
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

  const handleAddMealClick = () => {
    if (meals.length < MAX_MEALS) {
      setCurrentMealIndex(null);
      setMealDialogOpen(true);
    } else {
      showNotification(`Maximum ${MAX_MEALS} meals are allowed`, "warning");
    }
  };

  const handleEditMealClick = (index: number) => {
    setCurrentMealIndex(index);
    setMealDialogOpen(true);
  };

  const handleMealDialogClose = () => {
    setMealDialogOpen(false);
    setCurrentMealIndex(null);
  };

  const handleMealDialogSave = (mealData: MealData) => {
    const mealWithDate = { ...mealData, date: selectedDate };
    if (currentMealIndex !== null) {
      const updatedMeals = [...meals];
      updatedMeals[currentMealIndex] = mealWithDate;
      setMeals(updatedMeals);
    } else {
      setMeals([...meals, mealWithDate]);
    }
    setHasUnsavedChanges(true);
    handleMealDialogClose();
  };

  const handleSaveAllMeals = async () => {
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

    } catch (err: any) {
      console.error("Error saving meals:", err);
      const errorMsg = `Failed to save meals. ${err.response?.data?.message || err.message || ""}`;
      showNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteMealClick = (index: number) => {
    setMealToDeleteIndex(index);
    setDeleteSingleConfirmOpen(true);
  };

  const handleConfirmDeleteSingleMeal = async () => {
    if (mealToDeleteIndex === null || !user) return;
    const meal = meals[mealToDeleteIndex];
    const userId = getUserId(user);

    if (meal._id && userId) {
      setLoading(true);

      try {
        await axios.delete(`${API_BASE_URL}/meals/${meal._id}/user/${userId}`);
      } catch (err: any) {
        showNotification(`Failed to delete meal: ${err.message || "Unknown error"}`, "error");
        setLoading(false);
        setDeleteSingleConfirmOpen(false);
        setMealToDeleteIndex(null);
        return;
      }

      const updatedMeals = meals.filter((_, i) => i !== mealToDeleteIndex);
      setMeals(updatedMeals);
      showNotification("Meal deleted successfully", "success");
      fetchMealsForDate(selectedDate);
      setLoading(false);
    } else {
      const updatedMeals = meals.filter((_, i) => i !== mealToDeleteIndex);
      setMeals(updatedMeals);
      showNotification("Meal removed", "info");
      setHasUnsavedChanges(true);
    }

    setDeleteSingleConfirmOpen(false);
    setMealToDeleteIndex(null);
  };

  const cancelDeleteSingleMeal = () => {
    setDeleteSingleConfirmOpen(false);
    setMealToDeleteIndex(null);
  };

  const handleDeleteAllMealsClick = () => {
    if (meals.length > 0) {
      setDeleteAllConfirmOpen(true);
    } else {
      showNotification("No meals to delete for this date.", "info");
    }
  };

  const handleConfirmDeleteAllMeals = async () => {
    if (!isAuthenticated || !user || !getUserId(user) || !selectedDate) {
      showNotification("Cannot delete meals: User or date information missing.", "error");
      setDeleteAllConfirmOpen(false);
      return;
    }
    setLoading(true);
    try {
      const userId = getUserId(user);
      await axios.delete(`${API_BASE_URL}/meals/user/${userId}/date/${selectedDate}`);
      showNotification("All meals for this date deleted successfully", "success");
      fetchMealsForDate(selectedDate);
    } catch (err: any) {
      const errorMsg = `Failed to delete all meals. ${err.response?.data?.message || err.message || ""}`;
      showNotification(errorMsg, "error");
    } finally {
      setLoading(false);
      setDeleteAllConfirmOpen(false);
    }
  };

  const cancelDeleteAllMeals = () => {
    setDeleteAllConfirmOpen(false);
  };

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