import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Clients, ClientDetail } from './pages/Clients';
import { Leads, LeadDetail } from './pages/Leads';
import { Tasks, TaskDetail } from './pages/Tasks';
import Navigation from './components/Navigation';
import ClientFinder from './pages/ClientFinder';
import AIChatbot from './pages/AIChatbot';
import ProposalWriter from './pages/ProposalWriter';
import EmailDrafter from './pages/EmailDrafter';
import ClientPortal from './pages/ClientPortal';
import './styles/Global.css';
import './styles/tailwind.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Navigation />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/client/:token" element={<ClientPortal />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Navigate to="/dashboard" />
                </PrivateRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <Clients />
                </PrivateRoute>
              }
            />

            <Route
              path="/clients/:id"
              element={
                <PrivateRoute>
                  <ClientDetail />
                </PrivateRoute>
              }
            />

            <Route
              path="/leads"
              element={
                <PrivateRoute>
                  <Leads />
                </PrivateRoute>
              }
            />

            <Route
              path="/leads/:id"
              element={
                <PrivateRoute>
                  <LeadDetail />
                </PrivateRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <Tasks />
                </PrivateRoute>
              }
            />

            <Route
              path="/tasks/:id"
              element={
                <PrivateRoute>
                  <TaskDetail />
                </PrivateRoute>
              }
            />

            <Route
              path="/client-finder"
              element={
                <PrivateRoute>
                  <ClientFinder />
                </PrivateRoute>
              }
            />

            <Route
              path="/ai-chat"
              element={
                <PrivateRoute>
                  <AIChatbot />
                </PrivateRoute>
              }
            />

            <Route
              path="/proposal-writer"
              element={
                <PrivateRoute>
                  <ProposalWriter />
                </PrivateRoute>
              }
            />

            <Route
              path="/email-drafter"
              element={
                <PrivateRoute>
                  <EmailDrafter />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
