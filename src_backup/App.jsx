import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import WelcomePage from './pages/WelcomePage';
import RecipeListPage from './pages/RecipeListPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import AddRecipePage from './pages/AddRecipePage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/" element={<RecipeListPage />} />
            <Route path="/recipe/new" element={<AddRecipePage />} />
            <Route path="/recipe/:id" element={<RecipeDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Routes>
          <Footer />
          <BottomNav />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
