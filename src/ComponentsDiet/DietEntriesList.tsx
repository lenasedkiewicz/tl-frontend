import React, { useState, useEffect } from "react";
import axios from "axios";
import { Typography, Box, Paper, CircularProgress } from "@mui/material";

interface DietEntries {
  _id?: string;
  username: string;
  userId: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

const DietEntriesList: React.FC = () => {
  const [entries, setEntries] = useState<DietEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetchEntries();
  }, [userId]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const url = userId ? `${API_URL}/user/${userId}` : API_URL;

      const response = await axios.get(url);
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch entries");
      setLoading(false);
      console.error(err);
    }
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(e.target.value);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "auto" }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h6">Filter by User ID:</Typography>
        <input
          type="text"
          value={userId}
          onChange={handleUserIdChange}
          placeholder="Enter User ID"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : entries.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {entries.map((entry) => (
            <Paper key={entry._id} elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {entry.username} (ID: {entry.userId})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(entry.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {entry.content}
              </Typography>
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ textAlign: "center", mt: 4 }}>
          No entries found.
        </Typography>
      )}
    </Box>
  );
};

export default DietEntriesList;
