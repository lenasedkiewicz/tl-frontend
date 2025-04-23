import React, { useState } from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Paper,
  Box,
  Container,
  Typography,
  Alert,
  Link,
  Grid,
  CircularProgress,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const defaultTheme = createTheme();

// Optional: Define interfaces for expected API responses for better type safety
// interface ApiError {
//   message: string;
// }
// interface LoginResponse {
//    token: string;
//    // other user data
// }
// interface SignUpResponse {
//    message: string;
//    // other data
// }

export const AuthView: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearForm = (): void => {
    setUsername("");
    setPassword("");
    setEmail("");
    setName("");
    setError(null);
    setSuccessMessage(null);
  };

  const handleToggleView = (): void => {
    setIsLoginView(!isLoginView);
    clearForm();
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic validation (added check for signup fields only when !isLoginView)
    if (!username || !password || (!isLoginView && (!email || !name))) {
      setError("Please fill in all required fields.");
      setLoading(false); // Stop loading if validation fails early
      return;
    }

    setLoading(true); // Start loading only after basic validation passes

    let endpoint: string = "";
    let payload: object = {};

    const backendBaseUrl = "http://localhost:5000"; // Or read from environment variables

    if (isLoginView) {
      endpoint = `${backendBaseUrl}/auth/login`;
      payload = { username, password };
    } else {
      endpoint = `${backendBaseUrl}/auth/signup`;
      payload = { username, email, password, name };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Use 'any' for data type initially if response structure is unknown or varies.
      // For better type safety, define interfaces (like commented out above) and use them:
      // const data: LoginResponse | SignUpResponse | ApiError = await response.json();
      const data: any = await response.json();

      if (!response.ok) {
        // Use message from backend response if available, otherwise use default
        throw new Error(
          data.message || `Request failed with status ${response.status}`,
        );
      }

      // --- Success ---
      if (isLoginView) {
        console.log("Login successful:", data);
        // TODO: Handle successful login securely:
        // 1. Store the authentication token (e.g., data.token) securely.
        // 2. Update global auth state (Context API / Zustand / Redux etc.).
        alert("Login successful! Redirecting..."); // Placeholder
        navigate("/dashboard");
      } else {
        console.log("Sign up successful:", data);
        setSuccessMessage("Registration successful! Please Sign In.");
        setIsLoginView(true); // Switch to login view
        clearForm(); // Clear form fields for login
      }
    } catch (err: unknown) {
      // Catch error as 'unknown' for type safety
      console.error(`${isLoginView ? "Login" : "Sign Up"} error:`, err);
      // Type guard to safely access error message
      let errorMessage = `An unexpected error occurred during ${isLoginView ? "login" : "sign up"}.`;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Type for MUI TextField onChange event
  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setter(e.target.value);
    };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minHeight: "80vh", // Adjusted from original example
            justifyContent: "center",
          }}
        >
          <Paper
            elevation={6}
            sx={{
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              {isLoginView ? <LockOutlinedIcon /> : <LockOpenIcon />}
            </Avatar>
            <Typography component="h1" variant="h5">
              {isLoginView ? "Sign In" : "Sign Up"}
            </Typography>
            {error && (
              <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                {error}
              </Alert>
            )}
            {successMessage && (
              <Alert severity="success" sx={{ width: "100%", mt: 2 }}>
                {successMessage}
              </Alert>
            )}
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ mt: 1, width: "100%" }}
            >
              {/* Name Field (Sign Up only) */}
              {!isLoginView && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={handleInputChange(setName)} // Use handler function
                  disabled={loading}
                />
              )}

              {/* Username Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus // Consider making this conditional?
                value={username}
                onChange={handleInputChange(setUsername)} // Use handler function
                disabled={loading}
              />

              {/* Email Field (Sign Up only) */}
              {!isLoginView && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleInputChange(setEmail)} // Use handler function
                  disabled={loading}
                />
              )}

              {/* Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete={isLoginView ? "current-password" : "new-password"}
                value={password}
                onChange={handleInputChange(setPassword)} // Use handler function
                disabled={loading}
              />

              {/* Optional: Add Confirm Password field here if needed */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isLoginView ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  {/* Explicitly type the onClick handler for the Link */}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleToggleView}
                    disabled={loading}
                    type="button"
                  >
                    {isLoginView
                      ? "Don't have an account? Sign Up"
                      : "Already have an account? Sign In"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default AuthView; // Export the refactored component
