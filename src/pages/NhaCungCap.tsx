import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Supplier, Transaction, DeviceLocation } from '../types';
import { Truck, Search, DollarSign, Plus, X, Phone, MapPin, Check, Store } from 'lucide-react';
import toast from 'react-hot-toast';



export default function NhaCungCap() {
  const { state, dispatch } = useAppContext();
  
  const SHOP_LABELS = state.storeBranches.reduce((acc, branch) => {
    acc[branch.code] = branch.name;
    return acc;
  }, {} as Record<string, string>);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStore, setSelectedStore] = useState<string>(
    state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'KHO_MAY' ? 'ALL' : (state.currentUser?.storeId || 'KHO_TONG')
  );

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '', phone: '', address: '', notes: ''
  });

  const [debtPayment, setDebtPayment] = useState({
    amount: '', paymentMethod: 'TRANSFER' as 'CASH' | 'TRANSFER' | 'CARD', storeId: state.currentUser?.storeId || 'KHO_TONG', notes: ''
  });

  const suppliers = useMemo(() => {
    return state.suppliers
      .filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (s.phone && s.phone.includes(searchQuery));
        if (!matchSearch) return false;
        
        if (selectedStore !== 'ALL') {
          return s.storeDebts && s.storeDebts[selectedStore] > 0;
        }
        return true;
      });
  }, [state.suppliers, searchQuery, selectedStore]);

  const totalDebtSystem = useMemo(() => {
    if (selectedStore === 'ALL') {
      return state.suppliers.reduce((sum, s) => sum + (s.totalDebt || 0), 0);
    }
    return state.suppliers.reduce((sum, s) => sum + (s.storeDebts?.[selectedStore] || 0), 0);
  }, [state.suppliers, selectedStore]);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) {
      toast.error('Vui lòng nhập tên nhà cung cấp');
      return;
    }
    const supplier: Supplier = {
      id: `SUP-${Date.now()}`,
      name: newSupplier.name,
      phone: newSupplier.phone,
      address: newSupplier.address,
      notes: newSupplier.notes,
      totalDebt: 0
    };
    dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
    toast.success('Thêm nhà cung cấp thành công!');
    setIsSupplierModalOpen(false);
    setNewSupplier({ name: '', phone: '', address: '', notes: '' });
  };

  const handleOpenDebtModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    const maxDebt = selectedStore === 'ALL' ? supplier.totalDebt : (supplier.storeDebts?.[selectedStore] || 0);
    
    setDebtPayment({
      amount: (maxDebt || 0).toString(),
      paymentMethod: 'TRANSFER',
      storeId: selectedStore === 'ALL' ? (state.currentUser?.storeId || 'KHO_TONG') : selectedStore,
      notes: `Thanh toán công nợ cho nhà cung cấp ${supplier.name}`
    });
    setIsDebtModalOpen(true);
  };

  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    
    const amount = Number(debtPayment.amount);
    const currentMaxDebt = debtPayment.storeId === 'KHO_TONG' || debtPayment.storeId === 'ALL' ? selectedSupplier.totalDebt : (selectedSupplier.storeDebts?.[debtPayment.storeId] || 0);
    
    // Check total debt
    if (amount <= 0 || amount > (selectedSupplier.totalDebt || 0) || amount > (currentMaxDebt || 0)) {
      toast.error('Số tiền thanh toán không hợp lệ!');
      return;
    }

    const now = new Date().toISOString();

    // Create Transaction (EXPENSE)
    const newTransaction: Transaction = {
      id: `TXN-${Date.now()}`,
      type: 'EXPENSE',
      amount: amount,
      category: 'SUPPLIER_PAYMENT',
      description: debtPayment.notes,
      date: now,
      storeId: debtPayment.storeId as DeviceLocation | 'KHO_TONG',
      createdBy: state.currentUser?.id || 'unknown',
      referenceId: selectedSupplier.id
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });

    // Update Supplier Debt
    dispatch({
      type: 'UPDATE_SUPPLIER',
      payload: {
        ...selectedSupplier,
        totalDebt: Math.max(0, (selectedSupplier.totalDebt || 0) - amount),
        storeDebts: {
          ...selectedSupplier.storeDebts,
          [debtPayment.storeId]: Math.max(0, (selectedSupplier.storeDebts?.[debtPayment.storeId] || 0) - amount)
        }
      }
    });

    toast.success(`Đã thanh toán công nợ cho ${SHOP_LABELS[debtPayment.storeId] || debtPayment.storeId}!`);
    setIsDebtModalOpen(false);
    setSelectedSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <Truck className="w-6 h-6 mr-2" />
            Nhà Cung Cấp & Công Nợ
          </h1>
          <p className="text-dark-muted text-sm mt-1">Quản lý nhà cung cấp linh kiện/máy và công nợ</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {(!state.currentUser?.storeId || state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'KHO_MAY') && (
            <div className="flex items-center bg-dark-card border border-dark-border rounded-lg px-3 py-2 w-full sm:w-auto">
              <Store className="w-4 h-4 text-dark-muted mr-2 shrink-0" />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-transparent text-dark-text outline-none text-sm font-medium w-full"
              >
                <option value="ALL" className="bg-dark-card">Tất cả chi nhánh</option>
                {Object.entries(SHOP_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-dark-card">{label}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="w-full sm:w-auto neon-button px-4 py-2 flex items-center justify-center font-bold whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2 border-2 border-current rounded-sm" />
            Thêm NCC
          </button>

          <div className="w-full sm:w-auto bg-dark-card border border-red-500/30 rounded-lg px-4 py-2 flex items-center shadow-[0_0_10px_rgba(239,68,68,0.1)]">
            <DollarSign className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <p className="text-xs text-dark-muted">{selectedStore === 'ALL' ? 'Tổng nợ phải trả NCC' : `Nợ tại ${SHOP_LABELS[selectedStore]}`}</p>
              <p className="text-lg font-bold text-red-500">{totalDebtSystem.toLocaleString()}đ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-lg">
        <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Tìm theo tên/SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-4 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark-text">
            <thead className="text-xs text-dark-muted uppercase bg-dark-bg/50 border-b border-dark-border">
              <tr>
                <th className="px-6 py-3">Nhà cung cấp</th>
                <th className="px-6 py-3">Liên hệ</th>
                <th className="px-6 py-3">Địa chỉ/Ghi chú</th>
                <th className="px-6 py-3 text-right">Công nợ cần trả</th>
                <th className="px-6 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-dark-muted">
                    Không tìm thấy nhà cung cấp nào.
                  </td>
                </tr>
              ) : (
                suppliers.map(supplier => {
                  const debt = selectedStore === 'ALL' ? supplier.totalDebt : (supplier.storeDebts?.[selectedStore] || 0);

                  return (
                  <tr key={supplier.id} className="hover:bg-dark-bg/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{supplier.name}</td>
                    <td className="px-6 py-4">
                      {supplier.phone ? (
                        <div className="flex items-center text-dark-muted">
                          <Phone className="w-3 h-3 mr-1" />
                          {supplier.phone}
                        </div>
                      ) : (
                        <span className="text-dark-muted italic">Chưa có SĐT</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-dark-muted flex items-start gap-1">
                        {supplier.address && (
                          <div className="flex items-center text-xs">
                            <MapPin className="w-3 h-3 mr-1 shrink-0" />
                            {supplier.address}
                          </div>
                        )}
                      </div>
                      {supplier.notes && (
                        <p className="text-xs text-dark-muted opacity-70 mt-1 pl-4" title={supplier.notes}>{supplier.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {debt && debt > 0 ? (
                        <span className="font-bold text-red-500">{debt.toLocaleString()}đ</span>
                      ) : (
                        <span className="text-dark-muted font-bold text-green-500">0đ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {debt && debt > 0 ? (
                        <button
                          onClick={() => handleOpenDebtModal(supplier)}
                          className="px-3 py-1 bg-neon-pink/10 text-neon-pink border border-neon-pink/30 rounded hover:bg-neon-pink hover:text-dark-bg transition-colors text-xs font-medium"
                        >
                          Thanh Toán Nợ
                        </button>
                      ) : (
                        <span className="text-xs text-dark-muted px-3 py-1">Đã hết nợ</span>
                      )}
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-bold text-neon-cyan flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Thêm Nhà Cung Cấp
              </h3>
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
                title="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Tên Nhà cung cấp <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="Ví dụ: Công ty Linh Kiện X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Số điện thoại (Không bắt buộc)</label>
                <input
                  type="text"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="0901xxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Địa chỉ (Không bắt buộc)</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Ghi chú thêm</label>
                <textarea
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none resize-none"
                  rows={3}
                  placeholder="..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-dark-bg text-dark-text border border-dark-border rounded-lg hover:bg-dark-border transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 neon-button rounded-lg flex items-center font-medium text-sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Xác Nhận & Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Payment Modal */}
      {isDebtModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-bold text-neon-pink flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Thanh Toán Nợ NCC
              </h3>
              <button 
                onClick={() => setIsDebtModalOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePayDebt} className="p-4 space-y-4">
              <div className="bg-dark-bg p-3 rounded-lg border border-dark-border mb-4">
                <p className="text-sm text-dark-muted mb-1">Nhà cung cấp: <span className="text-dark-text font-bold">{selectedSupplier.name}</span></p>
                <p className="text-sm text-dark-muted">Nợ cần trả: <span className="text-red-500 font-bold">
                  {selectedStore === 'ALL' || selectedStore === 'KHO_TONG' ? (selectedSupplier.totalDebt || 0).toLocaleString() : (selectedSupplier.storeDebts?.[selectedStore] || 0).toLocaleString()}đ
                  {selectedStore !== 'ALL' && selectedStore !== 'KHO_TONG' && ` (tại ${SHOP_LABELS[selectedStore] || selectedStore})`}
                </span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Số tiền thanh toán</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    max={selectedStore === 'ALL' || selectedStore === 'KHO_TONG' ? selectedSupplier.totalDebt || 0 : (selectedSupplier.storeDebts?.[selectedStore] || 0)}
                    value={debtPayment.amount}
                    onChange={(e) => setDebtPayment({...debtPayment, amount: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted">VNĐ</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Hình thức chi</label>
                <select
                  value={debtPayment.paymentMethod}
                  onChange={(e) => setDebtPayment({...debtPayment, paymentMethod: e.target.value as any})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                >
                  <option value="TRANSFER">Chuyển khoản</option>
                  <option value="CASH">Tiền mặt</option>
                  <option value="CARD">Quẹt thẻ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Ghi chú thanh toán</label>
                <textarea
                  value={debtPayment.notes}
                  onChange={(e) => setDebtPayment({...debtPayment, notes: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none h-20 resize-none"
                  placeholder="Nội dung thanh toán..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-4 py-2 bg-dark-bg text-dark-text border border-dark-border rounded-lg hover:bg-dark-border transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-neon-pink bg-neon-pink/10 text-neon-pink rounded-lg hover:bg-neon-pink hover:text-white transition-colors flex items-center font-medium text-sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Xác Nhận Chi Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
