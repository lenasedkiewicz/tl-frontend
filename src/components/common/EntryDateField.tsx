import React from "react";
import { TextField } from "@mui/material";
import { Controller, Control, FieldErrors } from "react-hook-form";

interface EntryDateFieldProps {
  control: Control<any>;
  errors: FieldErrors;
  name?: string;
  label?: string;
}

const EntryDateField: React.FC<EntryDateFieldProps> = ({
  control,
  errors,
  name = "date",
  label = "Date for Entry",
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          type="date"
          label={label}
          variant="outlined"
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          error={!!errors[name]}
          helperText={errors[name]?.message as string}
          sx={{ mb: 3 }}
        />
      )}
    />
  );
};

export default EntryDateField;
