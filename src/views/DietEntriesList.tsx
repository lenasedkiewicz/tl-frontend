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
  Stack,
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

const DietEntriesList = () => {
  const { user } = useAuth();

  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1),
    );
    const lastDayOfMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0),
    );
    const startDate = firstDayOfMonth.toISOString().split("T")[0];
    const endDate = lastDayOfMonth.toISOString().split("T")[0];

    console.info(startDate, endDate);

    return {
      startDate,
      endDate,
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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<DietEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DietEntry | null>(null);

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

      const response = await axios.get(url);

      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch entries");
      setLoading(false);
      console.error("Error fetching entries:", err);
    }
  };

  const handleEditClick = (entry: DietEntry) => {
    console.info("Editing entry:", entry);
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

    console.info("Updating entry with ID:", currentEntry._id);
    console.info("Request payload:", { content: editContent, date: editDate });

    try {
      setLoading(true);

      const response = await axios.put(`${API_URL}/${currentEntry._id}`, {
        content: editContent,
        date: editDate,
      });

      console.info("Entry updated:", response.data);

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
      console.error("Error updating entry:", err);
    }
  };

  const handleDeleteClick = (entry: DietEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete?._id) return;

    try {
      setLoading(true);
      console.info("Deleting entry with ID:", entryToDelete._id);

      await axios.delete(`${API_URL}/${entryToDelete._id}`);

      setEntries((prev) =>
        prev.filter((entry) => entry._id !== entryToDelete._id),
      );

      setSuccessMessage("Entry deleted successfully");
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      setLoading(false);
    } catch (err) {
      setError("Failed to delete entry");
      setLoading(false);
      console.error("Error deleting entry:", err);
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
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleEditClick(entry)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(entry)}
                  >
                    Delete
                  </Button>
                </Stack>
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

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Delete Diet Entry</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this entry? This action cannot be
            undone.
          </Typography>
          {entryToDelete && (
            <Box
              sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {new Date(entryToDelete.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {entryToDelete.content}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DietEntriesList;
