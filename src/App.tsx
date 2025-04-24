// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AuthView } from "./views/AuthView";
import { DashboardView } from "./views/DashboardView";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthView />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardView />
              </ProtectedRoute>
            }
          />
          {/* Redirect root to login if not logged in */}
          <Route path="/" element={<AuthView />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
