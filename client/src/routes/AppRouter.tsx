import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "../App";
import { AppShell } from "../components/layout/AppShell";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SettingsPage } from "../pages/SettingsPage";

const placeholder = (title: string, phase: string, description?: string) => <PlaceholderPage title={title} phase={phase} description={description} />;

function FoundationApp() {
  const navigate = useNavigate();
  return <AppShell role="client" name="BrandHub user" onLogout={() => navigate("/login")}><Routes>
    <Route path="dashboard" element={placeholder("Dashboard", "Phase 2", "Authentication will provide a role-aware dashboard in Phase 2.")} />
    <Route path="profile" element={placeholder("Profile", "Phase 2")} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="admin/users" element={placeholder("User management", "Phase 2")} />
    <Route path="admin/requests" element={placeholder("Project requests", "Phase 3")} />
    <Route path="projects" element={placeholder("Projects", "Phase 3")} />
    <Route path="projects/new" element={placeholder("Create project", "Phase 3")} />
    <Route path="projects/:id" element={placeholder("Project detail", "Phase 3")} />
    <Route path="projects/:id/edit" element={placeholder("Edit project", "Phase 3")} />
    <Route path="explore" element={placeholder("Explore public projects", "Phase 3")} />
    <Route path="requests" element={placeholder("My requests", "Phase 3")} />
    <Route path="requests/new" element={placeholder("Request a project", "Phase 3")} />
    <Route path="assets" element={placeholder("Asset library", "Phase 4")} />
    <Route path="assets/upload" element={placeholder("Upload asset", "Phase 4")} />
    <Route path="assets/:id" element={placeholder("Asset detail", "Phase 4")} />
    <Route path="reviews" element={placeholder("Reviews", "Phase 5")} />
    <Route path="bookmarks" element={placeholder("Bookmarks", "Phase 5")} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AppShell>;
}

export function AppRouter() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={placeholder("Log in", "Phase 2")} />
    <Route path="/register" element={placeholder("Create a Client account", "Phase 2")} />
    <Route path="/app/*" element={<FoundationApp />} />
    <Route path="/home" element={<Navigate to="/" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
