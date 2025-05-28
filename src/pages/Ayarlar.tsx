import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, User, PlusCircle, UserCircle, Shield } from 'lucide-react';

const Ayarlar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Kullanıcı ekleme için state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Varsayılan rol
  });
  const [userAddLoading, setUserAddLoading] = useState(false);
  const [userAddError, setUserAddError] = useState<string | null>(null);
  const [userAddSuccess, setUserAddSuccess] = useState<string | null>(null);

  // Admin kullanıcı listesi için state
  const [userList, setUserList] = useState<{id: string, username: string, role: string}[]>([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('auth_users')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setUserProfile(prev => ({
          ...prev,
          username: data.username || '',
          email: '',
        }));
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Profil bilgileri yüklenirken bir hata oluştu');
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        setUserListLoading(true);
        setUserListError(null);
        try {
          const { data, error } = await supabase
            .from('auth_users')
            .select('id, username, role')
            .order('username');
          if (error) {
            setUserListError('Kullanıcılar yüklenemedi');
          } else if (data) {
            setUserList(data);
          }
        } catch (err) {
          setUserListError('Kullanıcılar yüklenemedi');
        } finally {
          setUserListLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccessMessage(null);
  };

  // Kullanıcı ekleme input değişimi
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    setUserAddError(null);
    setUserAddSuccess(null);
  };

  // Kullanıcı ekleme fonksiyonu
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserAddLoading(true);
    setUserAddError(null);
    setUserAddSuccess(null);

    try {
      // Validasyonlar
      if (!newUser.username || !newUser.password) {
        throw new Error('Kullanıcı adı ve şifre zorunludur');
      }
      if (newUser.password !== newUser.confirmPassword) {
        throw new Error('Şifreler eşleşmiyor');
      }
      if (newUser.password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      // RPC çağrısı ile kullanıcı ekleme
      const { data, error } = await supabase.rpc('create_user', {
        p_username: newUser.username,
        p_password: newUser.password,
        p_role: newUser.role
      });

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Bu kullanıcı adı zaten kullanılıyor');
        }
        throw error;
      }

      setUserAddSuccess('Kullanıcı başarıyla eklendi');
      setNewUser({ username: '', password: '', confirmPassword: '', role: 'user' });
    } catch (error) {
      console.error('Kullanıcı ekleme hatası:', error);
      setUserAddError(error instanceof Error ? error.message : 'Kullanıcı eklenirken hata oluştu');
    } finally {
      setUserAddLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Update profile information
      const updates = {
        username: userProfile.username,
        updated_at: new Date()
      };

      const { error: updateError } = await supabase
        .from('auth_users')
        .update(updates)
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Update password if provided
      if (userProfile.newPassword) {
        if (userProfile.newPassword !== userProfile.confirmPassword) {
          throw new Error('Yeni şifreler eşleşmiyor');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: userProfile.newPassword
        });

        if (passwordError) throw passwordError;

        // Clear password fields
        setUserProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      setSuccessMessage('Profil başarıyla güncellendi');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Profil ve Şifre Bölümü */}
        <section className="flex flex-col gap-10 border border-gray-200 bg-white rounded-2xl p-10">
          <div className="flex items-center gap-4 mb-4">
            <UserCircle className="h-9 w-9 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-800">Hesap Bilgileri</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                name="username"
                value={userProfile.username}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded px-5 py-3 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-gray-50"
              />
            </div>
            <div className="border-t border-dashed border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-indigo-400" />
                <span className="text-base font-semibold text-indigo-700">Şifre Değiştir</span>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  type="password"
                  name="newPassword"
                  value={userProfile.newPassword}
                  onChange={handleChange}
                  placeholder="Yeni Şifre"
                  className="block w-full border border-gray-300 rounded px-5 py-3 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-gray-50"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={userProfile.confirmPassword}
                  onChange={handleChange}
                  placeholder="Yeni Şifre (Tekrar)"
                  className="block w-full border border-gray-300 rounded px-5 py-3 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-gray-50"
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
            )}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">{successMessage}</div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={logout}
                className="px-5 py-3 border border-gray-300 text-gray-700 rounded bg-white hover:bg-gray-100 text-sm font-medium"
              >
                Çıkış Yap
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-semibold"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </section>
        {/* Admin ise Kullanıcılar ve Kullanıcı Ekle Bölümü */}
        {isAdmin && (
          <section className="flex flex-col gap-10 border border-gray-200 bg-white rounded-2xl p-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <UserCircle className="h-8 w-8 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-800">Kullanıcılar</h2>
              </div>
              {userListLoading ? (
                <div className="text-gray-500 text-sm">Yükleniyor...</div>
              ) : userListError ? (
                <div className="text-red-600 text-sm">{userListError}</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {userList.map(u => (
                    <li key={u.id} className="py-3 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <UserCircle className="h-5 w-5 text-indigo-400" />
                        <span className="font-medium text-gray-800 text-sm">{u.username}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>{u.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-dashed border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <UserCircle className="h-7 w-7 text-green-600" />
                <h2 className="text-lg font-bold text-gray-800">Yeni Kullanıcı Ekle</h2>
              </div>
              <form onSubmit={handleAddUser} className="flex flex-col gap-3">
                <input
                  type="text"
                  name="username"
                  value={newUser.username}
                  onChange={handleNewUserChange}
                  placeholder="Kullanıcı Adı"
                  className="block w-full border border-gray-300 rounded px-5 py-3 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50"
                />
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  placeholder="Şifre"
                  className="block w-full border border-gray-300 rounded px-5 py-3 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={newUser.confirmPassword}
                  onChange={handleNewUserChange}
                  placeholder="Şifre (Tekrar)"
                  className="block w-full border border-gray-300 rounded px-5 py-3 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50"
                />
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleNewUserChange}
                  className="block w-full border border-gray-300 rounded px-5 py-3 focus:ring-green-500 focus:border-green-500 text-base bg-gray-50"
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Yönetici</option>
                </select>
                {userAddError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{userAddError}</div>
                )}
                {userAddSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">{userAddSuccess}</div>
                )}
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={userAddLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 text-sm font-semibold"
                  >
                    {userAddLoading ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Ayarlar;