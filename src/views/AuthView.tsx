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
import { useAuth } from "../hooks/useAuth"; // Import the auth hook

const defaultTheme = createTheme();

// Define interfaces for expected API responses
interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  // Add other fields that your API returns
}

interface SignUpResponse {
  message: string;
  // Other signup response fields
}

interface ApiError {
  message: string;
}

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
  const { login } = useAuth(); // Get login function from auth context

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

    // Basic validation
    if (!username || !password || (!isLoginView && (!email || !name))) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

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

      const data: LoginResponse | SignUpResponse | ApiError =
        await response.json();

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // --- Success ---
      if (isLoginView) {
        console.log("Login successful:", data);

        // Cast data to LoginResponse to access specific properties
        const loginData = data as LoginResponse;

        console.log("About to call login function with:", loginData.token);

        // Use auth context to store authentication data
        login(loginData.token, {
          id: loginData.userId,
          username: loginData.username,
        });

        console.log("Login function called, now navigating to dashboard");
        navigate("/dashboard");
        console.log("Navigate function called");
      } else {
        console.log("Sign up successful:", data);
        setSuccessMessage("Registration successful! Please Sign In.");
        setIsLoginView(true); // Switch to login view
        clearForm(); // Clear form fields for login
      }
    } catch (err: unknown) {
      console.error(`${isLoginView ? "Login" : "Sign Up"} error:`, err);
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
            minHeight: "80vh",
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
                  onChange={handleInputChange(setName)}
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
                autoFocus
                value={username}
                onChange={handleInputChange(setUsername)}
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
                  onChange={handleInputChange(setEmail)}
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
                onChange={handleInputChange(setPassword)}
                disabled={loading}
              />

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

export default AuthView;
