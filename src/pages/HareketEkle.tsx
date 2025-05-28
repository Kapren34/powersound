import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Package } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';

const HareketEkle = () => {
  const navigate = useNavigate();
  const { urunler, addHareket } = useEnvanter();
  
  const [formData, setFormData] = useState({
    urunId: '',
    tip: 'Giriş',
    miktar: 1,
    aciklama: '',
    lokasyon: 'Depo',
  });
  
  // Seçili ürün bilgisi
  const selectedUrun = urunler.find(u => u.id === formData.urunId);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'miktar' ? parseInt(value) || 0 : value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Yeni hareket oluştur
      const yeniHareket = {
        ...formData,
        id: Date.now().toString(),
        tarih: new Date().toLocaleDateString('tr-TR'),
        urunAdi: selectedUrun?.ad || '',
        kullanici: 'Admin',
      };
      
      // Hareketi ekle
      await addHareket(yeniHareket);
      
      // Hareket listesine dön
      navigate('/hareketler');
    } catch (error) {
      console.error('Hareket ekleme hatası:', error);
      alert(error instanceof Error ? error.message : 'Hareket eklenirken bir hata oluştu.');
    }
  };
  
  // Lokasyon seçenekleri
  const lokasyonlar = [
    'Depo',
    'Merit Park',
    'Merit Royal',
    'Merit Cristal',
    'Lord Place',
    'Kaya Plazzo',
    'Cratos',
    'Acapolco',
    'Elexsus',
    'Chamada',
    'Limak',
    'Kaya Artemis',
    'Concorde',
    'Concorde Lefkosa',
    'Grand Saphire'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Yeni Hareket Kaydı</h1>
        <button
          onClick={() => navigate('/hareketler')}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="urunId" className="block text-sm font-medium text-gray-700 mb-1">
              Ürün*
            </label>
            <select
              id="urunId"
              name="urunId"
              required
              value={formData.urunId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Ürün Seçin</option>
              {urunler.map((urun) => (
                <option key={urun.id} value={urun.id}>
                  {urun.ad} - {urun.marka} {urun.model}
                </option>
              ))}
            </select>
          </div>
          
          {selectedUrun && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start">
                <Package className="h-6 w-6 text-gray-500 mr-3 mt-1" />
                <div>
                  <h3 className="text-md font-medium text-gray-800">{selectedUrun.ad}</h3>
                  <p className="text-sm text-gray-600">{selectedUrun.marka} {selectedUrun.model}</p>
                  <p className="text-sm">
                    <span className="font-medium">Kategori:</span> {selectedUrun.kategori}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tip" className="block text-sm font-medium text-gray-700 mb-1">
                Hareket Tipi*
              </label>
              <select
                id="tip"
                name="tip"
                required
                value={formData.tip}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Giriş">Giriş</option>
                <option value="Çıkış">Çıkış</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="miktar" className="block text-sm font-medium text-gray-700 mb-1">
                Miktar*
              </label>
              <input
                type="number"
                id="miktar"
                name="miktar"
                required
                min="1"
                value={formData.miktar}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="lokasyon" className="block text-sm font-medium text-gray-700 mb-1">
              Lokasyon
            </label>
            <select
              id="lokasyon"
              name="lokasyon"
              value={formData.lokasyon}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {lokasyonlar.map((lokasyon) => (
                <option key={lokasyon} value={lokasyon}>
                  {lokasyon}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="aciklama" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              id="aciklama"
              name="aciklama"
              rows={3}
              value={formData.aciklama}
              onChange={handleChange}
              placeholder="Hareketle ilgili detayları girin..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        {/* Butonlar */}
        <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/hareketler')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};

export default HareketEkle;