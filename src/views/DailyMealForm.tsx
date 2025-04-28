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
} from "@mui/material";
import { Alert } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../hooks/useAuth";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Interface for Meal data used in the form
interface MealData {
  _id?: string; // For existing meals
  name: string;
  hour: number;
  minute: number;
  content: string;
  date: string; // Now each meal has its own date
}

// Interface for the main form values
interface DailyMealFormValues {
  date: string;
  meals: MealData[];
}

const API_BASE_URL = "http://localhost:5000/api";

const getUserId = (user: any): string | undefined => {
  // Check for MongoDB style ID (_id) or regular id field
  return user?._id || user?.id;
};

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

// --- Validation Schema ---
const validationSchema = yup.object({
  date: yup.string().required("Date is required"),
  meals: yup
    .array()
    .of(
      yup.object({
        name: yup
          .string()
          .required("Meal name is required")
          .max(100, "Name too long"),
        hour: yup.number().required("Hour required").min(0).max(23),
        minute: yup.number().required("Minute required").oneOf([0, 30]),
        content: yup
          .string()
          .required("Meal content is required")
          .min(5, "Content needs minimum 5 characters")
          .max(1000, "Content max 1000 characters"),
      }),
    )
    .min(1, "At least 1 meal is required")
    .max(8, "Maximum 8 meals allowed"),
});
// --- End Validation Schema ---

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

