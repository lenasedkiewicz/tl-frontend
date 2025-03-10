import { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";

interface DietEntry {
  _id?: string;
  username: string;
  userId: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

function DietEntriesList() {
  const { user } = useAuth();

  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const lastDay = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0),
    );

    // console.log(
    //   firstDay.toISOString().split("T")[0],
    //   lastDay.toISOString().split("T")[0],
    // );

    return {
      startDate: firstDay.toISOString().split("T")[0],
      endDate: lastDay.toISOString().split("T")[0],
    };
  };

  const [entries, setEntries] = useState<DietEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState({
    startDate: getCurrentMonthRange().startDate,
    endDate: getCurrentMonthRange().endDate,
  });

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<DietEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [dateRange, user]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_URL}/user/${user.id}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      console.log("Fetching entries from:", url); // Log the URL

      const response = await axios.get(url);
      console.log("Entries fetched:", response.data); // Log the fetched data

      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch entries");
      setLoading(false);
      console.error("Error fetching entries:", err); // Log the error
    }
  };
  const handleEditClick = (entry: DietEntry) => {
    console.log("Editing entry:", entry); // Log the entry
    setCurrentEntry(entry);
    setEditContent(entry.content);
    setEditDate(entry.date.split("T")[0]);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setCurrentEntry(null);
  };

  const handleEditSave = async () => {
    if (!currentEntry?._id) return;

    console.log("Updating entry with ID:", currentEntry._id); // Log the entry ID
    console.log("Request payload:", { content: editContent, date: editDate }); // Log the payload

    try {
      setLoading(true);

      const response = await axios.put(`${API_URL}/${currentEntry._id}`, {
        content: editContent,
        date: editDate,
      });

      console.log("Entry updated:", response.data); // Log the updated entry

      setEntries((prev) =>
        prev.map((entry) =>
          entry._id === currentEntry._id
            ? { ...response.data, date: response.data.date }
            : entry,
        ),
      );

      setSuccessMessage("Entry updated successfully");
      setEditDialogOpen(false);
      setCurrentEntry(null);
      setLoading(false);
    } catch (err) {
      setError("Failed to update entry");
      setLoading(false);
      console.error("Error updating entry:", err); // Log the error
    }
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 600, margin: "auto", textAlign: "center", mt: 4 }}>
        <Alert severity="info">Please log in to view your diet entries</Alert>
      </Box>
    );
  }

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

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
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
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {new Date(entry.date).toLocaleDateString()}
                </Typography>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleEditClick(entry)}
                >
                  Edit
                </Button>
              </Box>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {entry.content}
              </Typography>
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ textAlign: "center", mt: 4 }}>
          No entries found for this date range.
        </Typography>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Diet Entry</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            autoFocus
            margin="dense"
            label="Content"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DietEntriesList;
