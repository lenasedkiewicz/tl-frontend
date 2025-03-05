import { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";

interface DietEntry {
  _id?: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

function DietEntriesList() {
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: firstDay.toISOString().split("T")[0],
      endDate: lastDay.toISOString().split("T")[0],
    };
  };

  const [entries, setEntries] = useState<DietEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState({
    startDate: getCurrentMonthRange().startDate,
    endDate: getCurrentMonthRange().endDate,
  });

  useEffect(() => {
    fetchEntries();
  }, [dateRange]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_URL}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

      const response = await axios.get(url);
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch entries");
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "auto" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Diet Entries
      </Typography>

      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          type="date"
          label="Start Date"
          value={dateRange.startDate}
          onChange={(e) =>
            setDateRange((prev) => ({
              ...prev,
              startDate: e.target.value,
            }))
          }
          variant="outlined"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={dateRange.endDate}
          onChange={(e) =>
            setDateRange((prev) => ({
              ...prev,
              endDate: e.target.value,
            }))
          }
          variant="outlined"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : entries.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {entries.map((entry) => (
            <Paper key={entry._id} elevation={2} sx={{ p: 2 }}>
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
}

export default DietEntriesList;
