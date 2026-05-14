import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Device, DeviceLocation } from '../types';
import { Store, Truck, ShoppingCart, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const SHOP_LABELS: Record<string, string> = {
  KHO_TONG: 'Kho Tổng',
  XSTORE: 'Xstore',
  PH_DN: 'PH Đà Nẵng',
  PH_HUE: 'PH Huế',
  PH_QNG: 'PH Quảng Ngãi',
  DA_BAN: 'Đã Bán',
};

export default function PhanPhoi() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'KHO_TONG' | 'SHOPS' | 'SERVICE_RETURN' | 'WARRANTY_RETURN' | 'HISTORY'>('KHO_TONG');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [transferShop, setTransferShop] = useState<DeviceLocation>('XSTORE');
  const [sellPrice, setSellPrice] = useState(0);
  const [customerInfo, setCustomerInfo] = useState('');
  const [actionType, setActionType] = useState<'TRANSFER' | 'SELL' | 'SERVICE_RETURN' | 'WARRANTY_RETURN'>('TRANSFER');

  useEffect(() => {
    if (selectedDevice) {
      setCustomerInfo(selectedDevice.customerInfo || '');
      setSellPrice(selectedDevice.sellPrice || 0);
    } else {
      setCustomerInfo('');
      setSellPrice(0);
    }
  }, [selectedDevice]);

  const readyDevices = state.devices.filter(d => d.status === 'CHO_BAN' && (!d.location || d.location === 'KHO_TONG'));
  const shopDevices = state.devices.filter(d => d.location && d.location !== 'KHO_TONG' && d.location !== 'DA_BAN' && d.status !== 'HOAN_TAT');
  const serviceReturnDevices = state.devices.filter(d => d.receptionType === 'SERVICE' && (d.status === 'HOAN_TAT' || d.status === 'CHO_BAN'));
  const warrantyReturnDevices = state.devices.filter(d => d.receptionType === 'WARRANTY' && (d.status === 'HOAN_TAT' || d.status === 'CHO_BAN'));
  const soldDevices = state.devices.filter(d => d.location === 'DA_BAN' || d.status === 'DA_BAN');

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    // Check for active tasks
    const activeTasks = state.tasks.filter(t => t.deviceId === selectedDevice.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
    if (activeTasks.length > 0) {
      alert(`Không thể chuyển máy! Máy vẫn còn ${activeTasks.length} task chưa hoàn thành/đóng.`);
      return;
    }

    dispatch({
      type: 'UPDATE_DEVICE',
      payload: {
        ...selectedDevice,
        location: transferShop,
        notes: `${selectedDevice.notes}\n[CHUYỂN KHO]: Chuyển đến ${SHOP_LABELS[transferShop]} lúc ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      }
    });

    alert(`Đã chuyển máy đến ${SHOP_LABELS[transferShop]}`);
    setSelectedDevice(null);
  };

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    dispatch({
      type: 'UPDATE_DEVICE',
      payload: {
        ...selectedDevice,
        status: 'DA_BAN',
        location: 'DA_BAN',
        sellPrice,
        customerInfo,
        sellDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
        notes: `${selectedDevice.notes}\n[BÁN HÀNG]: Bán giá ${sellPrice.toLocaleString()}đ cho KH: ${customerInfo}`,
      }
    });

    alert('Đã ghi nhận bán máy thành công!');
    setSelectedDevice(null);
    setSellPrice(0);
    setCustomerInfo('');
  };

  const handleServiceReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    dispatch({
      type: 'UPDATE_DEVICE',
      payload: {
        ...selectedDevice,
        status: 'HOAN_TAT', // Use HOAN_TAT for service return
        location: 'DA_BAN', // Still mark as out of inventory
        sellPrice,
        customerInfo: selectedDevice.customerInfo || customerInfo,
        sellDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
        notes: `${selectedDevice.notes}\n[TRẢ MÁY SỬA LẺ]: Hoàn tất & Thu tiền ${sellPrice.toLocaleString()}đ từ KH: ${selectedDevice.customerInfo || customerInfo}`,
      }
    });

    alert('Đã xác nhận trả máy và thu tiền thành công!');
    setSelectedDevice(null);
    setSellPrice(0);
    setCustomerInfo('');
  };

  const handleWarrantyReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    dispatch({
      type: 'UPDATE_DEVICE',
      payload: {
        ...selectedDevice,
        status: 'HOAN_TAT', // Use HOAN_TAT for warranty return
        location: 'DA_BAN',
        sellDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
        notes: `${selectedDevice.notes}\n[TRẢ MÁY BẢO HÀNH]: Hoàn tất & Trả máy cho KH: ${selectedDevice.customerInfo || customerInfo}`,
      }
    });

    alert('Đã xác nhận trả máy bảo hành thành công!');
    setSelectedDevice(null);
    setCustomerInfo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Phân Phối & Bán Hàng</h1>
        <div className="bg-dark-card p-1 rounded-lg border border-dark-border w-full lg:w-auto overflow-hidden">
          <div className="tab-scroll p-1">
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'KHO_TONG' ? 'bg-neon-cyan/20 text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('KHO_TONG')}
            >
              Kho Tổng (Sẵn Sàng)
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'SHOPS' ? 'bg-neon-cyan/20 text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('SHOPS')}
            >
              Tồn Kho Shop
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'SERVICE_RETURN' ? 'bg-neon-green/20 text-neon-green shadow-sm border border-neon-green/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('SERVICE_RETURN')}
            >
              Trả Máy Sửa Lẻ
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'WARRANTY_RETURN' ? 'bg-neon-pink/20 text-neon-pink shadow-sm border border-neon-pink/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('WARRANTY_RETURN')}
            >
              Trả Máy Bảo Hành
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-neon-cyan/20 text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('HISTORY')}
            >
              Lịch Sử Bán
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Danh sách máy */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden col-span-1 lg:col-span-2">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-medium text-dark-text flex items-center">
              {activeTab === 'KHO_TONG' && <><Store className="w-5 h-5 mr-2 text-neon-cyan" /> Máy Sẵn Sàng Phân Phối ({readyDevices.length})</>}
              {activeTab === 'SHOPS' && <><Store className="w-5 h-5 mr-2 text-neon-cyan" /> Máy Đang Ở Shop ({shopDevices.length})</>}
              {activeTab === 'SERVICE_RETURN' && <><CheckCircle className="w-5 h-5 mr-2 text-neon-green" /> Chờ Trả Máy Sửa Lẻ ({serviceReturnDevices.length})</>}
              {activeTab === 'WARRANTY_RETURN' && <><CheckCircle className="w-5 h-5 mr-2 text-neon-pink" /> Chờ Trả Máy Bảo Hành ({warrantyReturnDevices.length})</>}
              {activeTab === 'HISTORY' && <><ShoppingCart className="w-5 h-5 mr-2 text-neon-cyan" /> Máy Đã Bán ({soldDevices.length})</>}
            </h3>
            <div className="relative w-full sm:w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
              <input 
                type="text" 
                placeholder="Tìm IMEI, Model..." 
                className="pl-9 pr-4 py-1.5 w-full rounded-md text-sm dark-input"
              />
            </div>
          </div>
          
          <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
            {activeTab === 'KHO_TONG' && readyDevices.map(device => (
              <div 
                key={device.id} 
                onClick={() => { setSelectedDevice(device); setActionType('TRANSFER'); }}
                className={`p-4 cursor-pointer hover:bg-dark-border/50 transition-colors flex justify-between items-center ${selectedDevice?.id === device.id ? 'bg-dark-bg border-l-4 border-neon-cyan' : ''}`}
              >
                <div>
                  <p className="font-medium text-dark-text">{device.model} ({device.capacity})</p>
                  <p className="text-xs text-dark-muted font-mono mt-1">IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button></p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-dark-text">{device.color}</p>
                  <p className="text-xs text-neon-green mt-1">Sẵn sàng</p>
                </div>
              </div>
            ))}

            {activeTab === 'SHOPS' && shopDevices.map(device => (
              <div 
                key={device.id} 
                onClick={() => { setSelectedDevice(device); setActionType('SELL'); }}
                className={`p-4 cursor-pointer hover:bg-dark-border/50 transition-colors flex justify-between items-center ${selectedDevice?.id === device.id ? 'bg-dark-bg border-l-4 border-neon-cyan' : ''}`}
              >
                <div>
                  <p className="font-medium text-dark-text">{device.model} ({device.capacity})</p>
                  <p className="text-xs text-dark-muted font-mono mt-1">IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button></p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {SHOP_LABELS[device.location || 'KHO_TONG']}
                  </span>
                </div>
              </div>
            ))}

            {activeTab === 'SERVICE_RETURN' && serviceReturnDevices.map(device => (
              <div 
                key={device.id} 
                onClick={() => { setSelectedDevice(device); setActionType('SERVICE_RETURN'); setSellPrice(0); }}
                className={`p-4 cursor-pointer hover:bg-dark-border/50 transition-colors flex justify-between items-center ${selectedDevice?.id === device.id ? 'bg-dark-bg border-l-4 border-neon-green' : ''}`}
              >
                <div>
                  <p className="font-medium text-dark-text">{device.model} ({device.capacity})</p>
                  <p className="text-xs text-dark-muted font-mono mt-1">IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button></p>
                  <p className="text-xs text-neon-cyan mt-1">KH: {device.customerInfo || '---'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30">
                    Chờ Trả
                  </span>
                </div>
              </div>
            ))}

            {activeTab === 'WARRANTY_RETURN' && warrantyReturnDevices.map(device => (
              <div 
                key={device.id} 
                onClick={() => { setSelectedDevice(device); setActionType('WARRANTY_RETURN'); }}
                className={`p-4 cursor-pointer hover:bg-dark-border/50 transition-colors flex justify-between items-center ${selectedDevice?.id === device.id ? 'bg-dark-bg border-l-4 border-neon-pink' : ''}`}
              >
                <div>
                  <p className="font-medium text-dark-text">{device.model} ({device.capacity})</p>
                  <p className="text-xs text-dark-muted font-mono mt-1">IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button></p>
                  <p className="text-xs text-neon-pink mt-1">KH: {device.customerInfo || '---'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-neon-pink/20 text-neon-pink border border-neon-pink/30">
                    Chờ Trả BH
                  </span>
                </div>
              </div>
            ))}

            {activeTab === 'HISTORY' && soldDevices.map(device => (
              <div key={device.id} className="p-4 bg-dark-bg flex justify-between items-center">
                <div>
                  <p className="font-medium text-dark-text">{device.model}</p>
                  <p className="text-xs text-dark-muted font-mono mt-1">IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button></p>
                  <p className="text-xs text-dark-muted/70 mt-1">KH: {device.customerInfo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-green">{device.sellPrice?.toLocaleString('vi-VN')} đ</p>
                  <p className="text-xs text-dark-muted mt-1">{format(new Date(device.sellDate.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>
            ))}

            {((activeTab === 'KHO_TONG' && readyDevices.length === 0) || 
              (activeTab === 'SHOPS' && shopDevices.length === 0) || 
              (activeTab === 'SERVICE_RETURN' && serviceReturnDevices.length === 0) || 
              (activeTab === 'WARRANTY_RETURN' && warrantyReturnDevices.length === 0) || 
              (activeTab === 'HISTORY' && soldDevices.length === 0)) && (
              <div className="p-8 text-center text-dark-muted text-sm">
                Không có dữ liệu.
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Form thao tác */}
        <div className="col-span-1">
          {selectedDevice ? (
            <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border sticky top-6">
              <div className="p-4 border-b border-dark-border bg-dark-bg/50">
                <h3 className="text-lg font-medium text-dark-text">Thao Tác</h3>
              </div>
              
              <div className="p-4 bg-neon-cyan/10 border-b border-neon-cyan/20">
                <p className="font-medium text-neon-cyan">{selectedDevice.model}</p>
                <p className="text-sm text-neon-cyan/70 font-mono mt-1">IMEI: {selectedDevice.imei}</p>
                <p className="text-xs text-neon-cyan/80 mt-1">Vị trí hiện tại: {SHOP_LABELS[selectedDevice.location || 'KHO_TONG']}</p>
              </div>

              <div className="p-4">
                <div className="flex space-x-2 mb-6">
                  {selectedDevice.receptionType === 'SERVICE' ? (
                    <button 
                      className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${actionType === 'SERVICE_RETURN' ? 'bg-neon-green/20 border-neon-green/30 text-neon-green' : 'bg-dark-bg border-dark-border text-dark-muted hover:bg-dark-border/50'}`}
                      onClick={() => setActionType('SERVICE_RETURN')}
                    >
                      Trả Máy & Thu Tiền
                    </button>
                  ) : selectedDevice.receptionType === 'WARRANTY' ? (
                    <button 
                      className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${actionType === 'WARRANTY_RETURN' ? 'bg-neon-pink/20 border-neon-pink/30 text-neon-pink' : 'bg-dark-bg border-dark-border text-dark-muted hover:bg-dark-border/50'}`}
                      onClick={() => setActionType('WARRANTY_RETURN')}
                    >
                      Trả Máy Bảo Hành
                    </button>
                  ) : (
                    <>
                      <button 
                        className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${actionType === 'TRANSFER' ? 'bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan' : 'bg-dark-bg border-dark-border text-dark-muted hover:bg-dark-border/50'}`}
                        onClick={() => setActionType('TRANSFER')}
                      >
                        Chuyển Shop
                      </button>
                      <button 
                        className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${actionType === 'SELL' ? 'bg-neon-green/20 border-neon-green/30 text-neon-green' : 'bg-dark-bg border-dark-border text-dark-muted hover:bg-dark-border/50'}`}
                        onClick={() => setActionType('SELL')}
                      >
                        Bán Hàng
                      </button>
                    </>
                  )}
                </div>

                {actionType === 'TRANSFER' && (
                  <form onSubmit={handleTransfer} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Chọn Shop Nhận</label>
                      <select 
                        className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                        value={transferShop}
                        onChange={e => setTransferShop(e.target.value as DeviceLocation)}
                      >
                        <option value="XSTORE">Xstore</option>
                        <option value="PH_DN">PH Đà Nẵng</option>
                        <option value="PH_HUE">PH Huế</option>
                        <option value="PH_QNG">PH Quảng Ngãi</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="w-full rounded-lg text-sm font-medium neon-button flex justify-center items-center"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Xác Nhận Chuyển
                    </button>
                  </form>
                )}

                {actionType === 'SELL' && (
                  <form onSubmit={handleSell} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Giá Bán (VNĐ)</label>
                      <input 
                        type="number" 
                        required
                        className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                        value={sellPrice}
                        onChange={e => setSellPrice(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Thông Tin Khách Hàng</label>
                      <textarea 
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                        placeholder="Tên, SĐT, Kênh bán..."
                        value={customerInfo}
                        onChange={e => setCustomerInfo(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full rounded-lg text-sm font-medium neon-button-green flex justify-center items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Xác Nhận Đã Bán
                    </button>
                  </form>
                )}

                {actionType === 'SERVICE_RETURN' && (
                  <form onSubmit={handleServiceReturn} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Tổng Tiền Thu (VNĐ)</label>
                      <input 
                        type="number" 
                        required
                        className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                        value={sellPrice}
                        onChange={e => setSellPrice(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Thông Tin Khách Hàng</label>
                      <input 
                        type="text"
                        className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                        value={customerInfo}
                        onChange={e => setCustomerInfo(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full rounded-lg text-sm font-medium neon-button-green flex justify-center items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Xác Nhận Trả Máy & Thu Tiền
                    </button>
                  </form>
                )}

                {actionType === 'WARRANTY_RETURN' && (
                  <form onSubmit={handleWarrantyReturn} className="space-y-4">
                    <div className="p-4 bg-neon-pink/10 border border-neon-pink/20 rounded-lg">
                      <p className="text-sm text-neon-pink">Xác nhận trả máy bảo hành cho khách hàng.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Thông Tin Khách Hàng</label>
                      <input 
                        type="text"
                        className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                        value={customerInfo}
                        onChange={e => setCustomerInfo(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full rounded-lg text-sm font-medium neon-button flex justify-center items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Xác Nhận Trả Máy Bảo Hành
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-dark-bg rounded-xl border border-dark-border border-dashed h-full min-h-[300px] flex flex-col items-center justify-center text-dark-muted">
              <Store className="w-12 h-12 mb-4 text-dark-border" />
              <p className="text-sm text-center px-4">Chọn một máy bên trái để thực hiện chuyển shop hoặc bán hàng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
