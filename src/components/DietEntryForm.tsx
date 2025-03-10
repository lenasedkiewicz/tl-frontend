import React from "react";
import { TextField, Button, Snackbar, Box, Typography } from "@mui/material";
import { Alert } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useNotification } from "../hooks/useNotification";

interface DietEntry {
  username: string;
  userId: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

const validationSchema = yup.object({
  username: yup.string(),
  userId: yup.string(),
  date: yup.string().required("Date is required"),
  content: yup
    .string()
    .required("Diet content is required")
    .min(5, "Please provide at least 5 characters")
    .max(1000, "Content should not exceed 1000 characters"),
});

function DietEntryForm() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const { notification, showNotification, hideNotification } =
    useNotification();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DietEntry>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      username: user?.username || "",
      userId: user?.id || "",
      date: new Date().toISOString().split("T")[0],
      content: "",
    },
  });

  // Handler for form submission
  const onSubmit = async (data: DietEntry) => {
    // Ensure user data is updated
    const updatedData = {
      ...data,
      username: user?.username || "",
      userId: user?.id || "",
    };

    setLoading(true);
    try {
      await axios.post(API_URL, updatedData);

      // Show success notification
      showNotification("Diet entry saved successfully!", "success");

      // Reset form to initial values
      reset({
        username: user?.username || "",
        userId: user?.id || "",
        date: new Date().toISOString().split("T")[0],
        content: "",
      });
    } catch (err) {
      // Show error notification
      showNotification("Failed to save diet entry", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 500, margin: "auto", mt: 4 }}>
        <Alert severity="info">Please log in to add diet entries</Alert>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 500,
        margin: "auto",
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Add Diet Entry
      </Typography>

      {/* Date field with Controller */}
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
          />
        )}
      />

      {/* Content field with Controller */}
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Diet Content"
            variant="outlined"
            multiline
            rows={4}
            placeholder="What did you eat today?"
            required
            fullWidth
            error={!!errors.content}
            helperText={errors.content?.message}
          />
        )}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        fullWidth
      >
        {loading ? "Saving..." : "Save Diet Entry"}
      </Button>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={hideNotification}
      >
        <Alert severity={notification.type} onClose={hideNotification}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DietEntryForm;