const DailyMealForm = () => {
  const { isAuthenticated, user, token } = useAuth();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingMeals, setFetchingMeals] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Debug the authentication issue more thoroughly
  console.log("Auth state (full user object):", user);

  // When using the user ID, ensure we're checking both potential formats
  const userId = user?._id || user?.id;

  // --- Meal Dialog State ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState<number | null>(null);
  // --- End Meal Dialog State ---

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<DailyMealFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0], // Today's date
      meals: [
        // Default meals - similar to original form
        {
          name: "Breakfast",
          hour: 8,
          minute: 0,
          content: "",
          date: new Date().toISOString().split("T")[0],
        },
        {
          name: "Lunch",
          hour: 12,
          minute: 30,
          content: "",
          date: new Date().toISOString().split("T")[0],
        },
        {
          name: "Dinner",
          hour: 18,
          minute: 0,
          content: "",
          date: new Date().toISOString().split("T")[0],
        },
      ],
    },
  });

  // react-hook-form hook for managing the meals array
  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: "meals",
  });

  // Mark auth as initialized after first render
  useEffect(() => {
    setAuthInitialized(true);
  }, []);

  // Fetch meals for the selected date whenever date changes or user/auth state changes
  useEffect(() => {
    const selectedDate = watch("date");
    if (isAuthenticated && user?.id) {
      fetchMealsForDate(selectedDate);
    }
  }, [watch("date"), isAuthenticated, user]);

  // Configure axios with auth token for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const fetchMealsForDate = async (date: string) => {
    if (!isAuthenticated || !user?.id) return;

    setFetchingMeals(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/meals/user/${userId}/date/${date}`,
      );
      if (response.data && Array.isArray(response.data)) {
        // Replace the current meals array with fetched meals
        if (response.data.length > 0) {
          const formattedMeals = response.data.map((meal: any) => ({
            _id: meal._id,
            name: meal.name,
            hour: meal.hour,
            minute: meal.minute,
            content: meal.content,
            date: meal.date,
          }));
          replace(formattedMeals);
        } else {
          // If no meals found for this date, keep the form with empty meals array
          // Don't reset to avoid losing the date selection
          replace([]);
        }
      } else {
        // Handle unexpected response format
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
      setFetchingMeals(false);
    }
  };

  // --- Form Submission Logic ---
  const onSubmit = async (formData: DailyMealFormValues) => {
    if (!isAuthenticated || !user?.id) {
      console.error("User ID not available", { isAuthenticated, user });
      showNotification(
        "Cannot save meals: User information not available",
        "error",
      );
      return;
    }

    setLoading(true);
    try {
      // Process each meal (create new ones, update existing ones)
      const savePromises = formData.meals.map(async (meal) => {
        // Each meal gets the selected date
        const mealData = {
          ...meal,
          date: formData.date,
        };

        if (meal._id) {
          // Update existing meal
          return axios.put(
            `${API_BASE_URL}/meals/${meal._id}/user/${user.id}`,
            mealData,
          );
        } else {
          // Create new meal
          return axios.post(`${API_BASE_URL}/meals/user/${user.id}`, mealData);
        }
      });

      await Promise.all(savePromises);
      showNotification("Meals saved successfully!", "success");

      // Refresh the meals from the server
      fetchMealsForDate(formData.date);
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
    const meal = fields[index];

    // If the meal exists in the database (has an _id)
    if (meal._id && user?.id) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/meals/${meal._id}/user/${user.id}`);
        remove(index);
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
      if (fields.length > 1) {
        remove(index);
      } else {
        showNotification("At least 1 meal is required", "warning");
      }
    }
  };

  // --- Meal Dialog Handlers ---
  const handleAddMealClick = () => {
    if (fields.length < 8) {
      setCurrentMealIndex(null);
      setDialogOpen(true);
    } else {
      showNotification("Maximum 8 meals are allowed", "warning");
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
      date: watch("date"),
    };

    if (currentMealIndex !== null) {
      update(currentMealIndex, mealWithDate);
    } else {
      append(mealWithDate);
    }
    handleDialogClose();
  };
  // --- End Meal Dialog Handlers ---

  // --- Meal Dialog Component ---
  const MealDialog = () => {
    // Local state for the meal being edited/added in the dialog
    const [meal, setMeal] = useState<MealData>(() => {
      if (currentMealIndex !== null && fields[currentMealIndex]) {
        return { ...fields[currentMealIndex] };
      }
      return {
        name: "",
        hour: 12,
        minute: 0,
        content: "",
        date: watch("date"),
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
  // --- End Meal Dialog Component ---

  // Debug the authentication issue
  console.log("Auth state:", { isAuthenticated, user, authInitialized });

  // Render Logic
  // Only show the not-logged-in message if we're sure auth has initialized
  if (!isAuthenticated && authInitialized) {
    return (
      <Box sx={{ maxWidth: 700, margin: "auto", mt: 4 }}>
        <Alert severity="info">Please log in to manage your meals.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", mt: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Daily Meals
      </Typography>

      {/* Optional debug section - remove in production */}
      {isAuthenticated && user ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Logged in as: {user?.username} (ID: {getUserId(user)})
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          User data not available. The form may not work correctly.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 4 }}>
        {/* Date Field */}
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="date"
              label="Date"
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              error={!!errors.date}
              helperText={errors.date?.message}
              sx={{ mb: 3 }}
            />
          )}
        />

        {/* Loading indicator when fetching meals */}
        {fetchingMeals && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={30} />
          </Box>
        )}

        {/* General Meal Array Errors */}
        {errors.meals &&
          !Array.isArray(errors.meals) &&
          errors.meals.message && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.meals.message}
            </Alert>
          )}

        {/* Meals Section Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Meals ({fields.length}/8)</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddMealClick}
            variant="outlined"
            size="small"
            disabled={fields.length >= 8}
          >
            Add Meal
          </Button>
        </Box>

        {/* List of Meals */}
        {fields.length === 0 && !fetchingMeals ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No meals added for this date. Click "Add Meal" to create one.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {fields.map((field, index) => (
              <Card key={field.id} variant="outlined">
                <CardContent>
                  <Grid container spacing={1} alignItems="center">
                    {/* Meal Name & Time */}
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {watch(`meals.${index}.name`)} (
                        {`${String(watch(`meals.${index}.hour`)).padStart(2, "0")}:${String(watch(`meals.${index}.minute`)).padStart(2, "0")}`}
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
                        disabled={loading || (fields.length <= 1 && field._id)}
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
                        {watch(`meals.${index}.content`)}
                      </Typography>
                    </Grid>
                    {/* Individual Meal Errors */}
                    {errors.meals?.[index] && (
                      <Grid item xs={12}>
                        <Alert
                          severity="error"
                          sx={{ mt: 1, fontSize: "0.8rem", p: "2px 8px" }}
                        >
                          {Object.values(errors.meals[index] || {}).map(
                            (err: any, i) => (
                              <div key={i}>{err?.message}</div>
                            ),
                          )}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={
            loading ||
            (!isDirty && fields.length > 0) ||
            fetchingMeals ||
            !isAuthenticated
          }
          fullWidth
          sx={{ mt: 3, py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} /> : "Save Daily Meals"}
        </Button>
      </Box>

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
    </Box>
  );
};

export default DailyMealForm;
