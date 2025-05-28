import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Filter, ArrowDown, ArrowUp, Plus, Edit, Download, Trash2, CheckSquare, Square, Scan, Volume2, Sun, Monitor, Laptop, Plug, Box } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel } from '../utils/excelUtils';
import { supabase } from '../lib/supabase';
import BarcodeScanner from '../components/BarcodeScanner';
import BarkodGenerator from '../components/BarkodGenerator';

const PAGE_SIZE = 10;

const Depo = () => {
  const { urunler, kategoriler } = useEnvanter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('ad');
  const [sortDir, setSortDir] = useState('asc');
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<string | null>(null);
  const [showBulkBarcodeModal, setShowBulkBarcodeModal] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching locations:', error);
      } else if (data) {
        setLocations(data);
      }
    };

    fetchLocations();
  }, []);

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const depodakiUrunler = urunler.filter(urun => urun.durum === 'Depoda');

  const getKategoriAdi = (kategoriId: string) => {
    const kategori = kategoriler.find(k => String(k.id) === String(kategoriId));
    return kategori ? kategori.name : 'Bilinmiyor';
  };

  const filteredUrunler = depodakiUrunler.filter((urun) => {
    const matchesSearch = urun.ad.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         urun.barkod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? String(urun.kategori) === String(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  const sortedUrunler = [...filteredUrunler].sort((a, b) => {
    if (sortBy === 'miktar') {
      return sortDir === 'asc' ? a.miktar - b.miktar : b.miktar - a.miktar;
    } else {
      const strA = String(a[sortBy as keyof typeof a]);
      const strB = String(b[sortBy as keyof typeof b]);
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === sortedUrunler.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(sortedUrunler.map(urun => urun.id));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const exportSelectedProducts = () => {
    const selectedUrunler = sortedUrunler.filter(urun => selectedProducts.includes(urun.id));
    exportToExcel(
      selectedUrunler.map(urun => ({
        'Ürün Adı': urun.ad,
        'Marka': urun.marka,
        'Model': urun.model,
        'Kategori': urun.kategori,
        'Durum': urun.durum,
        'Lokasyon': getLocationName(urun.lokasyon),
        'Seri No': urun.seriNo,
        'Barkod': urun.barkod,
        'Son İşlem': urun.eklemeTarihi
      })),
      'Secili_Depo_Urunleri'
    );
  };

  // Ürün silme fonksiyonu
  const handleDelete = async (urunId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', urunId);
      if (error) throw error;
      // UI'dan silinen ürünü çıkar
      window.location.reload(); // Hızlı çözüm, daha iyi: state güncellemesi
    } catch (err) {
      alert('Ürün silinirken hata oluştu.');
    }
  };

  // Toplu ürün silme fonksiyonu
  const handleBulkDelete = async () => {
    if (!isAdmin) return;
    if (selectedProducts.length === 0) return;
    if (!window.confirm('Seçili ürünleri silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('products').delete().in('id', selectedProducts);
      if (error) throw error;
      window.location.reload(); // Hızlı çözüm, daha iyi: state güncellemesi
    } catch (err) {
      alert('Ürünler silinirken hata oluştu.');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(sortedUrunler.length / PAGE_SIZE);
  const paginatedUrunler = sortedUrunler.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  // Kategoriye göre ikon döndüren fonksiyon
  const getCategoryIcon = (kategori: string) => {
    const name = kategori.toLowerCase();
    if (name.includes('ses')) return <Volume2 className="h-6 w-6 text-indigo-500" />;
    if (name.includes('ışık') || name.includes('isik') || name.includes('light')) return <Sun className="h-6 w-6 text-yellow-500" />;
    if (name.includes('görüntü') || name.includes('goruntu') || name.includes('monitor') || name.includes('ekran')) return <Monitor className="h-6 w-6 text-blue-500" />;
    if (name.includes('bilgisayar') || name.includes('laptop') || name.includes('pc')) return <Laptop className="h-6 w-6 text-green-500" />;
    if (name.includes('aksesuar') || name.includes('plug')) return <Plug className="h-6 w-6 text-pink-500" />;
    if (name.includes('case') || name.includes('kasa') || name.includes('box')) return <Box className="h-6 w-6 text-gray-500" />;
    return <Package className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depodaki Ürünler</h1>
          <p className="text-sm text-gray-500 mt-1">Depoda bulunan tüm ürünleri görüntüleyin ve yönetin</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link
              to="/urunler/ekle"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Ürün Ekle
            </Link>
          )}
          {isAdmin && (
            <button
              onClick={handleBulkDelete}
              disabled={selectedProducts.length === 0}
              className={`inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 ${selectedProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Seçili Ürünleri Sil
            </button>
          )}
          <button
            onClick={() => setShowBulkBarcodeModal(true)}
            disabled={selectedProducts.length === 0}
            className={`inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 ${selectedProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Package className="h-5 w-5 mr-2" />
            Seçili Barkodları Yazdır
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Toplam Ürün</h3>
              <p className="text-2xl font-bold text-blue-600">{depodakiUrunler.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Seçili Ürün</h3>
              <p className="text-2xl font-bold text-green-600">{selectedProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Bakımda</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {depodakiUrunler.filter(u => u.durum === 'Serviste').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ürün adı veya barkod..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Kategoriler</option>
              {kategoriler.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {selectedProducts.length === sortedUrunler.length ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('ad')}
                >
                  <div className="flex items-center">
                    Ürün Adı
                    {sortBy === 'ad' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Barkod
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('kategori')}
                >
                  <div className="flex items-center">
                    Kategori
                    {sortBy === 'kategori' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Durum
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Miktar
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Son İşlem
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUrunler.map((urun) => (
                <tr key={urun.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleSelectProduct(urun.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {selectedProducts.includes(urun.id) ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {urun.photo_url ? (
                          <img
                            src={urun.photo_url}
                            alt={urun.ad}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getCategoryIcon(getKategoriAdi(urun.kategori))
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{urun.ad}</div>
                        <div className="text-sm text-gray-500">{urun.marka} {urun.model}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer underline hover:text-indigo-600"
                      onClick={() => setBarcodeModalProduct(urun.id)}
                      title="Barkodu Yazdır">
                    {urun.barkod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getKategoriAdi(urun.kategori)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      urun.durum === 'Depoda' ? 'bg-green-100 text-green-800' :
                      urun.durum === 'Serviste' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {urun.durum}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {urun.miktar}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(urun.eklemeTarihi)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                    <Link
                      to={`/urunler/${urun.id}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition"
                      title="Düzenle"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(urun.id)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={exportSelectedProducts}
          disabled={selectedProducts.length === 0}
          className={`flex items-center px-4 py-2 rounded-lg transition duration-150 ${
            selectedProducts.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          <Download className="h-5 w-5 mr-2" />
          Seçili Ürünleri Dışa Aktar
        </button>
      </div>

      {showScanner && (
        <BarcodeScanner onClose={() => setShowScanner(false)} />
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border text-xs bg-white disabled:opacity-50"
        >
          Önceki
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded border text-xs ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white'}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border text-xs bg-white disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>

      {/* Tekli Barkod Modal */}
      {barcodeModalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Barkod</h2>
            <div className="mb-4">
              <BarkodGenerator
                barkod={depodakiUrunler.find(u => u.id === barcodeModalProduct)?.barkod || ''}
                urunAdi={depodakiUrunler.find(u => u.id === barcodeModalProduct)?.ad || ''}
                onPrint={() => setBarcodeModalProduct(null)}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setBarcodeModalProduct(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toplu Barkod Modal */}
      {showBulkBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Seçili Barkodlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {depodakiUrunler.filter(u => selectedProducts.includes(u.id)).map(u => (
                <BarkodGenerator
                  key={u.id}
                  barkod={u.barkod}
                  urunAdi={u.ad}
                  onPrint={() => {}}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowBulkBarcodeModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depo;