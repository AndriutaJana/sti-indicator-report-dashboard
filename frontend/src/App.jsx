import React from "react"
import {Routes, Route, Navigate} from "react-router-dom"
import Header from "./components/Header"
import Hero from "./components/Hero"
import Dashboard from "./components/Dashboard"
import Login from "./components/auth/Login"
import { AuthProvider, useAuth } from "./context/AuthContext"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <Hero />
          </>
        } />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  )
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default App