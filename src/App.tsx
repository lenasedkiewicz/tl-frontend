import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  CssBaseline,
} from "@mui/material";
import { Add as AddIcon, List as ListIcon } from "@mui/icons-material";

import DietEntriesForm from "./ComponentsDiet/DietEntriesForm";
import DietEntriesList from "./ComponentsDiet/DietEntriesList";

const drawerWidth = 240;

function App() {
  return (
    <Router>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        {/* Sidebar Navigation */}
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <List>
            <ListItem
              sx={{
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
              onClick={() => (window.location.href = "/add-entry")}
            >
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="Add Diet Entry" />
            </ListItem>

            <ListItem
              sx={{
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
              onClick={() => (window.location.href = "/previous-entries")}
            >
              <ListItemIcon>
                <ListIcon />
              </ListItemIcon>
              <ListItemText primary="Previous Entries" />
            </ListItem>
          </List>
        </Drawer>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            p: 3,
            width: `calc(100% - ${drawerWidth}px)`,
          }}
        >
          <Container maxWidth="lg">
            <Routes>
              <Route path="/add-entry" element={<DietEntriesForm />} />
              <Route path="/previous-entries" element={<DietEntriesList />} />
              <Route path="/" element={<DietEntriesForm />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
