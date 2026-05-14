import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Device } from "../types";
import { Search, Smartphone, Package, ArrowRightLeft, ShieldAlert, UserPlus, Store, Settings } from "lucide-react";

const RECEPTION_TYPE_MAP: Record<string, { label: string, icon: any, color: string }> = {
  IMPORT: { label: 'Nhập mới', icon: Package, color: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10' },
  TRADE_IN: { label: 'Thu cũ đổi mới', icon: ArrowRightLeft, color: 'text-neon-pink border-neon-pink/30 bg-neon-pink/10' },
  WARRANTY: { label: 'Bảo hành', icon: ShieldAlert, color: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' },
  SERVICE: { label: 'Dịch vụ/Sửa lẻ', icon: UserPlus, color: 'text-neon-green border-neon-green/30 bg-neon-green/10' },
  SHOP_TRANSFER: { label: 'Shop chuyển', icon: Store, color: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10' },
};

export default function NguonHang() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('IMPORT');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH' | 'CUSTOM'>('ALL');
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    imei: true,
    model: true,
    color: true,
    capacity: true,
    source: true,
    status: true,
    location: true,
    receptionDate: true,
    importPrice: true,
    repairCost: true,
    totalCost: true,
    notes: true,
    customerInfo: true,
    customerPhone: true,
  });

  const filteredDevices = state.devices.filter(d => {
    const matchesSearch = d.imei.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = d.receptionType === activeTab;
    const isCurrentStock = d.status !== 'DA_BAN' && d.status !== 'DA_TRA_NCC';
    
    // Date filtering
    let matchesDate = true;
    if (dateRange !== 'ALL') {
      const deviceDate = d.receptionDate ? new Date(d.receptionDate) : (d.importDate ? new Date(d.importDate) : null);
      if (!deviceDate) return false;
      const now = new Date();
      
      if (dateRange === 'TODAY') {
        matchesDate = deviceDate.toDateString() === now.toDateString();
      } else if (dateRange === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = deviceDate >= weekAgo;
      } else if (dateRange === 'MONTH') {
        matchesDate = deviceDate.getMonth() === now.getMonth() && deviceDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'LAST_MONTH') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        matchesDate = deviceDate.getMonth() === lastMonth.getMonth() && deviceDate.getFullYear() === lastMonth.getFullYear();
      } else if (dateRange === 'CUSTOM') {
        if (customDateFrom) matchesDate = matchesDate && deviceDate >= new Date(customDateFrom);
        if (customDateTo) matchesDate = matchesDate && deviceDate <= new Date(customDateTo);
      }
    }

    // Supplier filter
    let matchesSupplier = true;
    if (activeTab === 'IMPORT' && selectedSupplier) {
      matchesSupplier = d.source === selectedSupplier;
    }

    // Shop filter
    let matchesShop = true;
    if (activeTab === 'SHOP_TRANSFER' && selectedShop) {
      matchesShop = d.source === selectedShop;
    }

    return matchesSearch && matchesType && isCurrentStock && matchesDate && matchesSupplier && matchesShop;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
          <Package className="w-6 h-6 mr-2" />
          Hàng Hóa Theo Nguồn Đầu Vào
        </h1>
      </div>

      <div className="bg-dark-card p-1 rounded-lg border border-dark-border overflow-hidden">
        <div className="flex overflow-x-auto p-1 gap-2">
          {Object.entries(RECEPTION_TYPE_MAP).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setSelectedSupplier("");
                setSelectedShop("");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center whitespace-nowrap ${
                activeTab === key 
                  ? 'bg-neon-cyan text-dark-bg' 
                  : 'text-dark-muted hover:text-dark-text hover:bg-dark-border'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Số lượng tồn</p>
          <p className="text-lg font-bold text-dark-text">{filteredDevices.length} máy</p>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Tổng vốn tồn</p>
          <p className="text-lg font-bold text-neon-cyan">
            {filteredDevices.reduce((sum, d) => sum + d.importPrice, 0).toLocaleString('vi-VN')} đ
          </p>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border md:col-span-2">
          <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Mô tả nguồn</p>
          <p className="text-sm text-dark-text">
            {activeTab === 'IMPORT' && "Máy nhập số lượng lớn từ các Nhà cung cấp (NCC). Đây là nguồn hàng chính để kinh doanh."}
            {activeTab === 'TRADE_IN' && "Máy thu lại từ khách hàng lẻ khi họ có nhu cầu lên đời máy."}
            {activeTab === 'WARRANTY' && "Máy do các Shop gửi về hoặc khách mang đến để xử lý các vấn đề phát sinh sau bán hàng."}
            {activeTab === 'SERVICE' && "Khách hàng mang máy đến sửa chữa (không phải máy của hệ thống bán ra)."}
            {activeTab === 'SHOP_TRANSFER' && "Điều chuyển hàng hóa giữa các chi nhánh (ví dụ từ XStore về Kho Tổng để bảo trì)."}
          </p>
        </div>
      </div>

      <div className="bg-dark-card p-4 rounded-xl border border-dark-border space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-dark-muted mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
              <input
                type="text"
                placeholder="Tìm IMEI, Model..."
                className="w-full pl-9 pr-4 py-2 rounded-md text-sm dark-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-[180px]">
            <label className="block text-xs text-dark-muted mb-1">Khung thời gian</label>
            <select
              className="w-full dark-input p-2 rounded-md text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
            >
              <option value="ALL">Tất cả</option>
              <option value="TODAY">Hôm nay</option>
              <option value="WEEK">Trong tuần</option>
              <option value="MONTH">Trong tháng</option>
              <option value="LAST_MONTH">Tháng trước</option>
              <option value="CUSTOM">Tùy chỉnh</option>
            </select>
          </div>

          {dateRange === 'CUSTOM' && (
            <>
              <div className="w-[150px]">
                <label className="block text-xs text-dark-muted mb-1">Từ ngày</label>
                <input type="date" className="w-full dark-input p-2 rounded-md text-sm" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} />
              </div>
              <div className="w-[150px]">
                <label className="block text-xs text-dark-muted mb-1">Đến ngày</label>
                <input type="date" className="w-full dark-input p-2 rounded-md text-sm" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} />
              </div>
            </>
          )}

          {activeTab === 'IMPORT' && (
            <div className="w-[180px]">
              <label className="block text-xs text-dark-muted mb-1">Nhà cung cấp</label>
              <select
                className="w-full dark-input p-2 rounded-md text-sm"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="">Tất cả NCC</option>
                {state.suppliers.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'SHOP_TRANSFER' && (
            <div className="w-[180px]">
              <label className="block text-xs text-dark-muted mb-1">Shop chuyển</label>
              <select
                className="w-full dark-input p-2 rounded-md text-sm"
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
              >
                <option value="">Tất cả Shop</option>
                <option value="XStore">XStore</option>
                <option value="PH_DN">PH_DN</option>
                <option value="PH_HUE">PH_HUE</option>
                <option value="PH_QNG">PH_QNG</option>
              </select>
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-text hover:bg-dark-border/50 bg-dark-bg flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Cột hiển thị
            </button>
            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-md shadow-lg z-10 p-2">
                {Object.entries({
                  imei: 'IMEI',
                  model: 'Model',
                  color: 'Màu sắc',
                  capacity: 'Dung lượng',
                  source: 'Nguồn gốc',
                  status: 'Trạng thái',
                  location: 'Vị trí',
                  receptionDate: 'Ngày nhận',
                  importPrice: 'Giá nhập',
                  repairCost: 'Phí sửa chữa',
                  totalCost: 'Tổng giá',
                  notes: 'Ghi chú',
                  customerInfo: 'Khách hàng',
                  customerPhone: 'SĐT Khách',
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center p-2 hover:bg-dark-bg rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 rounded border-dark-border bg-dark-bg text-neon-cyan focus:ring-neon-cyan focus:ring-offset-dark-card"
                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                      onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof visibleColumns] }))}
                    />
                    <span className="text-sm text-dark-text">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="dark-table">
            <thead>
              <tr>
                {visibleColumns.imei && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">IMEI</th>}
                {visibleColumns.model && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Model</th>}
                {visibleColumns.color && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Màu sắc</th>}
                {visibleColumns.capacity && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dung lượng</th>}
                {visibleColumns.source && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nguồn gốc</th>}
                {visibleColumns.status && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng Thái</th>}
                {visibleColumns.location && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Vị Trí Hiện Tại</th>}
                {visibleColumns.receptionDate && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngày Nhận</th>}
                {visibleColumns.importPrice && <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Giá Nhập</th>}
                {visibleColumns.repairCost && <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Phí Sửa Chữa</th>}
                {visibleColumns.totalCost && <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Tổng Giá</th>}
                {visibleColumns.notes && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ghi chú</th>}
                {visibleColumns.customerInfo && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Khách hàng</th>}
                {visibleColumns.customerPhone && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">SĐT Khách</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                // Determine current location
                const activeTask = state.tasks.find(t => t.deviceId === device.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
                let currentLocation = 'Kho Tổng';
                if (activeTask) {
                  const assignee = state.users.find(u => u.id === activeTask.assigneeId);
                  currentLocation = assignee ? `KT: ${assignee.name}` : 'Kho Tổng';
                } else if (device.location && device.location !== 'KHO_TONG') {
                  currentLocation = device.location;
                }

                // Calculate repair cost
                const deviceTasks = state.tasks.filter(t => t.deviceId === device.id);
                let repairCost = 0;
                deviceTasks.forEach(task => {
                  repairCost += task.commission || 0;
                  if (task.usedParts) {
                    task.usedParts.forEach(up => {
                      const part = state.parts.find(p => p.id === up.partId);
                      if (part) {
                        repairCost += (part.price * up.quantity);
                      }
                    });
                  }
                });

                const totalCost = device.importPrice + repairCost;

                return (
                  <tr key={device.id}>
                    {visibleColumns.imei && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                        <button 
                          onClick={() => navigate(`/thiet-bi/${device.imei}`)}
                          className="flex items-center hover:text-neon-cyan transition-colors group"
                        >
                          <Smartphone className="w-4 h-4 mr-2 text-neon-cyan group-hover:scale-110 transition-transform" />
                          <span className="border-b border-transparent group-hover:border-neon-cyan">{device.imei}</span>
                        </button>
                      </td>
                    )}
                    {visibleColumns.model && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.model}
                      </td>
                    )}
                    {visibleColumns.color && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.color}
                      </td>
                    )}
                    {visibleColumns.capacity && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.capacity}
                      </td>
                    )}
                    {visibleColumns.source && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.source}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-dark-bg border border-dark-border text-dark-muted">
                          {device.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    )}
                    {visibleColumns.location && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text font-medium">
                        {currentLocation}
                      </td>
                    )}
                    {visibleColumns.receptionDate && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.receptionDate || device.importDate}
                      </td>
                    )}
                    {visibleColumns.importPrice && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neon-cyan font-bold">
                        {device.importPrice.toLocaleString('vi-VN')} đ
                      </td>
                    )}
                    {visibleColumns.repairCost && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-500 font-bold">
                        {repairCost.toLocaleString('vi-VN')} đ
                      </td>
                    )}
                    {visibleColumns.totalCost && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neon-pink font-bold">
                        {totalCost.toLocaleString('vi-VN')} đ
                      </td>
                    )}
                    {visibleColumns.notes && (
                      <td className="px-6 py-4 text-sm text-dark-muted max-w-xs truncate" title={device.notes}>
                        {device.notes}
                      </td>
                    )}
                    {visibleColumns.customerInfo && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.customerInfo}
                      </td>
                    )}
                    {visibleColumns.customerPhone && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.customerPhone}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-sm text-dark-muted">
                    Không có máy nào thuộc nguồn này trong kho.
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
