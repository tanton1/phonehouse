import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { User, Role, Permission } from '../types';
import { Users, Plus, Edit2, Trash2, Search, Shield, CheckSquare, Square } from 'lucide-react';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản Trị Viên',
  KHO_MAY: 'Kho Máy',
  TESTER: 'Tester',
  TRUONG_KT: 'Trưởng Kỹ Thuật',
  KY_THUAT: 'Kỹ Thuật Viên',
  KHO_LINH_KIEN: 'Kho Linh Kiện',
  QC: 'QC',
  SALE: 'Sale / Phân Phối',
};

const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_DASHBOARD: 'Xem Tổng Quan',
  MANAGE_USERS: 'Quản Lý Nhân Sự',
  MANAGE_DEVICES: 'Quản Lý Kho Máy',
  MANAGE_PARTS: 'Quản Lý Linh Kiện',
  MANAGE_TASKS: 'Quản Lý Kỹ Thuật',
  MANAGE_QC: 'Quản Lý QC',
  MANAGE_SUPPLIERS: 'Quản Lý Nguồn Hàng',
  MANAGE_PRODUCTS: 'Quản Lý Sản Phẩm',
  MANAGE_IMPORT: 'Quản Lý Nhập Hàng',
  MANAGE_DISTRIBUTION: 'Quản Lý Phân Phối / Điều Chuyển',
  VIEW_REPORTS: 'Xem Báo Cáo',
  MANAGE_SALES: 'Quản Lý Bán Hàng (POS)',
  MANAGE_CASHBOOK: 'Quản Lý Sổ Quỹ',
};

