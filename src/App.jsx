/**
 * App Component - Root routing configuration
 *
 * Uses HashRouter instead of BrowserRouter for deployment compatibility with GitHub Pages
 * and other static hosts that don't support server-side routing configuration.
 *
 * Route protection is handled at the layout level (AuthLayout, RootLayout, AdminLayout)
 * rather than through wrapper components for better performance and cleaner code.
 */
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthLayout } from './layouts/AuthLayout';
import { RootLayout } from './layouts/RootLayout';
import { AdminLayout } from './layouts/AdminLayout';

import { Login } from './pages/Auth/Login';
import { Signup } from './pages/Auth/Signup';
import { Home } from './pages/Recipe/Home';
import { Search } from './pages/Recipe/Search';
import { RecipeDetail } from './pages/Recipe/RecipeDetail';
import { CreateRecipe } from './pages/Recipe/CreateRecipe';
import { Profile } from './pages/Recipe/Profile';

import { AdminStats } from './pages/Admin/AdminStats';
import { UserList } from './pages/Admin/UserList';
import { AdminRecipes } from './pages/Admin/AdminRecipes';

function App() {
  return (
    // AuthProvider wraps entire app to give all components access to auth state
    <ToastProvider>
    <AuthProvider>
      <ErrorBoundary>
      <Router>
        <Routes>
          {/* Auth Routes - No authentication required, minimal layout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* User Routes - Protected by RootLayout authentication check */}
          <Route element={<RootLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/recipes/create" element={<CreateRecipe />} />
            {/* CreateRecipe component handles both create and edit modes via :id param */}
            <Route path="/recipes/edit/:id" element={<CreateRecipe />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            {/* Profile component handles current user's profile and other users' profiles */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/users/:userId" element={<Profile />} />
            {/* Alias for better UX - redirects to profile with recipes tab active */}
            <Route path="/recipes/my-recipes" element={<Profile activeTab="recipes" />} />
          </Route>

          {/* Admin Routes - Protected by AdminLayout with role-based access control */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminStats />} />
            <Route path="users" element={<UserList />} />
            <Route path="recipes" element={<AdminRecipes />} />
          </Route>

          {/* Catch All - Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ErrorBoundary>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
