import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from './layouts/AdminLayout';

import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import ExecutiveAnalytics from './pages/ExecutiveAnalytics';
import StaffPerformance from './pages/StaffPerformance';
import SearchCenter from './pages/SearchCenter';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import Devices from './pages/Devices';
import DeviceProfile from './pages/DeviceProfile';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Referrals from './pages/Referrals';
import ReferralProfile from './pages/ReferralProfile';
import Compliance from './pages/Compliance';
import FollowUpCenter from './pages/FollowUpCenter';
import FollowUpOutcomes from './pages/FollowUpOutcomes';
import PriorityQueue from './pages/PriorityQueue';
import DailyActionBoard from './pages/DailyActionBoard';
import RecheckScheduler from './pages/RecheckScheduler';
import RecoveryFunnel from './pages/RecoveryFunnel';
import Activity from './pages/Activity';
import Settings from './pages/Settings';

function PageShell({ title, children }) {
  return <AdminLayout title={title}>{children}</AdminLayout>;
}

function ProtectedRoute({ title, children }) {
  const auth = localStorage.getItem('raftop_auth');
  const isAuthenticated = !!auth;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <PageShell title={title}>{children}</PageShell>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute title="Dashboard">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/executive-analytics"
          element={
            <ProtectedRoute title="Executive Analytics">
              <ExecutiveAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff-performance"
          element={
            <ProtectedRoute title="Staff Performance">
              <StaffPerformance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute title="Search Center">
              <SearchCenter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute title="Patients">
              <Patients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients/:patientId"
          element={
            <ProtectedRoute title="Patient Profile">
              <PatientProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/devices"
          element={
            <ProtectedRoute title="Devices">
              <Devices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/devices/:deviceId"
          element={
            <ProtectedRoute title="Device Profile">
              <DeviceProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute title="Tasks">
              <Tasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes"
          element={
            <ProtectedRoute title="Notes">
              <Notes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/referrals"
          element={
            <ProtectedRoute title="Referrals">
              <Referrals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/referrals/:referralId"
          element={
            <ProtectedRoute title="Referral Profile">
              <ReferralProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/compliance"
          element={
            <ProtectedRoute title="80h Compliance">
              <Compliance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/followup"
          element={
            <ProtectedRoute title="Follow-up Center">
              <FollowUpCenter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/followup-outcomes"
          element={
            <ProtectedRoute title="Follow-up Outcomes">
              <FollowUpOutcomes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/priority-queue"
          element={
            <ProtectedRoute title="Priority Queue">
              <PriorityQueue />
            </ProtectedRoute>
          }
        />

        <Route
          path="/daily-board"
          element={
            <ProtectedRoute title="Daily Action Board">
              <DailyActionBoard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recheck-scheduler"
          element={
            <ProtectedRoute title="Recheck Scheduler">
              <RecheckScheduler />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recovery-funnel"
          element={
            <ProtectedRoute title="Recovery Funnel">
              <RecoveryFunnel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <ProtectedRoute title="Activity">
              <Activity />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute title="Settings">
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}