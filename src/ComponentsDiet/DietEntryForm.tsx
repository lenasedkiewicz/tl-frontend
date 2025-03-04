import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Snackbar, Box } from "@mui/material";
import { Alert } from "@mui/material";

interface DietEntry {
  _id?: string;
  username: string;
  userId: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

function DietEntryForm() {
  const [formData, setFormData] = useState<DietEntry>({
    username: "",
    userId: "",
    date: new Date().toISOString().split("T")[0],
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await axios.post(API_URL, formData);

      setSuccess("Diet entry saved successfully!");
      setFormData({
        username: "",
        userId: "",
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
      <TextField
        type="text"
        name="username"
        label="Username"
        value={formData.username}
        onChange={handleChange}
        variant="outlined"
        required
        fullWidth
      />

      <TextField
        type="text"
        name="userId"
        label="User ID"
        value={formData.userId}
        onChange={handleChange}
        variant="outlined"
        required
        fullWidth
      />

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
        >
          <Alert severity={error ? "error" : "success"}>
            {error || success}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}

export default DietEntryForm;
