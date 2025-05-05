import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ListIcon from "@mui/icons-material/List";
import LogoutIcon from "@mui/icons-material/Logout";
import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const MenuDrawer: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentView = () => {
    const path = location.pathname.split("/").pop() || "";
    if (path === "dashboard" || path === "add-edit-meal") return "meals";
    if (path === "meal-entries") return "entries";
    return path;
  };

  const currentView = getCurrentView();

  const handleNavigation = useCallback(
    (path: string) => {
      // const targetView = path.split("/").pop() || "";
      if (
        (currentView === "meals" || currentView === "add-edit-meal") &&
        window.__checkMealUnsavedChanges?.()
      ) {
        setPendingNavigation(path);

        const dialogShown = window.__showMealUnsavedChangesDialog?.(path);

        if (dialogShown) {
          return;
        }
      }

      navigate(path);
      setMobileOpen(false);
    },
    [currentView, navigate],
  );

  const handleLogoutAttempt = useCallback(() => {
    if (
      (currentView === "meals" || currentView === "add-edit-meal") &&
      window.__hasMealUnsavedChanges
    ) {
      setShowLogoutConfirm(true);
    } else {
      logout();
    }
  }, [currentView, logout]);

  return (
    <List>
      <ListItem
        onClick={() => handleNavigation("/dashboard/add-edit-meal")}
        sx={{
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText primary="Add / Edit Meal" />
      </ListItem>
      <ListItem
        onClick={() => handleNavigation("/dashboard/meal-entries")}
        sx={{
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        <ListItemIcon>
          <ListIcon />
        </ListItemIcon>
        <ListItemText primary="My Diet Entries" />
      </ListItem>
      <ListItem
        onClick={handleLogoutAttempt}
        sx={{
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>
    </List>
  );
};
