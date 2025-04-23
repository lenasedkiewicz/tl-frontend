import React, { useState } from "react";
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
import { useNotification } from "../hooks/useNotification";
import { useNavigate } from "react-router-dom";

interface MealFormData {
  name: string;
  hour: number;
  minute: number;
  content: string;
}

interface DietFormValues {
  date: string;
  meals: MealFormData[];
}

const API_BASE_URL = "http://localhost:5000/meal";

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
    .min(1, "At least 1 meal is required") // Adjusted min requirement
    .max(8, "Maximum 8 meals allowed"), // Adjusted max
});
// --- End Validation Schema ---

const DietEntryForm = () => {
  const { user } = useAuth();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const navigate = useNavigate(); // Hook for navigation
  const [loading, setLoading] = useState(false);

  // --- Meal Dialog State ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState<number | null>(null); // index for editing meal *in form state*
  // --- End Meal Dialog State ---

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }, // Use isDirty to check if form has changes
    setValue, // Keep setValue if needed for dialog interactions
    watch, // Keep watch for displaying meal details
  } = useForm<DietFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0], // Today's date
      meals: [
        // Sensible defaults
        { name: "Breakfast", hour: 8, minute: 0, content: "" },
        { name: "Lunch", hour: 12, minute: 30, content: "" },
        { name: "Dinner", hour: 18, minute: 0, content: "" },
      ],
    },
  });

  // react-hook-form hook for managing the meals array
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "meals",
  });

  // --- Form Submission Logic (Create Only) ---
  const onSubmit = async (formData: DietFormValues) => {
    if (!user?.id) {
      showNotification("User not logged in.", "error");
      return;
    }

    setLoading(true);
    let newEntryId: string | null = null;

    try {
      // 1. Create the basic Entry shell
      const entryPayload = {
        date: formData.date,
        entryType: "DietEntry",
      };
      const entryUrl = `${API_BASE_URL}/${user.id}/entries`;
      const entryResponse = await axios.post<{ _id: string }>(
        entryUrl,
        entryPayload,
        {
          // headers: { Authorization: `Bearer ${user.token}` }
        },
      );
      newEntryId = entryResponse.data._id;

      if (!newEntryId) {
        throw new Error("Failed to create entry shell.");
      }

      // 2. Create each Meal and associate it with the new Entry
      const mealPromises = formData.meals.map((mealData) => {
        const mealUrl = `${API_BASE_URL}/${user.id}/entries/${newEntryId}/meals`;
        const mealPayload = {
          // Send only meal data needed for creation
          name: mealData.name,
          hour: mealData.hour,
          minute: mealData.minute,
          content: mealData.content,
        };
        return axios.post(mealUrl, mealPayload, {
          // headers: { Authorization: `Bearer ${user.token}` }
        });
      });

      // Wait for all meal creation requests to complete
      await Promise.all(mealPromises);

      showNotification("Diet entry and meals saved successfully!", "success");
      reset(); // Reset form after successful submission
      // Optional: Redirect user to the list page or the newly created entry view
      // navigate('/diet-entries'); // Example redirect
    } catch (err: any) {
      console.error("Error saving diet entry:", err);
      let errorMsg = "Failed to save diet entry.";
      if (err.response?.data?.message) {
        errorMsg += ` ${err.response.data.message}`;
      }
      // If entry was created but meals failed, maybe notify user differently?
      showNotification(errorMsg, "error");
      // Consider cleanup logic here if needed (e.g., delete the entry shell if meals failed)
    } finally {
      setLoading(false);
    }
  };
  // --- End Form Submission Logic ---

  // --- Meal Dialog Handlers ---
  const handleAddMealClick = () => {
    if (fields.length < 8) {
      // Use max limit from validation
      setCurrentMealIndex(null); // Indicates adding a new meal
      setDialogOpen(true);
    } else {
      showNotification("Maximum 8 meals are allowed", "warning");
    }
  };

  const handleEditMealClick = (index: number) => {
    setCurrentMealIndex(index); // Set index for editing
    setDialogOpen(true);
  };

  const handleDeleteMealClick = (index: number) => {
    if (fields.length > 1) {
      // Use min limit from validation
      remove(index);
    } else {
      showNotification("At least 1 meal is required", "warning");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentMealIndex(null); // Reset index on close
  };

  const handleDialogSave = (mealData: MealFormData) => {
    if (currentMealIndex !== null) {
      update(currentMealIndex, mealData); // Update meal in form state
    } else {
      append(mealData); // Add new meal to form state
    }
    handleDialogClose();
  };
  // --- End Meal Dialog Handlers ---

  // --- Meal Dialog Component --- (Manages local state for the dialog)
  const MealDialog = () => {
    // Local state for the meal being edited/added in the dialog
    const [meal, setMeal] = useState<MealFormData>(() => {
      if (currentMealIndex !== null && fields[currentMealIndex]) {
        return { ...fields[currentMealIndex] }; // Load data for editing
      }
      return { name: "", hour: 12, minute: 0, content: "" }; // Default for new meal
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

    // Basic validation for the dialog save button
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
            {" "}
            {/* Use Stack for spacing */}
            <TextField
              label="Meal Name"
              value={meal.name}
              onChange={(e) => setMeal({ ...meal, name: e.target.value })}
              fullWidth
              required
              autoFocus // Focus name field first
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

  // Render Logic
  if (!user) {
    return (
      <Box sx={{ maxWidth: 700, margin: "auto", mt: 4 }}>
        <Alert severity="info">Please log in to add a diet entry.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", mt: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Diet Entry {/* Simplified Title */}
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 4 }}>
        {/* Date Field */}
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="date"
              label="Date for Entry"
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

        {/* General Meal Array Errors */}
        {errors.meals &&
          !Array.isArray(errors.meals) &&
          errors.meals.message && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.meals.message} {/* e.g., "At least 1 meal required" */}
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
          <Typography variant="h6">
            Meals ({fields.length}/
            {validationSchema.fields.meals.describe().max})
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddMealClick}
            variant="outlined"
            size="small"
            disabled={
              fields.length >=
              (validationSchema.fields.meals.describe().max ?? 8)
            } // Disable based on max
          >
            Add Meal
          </Button>
        </Box>

        {/* List of Meals */}
        <Stack spacing={2}>
          {" "}
          {/* Use Stack for meal cards */}
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
                      {" "}
                      <EditIcon fontSize="small" />{" "}
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteMealClick(index)}
                      size="small"
                      color="error"
                      aria-label="delete meal"
                      disabled={
                        fields.length <=
                        (validationSchema.fields.meals.describe().min ?? 1)
                      }
                    >
                      {" "}
                      <DeleteIcon fontSize="small" />{" "}
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

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !isDirty} // Disable if loading or form hasn't changed
          fullWidth
          sx={{ mt: 3, py: 1.5 }} // Adjust padding
        >
          {loading ? <CircularProgress size={24} /> : "Save Diet Entry"}
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

export default DietEntryForm;
