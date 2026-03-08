import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Home, ClipboardList, Gamepad2, Sparkles, Droplet } from 'lucide-react';

// Placeholders for Pages
import Dashboard from './pages/Dashboard';
import Niyams from './pages/Niyams';
import Smruti from './pages/Smruti';
import Shangar from './pages/Shangar';
import Abhishek from './pages/Abhishek';

function Layout({ children }) {
  return (
    <>
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
        <NavLink to="/smruti" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Gamepad2 className="nav-icon" size={24} />
          <span>Smruti</span>
        </NavLink>
      </nav>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shangar" element={<Shangar />} />
          <Route path="/abhishek" element={<Abhishek />} />
          <Route path="/niyams" element={<Niyams />} />
          <Route path="/smruti" element={<Smruti />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
