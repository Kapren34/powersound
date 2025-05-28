import React from 'react';
import { BarChart3, Package, Warehouse, RefreshCw } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';

const Raporlar = () => {
  const { urunler, hareketler } = useEnvanter();

  // Toplam ürün sayısı
  const toplamUrun = urunler.length;
  // Depodaki ürün sayısı
  const depodaUrun = urunler.filter(u => u.durum === 'Depoda').length;
  // Servisteki ürün sayısı
  const servisteUrun = urunler.filter(u => u.durum === 'Serviste').length;
  // Oteldeki ürün sayısı
  const oteldeUrun = urunler.filter(u => u.durum === 'Otelde').length;
  // Kiralanan ürün sayısı
  const kiradaUrun = urunler.filter(u => u.durum === 'Kiralandı').length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-indigo-500" /> Raporlar
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <Package className="h-8 w-8 text-indigo-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">Toplam Ürün</div>
          <div className="text-3xl font-bold text-indigo-700 mt-1">{toplamUrun}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <Warehouse className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">Depoda</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{depodaUrun}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">Serviste</div>
          <div className="text-3xl font-bold text-yellow-700 mt-1">{servisteUrun}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <Package className="h-8 w-8 text-pink-500 mb-2" />
          <div className="text-lg font-semibold text-gray-700">Otelde / Kirada</div>
          <div className="text-3xl font-bold text-pink-700 mt-1">{oteldeUrun + kiradaUrun}</div>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {hareketler.slice(-20).reverse().map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{h.tarih}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{h.urunAdi}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.tip === 'Giriş' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.tip}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{h.miktar}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{h.lokasyon}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">{h.aciklama}</td>
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