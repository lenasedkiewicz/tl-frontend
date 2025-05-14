import React, { useState, useEffect } from "react";
import {
  Snackbar,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Paper,
  Alert as MuiAlert,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { useNotification } from "../hooks/useNotification";
import { MealData } from "../interfaces/MealInterfaces";
import { sortMealsByTime } from "../components/helperfunctions/MealHelpers";
import { formatISO } from "date-fns";
import { CalendarDatePicker } from "../components/common/CalendarDatePicker";
import { MealCardItem } from "../components/meal/MealCardItem";
import { getUserId } from "../components/helperfunctions/AuthHelpers";

const API_BASE_URL = "http://localhost:5000";

export const FindMealsView: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const { notifications, showNotification, hideNotification } =
    useNotification();
  const [currentNotification, setCurrentNotification] = useState<
    (typeof notifications)[0] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    formatISO(new Date(), { representation: "date" }),
  );
  const [meals, setMeals] = useState<MealData[]>([]);
  const [authInitialized, setAuthInitialized] = useState(false);

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
      setLoading(false);
    }
  }, [selectedDate, isAuthenticated, user, authInitialized]);

  useEffect(() => {
    if (notifications.length > 0) {
      setCurrentNotification(notifications[0]);
    } else {
      setCurrentNotification(null);
    }
  }, [notifications]);

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
      } else {
        console.error("Unexpected response format:", response.data);
        showNotification(
          "Received unexpected data format from server",
          "error",
        );
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
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dateString: string) => {
    setSelectedDate(dateString);
  };
  const handleClose = () => {
    if (currentNotification) {
      hideNotification(currentNotification.id);
    }
  };
  if (!isAuthenticated && authInitialized) {
    return (
      <Box sx={{ maxWidth: 700, margin: "auto", mt: 4 }}>
        <Alert severity="info">Please log in to view your meals.</Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ margin: "auto", mt: 4, p: 3, height: "100%" }}>
      <Typography variant="h5" component="h2" gutterBottom>
        <CalendarTodayIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        View Meals by Date
      </Typography>

      <CalendarDatePicker
        label="Select Date"
        value={selectedDate}
        onChange={handleDateChange}
        required
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : meals.length > 0 ? (
        <Stack spacing={2}>
          {sortMealsByTime(meals).map((meal) => (
            <MealCardItem key={meal._id} meal={meal} />
          ))}
        </Stack>
      ) : (
        <MuiAlert severity="info" sx={{ my: 2 }}>
          No meals found for {selectedDate}.
        </MuiAlert>
      )}
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
