import { Route, Routes } from 'react-router-dom';
import '../styles/admin.css';
import { AuthProvider, RequireAuth, RequireRole } from './auth';
import { UiProvider } from './ui';
import { AdminLayout, Dashboard, LoginPage } from './AdminShell';
import { ResourceEdit, ResourceList } from './ResourceManager';
import { RESOURCES } from './resources';
import { EnquiryDetail, EnquiryList } from './Enquiries';
import { UsersPage } from './Users';
import { SettingsPage } from './Settings';
import { MediaLibrary } from './MediaLibrary';

export default function AdminApp() {
  return (
    <AuthProvider>
      <UiProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            {RESOURCES.map((cfg) => (
              <Route key={cfg.key} path={cfg.key}>
                <Route index element={<ResourceList cfg={cfg} />} />
                <Route path=":id" element={<ResourceEdit cfg={cfg} />} />
              </Route>
            ))}
            <Route path="media" element={<MediaLibrary />} />
            <Route path="enquiries" element={<RequireRole role="admin"><EnquiryList /></RequireRole>} />
            <Route path="enquiries/:id" element={<RequireRole role="admin"><EnquiryDetail /></RequireRole>} />
            <Route path="users" element={<RequireRole role="admin"><UsersPage /></RequireRole>} />
            <Route path="settings" element={<RequireRole role="admin"><SettingsPage /></RequireRole>} />
            <Route path="*" element={<div className="state"><h1 style={{ fontSize: 'var(--h2)' }}>Page not found</h1><p className="muted">Use the menu to find what you need.</p></div>} />
          </Route>
        </Routes>
      </UiProvider>
    </AuthProvider>
  );
}
