import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Transaction, DeviceLocation } from '../types';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Search, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SHOP_LABELS: Record<string, string> = {
  KHO_TONG: 'Kho Tổng',
  XSTORE: 'Xstore',
  PH_DN: 'PH Đà Nẵng',
  PH_HUE: 'PH Huế',
  PH_QNG: 'PH Quảng Ngãi',
};

const CATEGORY_LABELS: Record<string, string> = {
  SALE: 'Bán hàng',
  IMPORT: 'Nhập hàng',
  SALARY: 'Lương',
  UTILITIES: 'Điện nước/Chi phí',
  DEBT_COLLECTION: 'Thu nợ khách hàng',
  OTHER: 'Khác',
};

export default function SoQuy() {
  const { state, dispatch } = useAppContext();
  const [selectedStore, setSelectedStore] = useState<DeviceLocation | 'KHO_TONG' | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'EXPENSE',
    amount: 0,
    category: 'OTHER',
    description: '',
    storeId: 'KHO_TONG',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(tx => {
      const matchStore = selectedStore === 'ALL' || tx.storeId === selectedStore;
      const matchDate = !dateFilter || tx.date.startsWith(dateFilter);
      return matchStore && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, selectedStore, dateFilter]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(tx => {
      if (tx.type === 'INCOME') income += tx.amount;
      else expense += tx.amount;
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || newTx.amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (!newTx.description) {
      toast.error('Vui lòng nhập mô tả');
      return;
    }

    const transaction: Transaction = {
      id: `TXN-${Date.now()}`,
      type: newTx.type as 'INCOME' | 'EXPENSE',
      amount: Number(newTx.amount),
      category: newTx.category as any,
      description: newTx.description,
      date: newTx.date || new Date().toISOString(),
      storeId: newTx.storeId as any,
      createdBy: state.currentUser?.id || 'unknown'
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    toast.success('Đã thêm giao dịch!');
    setIsAddModalOpen(false);
    setNewTx({
      type: 'EXPENSE',
      amount: 0,
      category: 'OTHER',
      description: '',
      storeId: 'KHO_TONG',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            Sổ Quỹ
          </h1>
          <p className="text-dark-muted text-sm mt-1">Quản lý thu chi các cửa hàng</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto neon-button flex items-center justify-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Giao Dịch
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-dark-muted" />
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value as any)}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
          >
            <option value="ALL">Tất cả cửa hàng</option>
            {Object.entries(SHOP_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-dark-muted" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-neon-cyan hover:underline">Xóa</button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-muted mb-1">Tổng Thu</p>
            <p className="text-2xl font-bold text-green-400">{summary.income.toLocaleString()}đ</p>
          </div>
          <div className="p-3 bg-green-400/10 rounded-full">
            <ArrowUpRight className="w-6 h-6 text-green-400" />
          </div>
        </div>
        <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-muted mb-1">Tổng Chi</p>
            <p className="text-2xl font-bold text-red-400">{summary.expense.toLocaleString()}đ</p>
          </div>
          <div className="p-3 bg-red-400/10 rounded-full">
            <ArrowDownRight className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-muted mb-1">Tồn Quỹ</p>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-neon-cyan' : 'text-red-400'}`}>
              {summary.balance.toLocaleString()}đ
            </p>
          </div>
          <div className="p-3 bg-neon-cyan/10 rounded-full">
            <DollarSign className="w-6 h-6 text-neon-cyan" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-bg/50 text-dark-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-dark-border">Ngày</th>
                <th className="p-4 font-medium border-b border-dark-border">Cửa hàng</th>
                <th className="p-4 font-medium border-b border-dark-border">Loại</th>
                <th className="p-4 font-medium border-b border-dark-border">Danh mục</th>
                <th className="p-4 font-medium border-b border-dark-border">Mô tả</th>
                <th className="p-4 font-medium border-b border-dark-border text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-muted">
                    Không có giao dịch nào
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-dark-bg/30 transition-colors">
                    <td className="p-4 text-dark-text whitespace-nowrap">
                      {format(new Date(tx.date), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="p-4 text-dark-text">
                      <span className="px-2 py-1 bg-dark-bg rounded text-xs border border-dark-border">
                        {SHOP_LABELS[tx.storeId] || tx.storeId}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        tx.type === 'INCOME' 
                          ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                          : 'bg-red-400/10 text-red-400 border-red-400/20'
                      }`}>
                        {tx.type === 'INCOME' ? 'THU' : 'CHI'}
                      </span>
                    </td>
                    <td className="p-4 text-dark-muted">
                      {CATEGORY_LABELS[tx.category] || tx.category}
                    </td>
                    <td className="p-4 text-dark-text max-w-xs truncate" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className={`p-4 text-right font-bold ${
                      tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString()}đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
              <h2 className="text-lg font-bold text-neon-cyan">Thêm Giao Dịch</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Loại giao dịch</label>
                  <select
                    value={newTx.type}
                    onChange={(e) => setNewTx({...newTx, type: e.target.value as any})}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
                  >
                    <option value="INCOME">Thu</option>
                    <option value="EXPENSE">Chi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Cửa hàng</label>
                  <select
                    value={newTx.storeId}
                    onChange={(e) => setNewTx({...newTx, storeId: e.target.value as any})}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
                  >
                    {Object.entries(SHOP_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newTx.amount || ''}
                    onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-muted mb-1">Danh mục</label>
                  <select
                    value={newTx.category}
                    onChange={(e) => setNewTx({...newTx, category: e.target.value as any})}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-muted mb-1">Ngày</label>
                <input
                  type="date"
                  required
                  value={newTx.date?.split('T')[0]}
                  onChange={(e) => setNewTx({...newTx, date: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-muted mb-1">Mô tả chi tiết</label>
                <textarea
                  required
                  value={newTx.description}
                  onChange={(e) => setNewTx({...newTx, description: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none min-h-[80px]"
                  placeholder="Ví dụ: Tiền điện tháng 4, Lương nv A..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-dark-muted hover:text-dark-text transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="neon-button px-6 py-2 text-sm"
                >
                  Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
