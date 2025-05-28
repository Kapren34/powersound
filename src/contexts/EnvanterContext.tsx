import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Urun {
  id: string;
  ad: string;
  marka: string;
  model: string;
  kategori: string;
  durum: string;
  lokasyon: string;
  seriNo: string;
  aciklama: string;
  barkod: string;
  miktar: number;
  eklemeTarihi: string;
}

interface Hareket {
  id: string;
  urunId: string;
  urunAdi: string;
  tip: string;
  miktar: number;
  tarih: string;
  aciklama: string;
  lokasyon: string;
  kullanici: string;
}

interface Kategori {
  id: string;
  name: string;
}

interface EnvanterContextType {
  urunler: Urun[];
  hareketler: Hareket[];
  kategoriler: Kategori[];
  loading: boolean;
  error: string | null;
  addUrun: (urun: Urun) => Promise<void>;
  updateUrun: (id: string, updatedUrun: Partial<Urun>) => Promise<void>;
  removeUrun: (id: string) => Promise<void>;
  addHareket: (hareket: Hareket) => Promise<void>;
  removeHareket: (id: string) => Promise<void>;
  addKategori: (kategori: Kategori) => Promise<void>;
  removeKategori: (id: string) => Promise<void>;
  isAdmin: boolean;
  loadProducts: () => Promise<void>;
}

const EnvanterContext = createContext<EnvanterContextType | undefined>(undefined);

export const EnvanterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [hareketler, setHareketler] = useState<Hareket[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadProducts(),
        loadLocations(),
        loadCategories(),
        loadMovements()
      ]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenirken bir hata oluştu');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Ürünler yüklenirken bir hata oluştu');
      }

      const mappedProducts: Urun[] = data.map((item: any) => ({
        id: item.id,
        ad: item.name,
        marka: item.brand,
        model: item.model,
        kategori: item.category_id,
        durum: item.status,
        lokasyon: item.location_id,
        seriNo: item.serial_number,
        barkod: item.barcode,
        miktar: item.quantity,
        aciklama: item.description || '',
        eklemeTarihi: item.created_at
      }));

      setUrunler(mappedProducts);
    } catch (error) {
      console.error('Ürün yükleme hatası:', error);
      throw error;
    }
  };

  const loadLocations = async () => {
    // Implementation needed
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) {
        throw new Error('Kategoriler yüklenirken bir hata oluştu');
      }

      setKategoriler(data || []);
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
      throw error;
    }
  };

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(item => ({
        id: item.id,
        urunId: item.product_id,
        urunAdi: '',
        tip: item.type,
        miktar: item.quantity,
        aciklama: item.description,
        lokasyon: item.location_id,
        tarih: item.created_at,
        kullanici: item.user_id,
      }));

      setHareketler(mapped);
    } catch (error) {
      console.error('Hareketler yüklenirken hata:', error);
    }
  };

  const addUrun = async (urun: Urun) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: urun.ad,
          brand: urun.marka,
          model: urun.model,
          category_id: urun.kategori,
          status: urun.durum,
          location_id: urun.lokasyon,
          serial_number: urun.seriNo,
          description: urun.aciklama,
          barcode: urun.barkod,
          quantity: urun.miktar
        }])
        .select()
        .single();

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Product addition error:', error);
      throw error;
    }
  };

  const updateUrun = async (id: string, updatedUrun: Partial<Urun>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updatedUrun.ad,
          brand: updatedUrun.marka,
          model: updatedUrun.model,
          category_id: updatedUrun.kategori,
          status: updatedUrun.durum,
          location_id: updatedUrun.lokasyon,
          serial_number: updatedUrun.seriNo,
          description: updatedUrun.aciklama,
          quantity: updatedUrun.miktar
        })
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Product update error:', error);
      throw error;
    }
  };

  const removeUrun = async (id: string) => {
    try {
      // First, delete all related movements
      const { error: movementsError } = await supabase
        .from('movements')
        .delete()
        .eq('product_id', id);

      if (movementsError) throw movementsError;

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (productError) throw productError;

      setUrunler(prevUrunler => prevUrunler.filter(urun => urun.id !== id));
      setHareketler(prevHareketler => prevHareketler.filter(hareket => hareket.urunId !== id));

      await loadData();
    } catch (error) {
      console.error('Product deletion error:', error);
      throw error;
    }
  };

  const addHareket = async (hareket: Hareket) => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .insert([{
          product_id: hareket.urunId,
          user_id: null, // veya user?.id
          type: hareket.tip,
          quantity: hareket.miktar,
          description: hareket.aciklama || 'EMPTY',
          location_id: hareket.lokasyon,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      await loadData();
      return data;
    } catch (error) {
      console.error('Hareket ekleme hatası:', error);
      throw error;
    }
  };

  const removeHareket = async (id: string) => {
    try {
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Movement deletion error:', error);
      throw error;
    }
  };

  const addKategori = async (kategori: Kategori) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: kategori.name
        }])
        .select()
        .single();

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Category addition error:', error);
      throw error;
    }
  };

  const removeKategori = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Category deletion error:', error);
      throw error;
    }
  };

  const value = {
    urunler,
    hareketler,
    kategoriler,
    loading,
    error,
    addUrun,
    updateUrun,
    removeUrun,
    addHareket,
    removeHareket,
    addKategori,
    removeKategori,
    isAdmin,
    loadProducts
  };

  return (
    <EnvanterContext.Provider value={value}>
      {children}
    </EnvanterContext.Provider>
  );
};

export const useEnvanter = () => {
  const context = useContext(EnvanterContext);
  if (context === undefined) {
    throw new Error('useEnvanter hook must be used within an EnvanterProvider');
  }
  return context;
};