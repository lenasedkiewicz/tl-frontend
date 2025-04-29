import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import { AddEditMealsView } from "./AddEditMealsView";
import { FindMealsView } from "./FindMealsView";

// =====================
// Combined Planner Component (unchanged, uses the two views)
// =====================
export const MealPlanner: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1200, margin: "auto", px: 2 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mt: 4, mb: 3, textAlign: "center" }}
      >
        Daily Meal Planner
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AddEditMealsView /> {/* Updated component name */}
        </Grid>
        <Grid item xs={12} md={6}>
          <FindMealsView /> {/* Updated component name */}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MealPlanner;
