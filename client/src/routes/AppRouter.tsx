import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { DashboardPage } from "../pages/app/DashboardPage";
import { ProfilePage } from "../pages/app/ProfilePage";
import { UsersPage } from "../pages/admin/UsersPage";
import { ChangePasswordPage } from "../pages/auth/ChangePasswordPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { ProjectsPage } from "../pages/projects/ProjectsPage";
import { ProjectFormPage } from "../pages/projects/ProjectFormPage";
import { ProjectDetailPage } from "../pages/projects/ProjectDetailPage";
import { RequestsPage, RequestFormPage } from "../pages/requests/RequestsPage";
import { AssetsPage } from "../pages/assets/AssetsPage";
import { AssetUploadPage } from "../pages/assets/AssetUploadPage";
import { AssetDetailPage } from "../pages/assets/AssetDetailPage";

const LandingPage = lazy(() => import("../App"));

const placeholder = (title: string, phase: string, description?: string) => <PlaceholderPage title={title} phase={phase} description={description} />;

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <AppShell role={user.role} name={user.name} onLogout={logout}><Routes>
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="admin/users" element={<ProtectedRoute roles={["admin"]}><UsersPage /></ProtectedRoute>} />
    <Route path="admin/requests" element={<ProtectedRoute roles={["admin"]}><RequestsPage admin /></ProtectedRoute>} />
    <Route path="projects" element={<ProjectsPage />} />
    <Route path="projects/new" element={<ProtectedRoute roles={["admin"]}><ProjectFormPage /></ProtectedRoute>} />
    <Route path="projects/:id" element={<ProjectDetailPage />} />
    <Route path="projects/:id/edit" element={<ProtectedRoute roles={["admin"]}><ProjectFormPage /></ProtectedRoute>} />
    <Route path="explore" element={<ProtectedRoute roles={["client"]}><ProjectsPage explore /></ProtectedRoute>} />
    <Route path="requests" element={<ProtectedRoute roles={["client"]}><RequestsPage /></ProtectedRoute>} />
    <Route path="requests/new" element={<ProtectedRoute roles={["client"]}><RequestFormPage /></ProtectedRoute>} />
    <Route path="assets" element={<AssetsPage />} />
    <Route path="assets/upload" element={<ProtectedRoute roles={["admin", "designer"]}><AssetUploadPage /></ProtectedRoute>} />
    <Route path="assets/:id" element={<AssetDetailPage />} />
    <Route path="reviews" element={placeholder("Reviews", "Phase 5")} />
    <Route path="bookmarks" element={placeholder("Bookmarks", "Phase 5")} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AppShell>;
}

export function AppRouter() {
  return <Suspense fallback={<div className="route-loading" role="status">Loading BrandHub…</div>}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/change-password" element={<ChangePasswordPage />} />
    <Route path="/register" element={<Navigate to="/signup" replace />} />
    <Route path="/app/*" element={<ProtectedRoute><AuthenticatedApp /></ProtectedRoute>} />
    <Route path="/home" element={<Navigate to="/" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense>;
}
