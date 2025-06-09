declare module "react-qr-scanner";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QrScanner from 'react-qr-scanner';

// @ts-ignore
// eslint-disable-next-line
// typescript için modül bildirimi
// Eğer @types/react-qr-scanner yoksa aşağıdaki satırı ekle
// declare module 'react-qr-scanner';

interface BarcodeScannerProps {
  onClose?: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onClose }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const navigate = useNavigate();
  const [cameraActive, setCameraActive] = useState(true);

  useEffect(() => {
    // Focus input when component mounts
    const input = document.getElementById('barcode-input');
    if (input) {
      input.focus();
    }

    // Handle barcode scanner input
    const handleKeyPress = async (e: KeyboardEvent) => {
      if (e.key === 'Enter' && barcodeInput) {
        try {
          // Search for product with scanned barcode
          const { data, error } = await supabase
            .from('products')
            .select('id')
            .eq('barcode', barcodeInput)
            .single();

          if (error) {
            console.error('Error searching for product:', error);
            return;
          }

          if (data) {
            // Navigate to product details
            navigate(`/urunler/${data.id}`);
            if (onClose) onClose();
          } else {
            alert('Ürün bulunamadı');
          }
        } catch (error) {
          console.error('Error:', error);
        }

        setBarcodeInput('');
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [barcodeInput, navigate, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Barkod Tarama</h2>
        {/* Kamera ile barkod okuma */}
        {cameraActive && (
          <QrScanner
            delay={300}
            onError={() => setCameraActive(false)}
            onScan={async (data: string | null) => {
              if (data) {
                setCameraActive(false);
                setBarcodeInput(data);
                // Ürün arama ve yönlendirme işlemi
                try {
                  const { data: product, error } = await supabase
                    .from('products')
                    .select('id')
                    .eq('barcode', data)
                    .single();
                  if (error) {
                    alert('Ürün bulunamadı');
                    setCameraActive(true);
                    return;
                  }
                  if (product) {
                    navigate(`/urunler/${product.id}`);
                    if (onClose) onClose();
                  }
                } catch (err) {
                  alert('Bir hata oluştu');
                  setCameraActive(true);
                }
              }
            }}
            style={{ width: '100%' }}
          />
        )}
        {/* Manuel giriş için input alanı */}
        <input
          id="barcode-input"
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Barkodu okutun veya girin..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          autoComplete="off"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;