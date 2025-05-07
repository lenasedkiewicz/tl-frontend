import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Snackbar,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import { Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { formatISO } from "date-fns";
import { useNotification } from "../hooks/useNotification";
import { MealData } from "../interfaces/MealInterfaces";
import { sortMealsByTime } from "../components/helperfunctions/MealHelpers";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { CalendarDatePicker } from "../components/common/CalendarDatePicker";
import { MealCardItem } from "../components/meal/MealCardItem";
import { getUserId } from "../components/helperfunctions/AuthHelpers";
import { MealDialog } from "../components/meal/MealDialog";
import { useFetchMeals } from "../hooks/useFetchMeals";

const API_BASE_URL = "http://localhost:5000";

const MEAL_NAME_CHOICES = [
  "Breakfast",
  "Brunch",
  "Elevenses",
  "Lunch",
  "Tea",
  "Dinner",
  "Supper",
  "Snack",
  "Other",
];

interface AddEditMealsViewProps {
  onPageLeave?: () => void;
}

export const AddEditMealsView: React.FC<AddEditMealsViewProps> = ({
  onPageLeave,
}) => {
  const { isAuthenticated, user, token } = useAuth();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    formatISO(new Date(), { representation: "date" }),
  );

  // Use our custom hook for meal fetching, with change tracking enabled
  const {
    meals,
    loading,
    fetchMealsForDate,
    originalMeals,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setMeals,
  } = useFetchMeals({
    API_BASE_URL,
    isAuthenticated,
    getUserId,
    user,
    showNotification,
    trackOriginalMeals: true,
  });

  const [discardChangesDialogOpen, setDiscardChangesDialogOpen] =
    useState(false);
  const [navigationAttempt, setNavigationAttempt] = useState<string | null>(
    null,
  );

  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState<number | null>(null);
  const MAX_MEALS = 6;

  const [deleteSingleConfirmOpen, setDeleteSingleConfirmOpen] = useState(false);
  const [mealToDeleteIndex, setMealToDeleteIndex] = useState<number | null>(
    null,
  );
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  const checkForUnsavedChanges = useCallback(() => {
    if (meals.length !== originalMeals.length) {
      return true;
    }

    const hasDifferences = meals.some((meal, index) => {
      const originalMeal = originalMeals[index];

      if (!originalMeal || !meal._id) {
        return true;
      }

      return (
        meal.name !== originalMeal.name ||
        meal.hour !== originalMeal.hour ||
        meal.minute !== originalMeal.minute ||
        meal.content !== originalMeal.content
      );
    });

    return hasDifferences;
  }, [meals, originalMeals]);

  useEffect(() => {
    setHasUnsavedChanges(checkForUnsavedChanges());
  }, [meals, checkForUnsavedChanges, setHasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    window.__hasMealUnsavedChanges = hasUnsavedChanges;

    window.__checkMealUnsavedChanges = () => {
      return hasUnsavedChanges;
    };

    window.__showMealUnsavedChangesDialog = (navigateTo: string | null) => {
      if (hasUnsavedChanges) {
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
  }, [hasUnsavedChanges]);

  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && onPageLeave) {
        onPageLeave();
      }
    };
  }, [hasUnsavedChanges, onPageLeave]);

  const handleNavigation = (navigateTo: string | null) => {
    if (hasUnsavedChanges) {
      setNavigationAttempt(navigateTo);
      setDiscardChangesDialogOpen(true);
      return;
    }

    if (navigateTo !== null) {
      console.info("Navigating to:", navigateTo);
    }
  };

  const handleDiscardChanges = () => {
    setDiscardChangesDialogOpen(false);
    setHasUnsavedChanges(false);

    if (navigationAttempt !== null) {
      console.info("Navigating after discard:", navigationAttempt);
      setNavigationAttempt(null);
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  useEffect(() => {
    setAuthInitialized(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && getUserId(user) && selectedDate) {
      fetchMealsForDate(selectedDate);
    } else if (authInitialized && !isAuthenticated) {
      setMeals([]);
    }
  }, [
    selectedDate,
    isAuthenticated,
    user,
    authInitialized,
    fetchMealsForDate,
    setMeals,
  ]);

  const handleDateChange = (dateString: string) => {
    if (hasUnsavedChanges) {
      setNavigationAttempt(dateString);
      setDiscardChangesDialogOpen(true);
    } else {
      setSelectedDate(dateString);
    }
  };

  const handleSaveMeals = async () => {
    if (!isAuthenticated || !getUserId(user)) {
      showNotification(
        "Cannot save meals: User information not available",
        "error",
      );
      return;
    }

    setLoading(true);
    try {
      const userId = getUserId(user);
      const mealsToSave = meals.map((meal) => ({
        ...meal,
        date: selectedDate,
      }));

      const existingMeals = mealsToSave.filter((meal) => meal._id);
      const newMeals = mealsToSave.filter((meal) => !meal._id);

      const savePromises: Promise<any>[] = [];

      existingMeals.forEach((meal) => {
        savePromises.push(
          axios.put(`${API_BASE_URL}/meals/${meal._id}/user/${userId}`, meal),
        );
      });

      if (newMeals.length > 0) {
        newMeals.forEach((meal) => {
          savePromises.push(
            axios.post(`${API_BASE_URL}/meals/user/${userId}`, meal),
          );
        });
      }

      // Note: This current save logic doesn't handle deleting meals that were previously saved but are
      // now removed from the 'meals' state locally before hitting 'Save Daily Meals'.
      // A more robust approach would involve comparing initial meals (on fetch)
      // with the final meals state to determine deletions, or relying solely on the
      // individual delete button which is handled below. For simplicity, we'll stick
      // to just saving/updating the meals currently in the list when the "Save Daily Meals" button is clicked.
      // Individual deletion is handled by the delete button and confirmation.

      await Promise.all(savePromises);
      showNotification("Meals saved successfully!", "success");

      fetchMealsForDate(selectedDate);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error("Error saving meals:", err);
      let errorMsg = "Failed to save meals.";
      if (err.response?.data?.message) {
        errorMsg += ` ${err.response.data.message}`;
      } else if (err.message) {
        errorMsg += ` ${err.message}`;
      }
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
    if (mealToDeleteIndex === null) return;

    const meal = meals[mealToDeleteIndex];

    if (meal._id && getUserId(user)) {
      setLoading(true);
      try {
        const userId = getUserId(user);
        await axios.delete(`${API_BASE_URL}/meals/${meal._id}/user/${userId}`);

        const updatedMeals = meals.filter((_, i) => i !== mealToDeleteIndex);
        setMeals(updatedMeals);

        showNotification("Meal deleted successfully", "success");
        setHasUnsavedChanges(false);
      } catch (err: any) {
        console.error("Error deleting meal:", err);
        showNotification(
          `Failed to delete meal: ${err.message || "Unknown error"}`,
          "error",
        );
      } finally {
        setLoading(false);
        setDeleteSingleConfirmOpen(false);
        setMealToDeleteIndex(null);
      }
    } else {
      if (meals.length > 1) {
        const updatedMeals = meals.filter((_, i) => i !== mealToDeleteIndex);
        setMeals(updatedMeals);
        showNotification("Meal removed", "info");
      } else {
        showNotification("Cannot delete the last meal entry.", "warning");
      }
      setDeleteSingleConfirmOpen(false);
      setMealToDeleteIndex(null);
    }
  };

  const handleDeleteAllMealsClick = () => {
    if (meals.length > 0) {
      setDeleteAllConfirmOpen(true);
    } else {
      showNotification("No meals to delete for this date.", "info");
    }
  };

  const handleConfirmDeleteAllMeals = async () => {
    if (!isAuthenticated || !getUserId(user) || !selectedDate) {
      showNotification(
        "Cannot delete meals: User or date information missing.",
        "error",
      );
      setDeleteAllConfirmOpen(false);
      return;
    }

    setLoading(true);
    try {
      const userId = getUserId(user);
      await axios.delete(
        `${API_BASE_URL}/meals/user/${userId}/date/${selectedDate}`,
      );

      setMeals([]);
      setHasUnsavedChanges(false);

      showNotification(
        "All meals for this date deleted successfully",
        "success",
      );
    } catch (err: any) {
      console.error("Error deleting all meals:", err);
      let errorMsg = "Failed to delete all meals.";
      if (err.response?.data?.message) {
        errorMsg += ` ${err.response.data.message}`;
      } else if (err.message) {
        errorMsg += ` ${err.message}`;
      }
      showNotification(errorMsg, "error");
    } finally {
      setLoading(false);
      setDeleteAllConfirmOpen(false);
    }
  };

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
    const mealWithDate = {
      ...mealData,
      date: selectedDate,
    };

    if (currentMealIndex !== null) {
      const updatedMeals = [...meals];
      updatedMeals[currentMealIndex] = mealWithDate;
      setMeals(updatedMeals);
    } else {
      setMeals([...meals, mealWithDate]);
    }
    handleMealDialogClose();
  };

  if (!isAuthenticated && authInitialized) {
    return (
      <Box sx={{ maxWidth: 700, margin: "auto", mt: 4 }}>
        <Alert severity="info">Please log in to manage your meals.</Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ margin: "auto", mt: 4, p: 3, height: "100%" }}>
      <Typography variant="h5" component="h2" gutterBottom>
        <AddIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Add/Edit Daily Meals
      </Typography>

      <CalendarDatePicker
        label="Select Date"
        value={selectedDate}
        onChange={handleDateChange}
        required
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              Meals ({meals.length}/{MAX_MEALS})
              {hasUnsavedChanges && (
                <Typography
                  component="span"
                  color="warning.main"
                  sx={{ ml: 1, fontSize: "0.8em", fontStyle: "italic" }}
                >
                  (Unsaved changes)
                </Typography>
              )}
            </Typography>
            <Box>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddMealClick}
                variant="outlined"
                size="small"
                disabled={meals.length >= MAX_MEALS || loading}
                sx={{ mr: 1 }}
              >
                Add Meal
              </Button>
              <Button
                startIcon={<ClearAllIcon />}
                onClick={handleDeleteAllMealsClick}
                variant="outlined"
                color="error"
                size="small"
                disabled={meals.length === 0 || loading}
              >
                Delete All
              </Button>
            </Box>
          </Box>

          {meals.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No meals added for {selectedDate}. Click "Add Meal" to create one.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {sortMealsByTime(meals).map((meal, index) => (
                <MealCardItem
                  key={meal._id || index}
                  meal={meal}
                  onEdit={() => handleEditMealClick(index)}
                  onDelete={() => handleDeleteMealClick(index)}
                  loading={loading}
                />
              ))}
            </Stack>
          )}
        </>
      )}

      <Divider sx={{ my: 3 }} />

      <Button
        onClick={handleSaveMeals}
        variant="contained"
        color="primary"
        disabled={
          loading ||
          meals.length === 0 ||
          !isAuthenticated ||
          !hasUnsavedChanges
        }
        fullWidth
        sx={{ mt: 3, py: 1.5 }}
        startIcon={
          loading ? <CircularProgress size={20} color="inherit" /> : null
        }
      >
        Save Daily Meals
      </Button>

      <MealDialog
        open={mealDialogOpen}
        onClose={handleMealDialogClose}
        onSave={handleMealDialogSave}
        meal={currentMealIndex !== null ? meals[currentMealIndex] : undefined}
        currentMealIndex={currentMealIndex}
        meals={meals}
        selectedDate={selectedDate}
      />

      <ConfirmationDialog
        open={deleteSingleConfirmOpen}
        onClose={() => setDeleteSingleConfirmOpen(false)}
        onConfirm={handleConfirmDeleteSingleMeal}
        title="Confirm Meal Deletion"
        content="Are you sure you want to delete this meal?"
        confirmButtonText="Delete"
        confirmButtonColor="error"
        loading={loading}
      />

      <ConfirmationDialog
        open={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        onConfirm={handleConfirmDeleteAllMeals}
        title="Confirm Deletion of All Meals"
        content={`Are you sure you want to delete ALL meals for ${selectedDate}? This action cannot be undone.`}
        confirmButtonText="Delete All"
        confirmButtonColor="error"
        loading={loading}
      />

      <ConfirmationDialog
        open={discardChangesDialogOpen}
        onClose={() => {
          setDiscardChangesDialogOpen(false);
          setNavigationAttempt(null);
        }}
        onConfirm={handleDiscardChanges}
        title="Unsaved Changes"
        content="You have unsaved changes. Do you want to discard them and continue?"
        confirmButtonText="Discard Changes"
        confirmButtonColor="warning"
        cancelButtonText="Stay Here"
        loading={loading}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={hideNotification}
      >
        <Alert
          severity={notification.type}
          onClose={hideNotification}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
