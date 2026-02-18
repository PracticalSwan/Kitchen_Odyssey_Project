// App - Main app component with routing, code-splitting, and provider setup
import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthLayout } from './layouts/AuthLayout';
import { RootLayout } from './layouts/RootLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Code-split page components for better initial load performance
const Login = lazy(() => import('./pages/Auth/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Auth/Signup').then(m => ({ default: m.Signup })));
const Home = lazy(() => import('./pages/Recipe/Home').then(m => ({ default: m.Home })));
const Search = lazy(() => import('./pages/Recipe/Search').then(m => ({ default: m.Search })));
const RecipeDetail = lazy(() => import('./pages/Recipe/RecipeDetail').then(m => ({ default: m.RecipeDetail })));
const CreateRecipe = lazy(() => import('./pages/Recipe/CreateRecipe').then(m => ({ default: m.CreateRecipe })));
const Profile = lazy(() => import('./pages/Recipe/Profile').then(m => ({ default: m.Profile })));
const AdminStats = lazy(() => import('./pages/Admin/AdminStats').then(m => ({ default: m.AdminStats })));
const UserList = lazy(() => import('./pages/Admin/UserList').then(m => ({ default: m.UserList })));
const AdminRecipes = lazy(() => import('./pages/Admin/AdminRecipes').then(m => ({ default: m.AdminRecipes })));

function App() {
  return (
    // AuthProvider wraps entire app to give all components access to auth state
    <ToastProvider>
    <AuthProvider>
      <ErrorBoundary>
      <Router>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-warm-gray-60">Loading...</div>}>
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
        </Suspense>
      </Router>
      </ErrorBoundary>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
