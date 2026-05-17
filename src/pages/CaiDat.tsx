import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { StoreBranch } from '../types';
import { Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CaiDat() {
  const { state, dispatch } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', address: '', isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (branch: StoreBranch) => {
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      isActive: branch.isActive,
    });
    setEditingId(branch.id);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng nhập tên và mã chi nhánh');
      return;
    }

    const newBranch: StoreBranch = {
      id: editingId || `sb-${Date.now()}`,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      address: formData.address.trim(),
      isActive: formData.isActive,
    };

    if (editingId) {
      dispatch({ type: 'UPDATE_STORE_BRANCH', payload: newBranch });
      toast.success('Đã cập nhật chi nhánh');
    } else {
      if (state.storeBranches.find(b => b.code === newBranch.code)) {
        toast.error('Mã chi nhánh đã tồn tại!');
        return;
      }
      dispatch({ type: 'ADD_STORE_BRANCH', payload: newBranch });
      toast.success('Đã thêm chi nhánh mới');
    }
    resetForm();
  };

  const handleDelete = (id: string, code: string) => {
    if (code === 'KHO_TONG') {
      toast.error('Không thể xóa Kho Tổng');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa chi nhánh này? Mọi dữ liệu liên kết có thể bị ảnh hưởng nếu vẫn còn sử dụng mã này.')) {
      dispatch({ type: 'DELETE_STORE_BRANCH', payload: id });
      toast.success('Đã xóa chi nhánh');
    }
  };

  if (state.currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <ShieldAlert className="w-16 h-16 text-neon-pink mb-4" />
        <h2 className="text-2xl font-bold text-neon-pink">Không có quyền truy cập</h2>
        <p className="text-dark-muted mt-2">Tính năng này chỉ dành cho Admin.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan">Cài Đặt</h1>
          <p className="text-dark-muted">Quản lý các chi nhánh và thông tin hệ thống</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center px-4 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-md hover:bg-neon-cyan hover:text-dark-bg transition-colors font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm chi nhánh
          </button>
        )}
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-dark-border bg-dark-bg/50">
          <h3 className="font-semibold text-neon-green">Danh Sách Chi Nhánh</h3>
        </div>

        {(isAdding || editingId) && (
          <div className="p-4 border-b border-dark-border bg-dark-bg/30">
            <h4 className="font-semibold text-dark-text mb-3">{editingId ? 'Sửa chi nhánh' : 'Thêm chi nhánh mới'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dark-muted mb-1">Tên chi nhánh *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md dark-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: PH Đà Nẵng 2"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-muted mb-1">Mã chi nhánh * (Không dấu, viết liền)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md dark-input uppercase"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  placeholder="VD: PH_DN_2"
                  disabled={!!editingId && formData.code === 'KHO_TONG'}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-dark-muted mb-1">Địa chỉ</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md dark-input"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nhập địa chỉ..."
                />
              </div>
              <div className="flex items-center md:col-span-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="mr-2 rounded border-dark-border bg-dark-bg text-neon-cyan focus:ring-neon-cyan/50 h-4 w-4"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm font-medium text-dark-text cursor-pointer">
                  Đang hoạt động
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-md border border-dark-border text-dark-muted hover:text-dark-text transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-2" /> Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan hover:text-dark-bg transition-colors font-medium flex items-center"
              >
                <Check className="w-4 h-4 mr-2" /> Lưu
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dark-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-dark-muted">Mã</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-dark-muted">Tên CN</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-dark-muted">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-dark-muted">Địa chỉ</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-dark-muted text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.storeBranches.map(branch => (
                <tr key={branch.id} className="border-t border-dark-border hover:bg-dark-border/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-neon-cyan">
                    {branch.code}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-dark-text">
                    {branch.name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {branch.isActive ? (
                      <span className="px-2 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-full text-xs">Hoạt động</span>
                    ) : (
                      <span className="px-2 py-1 bg-neon-pink/10 text-neon-pink border border-neon-pink/30 rounded-full text-xs">Tạm ngưng</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-muted">
                    {branch.address || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="text-dark-muted hover:text-neon-cyan transition-colors mr-3"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!['KHO_TONG'].includes(branch.code) && (
                      <button
                        onClick={() => handleDelete(branch.id, branch.code)}
                        className="text-dark-muted hover:text-neon-pink transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
