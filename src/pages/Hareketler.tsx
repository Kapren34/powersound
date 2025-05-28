import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search, Trash2, RefreshCw, ArrowDown, ArrowUp, Download, Scan } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { exportToExcel } from '../utils/excelUtils';
import { supabase } from '../lib/supabase';
import { Urun } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Hareketler = () => {
  const { hareketler, urunler, removeHareket, addHareket } = useEnvanter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('tarih');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeProduct, setBarcodeProduct] = useState<Urun | null>(null);
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeMovementType, setBarcodeMovementType] = useState<'Giriş' | 'Çıkış'>('Çıkış');
  const [barcodeMovementQuantity, setBarcodeMovementQuantity] = useState(1);
  const [barcodeMovementLocation, setBarcodeMovementLocation] = useState('');
  const [barcodeMovementDescription, setBarcodeMovementDescription] = useState('');
  
  // Fetch locations and users from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
      } else if (locationsData) {
        setLocations(locationsData);
      }

      // Fetch users from auth_users table instead of users
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username')
        .order('username');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else if (usersData) {
        setUsers(usersData);
      }
    };

    fetchData();
  }, []);

  // Helper functions to get names
  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const getUrunAdi = (urunId: string) => {
    const urun = urunler.find(u => String(u.id) === String(urunId));
    return urun ? urun.ad : urunId;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => String(u.id) === String(userId));
    return user ? user.username : 'Unknown';
  };
  
  // Filtreleme
  const filteredHareketler = hareketler.filter((hareket) => {
    const matchesSearch = hareket.urunAdi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          hareket.aciklama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType ? hareket.tip === selectedType : true;
    return matchesSearch && matchesType;
  });
  
  // Sıralama
  const sortedHareketler = [...filteredHareketler].sort((a, b) => {
    if (sortBy === 'tarih') {
      const dateA = a.tarih.split('.').reverse().join('-');
      const dateB = b.tarih.split('.').reverse().join('-');
      return sortDir === 'asc' 
        ? dateA.localeCompare(dateB) 
        : dateB.localeCompare(dateA);
    } else if (sortBy === 'urunAdi') {
      return sortDir === 'asc'
        ? a.urunAdi.localeCompare(b.urunAdi)
        : b.urunAdi.localeCompare(a.urunAdi);
    } else if (sortBy === 'tip') {
      return sortDir === 'asc'
        ? a.tip.localeCompare(b.tip)
        : b.tip.localeCompare(a.tip);
    } else if (sortBy === 'miktar') {
      return sortDir === 'asc'
        ? a.miktar - b.miktar
        : b.miktar - a.miktar;
    } else if (sortBy === 'kullanici') {
      return sortDir === 'asc'
        ? a.kullanici.localeCompare(b.kullanici)
        : b.kullanici.localeCompare(a.kullanici);
    }
    return 0;
  });
  
  // Sütuna göre sıralama
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };

  const openBarcodeModal = () => {
    setShowBarcodeModal(true);
    setBarcodeInput('');
    setBarcodeProduct(null);
    setBarcodeError('');
    setBarcodeMovementType('Çıkış');
    setBarcodeMovementQuantity(1);
    setBarcodeMovementLocation('');
    setBarcodeMovementDescription('');
  };

  const closeBarcodeModal = () => {
    setShowBarcodeModal(false);
    setBarcodeInput('');
    setBarcodeProduct(null);
    setBarcodeError('');
    setBarcodeMovementType('Çıkış');
    setBarcodeMovementQuantity(1);
    setBarcodeMovementLocation('');
    setBarcodeMovementDescription('');
  };

  const handleBarcodeInput = (value: string) => {
    setBarcodeInput(value);
    if (value.length > 0) {
      const found = urunler.find(u => u.barkod === value);
      if (found) {
        setBarcodeProduct(found);
        setBarcodeError('');
      } else {
        setBarcodeProduct(null);
        setBarcodeError('Barkod ile eşleşen ürün bulunamadı!');
      }
    } else {
      setBarcodeProduct(null);
      setBarcodeError('');
    }
  };

  const handleBarcodeMovement = async () => {
    if (!barcodeProduct) return;
    try {
      await addHareket({
        id: '',
        urunId: barcodeProduct.id,
        urunAdi: barcodeProduct.ad,
        tip: barcodeMovementType,
        miktar: barcodeMovementQuantity,
        tarih: new Date().toLocaleDateString('tr-TR'),
        aciklama: barcodeMovementDescription,
        lokasyon: barcodeMovementLocation,
        kullanici: user?.username || 'Kullanıcı'
      });
      closeBarcodeModal();
      alert('İşlem başarıyla kaydedildi!');
    } catch (error) {
      alert('İşlem kaydedilemedi!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Hareket Kayıtları</h1>
        <div className="flex gap-2">
          <button
            onClick={openBarcodeModal}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Scan className="h-5 w-5 mr-2" />
            Barkod Tara
          </button>
          <Link to="/hareketler/ekle" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Yeni Hareket
          </Link>
        </div>
      </div>
      
      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ürün veya açıklama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hareket Tipi</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Hareketler</option>
              <option value="Giriş">Giriş</option>
              <option value="Çıkış">Çıkış</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-gray-700">
            <Filter className="h-5 w-5 mr-2" />
            <span className="text-sm">{filteredHareketler.length} kayıt filtrelendi</span>
          </div>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('');
            }}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Filtreleri Temizle
          </button>
        </div>
      </div>
      
      {/* Hareket Tablosu */}
      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('tarih')}
                >
                  <div className="flex items-center">
                    Tarih
                    {sortBy === 'tarih' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('urunAdi')}
                >
                  <div className="flex items-center">
                    Ürün
                    {sortBy === 'urunAdi' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('tip')}
                >
                  <div className="flex items-center">
                    Tip
                    {sortBy === 'tip' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('miktar')}
                >
                  <div className="flex items-center">
                    Miktar
                    {sortBy === 'miktar' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Lokasyon
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Açıklama
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('kullanici')}
                >
                  <div className="flex items-center">
                    İşlemi Yapan
                    {sortBy === 'kullanici' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedHareketler.length > 0 ? (
                sortedHareketler.map((hareket) => (
                  <tr key={hareket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(hareket.tarih)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getUrunAdi(hareket.urunId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        hareket.tip === 'Giriş' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hareket.tip}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hareket.miktar} adet
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getLocationName(hareket.lokasyon)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {hareket.aciklama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserName(hareket.kullanici)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => removeHareket(hareket.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Hareket kaydı bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Dışa Aktar Butonu */}
      <div className="flex justify-end">
        <button 
          onClick={() => exportToExcel(
            sortedHareketler.map(hareket => ({
              'Tarih': hareket.tarih,
              'Ürün': hareket.urunAdi,
              'Tip': hareket.tip,
              'Miktar': hareket.miktar,
              'Lokasyon': getLocationName(hareket.lokasyon),
              'Açıklama': hareket.aciklama,
              'İşlemi Yapan': getUserName(hareket.kullanici)
            })),
            'Hareketler'
          )}
          className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-150"
        >
          <Download className="h-5 w-5 mr-2" />
          Excel'e Aktar
        </button>
      </div>

      {/* Barkod Tara Modalı */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Barkod Tarama</h2>
            <input
              type="text"
              placeholder="Barkodu okutun veya girin..."
              value={barcodeInput}
              onChange={e => handleBarcodeInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleBarcodeInput((e.target as HTMLInputElement).value);
                  e.preventDefault();
                }
              }}
              className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
              autoFocus
            />
            {barcodeError && <div className="text-red-600 text-sm mb-2">{barcodeError}</div>}
            {barcodeProduct && (
              <div className="space-y-3 mt-2">
                <div className="font-semibold text-gray-700">{barcodeProduct.ad} ({barcodeProduct.barkod})</div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">İşlem Tipi</label>
                  <select
                    value={barcodeMovementType}
                    onChange={e => setBarcodeMovementType(e.target.value as 'Giriş' | 'Çıkış')}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="Giriş">Giriş</option>
                    <option value="Çıkış">Çıkış</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Miktar</label>
                  <input
                    type="number"
                    min="1"
                    value={barcodeMovementQuantity}
                    onChange={e => setBarcodeMovementQuantity(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lokasyon</label>
                  <select
                    value={barcodeMovementLocation}
                    onChange={e => setBarcodeMovementLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Lokasyon Seçin</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={barcodeMovementDescription}
                    onChange={e => setBarcodeMovementDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={closeBarcodeModal}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={handleBarcodeMovement}
                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            )}
            {!barcodeProduct && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={closeBarcodeModal}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hareketler;