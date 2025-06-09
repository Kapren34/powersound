import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Anasayfa from './pages/Anasayfa';
import UrunEkle from './pages/UrunEkle';
import UrunDetay from './pages/UrunDetay';
import Hareketler from './pages/Hareketler';
import HareketEkle from './pages/HareketEkle';
import Raporlar from './pages/Raporlar';
import Ayarlar from './pages/Ayarlar';
import Depo from './pages/Depo';
import { EnvanterProvider } from './contexts/EnvanterContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <EnvanterProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Anasayfa />} />
              <Route path="depo" element={<Depo />} />
              <Route path="urunler/ekle" element={
                <PrivateRoute requireAdmin>
                  <UrunEkle />
                </PrivateRoute>
              } />
              <Route path="urunler/:id" element={<UrunDetay />} />
              <Route path="hareketler" element={<Hareketler />} />
              <Route path="hareketler/ekle" element={<HareketEkle />} />
              <Route path="raporlar" element={<Raporlar />} />
              <Route path="ayarlar" element={
                <PrivateRoute>
                  <Ayarlar />
                </PrivateRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </EnvanterProvider>
    </AuthProvider>
  );
}

export default App;