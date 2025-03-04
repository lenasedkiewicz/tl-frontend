import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { Alert } from "@mui/material";

interface DietEntry {
  _id?: string;
  username: string;
  userId: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

const DietEntryForm: React.FC = () => {
  const [entries, setEntries] = useState<DietEntry[]>([]);
  const [formData, setFormData] = useState<DietEntry>({
    username: "",
    userId: "",
    date: new Date().toISOString().split("T")[0],
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch entries");
      setLoading(false);
      console.error(err);
    }
  };

  const fetchUserEntries = async (userId: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/user/${userId}`);
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch user entries");
      setLoading(false);
      console.error(err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "userId" && value) {
      fetchUserEntries(value);
    }
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
        ...formData,
        date: new Date().toISOString().split("T")[0],
        content: "",
      });

      fetchUserEntries(formData.userId);
      setLoading(false);
    } catch (err) {
      setError("Failed to save diet entry");
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Typography variant="h1" className="text-2xl font-bold mb-4">
        Diet Tracker
      </Typography>

      <form
        onSubmit={handleSubmit}
        className="mb-8 p-4 bg-gray-100 rounded shadow"
      >
        <TextField
          type="text"
          name="username"
          label="Username"
          value={formData.username}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
          className="mb-4"
        />

        <TextField
          type="text"
          name="userId"
          label="User ID"
          value={formData.userId}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
          className="mb-4"
        />

        <TextField
          type="date"
          name="date"
          label="Date"
          value={formData.date}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
          className="mb-4"
        />

        <TextField
          name="content"
          label="Diet Content"
          value={formData.content}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          placeholder="What did you eat today?"
          required
          className="mb-4"
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          className="mb-4"
        >
          {loading ? "Saving..." : "Save Diet Entry"}
        </Button>

        <Snackbar open={!!error || !!success} autoHideDuration={6000}>
          <Alert severity={error ? "error" : "success"}>
            {error || success}
          </Alert>
        </Snackbar>
      </form>

      <div>
        <Typography variant="h2" className="text-xl font-bold mb-2">
          Diet Entries
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry._id} className="p-4 border rounded shadow">
                <Typography variant="body1" className="font-bold">
                  {entry.username}(ID: {entry.userId})
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {new Date(entry.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body1" className="mt-2">
                  {entry.content}
                </Typography>
              </div>
            ))}
          </div>
        ) : (
          <Typography variant="body1">No entries found.</Typography>
        )}
      </div>
    </div>
  );
};

export default DietEntryForm;
