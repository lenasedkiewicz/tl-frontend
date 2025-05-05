import React, { useState, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import ListIcon from "@mui/icons-material/List";
import LogoutIcon from "@mui/icons-material/Logout";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../hooks/useAuth";
import { AddEditMealsView } from "./AddEditMealsView";
import { FindMealsView } from "./FindMealsView";
import LogoutConfirmation from "../components/common/LogoutConfirmation";

// Define global typings for unsaved changes handling
declare global {
  interface Window {
    __hasMealUnsavedChanges?: boolean;
    __checkMealUnsavedChanges?: () => boolean;
    __showMealUnsavedChangesDialog?: (navigateTo: string | null) => boolean;
  }
}

const DRAWER_WIDTH = 240;

export const DashboardView: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current view from URL path
  const getCurrentView = () => {
    const path = location.pathname.split("/").pop() || "";
    if (path === "dashboard" || path === "add-edit-meal") return "meals";
    if (path === "meal-entries") return "entries";
    return path;
  };

  const currentView = getCurrentView();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle navigation between dashboard views
  const handleNavigation = useCallback(
    (path: string) => {
      // Extract view name from path for unsaved changes check
      const targetView = path.split("/").pop() || "";

      // Check if we're leaving the meals view with unsaved changes
      if (
        (currentView === "meals" || currentView === "add-edit-meal") &&
        window.__checkMealUnsavedChanges?.()
      ) {
        // Store the intended destination
        setPendingNavigation(path);

        // Use the global function from the meal component to show its dialog
        const dialogShown = window.__showMealUnsavedChangesDialog?.(path);

        if (dialogShown) {
          // Dialog is shown, navigation will be handled by the meal component
          return;
        }
      }

      // If no unsaved changes or dialog was not shown, navigate immediately
      navigate(path);
      setMobileOpen(false);
    },
    [currentView, navigate],
  );

  // Handle logout attempt
  const handleLogoutAttempt = useCallback(() => {
    // Check if there are unsaved changes in the meals view
    if (
      (currentView === "meals" || currentView === "add-edit-meal") &&
      window.__hasMealUnsavedChanges
    ) {
      setShowLogoutConfirm(true);
    } else {
      // No unsaved changes, logout immediately
      logout();
    }
  }, [currentView, logout]);

  // Callback for when page is left with unsaved changes
  const handleMealPageLeave = useCallback(() => {
    console.log("Meal page was left with unsaved changes");
    // Additional actions can be taken here if needed
  }, []);

  const drawer = (
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { sm: `${DRAWER_WIDTH}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Diet Tracker Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: DRAWER_WIDTH,
              },
            }}
          >
            {drawer}
          </Drawer>
          {/* Desktop Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: DRAWER_WIDTH,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          }}
        >
          <Toolbar />
          <Container maxWidth="lg">
            <Routes>
              <Route
                path="add-edit-meal"
                element={<AddEditMealsView onPageLeave={handleMealPageLeave} />}
              />
              <Route path="meal-entries" element={<FindMealsView />} />
              <Route
                path=""
                element={<AddEditMealsView onPageLeave={handleMealPageLeave} />}
              />
            </Routes>
          </Container>
        </Box>
      </Box>

      {/* Logout confirmation dialog */}
      <LogoutConfirmation
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        message="You have unsaved meal changes. Logging out will discard these changes. Continue?"
      />
    </LocalizationProvider>
  );
};

export default DashboardView;
