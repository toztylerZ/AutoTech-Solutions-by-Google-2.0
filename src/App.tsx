/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Breadcrumbs from './components/ui/Breadcrumbs';
import Footer from './components/layout/Footer';
import ChatWidget from './components/ChatWidget';
import BookingModal from './components/BookingModal';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contacts from './pages/Contacts';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCharts from './pages/admin/AdminCharts';
import AdminAgents from './pages/admin/AdminAgents';
import AdminReports from './pages/admin/AdminReports';
import AdminTables from './pages/admin/AdminTables';
import AdminAccounts from './pages/admin/AdminAccounts';
import RepairSchedule from './pages/admin/RepairSchedule';
import DiagnosticSchedule from './pages/admin/DiagnosticSchedule';
import BodyworkSchedule from './pages/admin/BodyworkSchedule';
import ProtectedRoute from './components/auth/ProtectedRoute';

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToHash />
      <div className="flex flex-col min-h-screen bg-graphite selection:bg-accent-orange/30">
        <Navbar />
        <main className="flex-grow pt-20">
          <Breadcrumbs />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contacts" element={<Contacts />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="repair" element={<RepairSchedule />} />
              <Route path="diagnostic" element={<DiagnosticSchedule />} />
              <Route path="bodywork" element={<BodyworkSchedule />} />
              <Route path="charts" element={<AdminCharts />} />
              <Route path="reports/boxes" element={<AdminReports />} />
              <Route path="reports/ai" element={<AdminReports />} />
              <Route path="tables" element={<AdminTables />} />
              <Route path="accounts" element={<AdminAccounts />} />
              <Route path="agents" element={<AdminAgents />} />
            </Route>
          </Routes>
        </main>
        <Footer />
        <ChatWidget />
        <BookingModal />
      </div>
    </Router>
  );
}
