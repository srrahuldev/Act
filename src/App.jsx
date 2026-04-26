import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import NewEntry from './pages/NewEntry';
import Statements from './pages/Statements';
import Reports from './pages/Reports';
import CalendarView from './pages/CalendarView';
import Settings from './pages/Settings';
import EmiDashboard from './pages/EmiDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';



import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { currentUser } = useAuth();

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!currentUser ? <ForgotPassword /> : <Navigate to="/" replace />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="new-entry" element={<NewEntry />} />
          <Route path="statements" element={<Statements />} />
          <Route path="reports" element={<Reports />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="settings" element={<Settings />} />
          <Route path="emi-dashboard" element={<EmiDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
