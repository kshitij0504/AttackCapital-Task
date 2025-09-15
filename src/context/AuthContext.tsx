"use client";

import React, { createContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string,
    apiKey: string
  ) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  apiKey: string;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  loading: false,
  apiKey: "",
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    async function verifySession() {
      try {
        const resp = await fetch("/api/auth/verify");
        console.log("Verification response:", resp);
        console.log(resp.ok);
        if (resp.ok) setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    verifySession();
  }, []);

  const login = async (
    username: string,
    password: string,
    apiKeyInput: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, apiKey: apiKeyInput }),
      });

      if (!res.ok) {
        setLoading(false);
        return false;
      }

      // Save API key in memory state only
      setApiKey(apiKeyInput);
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch {
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setApiKey("");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, loading, apiKey }}
    >
      {children}
    </AuthContext.Provider>
  );
};
