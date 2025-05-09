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
import {
  formatTime,
  generateTimeOptions,
} from "../../components/helperfunctions/TimeHelpers";

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

interface MealDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (mealData: MealData) => void;
  meal?: MealData;
  selectedDate: string;
  loading?: boolean;
}

const getDefaultMeal = (date: string): MealData => ({
  name: "",
  hour: 12,
  minute: 0,
  content: "",
  date: date,
});

export const MealDialog: React.FC<MealDialogProps> = ({
  open,
  onClose,
  onSave,
  meal,
  selectedDate,
  loading = false,
}) => {
  const [dialogMealState, setDialogMealState] = useState<MealData>(
    getDefaultMeal(selectedDate),
  );

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (open) {
      if (meal) {
        setDialogMealState({ ...meal, date: selectedDate });
      } else {
        setDialogMealState(getDefaultMeal(selectedDate));
      }
    }
  }, [meal, selectedDate, open]);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>,
  ) => {
    const { name, value } = e.target;
    setDialogMealState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleTimeChange = (e: SelectChangeEvent<string>) => {
    const selectedTimeValue = e.target.value;
    const [hourStr, minuteStr] = selectedTimeValue.split(":");
    setDialogMealState((prevState) => ({
      ...prevState,
      hour: parseInt(hourStr, 10),
      minute: parseInt(minuteStr, 10),
    }));
  };

  const handleInternalSave = () => {
    onSave({ ...dialogMealState, date: selectedDate });
  };

  const isMealNameValid = dialogMealState.name.trim() !== "";
  const isMealContentValid = dialogMealState.content.trim().length >= 5;
  const isValid = isMealNameValid && isMealContentValid;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {meal?._id || (meal && meal.name)
          ? "Edit Meal Details"
          : "Add New Meal"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Meal Name"
            name="name"
            value={dialogMealState.name}
            onChange={handleInputChange}
            fullWidth
            required
            autoFocus
            error={!isMealNameValid && dialogMealState.name !== ""}
            helperText={
              !isMealNameValid && dialogMealState.name !== ""
                ? "Meal name is required"
                : ""
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
            name="content"
            value={dialogMealState.content}
            onChange={handleInputChange}
            multiline
            rows={4}
            fullWidth
            required
            error={!isMealContentValid && dialogMealState.content.trim() !== ""}
            helperText={
              !isMealContentValid && dialogMealState.content.trim() !== ""
                ? "Content must be at least 5 characters."
                : dialogMealState.content.trim() === "" &&
                    dialogMealState.content !== ""
                  ? "Content is required."
                  : ""
            }
          />
          <Typography variant="caption" color="text.secondary">
            Meal date: {selectedDate}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleInternalSave}
          variant="contained"
          disabled={!isValid || loading}
        >
          {meal?._id || (meal && meal.name) ? "Update Meal" : "Add Meal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
