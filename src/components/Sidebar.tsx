import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, RefreshCw, BarChart3, Settings, SpeakerIcon, Lightbulb, Monitor, Warehouse } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  // const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white">
      <div className="px-6 py-8 border-b border-indigo-800/30">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-indigo-200">
          POWERSOUND
        </h2>
        <p className="text-indigo-200 text-sm mt-1">Envanter Sistemi</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <Home className="h-5 w-5 mr-3" />
          <span>Anasayfa</span>
        </NavLink>

        <NavLink
          to="/depo"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <Warehouse className="h-5 w-5 mr-3" />
          <span>Depo</span>
        </NavLink>

        <NavLink
          to="/hareketler"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <RefreshCw className="h-5 w-5 mr-3" />
          <span>Hareketler</span>
        </NavLink>

        <NavLink
          to="/raporlar"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <BarChart3 className="h-5 w-5 mr-3" />
          <span>Raporlar</span>
        </NavLink>

        <NavLink
          to="/ayarlar"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20 translate-x-1'
                : 'text-indigo-100 hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <Settings className="h-5 w-5 mr-3" />
          <span>Ayarlar</span>
        </NavLink>
      </nav>

      <div className="px-6 py-6 border-t border-indigo-800/30 bg-gradient-to-t from-indigo-900/50">
        <div className="flex items-center justify-around text-sm">
          <div className="flex items-center text-indigo-200 hover:text-white transition-colors duration-200 cursor-pointer group">
            <SpeakerIcon className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
            <span>Ses</span>
          </div>
          <div className="flex items-center text-indigo-200 hover:text-white transition-colors duration-200 cursor-pointer group">
            <Lightbulb className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
            <span>Işık</span>
          </div>
          <div className="flex items-center text-indigo-200 hover:text-white transition-colors duration-200 cursor-pointer group">
            <Monitor className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
            <span>Görüntü</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;