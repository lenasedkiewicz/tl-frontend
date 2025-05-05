import React, { useState, useEffect, useCallback } from "react";
import {
  TextField,
  Button,
  Snackbar,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import {
  formatTime,
  generateTimeOptions,
  getUserId,
  sortMealsByTime,
} from "../components/HelperFunctions";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { CalendarDatePicker } from "../components/common/CalendarDatePicker";
import { MealCardItem } from "../components/meal/MealCardItem";

const API_BASE_URL = "http://localhost:5000";

const MEAL_NAME_CHOICES = [
  "Breakfast",
  "Brunch",
  "Elevenses",
  "Lunch",
  "Tea",
  "Dinner",
  "Supper",
  "Other",
];

// Define the props to receive a onPageLeave callback
interface AddEditMealsViewProps {
  onPageLeave?: () => void;
}

export const AddEditMealsView: React.FC<AddEditMealsViewProps> = ({
  onPageLeave,
}) => {
  const { isAuthenticated, user, token } = useAuth();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    formatISO(new Date(), { representation: "date" }),
  );
  const [meals, setMeals] = useState<MealData[]>([]);
  const [originalMeals, setOriginalMeals] = useState<MealData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [discardChangesDialogOpen, setDiscardChangesDialogOpen] =
    useState(false);
  const [navigationAttempt, setNavigationAttempt] = useState<string | null>(
    null,
  );

  const timeOptions = generateTimeOptions();

  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState<number | null>(null);
  const MAX_MEALS = 6;

  const [deleteSingleConfirmOpen, setDeleteSingleConfirmOpen] = useState(false);
  const [mealToDeleteIndex, setMealToDeleteIndex] = useState<number | null>(
    null,
  );
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  // Detect unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    if (meals.length !== originalMeals.length) {
      return true;
    }

    // Check for new or modified meals (without IDs or with modified content)
    const hasDifferences = meals.some((meal, index) => {
      const originalMeal = originalMeals[index];

      // If there's no matching original meal or this is a new meal (no ID)
      if (!originalMeal || !meal._id) {
        return true;
      }

      // Check if any properties differ
      return (
        meal.name !== originalMeal.name ||
        meal.hour !== originalMeal.hour ||
        meal.minute !== originalMeal.minute ||
        meal.content !== originalMeal.content
      );
    });

    return hasDifferences;
  }, [meals, originalMeals]);

  // Update unsaved changes status whenever meals change
  useEffect(() => {
    setHasUnsavedChanges(checkForUnsavedChanges());
  }, [meals, checkForUnsavedChanges]);

  // Handle browser navigation/refresh events
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

  // Notify parent component about unsaved changes
  useEffect(() => {
    // Create a global variable to track unsaved changes for this component
    window.__hasMealUnsavedChanges = hasUnsavedChanges;

    // Create a global function that can be called before navigation
    window.__checkMealUnsavedChanges = () => {
      return hasUnsavedChanges;
    };

    // Create another global function to programmatically show the dialog
    window.__showMealUnsavedChangesDialog = (navigateTo: string | null) => {
      if (hasUnsavedChanges) {
        setNavigationAttempt(navigateTo);
        setDiscardChangesDialogOpen(true);
        return true; // Dialog was shown
      }
      return false; // No need for dialog
    };

    return () => {
      // Clean up global variables when component unmounts
      delete window.__hasMealUnsavedChanges;
      delete window.__checkMealUnsavedChanges;
      delete window.__showMealUnsavedChangesDialog;
    };
  }, [hasUnsavedChanges]);

  // Component unmount handler - optionally notify parent
  useEffect(() => {
    return () => {
      // If component is unmounting with unsaved changes
      if (hasUnsavedChanges && onPageLeave) {
        onPageLeave();
      }
    };
  }, [hasUnsavedChanges, onPageLeave]);

  // Function to handle navigation with unsaved changes
  const handleNavigation = (navigateTo: string | null) => {
    if (hasUnsavedChanges) {
      setNavigationAttempt(navigateTo);
      setDiscardChangesDialogOpen(true);
      return;
    }

    // If no unsaved changes, proceed with navigation
    if (navigateTo !== null) {
      // Handle navigation to new path
      // You'd implement this with your router
      // For example: history.push(navigateTo);
      console.log("Navigating to:", navigateTo);
    }
  };

  const handleDiscardChanges = () => {
    setDiscardChangesDialogOpen(false);
    setHasUnsavedChanges(false);

    if (navigationAttempt !== null) {
      // Handle navigation to the stored path
      // For example: history.push(navigationAttempt);
      console.log("Navigating after discard:", navigationAttempt);
      setNavigationAttempt(null);
    }
  };

  useEffect(() => {
    if (token) {
      // console.log(token);
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
      setOriginalMeals([]);
      setLoading(false);
    }
  }, [selectedDate, isAuthenticated, user, authInitialized]);

  const fetchMealsForDate = async (date: string) => {
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
        setOriginalMeals(JSON.parse(JSON.stringify(formattedMeals))); // Deep copy for comparison
        setHasUnsavedChanges(false); // Reset unsaved changes flag after fetch
      } else {
        console.error("Unexpected response format:", response.data);
        setMeals([]);
        setOriginalMeals([]);
      }
    } catch (err: any) {
      console.error("Error fetching meals:", err);
      if (err.response?.status !== 404) {
        showNotification(
          `Failed to load meals: ${err.message || "Unknown error"}`,
          "error",
        );
      } else {
        setMeals([]);
        setOriginalMeals([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dateString: string) => {
    if (hasUnsavedChanges) {
      // Store the date we're trying to navigate to
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
        setOriginalMeals(updatedMeals); // Update original meals after successful deletion

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
        `${API_BASE_URL}/meals/user/${userId}/date/${selectedDate}`, // needs to be fixed (add endpoint on backend)
      );

      setMeals([]);
      setOriginalMeals([]);
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

  // --- Meal Add/Edit Dialog Component (Inline or Extracted) ---
  // Keeping it inline for access to parent state/handlers, but could be extracted
  // by passing `meal`, `onSave`, `onClose`, `timeOptions`, etc. as props.
  const MealDialog = () => {
    const [dialogMealState, setDialogMealState] = useState<MealData>(() => {
      if (currentMealIndex !== null && meals[currentMealIndex]) {
        return { ...meals[currentMealIndex] };
      }
      return {
        name: "",
        hour: 12,
        minute: 0o0,
        content: "",
        date: selectedDate,
      };
    });

    useEffect(() => {
      setDialogMealState((prevMeal) => {
        const baseMeal =
          currentMealIndex !== null && meals[currentMealIndex]
            ? meals[currentMealIndex]
            : { name: "", hour: 12, minute: 0, content: "" };
        return {
          ...baseMeal,
          date: selectedDate,
          // Keep existing name/content/time if editing the same meal index across date changes?
          // Or reset if date changes while editing? Resetting is simpler:
          ...(currentMealIndex === null ||
          !meals[currentMealIndex] ||
          meals[currentMealIndex].date !== selectedDate
            ? {
                name: "",
                hour: 12,
                minute: 0,
                content: "",
              }
            : {}),
        };
      });
    }, [selectedDate, currentMealIndex, meals]);

    const handleTimeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
      const selectedTimeValue = e.target.value as string;
      const [hourStr, minuteStr] = selectedTimeValue.split(":");
      setDialogMealState({
        ...dialogMealState,
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
      });
    };

    const isValid =
      dialogMealState.name.trim() &&
      dialogMealState.content.trim() &&
      dialogMealState.content.length >= 5;

    return (
      <Dialog
        open={mealDialogOpen}
        onClose={handleMealDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentMealIndex !== null ? "Edit Meal Details" : "Add New Meal"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select // <-- Add the select prop
              label="Meal Name"
              value={dialogMealState.name}
              onChange={(e) =>
                setDialogMealState({ ...dialogMealState, name: e.target.value })
              }
              fullWidth
              required
              autoFocus
              // Validation remains the same: name shouldn't be empty
              error={dialogMealState.name.trim() === ""}
              helperText={
                dialogMealState.name.trim() === ""
                  ? "Meal name is required"
                  : ""
              }
            >
              {/* Map over the choices to create MenuItem components */}
              {MEAL_NAME_CHOICES.map((choice) => (
                <MenuItem key={choice} value={choice}>
                  {choice}
                </MenuItem>
              ))}
            </TextField>
            <FormControl fullWidth required>
              <InputLabel id="time-select-label">Time</InputLabel>
              <Select
                labelId="time-select-label"
                value={formatTime(dialogMealState.hour, dialogMealState.minute)}
                label="Time"
                onChange={handleTimeChange}
              >
                {timeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Meal Content"
              value={dialogMealState.content}
              onChange={(e) =>
                setDialogMealState({
                  ...dialogMealState,
                  content: e.target.value,
                })
              }
              multiline
              rows={4}
              fullWidth
              required
              error={
                dialogMealState.content.length > 0 &&
                dialogMealState.content.length < 5
              }
              helperText={
                dialogMealState.content.length > 0 &&
                dialogMealState.content.length < 5
                  ? "Min 5 characters required"
                  : ""
              }
            />
            {/* Display the date for confirmation */}
            <Typography variant="caption" color="text.secondary">
              Meal date: {selectedDate}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMealDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => handleMealDialogSave(dialogMealState)}
            variant="contained"
            disabled={!isValid || loading}
          >
            {currentMealIndex !== null ? "Update Meal" : "Add Meal"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Only show the not-logged-in message if we're sure auth has initialized
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

      {/* Loading or Meals Section */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <>
          {/* Meals Section Header */}
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

          {/* List of Meals */}
          {meals.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No meals added for {selectedDate}. Click "Add Meal" to create one.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {sortMealsByTime(meals).map((meal, index) => (
                <MealCardItem
                  key={meal._id || index} // Use _id if exists, fallback to index
                  meal={meal}
                  onEdit={() => handleEditMealClick(index)}
                  onDelete={() => handleDeleteMealClick(index)}
                  loading={loading} // Pass loading to disable actions during save/delete
                />
              ))}
            </Stack>
          )}
        </>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Save Button */}
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

      {/* Meal Add/Edit Dialog */}
      <MealDialog />

      {/* Single Meal Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteSingleConfirmOpen}
        onClose={() => setDeleteSingleConfirmOpen(false)}
        onConfirm={handleConfirmDeleteSingleMeal}
        title="Confirm Meal Deletion"
        content="Are you sure you want to delete this meal?"
        confirmButtonText="Delete"
        confirmButtonColor="error"
        loading={loading} // Use the main loading state
      />

      {/* Delete All Meals Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        onConfirm={handleConfirmDeleteAllMeals}
        title="Confirm Deletion of All Meals"
        content={`Are you sure you want to delete ALL meals for ${selectedDate}? This action cannot be undone.`}
        confirmButtonText="Delete All"
        confirmButtonColor="error"
        loading={loading} // Use the main loading state
      />

      {/* Unsaved Changes Dialog */}
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

      {/* Notification Snackbar */}
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
