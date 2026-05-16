import React from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';

import LoginPage from './pages/LoginPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import PatientRouteGuard from './components/auth/PatientRouteGuard';
import TenantFailDrilldownPage from './pages/TenantFailDrilldownPage';
import TenantLayout from './layouts/TenantLayout';
import PatientLayout from './layouts/patient/PatientLayout';
import TenantLiveVerificationPage from './pages/TenantLiveVerificationPage';
import TenantDashboardPage from './pages/TenantDashboardPage';
import TenantTasksPage from './pages/TenantTasksPage';
import TenantPatientSignalsPage from './pages/TenantPatientSignalsPage';
import TenantPatientCoachingPage from './pages/TenantPatientCoachingPage';
import TenantPatientReportsPage from './pages/TenantPatientReportsPage';
import TenantImportCenterPage from './pages/TenantImportCenterPage';
import TenantImportHistoryPage from './pages/TenantImportHistoryPage';
import TenantAtlasActionCenterPage from './pages/TenantAtlasActionCenterPage';
import TenantPatientOrchestratorPage from './pages/TenantPatientOrchestratorPage';
import TenantPatientTaskBoardPage from './pages/TenantPatientTaskBoardPage';
import TenantProductionAuditPage from './pages/TenantProductionAuditPage';
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import PatientTherapyPage from './pages/patient/PatientTherapyPage';
import PatientNightlyAnalysisPage from './pages/patient/PatientNightlyAnalysisPage';
import PatientNightComparePage from './pages/patient/PatientNightComparePage';
import PatientHealthOverlayPage from './pages/patient/PatientHealthOverlayPage';
import PatientCoachingPage from './pages/patient/PatientCoachingPage';
import PatientReportsPage from './pages/patient/PatientReportsPage';
import PatientDataSyncPage from './pages/patient/PatientDataSyncPage';
import PatientActionCenterPage from './pages/patient/PatientActionCenterPage';
import PatientInsightsPage from './pages/patient/PatientInsightsPage';
import PatientGoalsPage from './pages/patient/PatientGoalsPage';
import PatientMessagesPage from './pages/patient/PatientMessagesPage';
import PatientNotificationsPage from './pages/patient/PatientNotificationsPage';

