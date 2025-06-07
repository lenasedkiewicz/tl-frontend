import { useState, useEffect, useCallback } from "react";
import { MealData } from "../interfaces/MealInterfaces";


interface UseMealUnsavedChangesManagerProps {
  meals: MealData[];
  originalMeals: MealData[] | undefined;
  onPageLeave?: () => void;
  setHasUnsavedChangesState: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useMealUnsavedChangesManager = ({
  meals,
  originalMeals,
  onPageLeave,
  setHasUnsavedChangesState,
}: UseMealUnsavedChangesManagerProps) => {
  const [discardChangesDialogOpen, setDiscardChangesDialogOpen] = useState(false);
  const [navigationAttempt, setNavigationAttempt] = useState<string | null>(null);
  const [internalHasUnsavedChanges, setInternalHasUnsavedChanges] = useState(false);

  const checkForUnsavedChanges = useCallback(() => {
    if (!originalMeals || !meals) return false;
    if (meals.length !== originalMeals.length) return true;

    return meals.some((meal, index) => {
      const originalMeal = originalMeals[index];
      if (!originalMeal || !meal._id) return true;
      return (
        meal.name !== originalMeal.name ||
        meal.hour !== originalMeal.hour ||
        meal.minute !== originalMeal.minute ||
        meal.content !== originalMeal.content
      );
    });
  }, [meals, originalMeals]);

  useEffect(() => {
    const changed = checkForUnsavedChanges();
    setInternalHasUnsavedChanges(changed);
    setHasUnsavedChangesState(changed);
  }, [meals, originalMeals, checkForUnsavedChanges, setHasUnsavedChangesState]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (internalHasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [internalHasUnsavedChanges]);

  useEffect(() => {
    window.__hasMealUnsavedChanges = internalHasUnsavedChanges;
    window.__checkMealUnsavedChanges = () => internalHasUnsavedChanges;
    window.__showMealUnsavedChangesDialog = (navigateTo: string | null) => {
      if (internalHasUnsavedChanges) {
        setNavigationAttempt(navigateTo);
        setDiscardChangesDialogOpen(true);
        return true;
      }
      return false;
    };
    return () => {
      delete window.__hasMealUnsavedChanges;
      delete window.__checkMealUnsavedChanges;
      delete window.__showMealUnsavedChangesDialog;
    };
  }, [internalHasUnsavedChanges]);

  useEffect(() => {
    return () => {
      if (internalHasUnsavedChanges && onPageLeave) {
        onPageLeave();
      }
    };
  }, [internalHasUnsavedChanges, onPageLeave]);

  const attemptNavigation = (navigateTo: string | null) => {
    if (internalHasUnsavedChanges) {
      setNavigationAttempt(navigateTo);
      setDiscardChangesDialogOpen(true);
      return true;
    }
    return false;
  };

  const confirmDiscardChanges = (callback?: (target: string | null) => void) => {
    setDiscardChangesDialogOpen(false);
    setInternalHasUnsavedChanges(false);
    setHasUnsavedChangesState(false);
    if (callback) {
      callback(navigationAttempt);
    }
    setNavigationAttempt(null);
  };

  const cancelDiscardChanges = () => {
    setDiscardChangesDialogOpen(false);
    setNavigationAttempt(null);
  };

  return {
    hasUnsavedChanges: internalHasUnsavedChanges,
    discardChangesDialogOpen,
    setDiscardChangesDialogOpen,
    attemptNavigation,
    confirmDiscardChanges,
    cancelDiscardChanges,
    navigationAttemptUrl: navigationAttempt,
  };
};