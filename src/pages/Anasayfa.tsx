import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, BarChart3, ArrowRight, Clock, MapPin, PenTool as Tool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEnvanter } from '../contexts/EnvanterContext';
import { useAuth } from '../contexts/AuthContext';

const Anasayfa = () => {
  const { urunler, hareketler } = useEnvanter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Son hareketler
  const sonHareketler = hareketler.slice(0, 5);

  // Toplam ürün sayısı
  const toplamUrun = urunler.length;

  // Şirket ürünleri
  const sirketUrunler = urunler.filter(
    (urun) => urun.durum === 'ŞİRKET'
  ).length;

  // Servisteki ürünler
  const servistekiUrunler = urunler.filter(
    (urun) => urun.durum === 'Serviste'
  ).length;

  // Kiralanan ürünler
  const kiralananUrunler = urunler.filter(
    (urun) => urun.durum === 'Kiralandı'
  ).length;

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

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Toplam Malzeme',
            value: toplamUrun,
            icon: <Package className="h-6 w-6 text-blue-600" />,
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
            link: '/urunler',
            linkText: 'Tüm malzemeleri görüntüle'
          },
          {
            title: 'ŞİRKET',
            value: sirketUrunler,
            icon: <MapPin className="h-6 w-6 text-green-600" />,
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
            link: '/hareketler',
            linkText: 'Hareketleri görüntüle'
          },
          {
            title: 'Serviste',
            value: servistekiUrunler,
            icon: <Tool className="h-6 w-6 text-yellow-600" />,
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600',
            link: '/raporlar',
            linkText: 'Detaylı rapor'
          },
          {
            title: 'Kiralandı',
            value: kiralananUrunler,
            icon: <Clock className="h-6 w-6 text-purple-600" />,
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600',
            link: '/raporlar',
            linkText: 'Kiralama detayları'
          }
        ].map((stat, index) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 transform hover:translate-y-[-2px]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={stat.link}
                className={`text-sm ${stat.textColor} hover:opacity-80 font-medium flex items-center group`}
              >
                {stat.linkText}
                <ArrowRight className="h-4 w-4 ml-1 transform transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

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
                      {hareket.urunAdi}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hareket.tip} - {hareket.tarih} - {hareket.kullanici}
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