function PlaceholderPage({ title, description }) {
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 14px 40px rgba(15,23,42,0.08)'
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#101828',
            marginBottom: 10
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: '#475467',
            lineHeight: 1.7
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function TenantShell() {
  return (
    <ProtectedRoute>
      <TenantProvider>
        <TenantLayout>
          <Outlet />
        </TenantLayout>
      </TenantProvider>
    </ProtectedRoute>
  );
}

function PatientShell() {
  return (
    <PatientRouteGuard>
      <PatientLayout>
        <Outlet />
      </PatientLayout>
    </PatientRouteGuard>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/tenant" element={<TenantShell />}>
          <Route index element={<TenantDashboardPage />} />
          <Route path="dashboard" element={<TenantDashboardPage />} />

          <Route path="tasks" element={<TenantTasksPage />} />
          <Route path="patient-signals" element={<TenantPatientSignalsPage />} />
          <Route path="patient-coaching" element={<TenantPatientCoachingPage />} />
          <Route path="patient-reports" element={<TenantPatientReportsPage />} />
          <Route path="reports/patient/:patientRef" element={<TenantPatientReportsPage />} />
          <Route path="fail-drilldown" element={<TenantFailDrilldownPage />} />
          <Route path="import-center" element={<TenantImportCenterPage />} />
          <Route path="import-history" element={<TenantImportHistoryPage />} />
          <Route path="atlas/action-center" element={<TenantAtlasActionCenterPage />} />
          <Route path="patient-orchestrator/:patientRef" element={<TenantPatientOrchestratorPage />} />
          <Route path="live-verification" element={<TenantLiveVerificationPage />} />
          <Route path="patient-tasks/:patientRef" element={<TenantPatientTaskBoardPage />} />
          <Route path="production-audit" element={<TenantProductionAuditPage />} />
          <Route
            path="patients"
            element={
              <PlaceholderPage
                title="Patients"
                description="Patients page route is active. Replace this placeholder with the full Patients page if needed."
              />
            }
          />
          <Route
            path="devices"
            element={
              <PlaceholderPage
                title="Devices"
                description="Devices page route is active. Replace this placeholder with the full Devices page if needed."
              />
            }
          />
          <Route
            path="compliance"
            element={
              <PlaceholderPage
                title="Compliance"
                description="Compliance page route is active. Replace this placeholder with the full Compliance page if needed."
              />
            }
          />
          <Route
            path="followup"
            element={
              <PlaceholderPage
                title="Follow-up Center"
                description="Follow-up Center route is active. Replace this placeholder with the full Follow-up page if needed."
              />
            }
          />
          <Route
            path="notes"
            element={
              <PlaceholderPage
                title="Notes"
                description="Notes page route is active. Replace this placeholder with the full Notes page if needed."
              />
            }
          />
          <Route
            path="referrals"
            element={
              <PlaceholderPage
                title="Referrals"
                description="Referrals page route is active. Replace this placeholder with the full Referrals page if needed."
              />
            }
          />
          <Route
            path="notifications"
            element={
              <PlaceholderPage
                title="Notifications"
                description="Notifications page route is active. Replace this placeholder with the full Notifications page if needed."
              />
            }
          />
          <Route
            path="patient-messages"
            element={
              <PlaceholderPage
                title="Patient Inbox"
                description="Patient Inbox route is active. Replace this placeholder with the full Patient Inbox page if needed."
              />
            }
          />
          <Route
            path="atlas/summary"
            element={
              <PlaceholderPage
                title="ATLAS Summary"
                description="ATLAS Summary route is active. Replace this placeholder with the full ATLAS Summary page if needed."
              />
            }
          />
          <Route
            path="atlas/queue"
            element={
              <PlaceholderPage
                title="ATLAS Queue"
                description="ATLAS Queue route is active. Replace this placeholder with the full ATLAS Queue page if needed."
              />
            }
          />
          <Route
            path="atlas/daily"
            element={
              <PlaceholderPage
                title="ATLAS Daily Board"
                description="ATLAS Daily Board route is active. Replace this placeholder with the full ATLAS Daily Board page if needed."
              />
            }
          />
          <Route
            path="atlas/tasks"
            element={
              <PlaceholderPage
                title="ATLAS Tasks"
                description="ATLAS Tasks route is active. Replace this placeholder with the full ATLAS Tasks page if needed."
              />
            }
          />
          <Route
            path="atlas/alerts"
            element={
              <PlaceholderPage
                title="ATLAS Alerts"
                description="ATLAS Alerts route is active. Replace this placeholder with the full ATLAS Alerts page if needed."
              />
            }
          />
          <Route
            path="atlas/auto-actions"
            element={
              <PlaceholderPage
                title="ATLAS Auto Actions"
                description="ATLAS Auto Actions route is active. Replace this placeholder with the full ATLAS Auto Actions page if needed."
              />
            }
          />
          <Route
            path="predictive-ai"
            element={
              <PlaceholderPage
                title="Predictive AI"
                description="Predictive AI route is active. Replace this placeholder with the full Predictive AI page if needed."
              />
            }
          />
          <Route
            path="doctor-billing"
            element={
              <PlaceholderPage
                title="Doctor Billing"
                description="Doctor Billing route is active. Replace this placeholder with the full Doctor Billing page if needed."
              />
            }
          />
          <Route
            path="revenue"
            element={
              <PlaceholderPage
                title="Revenue"
                description="Revenue route is active. Replace this placeholder with the full Revenue page if needed."
              />
            }
          />
          <Route
            path="payments/checkout"
            element={
              <PlaceholderPage
                title="Payments Checkout"
                description="Payments Checkout route is active. Replace this placeholder with the full Payments Checkout page if needed."
              />
            }
          />
          <Route
            path="payments/admin"
            element={
              <PlaceholderPage
                title="Payments Admin"
                description="Payments Admin route is active. Replace this placeholder with the full Payments Admin page if needed."
              />
            }
          />
          <Route
            path="users"
            element={
              <PlaceholderPage
                title="Users"
                description="Users route is active. Replace this placeholder with the full Users page if needed."
              />
            }
          />
          <Route
            path="modules"
            element={
              <PlaceholderPage
                title="Modules"
                description="Modules route is active. Replace this placeholder with the full Modules page if needed."
              />
            }
          />
          <Route
            path="integrations"
            element={
              <PlaceholderPage
                title="Integrations"
                description="Integrations route is active. Replace this placeholder with the full Integrations page if needed."
              />
            }
          />
          <Route
            path="branding"
            element={
              <PlaceholderPage
                title="Branding"
                description="Branding route is active. Replace this placeholder with the full Branding page if needed."
              />
            }
          />
          <Route
            path="system-status"
            element={
              <PlaceholderPage
                title="System Status"
                description="System Status route is active. Replace this placeholder with the full System Status page if needed."
              />
            }
          />
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Tenant Page Not Found"
                description="The tenant route you opened is not mapped yet in App.js."
              />
            }
          />
        </Route>

        <Route path="/patient" element={<PatientShell />}>
          <Route index element={<PatientDashboardPage />} />
          <Route path="dashboard" element={<PatientDashboardPage />} />
          <Route path="therapy" element={<PatientTherapyPage />} />
          <Route path="nightly-analysis" element={<PatientNightlyAnalysisPage />} />
          <Route path="compare-nights" element={<PatientNightComparePage />} />
          <Route path="health-overlay" element={<PatientHealthOverlayPage />} />
          <Route path="coaching" element={<PatientCoachingPage />} />
          <Route path="reports" element={<PatientReportsPage />} />
          <Route path="data-sync" element={<PatientDataSyncPage />} />
          <Route path="action-center" element={<PatientActionCenterPage />} />
          <Route path="insights" element={<PatientInsightsPage />} />
          <Route path="goals" element={<PatientGoalsPage />} />
          <Route path="messages" element={<PatientMessagesPage />} />
          <Route path="notifications" element={<PatientNotificationsPage />} />
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Patient Page Not Found"
                description="The patient route you opened is not mapped yet in App.js."
              />
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <PlaceholderPage
              title="Page Not Found"
              description="This route does not exist yet."
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}