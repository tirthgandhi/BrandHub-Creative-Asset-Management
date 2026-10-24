import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../App";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { DashboardPage } from "../pages/app/DashboardPage";
import { ProfilePage } from "../pages/app/ProfilePage";
import { UsersPage } from "../pages/admin/UsersPage";
import { ChangePasswordPage } from "../pages/auth/ChangePasswordPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ProtectedRoute } from "./ProtectedRoute";

const placeholder = (title: string, phase: string, description?: string) => <PlaceholderPage title={title} phase={phase} description={description} />;

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <AppShell role={user.role} name={user.name} onLogout={logout}><Routes>
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="admin/users" element={<ProtectedRoute roles={["admin"]}><UsersPage /></ProtectedRoute>} />
    <Route path="admin/requests" element={<ProtectedRoute roles={["admin"]}>{placeholder("Project requests", "Phase 3")}</ProtectedRoute>} />
    <Route path="projects" element={placeholder("Projects", "Phase 3")} />
    <Route path="projects/new" element={<ProtectedRoute roles={["admin"]}>{placeholder("Create project", "Phase 3")}</ProtectedRoute>} />
    <Route path="projects/:id" element={placeholder("Project detail", "Phase 3")} />
    <Route path="projects/:id/edit" element={<ProtectedRoute roles={["admin"]}>{placeholder("Edit project", "Phase 3")}</ProtectedRoute>} />
    <Route path="explore" element={<ProtectedRoute roles={["client"]}>{placeholder("Explore public projects", "Phase 3")}</ProtectedRoute>} />
    <Route path="requests" element={<ProtectedRoute roles={["client"]}>{placeholder("My requests", "Phase 3")}</ProtectedRoute>} />
    <Route path="requests/new" element={<ProtectedRoute roles={["client"]}>{placeholder("Request a project", "Phase 3")}</ProtectedRoute>} />
    <Route path="assets" element={placeholder("Asset library", "Phase 4")} />
    <Route path="assets/upload" element={<ProtectedRoute roles={["admin", "designer"]}>{placeholder("Upload asset", "Phase 4")}</ProtectedRoute>} />
    <Route path="assets/:id" element={placeholder("Asset detail", "Phase 4")} />
    <Route path="reviews" element={placeholder("Reviews", "Phase 5")} />
    <Route path="bookmarks" element={placeholder("Bookmarks", "Phase 5")} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AppShell>;
}

export function AppRouter() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/change-password" element={<ChangePasswordPage />} />
    <Route path="/app/*" element={<ProtectedRoute><AuthenticatedApp /></ProtectedRoute>} />
    <Route path="/home" element={<Navigate to="/" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
