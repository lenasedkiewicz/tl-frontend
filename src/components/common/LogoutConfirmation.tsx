import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";

interface LogoutConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({
  open,
  onClose,
  onConfirm,
  message,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="logout-confirmation-dialog-title"
      aria-describedby="logout-confirmation-dialog-description"
    >
      <DialogTitle
        id="logout-confirmation-dialog-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <WarningIcon color="warning" />
        Unsaved Changes
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="logout-confirmation-dialog-description">
          {message ||
            "You have unsaved changes that will be lost if you log out. Are you sure you want to continue?"}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          Logout Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutConfirmation;
