/**
 * AURA Frontend — Root App Component
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { Dashboard } from './pages/Dashboard';
import { TaskDetail } from './pages/TaskDetail';
import { TaskHistory } from './pages/TaskHistory';
import { Tools } from './pages/Tools';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks/:taskId" element={<TaskDetail />} />
              <Route path="/history" element={<TaskHistory />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/login" element={<Login />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};
