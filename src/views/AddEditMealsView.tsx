import React, { useState, useEffect } from "react";
import {
  Button,
  Snackbar,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Paper,
  Divider,
  Alert as MuiAlert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { formatISO } from "date-fns";
import { useNotification } from "../hooks/useNotification";
import { sortMealsByTime } from "../components/helperfunctions/MealHelpers";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { CalendarDatePicker } from "../components/common/CalendarDatePicker";
import { MealCardItem } from "../components/meal/MealCardItem";
import { getUserId } from "../components/helperfunctions/AuthHelpers";
import { MealDialog } from "../components/meal/MealDialog";
import { useFetchMeals } from "../hooks/useFetchMeals";
import { useMealUnsavedChangesManager } from "../hooks/useMealUnsavedChangesManager";
import { useMealDataManager } from "../hooks/useMealDataManager";
import { API_BASE_URL, MAX_MEALS_ALLOWED } from "../file.const";

interface AddEditMealsViewProps {
  onPageLeave?: () => void;
}

export const AddEditMealsView: React.FC<AddEditMealsViewProps> = ({
  onPageLeave,
}) => {
  const { isAuthenticated, user, token } = useAuth();
  const { notifications, showNotification, hideNotification } =
    useNotification();
  const [currentNotification, setCurrentNotification] = useState<
    (typeof notifications)[0] | null
  >(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    formatISO(new Date(), { representation: "date" }),
  );

  const {
    meals,
    loading: fetchMealsLoading,
    fetchMealsForDate,
    originalMeals,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setMeals,
    setLoading,
  } = useFetchMeals({
    API_BASE_URL,
    isAuthenticated,
    getUserId,
    user,
    showNotification,
    trackOriginalMeals: true,
  });

  const {
    hasUnsavedChanges: currentUnsavedChanges,
    discardChangesDialogOpen,
    attemptNavigation,
    confirmDiscardChanges,
    cancelDiscardChanges,
  } = useMealUnsavedChangesManager({
    meals,
    originalMeals,
    onPageLeave,
    setHasUnsavedChangesState: setHasUnsavedChanges,
  });

  const mealDataManager = useMealDataManager({
    meals,
    setMeals,
    originalMeals,
    selectedDate,
    user,
    isAuthenticated,
    API_BASE_URL,
    showNotification,
    fetchMealsForDate,
    setLoading, // Passed from useFetchMeals
    setHasUnsavedChanges, // Passed from useFetchMeals (and managed via useMealUnsavedChangesManager)
    MAX_MEALS: MAX_MEALS_ALLOWED,
  });

  useEffect(() => {
    if (token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete axios.defaults.headers.common["Authorization"];
  }, [token]);

  useEffect(() => {
    setAuthInitialized(true);
  }, []);

  useEffect(() => {
    const shouldFetch =
      isAuthenticated &&
      user &&
      getUserId(user) &&
      selectedDate &&
      authInitialized;
    if (shouldFetch) {
      fetchMealsForDate(selectedDate);
    } else if (authInitialized && !isAuthenticated) {
      setMeals([]); // Clear meals if not authenticated after init
    }
  }, [selectedDate, isAuthenticated, authInitialized]); // Added user to dependencies

  useEffect(() => {
    if (notifications.length > 0) {
      setCurrentNotification(notifications[0]);
    } else {
      setCurrentNotification(null);
    }
  }, [notifications]);

  const handleDateChange = (dateString: string) => {
    if (currentUnsavedChanges) {
      const navigationContinued = attemptNavigation(dateString);
      if (navigationContinued) return; // Dialog shown, wait for user action
    }
    // If no unsaved changes, or if user chose to discard (handled by confirmDiscardChanges)
    setSelectedDate(dateString);
  };

  const handleDiscardAndNavigate = () => {
    confirmDiscardChanges((targetDate) => {
      if (targetDate && targetDate.includes("-")) {
        // Check if it's a date string
        setSelectedDate(targetDate);
      } else {
        // Handle other types of navigation if any, or log
        console.info(
          "Navigating after discard to non-date target:",
          targetDate,
        );
      }
    });
  };

  const handleClose = () => {
    if (currentNotification) {
      hideNotification(currentNotification.id);
    }
  };

  if (!isAuthenticated && authInitialized) {
    return (
      <Box sx={{ maxWidth: 700, margin: "auto", mt: 4 }}>
        <MuiAlert severity="info">Please log in to manage your meals.</MuiAlert>
      </Box>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        margin: "auto",
        mt: 4,
        p: 3,
        minHeight: "calc(100vh - 100px)" /* Example height */,
      }}
    >
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

      {fetchMealsLoading ? ( // Use fetchMealsLoading for the initial data fetch
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
              Meals ({meals.length}/{MAX_MEALS_ALLOWED})
              {currentUnsavedChanges && (
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
                onClick={mealDataManager.handleAddMealClick}
                variant="outlined"
                size="small"
                disabled={
                  meals.length >= MAX_MEALS_ALLOWED || fetchMealsLoading
                } // Also disable if fetching
                sx={{ mr: 1 }}
              >
                {" "}
                Add Meal{" "}
              </Button>
              <Button
                startIcon={<ClearAllIcon />}
                onClick={mealDataManager.handleDeleteAllMealsClick}
                variant="outlined"
                color="error"
                size="small"
                disabled={meals.length === 0 || fetchMealsLoading} // Also disable if fetching
              >
                {" "}
                Delete All{" "}
              </Button>
            </Box>
          </Box>

          {meals.length === 0 ? (
            <MuiAlert severity="info" sx={{ my: 2 }}>
              No meals added for {selectedDate}. Click "Add Meal" to create one.
            </MuiAlert>
          ) : (
            <Stack spacing={2}>
              {sortMealsByTime(meals).map((meal, index) => (
                // Ensure original index is preserved if needed, or find meal by ID for edit/delete
                // For simplicity, if sortMealsByTime returns a new array, mapping by index might be tricky
                // if indices are used to find meals in the original `meals` array for edit/delete.
                // It's safer to pass the meal object or its ID.
                // mealDataManager.handleEditMealClick and handleDeleteMealClick should expect meal._id or the actual meal object.
                // For now, assuming indices are relative to the *displayed, sorted* list, and hooks can map back if necessary or operate on IDs.
                // Let's adjust MealCardItem to pass index from the *original* meals array or an ID.
                // For simplicity, let's assume the index here corresponds to the `meals` array IF `sortMealsByTime` doesn't reorder them in a way that breaks index mapping.
                // A safer way is to find the index in the original `meals` array before calling edit/delete handlers
                // Or pass meal._id if available.
                // Let's stick to passing the index of the `meal` in the `meals` array.
                // The `sortMealsByTime(meals).map((meal, sortedIndex)` means we need to find the original index.
                // A simple way: `meals.findIndex(m => m === meal)` if meals have unique references.
                // Or, if `meal._id` is reliable: `meals.findIndex(m => m._id === meal._id)`
                <MealCardItem
                  key={meal._id || `new-${index}`} // Use a more stable key if possible
                  meal={meal}
                  onEdit={() =>
                    mealDataManager.handleEditMealClick(
                      meals.findIndex((m) => m === meal),
                    )
                  } // Find original index
                  onDelete={() =>
                    mealDataManager.handleDeleteMealClick(
                      meals.findIndex((m) => m === meal),
                    )
                  } // Find original index
                  loading={fetchMealsLoading} // Or a combined loading state
                />
              ))}
            </Stack>
          )}
        </>
      )}

      <Divider sx={{ my: 3 }} />

      <Button
        onClick={mealDataManager.handleSaveAllMeals}
        variant="contained"
        color="primary"
        disabled={
          fetchMealsLoading ||
          meals.length === 0 ||
          !isAuthenticated ||
          !currentUnsavedChanges
        }
        fullWidth
        sx={{ mt: 3, py: 1.5 }}
        startIcon={
          fetchMealsLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : null
        }
      >
        {" "}
        Save Daily Meals{" "}
      </Button>

      <MealDialog
        open={mealDataManager.mealDialogOpen}
        onClose={mealDataManager.handleMealDialogClose}
        onSave={mealDataManager.handleMealDialogSave}
        meal={mealDataManager.currentMeal}
        // Pass other necessary props like currentMealIndex if your MealDialog uses it directly
        // meals={meals} // Pass if MealDialog needs the whole list for validation e.g.
        selectedDate={selectedDate}
      />

      <ConfirmationDialog
        open={mealDataManager.deleteSingleConfirmOpen}
        onClose={mealDataManager.cancelDeleteSingleMeal}
        onConfirm={mealDataManager.handleConfirmDeleteSingleMeal}
        title="Confirm Meal Deletion"
        content="Are you sure you want to delete this meal?"
        confirmButtonText="Delete"
        confirmButtonColor="error"
        loading={fetchMealsLoading} // Or a specific 'isDeleting' loading state
      />
      <ConfirmationDialog
        open={mealDataManager.deleteAllConfirmOpen}
        onClose={mealDataManager.cancelDeleteAllMeals}
        onConfirm={mealDataManager.handleConfirmDeleteAllMeals}
        title="Confirm Deletion of All Meals"
        content={`Are you sure you want to delete ALL meals for ${selectedDate}? This action cannot be undone.`}
        confirmButtonText="Delete All"
        confirmButtonColor="error"
        loading={fetchMealsLoading} // Or a specific 'isDeletingAll' loading state
      />
      <ConfirmationDialog
        open={discardChangesDialogOpen}
        onClose={cancelDiscardChanges}
        onConfirm={handleDiscardAndNavigate} // Updated to use the new handler
        title="Unsaved Changes"
        content="You have unsaved changes. Do you want to discard them and continue?"
        confirmButtonText="Discard Changes"
        confirmButtonColor="warning"
        cancelButtonText="Stay Here"
        loading={fetchMealsLoading}
      />

      {currentNotification && (
        <Snackbar
          open={true}
          autoHideDuration={currentNotification.duration || 6000}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          onClose={handleClose}
        >
          <MuiAlert
            severity={currentNotification.type}
            onClose={handleClose}
            sx={{ width: "100%" }}
          >
            {currentNotification.message}
          </MuiAlert>
        </Snackbar>
      )}
    </Paper>
  );
};