export default function NhanVien() {
  const { state, dispatch } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    role: 'KY_THUAT',
    email: '',
    password: '',
    phone: '',
    status: 'ACTIVE',
    permissions: []
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      role: 'KY_THUAT',
      email: '',
      password: '',
      phone: '',
      status: 'ACTIVE',
      permissions: []
    });
    setEditingUser(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (user: User) => {
    setFormData({ ...user, password: '' }); // Don't show password on edit
    setEditingUser(user);
    setIsAdding(true);
  };

  const handleTogglePermission = (permission: Permission) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      if (currentPermissions.includes(permission)) {
        return { ...prev, permissions: currentPermissions.filter(p => p !== permission) };
      } else {
        return { ...prev, permissions: [...currentPermissions, permission] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return alert('Vui lòng nhập đủ thông tin bắt buộc');

    if (editingUser) {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Keep old password if not changed
      }
      dispatch({
        type: 'UPDATE_USER',
        payload: { ...editingUser, ...updateData } as User
      });
      alert('Đã cập nhật thông tin nhân viên!');
    } else {
      if (!formData.password) return alert('Vui lòng nhập mật khẩu cho nhân viên mới');
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formData.name!,
        role: formData.role as Role,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        status: formData.status as 'ACTIVE' | 'INACTIVE',
        permissions: formData.permissions || []
      };
      dispatch({ type: 'ADD_USER', payload: newUser });
      alert('Đã thêm nhân viên mới!');
    }

    setIsAdding(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    if (id === state.currentUser?.id) {
      return alert('Không thể xóa tài khoản đang đăng nhập!');
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      dispatch({ type: 'DELETE_USER', payload: id });
    }
  };

  const filteredUsers = state.users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Quản Lý Nhân Sự</h1>
        <button 
          onClick={handleOpenAdd}
          className="w-full sm:w-auto neon-button flex items-center justify-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Nhân Viên
        </button>
      </div>

      {isAdding && (
        <div className="bg-dark-card p-6 rounded-xl shadow-sm border border-dark-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-dark-text">
            <Shield className="w-5 h-5 mr-2 text-neon-cyan" />
            {editingUser ? 'Cập Nhật Thông Tin' : 'Thêm Nhân Viên Mới'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted">Họ và Tên *</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted">Vai Trò (Role) *</label>
              <select 
                className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
              >
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted">Email</label>
              <input 
                type="email" 
                className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted">Số Điện Thoại</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted">Mật khẩu {editingUser ? '' : '*'}</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                value={formData.password || ''}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder={editingUser ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                required={!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted">Mức lương cơ bản (VNĐ)</label>
              <input 
                type="number" 
                className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                value={formData.baseSalary || ''}
                onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})}
                placeholder="Ví dụ: 5000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted">Trạng Thái</label>
              <select 
                className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
              >
                <option value="ACTIVE">Đang làm việc</option>
                <option value="INACTIVE">Đã nghỉ việc</option>
              </select>
            </div>
            
            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-bold text-neon-cyan mb-3">Khung Giờ Làm Việc</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-dark-bg p-4 rounded-xl border border-dark-border">
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Ca Sáng - Giờ Vào</label>
                  <input type="time" className="w-full rounded-md p-2 dark-input" 
                    value={formData.workingHours?.morningIn || ''} 
                    onChange={e => setFormData({...formData, workingHours: {...(formData.workingHours || {morningIn:'', morningOut:'', afternoonIn:'', afternoonOut:''}), morningIn: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Ca Sáng - Giờ Ra</label>
                  <input type="time" className="w-full rounded-md p-2 dark-input" 
                    value={formData.workingHours?.morningOut || ''} 
                    onChange={e => setFormData({...formData, workingHours: {...(formData.workingHours || {morningIn:'', morningOut:'', afternoonIn:'', afternoonOut:''}), morningOut: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Ca Chiều - Giờ Vào</label>
                  <input type="time" className="w-full rounded-md p-2 dark-input" 
                    value={formData.workingHours?.afternoonIn || ''} 
                    onChange={e => setFormData({...formData, workingHours: {...(formData.workingHours || {morningIn:'', morningOut:'', afternoonIn:'', afternoonOut:''}), afternoonIn: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Ca Chiều - Giờ Ra</label>
                  <input type="time" className="w-full rounded-md p-2 dark-input" 
                    value={formData.workingHours?.afternoonOut || ''} 
                    onChange={e => setFormData({...formData, workingHours: {...(formData.workingHours || {morningIn:'', morningOut:'', afternoonIn:'', afternoonOut:''}), afternoonOut: e.target.value}})} 
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 mt-2">
              <label className="block text-sm font-medium text-dark-muted mb-2">Quyền Hạn (Permissions)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-dark-bg/50 p-4 rounded-xl border border-dark-border">
                {(Object.keys(PERMISSION_LABELS) as Permission[]).map(permission => {
                  const isSelected = formData.permissions?.includes(permission);
                  return (
                    <div 
                      key={permission} 
                      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'hover:bg-dark-border/50 border border-transparent'}`}
                      onClick={() => handleTogglePermission(permission)}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-neon-cyan mr-2 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-dark-muted mr-2 shrink-0" />
                      )}
                      <span className={`text-sm ${isSelected ? 'text-neon-cyan font-medium' : 'text-dark-text'}`}>
                        {PERMISSION_LABELS[permission]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingUser(null); }}
                className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border hover:text-dark-text"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button"
              >
                {editingUser ? 'Cập Nhật' : 'Lưu Nhân Viên'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
        <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-medium text-dark-text flex items-center">
            <Users className="w-5 h-5 mr-2 text-neon-cyan" />
            Danh Sách Nhân Viên
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
            <input 
              type="text" 
              placeholder="Tìm tên, email, SĐT..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-md text-sm dark-input"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border dark-table">
            <thead className="bg-dark-bg/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Nhân Viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Vai Trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Liên Hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Lương CB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-dark-muted uppercase tracking-wider">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-dark-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-dark-border/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold text-xs border border-neon-cyan/30">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-dark-text">{user.name}</p>
                        <p className="text-xs text-dark-muted font-mono">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      user.role === 'TRUONG_KT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-dark-border text-dark-muted border border-dark-border'
                    }`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-dark-text">{user.phone || '---'}</p>
                    <p className="text-xs text-dark-muted">{user.email || '---'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-neon-cyan">{user.baseSalary ? user.baseSalary.toLocaleString() + 'đ' : '---'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'ACTIVE' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                    }`}>
                      {user.status === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ việc'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="text-neon-cyan hover:text-neon-cyan/80 mr-3 transition-colors"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="text-neon-pink hover:text-neon-pink/80 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-dark-muted">
                    Không tìm thấy nhân viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
