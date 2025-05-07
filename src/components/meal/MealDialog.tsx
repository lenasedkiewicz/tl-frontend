import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";

import { MealData } from "../../interfaces/MealInterfaces";
import { formatTime } from "../../components/helperfunctions/TimeHelpers";

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

export const MealDialog = ({ currentMealIndex, meals, selectedDate }) => {
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
        // TO DO: Keep existing name/content/time if editing the same meal index across date changes?
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
            select
            label="Meal Name"
            value={dialogMealState.name}
            onChange={(e) =>
              setDialogMealState({ ...dialogMealState, name: e.target.value })
            }
            fullWidth
            required
            autoFocus
            error={dialogMealState.name.trim() === ""}
            helperText={
              dialogMealState.name.trim() === "" ? "Meal name is required" : ""
            }
          >
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
