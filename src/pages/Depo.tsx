import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Filter, ArrowDown, ArrowUp, Plus, Edit, Download, Trash2, CheckSquare, Square, Scan, Volume2, Sun, Monitor, Laptop, Plug, Box, Printer } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel } from '../utils/excelUtils';
import { supabase } from '../lib/supabase';
import BarcodeScanner from '../components/BarcodeScanner';
import BarkodGenerator from '../components/BarkodGenerator';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10;

const Depo = () => {
  const { urunler, kategoriler, addUrun } = useEnvanter();
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
        'Kategori': getKategoriAdi(urun.kategori),
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

  // Excel'den toplu ürün yükleme
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      for (const [i, row] of json.entries()) {
        try {
           // Kategori adı -> kategori id
           let kategoriId = '';
           if (row['Kategori']) {
             const kategori = kategoriler.find(k => k.name.trim().toLowerCase() === String(row['Kategori']).trim().toLowerCase());
             kategoriId = kategori ? kategori.id : '';
           }
           // Sadece zorunlu alanlar kontrolü
           if (!row['Ürün Adı'] || !row['Marka'] || !row['Model'] || !kategoriId) {
             const eksik = [];
             if (!row['Ürün Adı']) eksik.push('Ürün Adı');
             if (!row['Marka']) eksik.push('Marka');
             if (!row['Model']) eksik.push('Model');
             if (!kategoriId) eksik.push('Kategori (eşleşmedi)');
             console.error(`Satır ${i + 2}: Eksik veya hatalı alanlar: ${eksik.join(', ')}`, row);
             alert(`Satır ${i + 2}: Eksik veya hatalı alanlar: ${eksik.join(', ')}. Ürün eklenmedi!`);
             continue;
           }
           // Lokasyon adı -> lokasyon id (isteğe bağlı)
           let lokasyonId = '';
           if (row['Lokasyon']) {
             const lokasyon = locations.find(l => l.name.trim().toLowerCase() === String(row['Lokasyon']).trim().toLowerCase());
             lokasyonId = lokasyon ? lokasyon.id : '';
           }
           await addUrun({
            id: '',
            ad: row['Ürün Adı'],
            marka: row['Marka'],
            model: row['Model'],
            kategori: kategoriId,
            durum: row['Durum'] || 'Depoda',
            lokasyon: lokasyonId,
            location_id: lokasyonId,
            seriNo: row['Seri No'] || '',
            aciklama: row['Açıklama'] || '',
            barkod: row['Barkod'] || '',
            miktar: Number(row['Miktar']) || 1,
            eklemeTarihi: new Date().toISOString(),
          });
        } catch (err) {
          console.error(`Satır ${i + 2}: Ürün eklenemedi!`, row, err);
          alert(`Satır ${i + 2}: Ürün eklenemedi! Hata: ${err instanceof Error ? err.message : err}`);
        }
      }
      alert('Excelden ürünler başarıyla yüklendi!');
    };
    reader.readAsBinaryString(file);
  };

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error) {
        alert('Ürün bulunamadı');
        return;
      }

      if (product) {
        setBarcodeModalProduct(product.id);
      }
    } catch (err) {
      console.error('Barkod tarama hatası:', err);
      alert('Barkod tarama sırasında bir hata oluştu');
    }
  };

  const handleBulkPrint = () => {
    if (selectedProducts.length === 0) {
      alert('Lütfen yazdırılacak ürünleri seçin');
      return;
    }
    setShowBulkBarcodeModal(true);
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
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkPrint}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <Printer className="h-5 w-5 mr-2" />
              Seçili Barkodları Yazdır ({selectedProducts.length})
            </button>
          )}
          <button
            onClick={() => setShowScanner(true)}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Scan className="h-5 w-5 mr-2" />
            Barkod Tara
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

      <div className="flex justify-end space-x-4 mb-6">
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
                    <span className={
                      `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        urun.durum === 'Depoda' ? 'bg-green-100 text-green-800' :
                        urun.durum === 'Serviste' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`
                    }>
                      {urun.durum}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {urun.miktar}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDateTime(urun.eklemeTarihi)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/urunler/${urun.id}/duzenle`}
                      className="text-indigo-600 hover:text-indigo-900 mr-5"
                    >
                      Düzenle
                    </Link>
                    <Link
                      to={`/urunler/${urun.id}/sil`}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
        />
      )}

      {barcodeModalProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Barkod</h2>
            <div className="mb-4">
              <BarkodGenerator
                barkod={urunler.find(u => u.id === barcodeModalProduct)?.barkod || ''}
                urunAdi={urunler.find(u => u.id === barcodeModalProduct)?.ad || ''}
                model={urunler.find(u => u.id === barcodeModalProduct)?.model}
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

      {showBulkBarcodeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Seçili Barkodlar</h2>
            <div className="flex flex-col gap-8 mb-4">
              {selectedProducts.map(productId => {
                const product = urunler.find(u => u.id === productId);
                if (!product) return null;
                return (
                  <div key={productId} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center barkod-container">
                    <div className="urun-bilgi">{product.ad}</div>
                    {product.model && <div className="urun-model">{product.model}</div>}
                    <BarkodGenerator
                      barkod={product.barkod}
                      urunAdi={product.ad}
                      model={product.model}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkBarcodeModal(false);
                  setSelectedProducts([]);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowBulkBarcodeModal(false);
                  setSelectedProducts([]);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center"
              >
                <Printer className="h-5 w-5 mr-2" />
                Tümünü Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depo;