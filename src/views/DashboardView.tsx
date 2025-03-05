import React from "react";
import { useAuth } from "../hooks/useAuth";

export const DashboardView: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white p-6 rounded shadow-md">
        <h1 className="text-3xl mb-4">Dashboard</h1>
        <p>Welcome to the admin dashboard!</p>
        <button
          onClick={logout}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
