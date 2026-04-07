import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes
} from 'react-router-dom';

import { TenantProvider } from './context/TenantContext';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import TenantLayout from './layouts/TenantLayout';
import LoginPage from './pages/LoginPage';

import TenantDashboardPage from './pages/TenantDashboardPage';
import TenantPatientsPage from './pages/TenantPatientsPage';
import PatientProfilePage from './pages/PatientProfilePage';
import TenantDevicesPage from './pages/TenantDevicesPage';
import DeviceProfilePage from './pages/DeviceProfilePage';
import TenantCompliancePage from './pages/TenantCompliancePage';
import TenantFollowupPage from './pages/TenantFollowupPage';
import TenantTasksPage from './pages/TenantTasksPage';
import TenantNotesPage from './pages/TenantNotesPage';
import TenantReferralsPage from './pages/TenantReferralsPage';
import TenantNotificationsPage from './pages/TenantNotificationsPage';

import TenantAtlasSummaryPage from './pages/TenantAtlasSummaryPage';
import TenantAtlasQueuePage from './pages/TenantAtlasQueuePage';
import TenantAtlasDailyPage from './pages/TenantAtlasDailyPage';
import TenantAtlasTasksPage from './pages/TenantAtlasTasksPage';
import TenantAtlasAlertsPage from './pages/TenantAtlasAlertsPage';
import TenantAtlasAutoActionsPage from './pages/TenantAtlasAutoActionsPage';

import TenantPredictiveAIPage from './pages/TenantPredictiveAIPage';
import TenantDoctorBillingPage from './pages/TenantDoctorBillingPage';
import TenantRevenuePage from './pages/TenantRevenuePage';
import TenantPaymentsCheckoutPage from './pages/TenantPaymentsCheckoutPage';
import TenantPaymentsAdminPage from './pages/TenantPaymentsAdminPage';

import TenantUsersPage from './pages/TenantUsersPage';
import TenantModulesPage from './pages/TenantModulesPage';
import TenantIntegrationsPage from './pages/TenantIntegrationsPage';
import TenantBrandingPage from './pages/TenantBrandingPage';
import TenantSystemStatusPage from './pages/TenantSystemStatusPage';

import { FEATURE_KEYS } from './utils/roleAccess';

function TenantRouteShell() {
  return (
    <ProtectedRoute>
      <TenantLayout>
        <Outlet />
      </TenantLayout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tenant/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/tenant" element={<TenantRouteShell />}>
        <Route index element={<Navigate to="/tenant/dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.dashboard}>
              <TenantDashboardPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="patients"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.patients}>
              <TenantPatientsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="patients/:id"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.patientProfile}>
              <PatientProfilePage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="devices"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.devices}>
              <TenantDevicesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="devices/:id"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.deviceProfile}>
              <DeviceProfilePage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="compliance"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.compliance}>
              <TenantCompliancePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="followup"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.followup}>
              <TenantFollowupPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="tasks"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.tasks}>
              <TenantTasksPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="notes"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.notes}>
              <TenantNotesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="referrals"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.referrals}>
              <TenantReferralsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.notifications}>
              <TenantNotificationsPage />
            </RoleProtectedRoute>
          }
        />

        <Route path="atlas" element={<Navigate to="/tenant/atlas/summary" replace />} />
        <Route
          path="atlas/summary"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.atlasSummary}>
              <TenantAtlasSummaryPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="atlas/queue"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.atlasQueue}>
              <TenantAtlasQueuePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="atlas/daily"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.atlasDaily}>
              <TenantAtlasDailyPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="atlas/tasks"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.atlasTasks}>
              <TenantAtlasTasksPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="atlas/alerts"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.atlasAlerts}>
              <TenantAtlasAlertsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="atlas/auto-actions"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.atlasAutoActions}>
              <TenantAtlasAutoActionsPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="atlas/autoactions" element={<Navigate to="/tenant/atlas/auto-actions" replace />} />

        <Route
          path="predictive-ai"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.predictiveAi}>
              <TenantPredictiveAIPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="doctor-billing"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.doctorBilling}>
              <TenantDoctorBillingPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="revenue"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.revenue}>
              <TenantRevenuePage />
            </RoleProtectedRoute>
          }
        />

        <Route path="payments" element={<Navigate to="/tenant/payments/checkout" replace />} />
        <Route
          path="payments/checkout"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.paymentsCheckout}>
              <TenantPaymentsCheckoutPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="payments/admin"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.paymentsAdmin}>
              <TenantPaymentsAdminPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.users}>
              <TenantUsersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="modules"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.modules}>
              <TenantModulesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="integrations"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.integrations}>
              <TenantIntegrationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="branding"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.branding}>
              <TenantBrandingPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="system-status"
          element={
            <RoleProtectedRoute featureKey={FEATURE_KEYS.systemStatus}>
              <TenantSystemStatusPage />
            </RoleProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <AppRoutes />
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}