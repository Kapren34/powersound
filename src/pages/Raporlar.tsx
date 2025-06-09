import React, { useEffect, useState } from 'react';
import { BarChart3, Package, Warehouse, RefreshCw } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Raporlar = () => {
  const { urunler, hareketler } = useEnvanter();
  const { user } = useAuth();
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);
  const [locationNames, setLocationNames] = useState({
    depo: 'DEPO',
    sirket: 'ŞİRKET',
    servis: 'SERVİS',
    kiralama: 'KİRALAMA'
  });
  const [locationIds, setLocationIds] = useState({
    depo: '',
    sirket: '',
    servis: '',
    kiralama: ''
  });

  useEffect(() => {
    const fetchLocations = async () => {
      const { data: locationsData, error } = await supabase
        .from('locations')
        .select('id, name');
      if (error) return;
      setLocations(locationsData || []);
      const depoObj = locationsData.find(l => l.name.toUpperCase() === 'DEPO');
      const sirketObj = locationsData.find(l => l.name.toUpperCase() === 'ŞİRKET');
      const servisObj = locationsData.find(l => l.name.toUpperCase() === 'SERVİS');
      const kiralamaObj = locationsData.find(l => l.name.toUpperCase() === 'KİRALAMA');
      setLocationNames({
        depo: depoObj?.name || 'DEPO',
        sirket: sirketObj?.name || 'ŞİRKET',
        servis: servisObj?.name || 'SERVİS',
        kiralama: kiralamaObj?.name || 'KİRALAMA'
      });
      setLocationIds({
        depo: depoObj?.id || '',
        sirket: sirketObj?.id || '',
        servis: servisObj?.id || '',
        kiralama: kiralamaObj?.id || ''
      });
    };
    const fetchUsers = async () => {
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username');
      if (!usersError && usersData) setUsers(usersData);
    };
    fetchLocations();
    fetchUsers();
  }, [urunler, hareketler]);

  // Lokasyon id'den isim bul
  const getLocationName = (id: string) => {
    const loc = locations.find(l => l.id === id);
    return loc ? loc.name : id;
  };

  // Ürün id'den isim bul
  const getProductName = (id: string) => {
    const urun = urunler.find(u => String(u.id) === String(id));
    return urun ? urun.ad : id;
  };

  const getUserName = (userId: string) => {
    const u = users.find(u => String(u.id) === String(userId));
    return u ? u.username : 'Unknown';
  };

  // Toplam ürün sayısı
  const toplamUrun = urunler.length;
  // Her lokasyondaki ürün sayısı (location_id alanına göre)
  const depodaUrun = urunler.filter(u => u.durum === 'Depoda').length;
  const sirketUrun = urunler.filter(u => u.location_id === locationIds.sirket).length;
  const servisteUrun = urunler.filter(u => u.location_id === locationIds.servis).length;
  const kiradaUrun = urunler.filter(u => u.location_id === locationIds.kiralama).length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-indigo-500" /> Raporlar
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <Package className="h-8 w-8 text-indigo-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">DEPO</div>
          <div className="text-3xl font-bold text-indigo-700 mt-1">{depodaUrun}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <Warehouse className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">ŞİRKET</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{sirketUrun}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">{locationNames.servis}</div>
          <div className="text-3xl font-bold text-yellow-700 mt-1">{servisteUrun}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <Package className="h-8 w-8 text-pink-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">{locationNames.kiralama}</div>
          <div className="text-3xl font-bold text-pink-700 mt-1">{kiradaUrun}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-indigo-400" /> Son 20 Hareket
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ürün</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tip</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Miktar</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Lokasyon</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Açıklama</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">İşlemi Yapan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {hareketler.slice(-20).reverse().map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{h.tarih}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{getProductName(h.urunId)}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.tip === 'Giriş' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.tip}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{h.miktar}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{getLocationName(h.lokasyon)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">{h.aciklama}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{getUserName(h.kullanici)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Raporlar;