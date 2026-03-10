import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Home, ClipboardList, Gamepad2, Sparkles, Droplet, Sun, Moon } from 'lucide-react';

// Placeholders for Pages
import Dashboard from './pages/Dashboard';
import Niyams from './pages/Niyams';
import Smruti from './pages/Smruti';
import Shangar from './pages/Shangar';
import Abhishek from './pages/Abhishek';

function Layout({ children, theme, toggleTheme }) {
  return (
    <>
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'var(--surface-color)',
          border: 'var(--glass-border)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-main)',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease'
        }}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <main className="page-container">
        {children}
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home className="nav-icon" size={24} />
          <span>Darshan</span>
        </NavLink>
        <NavLink to="/shangar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Sparkles className="nav-icon" size={24} />
          <span>Shangar</span>
        </NavLink>
        <NavLink to="/abhishek" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Droplet className="nav-icon" size={24} />
          <span>Abhishek</span>
        </NavLink>
        <NavLink to="/niyams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList className="nav-icon" size={24} />
          <span>E-Hisaab</span>
        </NavLink>
        <NavLink to="/games" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Gamepad2 className="nav-icon" size={24} />
          <span>Games</span>
        </NavLink>
      </nav>
    </>
  );
}

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <BrowserRouter>
      <Layout theme={theme} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shangar" element={<Shangar />} />
          <Route path="/abhishek" element={<Abhishek />} />
          <Route path="/niyams" element={<Niyams />} />
          <Route path="/games" element={<Smruti />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
