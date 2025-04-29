import React from "react";
import { Typography, IconButton, Card, CardContent, Grid } from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { MealCardItemProps } from "../../interfaces/MealInterfaces";
import { formatTime } from "../HelperFunctions";

export const MealCardItem: React.FC<MealCardItemProps> = ({
  meal,
  onEdit,
  onDelete,
  loading = false,
}) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={1} alignItems="center">
          {/* Meal Name & Time */}
          <Grid item xs={12} sm={onEdit || onDelete ? 8 : 12}>
            {" "}
            {/* Adjust grid size if actions exist */}
            <Typography variant="subtitle1" fontWeight="medium">
              {meal.name} ({formatTime(meal.hour, meal.minute)})
            </Typography>
          </Grid>
          {/* Action Buttons (only if onEdit or onDelete are provided) */}
          {(onEdit || onDelete) && (
            <Grid
              item
              xs={12}
              sm={4}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              {onEdit && (
                <IconButton
                  onClick={onEdit}
                  size="small"
                  color="primary"
                  aria-label="edit meal"
                  disabled={loading}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  onClick={onDelete}
                  size="small"
                  color="error"
                  aria-label="delete meal"
                  disabled={loading}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Grid>
          )}
          {/* Meal Content */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
              {meal.content || "No content added."}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
