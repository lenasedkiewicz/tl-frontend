import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Snackbar,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
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
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

// Interface for Meal data used in the form
interface MealData {
  _id?: string; // For existing meals
  name: string;
  hour: number;
  minute: number;
  content: string;
  date: string; // Each meal has its own date
}

// --- Time Options ---
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      options.push({
        label: `${hourStr}:${minuteStr}`,
        value: `${hour}:${minute}`, // Store combined value for Select
        hour,
        minute,
      });
    }
  }
  return options;
};
const timeOptions = generateTimeOptions();
// --- End Time Options ---

// Simple notification hook
const useNotification = () => {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => {
    setNotification({
      open: true,
      message,
      type,
    });
  };

  const hideNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  return { notification, showNotification, hideNotification };
};

// Helper function to get user ID
const getUserId = (user: any): string | undefined => {
  return user?._id || user?.id;
};

// ========================
// MealDatePicker Component
// ========================
export const MealDatePicker: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [meals, setMeals] = useState<MealData[]>([]);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Configure axios with auth token for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Mark auth as initialized after first render
  useEffect(() => {
    setAuthInitialized(true);
  }, []);

  // Fetch meals when date changes or auth state changes
  useEffect(() => {
    if (isAuthenticated && getUserId(user)) {
      fetchMealsForDate(selectedDate);
    }
  }, [selectedDate, isAuthenticated, user]);

  const fetchMealsForDate = async (date: string) => {
    if (!isAuthenticated || !getUserId(user)) return;

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
      } else {
        console.error("Unexpected response format:", response.data);
        showNotification(
          "Received unexpected data format from server",
          "error",
        );
      }
    } catch (err: any) {
      console.error("Error fetching meals:", err);
      showNotification(
        `Failed to load meals: ${err.message || "Unknown error"}`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  // Only show the not-logged-in message if we're sure auth has initialized
  if (!isAuthenticated && authInitialized) {
    return (
      <Box sx={{ maxWidth: 700, margin: "auto", mt: 4 }}>
        <Alert severity="info">Please log in to view your meals.</Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ maxWidth: 700, margin: "auto", mt: 4, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        <CalendarTodayIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        View Meals by Date
      </Typography>

      <TextField
        type="date"
        label="Select Date"
        value={selectedDate}
        onChange={handleDateChange}
        variant="outlined"
        fullWidth
        required
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : meals.length > 0 ? (
        <Stack spacing={2}>
          {meals
            .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
            .map((meal) => (
              <Card key={meal._id} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {meal.name} (
                    {`${String(meal.hour).padStart(2, "0")}:${String(meal.minute).padStart(2, "0")}`}
                    )
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", mt: 1 }}
                  >
                    {meal.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </Stack>
      ) : (
        <Alert severity="info" sx={{ my: 2 }}>
          No meals found for this date. Use the Meal Entry Form to add meals.
        </Alert>
      )}

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

// ===================
// MealEntryForm Component
// ===================
export const MealEntryForm: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [meals, setMeals] = useState<MealData[]>([]);

  // --- Meal Dialog State ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState<number | null>(null);
  const MAX_MEALS = 6; // Changed from 8 to 6 as requested

  // Mark auth as initialized after first render
  useEffect(() => {
    setAuthInitialized(true);
  }, []);

  // Configure axios with auth token for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Fetch meals when date changes or auth state changes
  useEffect(() => {
    if (isAuthenticated && getUserId(user)) {
      fetchMealsForDate(selectedDate);
    }
  }, [selectedDate, isAuthenticated, user]);

  const fetchMealsForDate = async (date: string) => {
    if (!isAuthenticated || !getUserId(user)) return;

    setLoading(true);
    try {
      const userId = getUserId(user);
      const response = await axios.get(
        `${API_BASE_URL}/meals/user/${userId}/date/${date}`,
      );

      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          const formattedMeals = response.data.map((meal: any) => ({
            _id: meal._id,
            name: meal.name,
            hour: meal.hour,
            minute: meal.minute,
            content: meal.content,
            date: meal.date,
          }));
          setMeals(formattedMeals);
        } else {
          // If no meals found for this date, set default meals
          setMeals([
            {
              name: "Breakfast",
              hour: 8,
              minute: 0,
              content: "",
              date: date,
            },
            {
              name: "Lunch",
              hour: 12,
              minute: 30,
              content: "",
              date: date,
            },
            {
              name: "Dinner",
              hour: 18,
              minute: 0,
              content: "",
              date: date,
            },
          ]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching meals:", err);
      showNotification(
        `Failed to load meals: ${err.message || "Unknown error"}`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
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

      // Process each meal (create new ones, update existing ones)
      const savePromises = meals.map(async (meal) => {
        // Make sure each meal has the current date
        const mealData = {
          ...meal,
          date: selectedDate,
        };

        if (meal._id) {
          // Update existing meal
          return axios.put(
            `${API_BASE_URL}/meals/${meal._id}/user/${userId}`,
            mealData,
          );
        } else {
          // Create new meal
          return axios.post(`${API_BASE_URL}/meals/user/${userId}`, mealData);
        }
      });

      await Promise.all(savePromises);
      showNotification("Meals saved successfully!", "success");

      // Refresh the meals from the server
      fetchMealsForDate(selectedDate);
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

  // --- Delete Meal Handler ---
  const handleDeleteMeal = async (index: number) => {
    const meal = meals[index];

    // If the meal exists in the database (has an _id)
    if (meal._id && getUserId(user)) {
      setLoading(true);
      try {
        const userId = getUserId(user);
        await axios.delete(`${API_BASE_URL}/meals/${meal._id}/user/${userId}`);

        // Remove from local state
        const updatedMeals = [...meals];
        updatedMeals.splice(index, 1);
        setMeals(updatedMeals);

        showNotification("Meal deleted successfully", "success");
      } catch (err: any) {
        console.error("Error deleting meal:", err);
        showNotification(
          `Failed to delete meal: ${err.message || "Unknown error"}`,
          "error",
        );
      } finally {
        setLoading(false);
      }
    } else {
      // If it's a new meal that hasn't been saved yet
      if (meals.length > 1) {
        const updatedMeals = [...meals];
        updatedMeals.splice(index, 1);
        setMeals(updatedMeals);
      } else {
        showNotification("At least 1 meal is required", "warning");
      }
    }
  };

  // --- Meal Dialog Handlers ---
  const handleAddMealClick = () => {
    if (meals.length < MAX_MEALS) {
      setCurrentMealIndex(null);
      setDialogOpen(true);
    } else {
      showNotification(`Maximum ${MAX_MEALS} meals are allowed`, "warning");
    }
  };

  const handleEditMealClick = (index: number) => {
    setCurrentMealIndex(index);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentMealIndex(null);
  };

  const handleDialogSave = (mealData: MealData) => {
    // Make sure the meal has the current date
    const mealWithDate = {
      ...mealData,
      date: selectedDate,
    };

    if (currentMealIndex !== null) {
      // Update existing meal
      const updatedMeals = [...meals];
      updatedMeals[currentMealIndex] = mealWithDate;
      setMeals(updatedMeals);
    } else {
      // Add new meal
      setMeals([...meals, mealWithDate]);
    }
    handleDialogClose();
  };

  // --- Meal Dialog Component ---
  const MealDialog = () => {
    // Local state for the meal being edited/added in the dialog
    const [meal, setMeal] = useState<MealData>(() => {
      if (currentMealIndex !== null && meals[currentMealIndex]) {
        return { ...meals[currentMealIndex] };
      }
      return {
        name: "",
        hour: 12,
        minute: 0,
        content: "",
        date: selectedDate,
      };
    });

    const handleTimeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
      const selectedTimeValue = e.target.value as string;
      const [hourStr, minuteStr] = selectedTimeValue.split(":");
      setMeal({
        ...meal,
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
      });
    };

    const isValid =
      meal.name.trim() && meal.content.trim() && meal.content.length >= 5;

    return (
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentMealIndex !== null ? "Edit Meal Details" : "Add New Meal"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Meal Name"
              value={meal.name}
              onChange={(e) => setMeal({ ...meal, name: e.target.value })}
              fullWidth
              required
              autoFocus
              error={meal.name.trim() === ""}
              helperText={
                meal.name.trim() === "" ? "Meal name is required" : ""
              }
            />
            <FormControl fullWidth>
              <InputLabel id="time-select-label">Time</InputLabel>
              <Select
                labelId="time-select-label"
                value={`${meal.hour}:${meal.minute}`}
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
              value={meal.content}
              onChange={(e) => setMeal({ ...meal, content: e.target.value })}
              multiline
              rows={4}
              fullWidth
              required
              error={meal.content.length > 0 && meal.content.length < 5}
              helperText={
                meal.content.length > 0 && meal.content.length < 5
                  ? "Min 5 characters required"
                  : ""
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={() => handleDialogSave(meal)}
            variant="contained"
            disabled={!isValid}
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
    <Paper elevation={2} sx={{ maxWidth: 700, margin: "auto", mt: 4, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        <AddIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Meal Entry Form
      </Typography>

      {/* Date Picker */}
      <TextField
        type="date"
        label="Select Date"
        value={selectedDate}
        onChange={handleDateChange}
        variant="outlined"
        fullWidth
        required
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3 }}
      />

      {/* Loading indicator when fetching meals */}
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
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddMealClick}
              variant="outlined"
              size="small"
              disabled={meals.length >= MAX_MEALS}
            >
              Add Meal
            </Button>
          </Box>

          {/* List of Meals */}
          {meals.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No meals added for this date. Click "Add Meal" to create one.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {meals.map((meal, index) => (
                <Card key={meal._id || index} variant="outlined">
                  <CardContent>
                    <Grid container spacing={1} alignItems="center">
                      {/* Meal Name & Time */}
                      <Grid item xs={12} sm={8}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {meal.name} (
                          {`${String(meal.hour).padStart(2, "0")}:${String(meal.minute).padStart(2, "0")}`}
                          )
                        </Typography>
                      </Grid>
                      {/* Action Buttons */}
                      <Grid
                        item
                        xs={12}
                        sm={4}
                        sx={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <IconButton
                          onClick={() => handleEditMealClick(index)}
                          size="small"
                          color="primary"
                          aria-label="edit meal"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteMeal(index)}
                          size="small"
                          color="error"
                          aria-label="delete meal"
                          disabled={loading || meals.length <= 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                      {/* Meal Content */}
                      <Grid item xs={12}>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap", mt: 1 }}
                        >
                          {meal.content}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSaveMeals}
        variant="contained"
        color="primary"
        disabled={loading || meals.length === 0 || !isAuthenticated}
        fullWidth
        sx={{ mt: 3, py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} /> : "Save Daily Meals"}
      </Button>

      {/* Meal Add/Edit Dialog */}
      <MealDialog />

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

// =====================
// Combined Component Example
// =====================
export const MealPlanner: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1200, margin: "auto", px: 2 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mt: 4, mb: 3, textAlign: "center" }}
      >
        Daily Meal Planner
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <MealEntryForm />
        </Grid>
        <Grid item xs={12} md={6}>
          <MealDatePicker />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MealPlanner;
