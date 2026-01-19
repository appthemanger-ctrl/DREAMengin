// Mock auth hook to bypass backend
import { useState, useEffect } from "react";

export function useAuth() {
  // Always return a mock user
  const user = {
    id: 1,
    username: "dreamer",
    displayName: "DreamEngin Pilot",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    role: "admin"
  };

  return {
    user,
    isLoading: false,
    isAuthenticated: true,
    logout: () => console.log("Logout mocked"),
    isLoggingOut: false,
  };
}
