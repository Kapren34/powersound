import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, BarChart3, ArrowRight, Clock, MapPin, PenTool as Tool, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEnvanter } from '../contexts/EnvanterContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Anasayfa = () => {
  const { urunler, hareketler } = useEnvanter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isLoaded, setIsLoaded] = useState(false);

  // Raporlar kartları için eklenen state'ler
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
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
    setIsLoaded(true);
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
    fetchLocations();
  }, [urunler, hareketler]);

  // Toplam ürün sayısı
  const toplamUrun = urunler.length;
  // Her lokasyondaki ürün sayısı (location_id alanına göre)
  const depodaUrun = urunler.filter(u => u.durum === 'Depoda').length;
  const sirketUrun = urunler.filter(u => u.location_id === locationIds.sirket).length;
  const servisteUrun = urunler.filter(u => u.location_id === locationIds.servis).length;
  const kiradaUrun = urunler.filter(u => u.location_id === locationIds.kiralama).length;

  // Son hareketler
  const sonHareketler = hareketler.slice(0, 5);

  // Hareketten ürün adı bulucu
  const getProductName = (id: string) => {
    const urun = urunler.find(u => String(u.id) === String(id));
    return urun ? urun.ad : id;
  };

  // Tarih formatlayıcı
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };

  return (
    <div className={`space-y-8 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hoş Geldiniz Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl text-white p-8 shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2 animate-fade-in">Hoş Geldiniz</h1>
          <p className="text-indigo-100 mb-8 text-lg animate-fade-in-delay"></p>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
          <div className="absolute inset-0 bg-gradient-to-l from-white via-white to-transparent transform rotate-12 translate-x-1/2"></div>
        </div>
      </div>

      {/* Raporlar kartları */}
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

      {/* İstatistik Kartları */}
      {/* İstatistik kartları kaldırıldı */}

      {/* Son Hareketler ve Hızlı Erişim */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Hareketler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-indigo-600" />
            Son Hareketler
          </h2>
          {sonHareketler.length > 0 ? (
            <div className="space-y-3">
              {sonHareketler.map((hareket, index) => (
                <div
                  key={hareket.id}
                  className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors transform hover:scale-[1.01] duration-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      hareket.tip === 'Giriş'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {hareket.urunAdi || getProductName(hareket.urunId) || 'Bilinmeyen Ürün'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hareket.tip} - {formatDateTime(hareket.tarih)} - {hareket.kullanici}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200">
                    {hareket.miktar} adet
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Henüz hareket kaydı bulunmamaktadır.</p>
            </div>
          )}
          <div className="mt-6 text-right">
            <Link
              to="/hareketler"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium group"
            >
              Tüm hareketleri görüntüle
              <ArrowRight className="h-4 w-4 ml-1 transform transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-indigo-600" />
            Hızlı Erişim
          </h2>
          <div className="grid gap-3">
            {[
              {
                title: 'Malzeme Listesi',
                description: 'Tüm malzemeleri görüntüle ve yönet',
                icon: <Package className="h-5 w-5 text-blue-600" />,
                link: '/depo',
                bgColor: 'bg-blue-100'
              },
              {
                title: 'Hareket Kayıtları',
                description: 'Giriş ve çıkışları takip et',
                icon: <RefreshCw className="h-5 w-5 text-green-600" />,
                link: '/hareketler',
                bgColor: 'bg-green-100'
              },
              {
                title: 'Raporlar',
                description: 'Detaylı analiz ve raporlar',
                icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
                link: '/raporlar',
                bgColor: 'bg-purple-100'
              }
            ].map((item, index) => (
              <Link
                key={item.title}
                to={item.link}
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center mr-4`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transform transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Anasayfa;