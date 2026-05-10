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
import StaffView from './pages/staff/StaffView';

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

function AppContent() {
  const location = useLocation();
  const isAccountsPage = location.pathname === '/admin/accounts';
  const isInAdminArea = location.pathname.startsWith('/admin');
  const isInStaffArea = location.pathname.startsWith('/staff');
  const isStaffView = location.pathname === '/staff/view';

  return (
    <div className={`flex flex-col ${isInAdminArea ? 'h-screen' : 'min-h-screen'} bg-graphite selection:bg-accent-orange/30 ${isInAdminArea ? 'overflow-hidden' : ''}`}>
      {!isStaffView && <Navbar />}
      <main className={`flex-grow ${!isStaffView ? 'pt-20' : ''} ${isInAdminArea ? 'overflow-hidden' : ''} flex flex-col`}>
        <Breadcrumbs />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contacts" element={<Contacts />} />
          
          {/* Staff Route */}
          <Route path="/staff/view" element={
            <ProtectedRoute role="работник">
              <StaffView />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role={['администратор', 'менеджер']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="repair" element={<RepairSchedule />} />
            <Route path="diagnostic" element={<DiagnosticSchedule />} />
            <Route path="bodywork" element={<BodyworkSchedule />} />
            
            {/* Restricted Admin Routes */}
            <Route path="charts" element={
              <ProtectedRoute role="администратор">
                <AdminCharts />
              </ProtectedRoute>
            } />
            <Route path="reports/boxes" element={
              <ProtectedRoute role="администратор">
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="reports/ai" element={
              <ProtectedRoute role="администратор">
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="tables" element={
              <ProtectedRoute role="администратор">
                <AdminTables />
              </ProtectedRoute>
            } />
            <Route path="accounts" element={
              <ProtectedRoute role="администратор">
                <AdminAccounts />
              </ProtectedRoute>
            } />
            <Route path="agents" element={
              <ProtectedRoute role="администратор">
                <AdminAgents />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </main>
      {!isInAdminArea && !isInStaffArea && <Footer />}
      {!isAccountsPage && !isInStaffArea && <ChatWidget />}
      <BookingModal />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToHash />
      <AppContent />
    </Router>
  );
}
