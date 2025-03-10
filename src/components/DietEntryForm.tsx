import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Snackbar, Box, Typography } from "@mui/material";
import { Alert } from "@mui/material";
import { useAuth } from "../hooks/useAuth";

interface DietEntry {
  username: string;
  userId: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

function DietEntryForm() {
  const { user } = useAuth();

  const [formData, setFormData] = useState<DietEntry>({
    username: user?.username || "",
    userId: user?.id || "",
    date: new Date().toISOString().split("T")[0],
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedFormData = {
      ...formData,
      username: user?.username || "",
      userId: user?.id || "",
    };

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await axios.post(API_URL, updatedFormData);

      setSuccess("Diet entry saved successfully!");
      setFormData({
        username: user?.username || "",
        userId: user?.id || "",
        date: new Date().toISOString().split("T")[0],
        content: "",
      });

      setLoading(false);
    } catch (err) {
      setError("Failed to save diet entry");
      setLoading(false);
      console.error(err);
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
      onSubmit={handleSubmit}
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

      {/* Removed the username and userId fields from the UI */}

      <TextField
        type="date"
        name="date"
        label="Date"
        value={formData.date}
        onChange={handleChange}
        variant="outlined"
        required
        fullWidth
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        name="content"
        label="Diet Content"
        value={formData.content}
        onChange={handleChange}
        variant="outlined"
        multiline
        rows={4}
        placeholder="What did you eat today?"
        required
        fullWidth
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

      {(error || success) && (
        <Snackbar
          open={!!error || !!success}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          onClose={() => {
            setError("");
            setSuccess("");
          }}
        >
          <Alert
            severity={error ? "error" : "success"}
            onClose={() => {
              setError("");
              setSuccess("");
            }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}

export default DietEntryForm;
