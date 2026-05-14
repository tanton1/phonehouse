import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Device, DeviceStatus } from "../types";
import SearchableSelect from "../components/SearchableSelect";
import { 
  Store, 
  ShieldAlert, 
  UserPlus, 
  Smartphone, 
  Save, 
  Search, 
  History,
  AlertCircle,
  ArrowRightLeft,
  Plus,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

export default function TiepNhan() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'SHOP' | 'WARRANTY' | 'SERVICE' | 'TRADE_IN'>('IMPORT');
  const [searchImei, setSearchImei] = useState("");
  const [foundDevice, setFoundDevice] = useState<Device | null>(null);
  const [imeiList, setImeiList] = useState<{ imei: string, images: string[] }[]>([]);
  const [currentImei, setCurrentImei] = useState("");

  const uniqueModels: string[] = Array.from(new Set(state.products.map(p => p.model))).filter((m): m is string => !!m).sort();

  const [formData, setFormData] = useState<Partial<Device>>({
    model: "",
    color: "",
    capacity: "",
    source: "",
    notes: "",
    customerInfo: "",
    customerPhone: "",
    importPrice: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.copyFromReceipt) {
      const receipt = location.state.copyFromReceipt;
      setActiveTab('IMPORT');
      setFormData(prev => ({
        ...prev,
        source: receipt.supplierName,
        notes: receipt.notes,
        // Pre-fill model, color, capacity, importPrice from the first item if exists
        ...(receipt.items && receipt.items.length > 0 ? {
          model: receipt.items[0].model,
          color: receipt.items[0].color,
          capacity: receipt.items[0].capacity,
          importPrice: receipt.items[0].importPrice,
        } : {})
      }));
      // Clear the state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    } else if (location.state?.editReceipt) {
      const receipt = location.state.editReceipt;
      setActiveTab('IMPORT');
      setIsEditing(true);
      setEditingReceiptId(receipt.id);
      setFormData(prev => ({
        ...prev,
        source: receipt.supplierName,
        notes: receipt.notes,
        // Pre-fill model, color, capacity, importPrice from the first item if exists
        ...(receipt.items && receipt.items.length > 0 ? {
          model: receipt.items[0].model,
          color: receipt.items[0].color,
          capacity: receipt.items[0].capacity,
          importPrice: receipt.items[0].importPrice,
        } : {})
      }));
      
      // Load IMEIs from the receipt
      if (receipt.items) {
        setImeiList(receipt.items.map((item: any) => ({
          imei: item.imei,
          images: [] // We don't have images in the receipt items currently
        })));
      }
      
      // Clear the state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imei: string) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === files.length) {
          setImeiList(prev => prev.map(item => 
            item.imei === imei ? { ...item, images: [...item.images, ...newImages] } : item
          ));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, imei: string) => {
    setImeiList(prev => prev.map(item => 
      item.imei === imei ? { ...item, images: item.images.filter((_, i) => i !== index) } : item
    ));
  };

  const handleSearch = () => {
    const device = state.devices.find(d => d.imei === searchImei);
    if (device) {
      if (imeiList.find(i => i.imei === device.imei)) {
        alert("IMEI này đã có trong danh sách");
        return;
      }
      setImeiList([...imeiList, { imei: device.imei, images: device.images || [] }]);
      setFoundDevice(device);
      setFormData({
        ...formData,
        model: device.model,
        color: device.color,
        capacity: device.capacity,
        source: device.source,
        importPrice: device.importPrice,
      });
      setSearchImei("");
    } else {
      alert("Không tìm thấy máy trong hệ thống.");
    }
  };

    const [paidAmount, setPaidAmount] = useState<number>(0);
    
    // Calculate total dynamically when importPrice or imeiList changes
    const calculatedTotal = (Number(formData.importPrice) || 0) * imeiList.length;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const receptionType = activeTab === 'IMPORT' ? 'IMPORT' :
                           activeTab === 'SHOP' ? 'SHOP_TRANSFER' : 
                           activeTab === 'WARRANTY' ? 'WARRANTY' : 
                           activeTab === 'TRADE_IN' ? 'TRADE_IN' : 'SERVICE';
      
      const status: DeviceStatus = activeTab === 'SERVICE' ? 'CHO_PHAN_TASK' : 
                                  activeTab === 'TRADE_IN' ? 'TRADE_IN' : 'CHO_TEST';

      if (imeiList.length === 0) {
        return alert("Vui lòng nhập ít nhất 1 IMEI");
      }

      if (paidAmount > calculatedTotal) {
        return alert("Số tiền thanh toán không được vượt quá tổng tiền nhập!");
      }

      const importItems: any[] = [];
      let totalAmount = 0;

      const importReceiptId = isEditing && editingReceiptId ? editingReceiptId : `ir-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      imeiList.forEach(item => {
        const importPrice = activeTab === 'TRADE_IN' || activeTab === 'IMPORT' ? Number(formData.importPrice) || 0 : foundDevice?.importPrice || 0;
        
        const sourceName = activeTab === 'IMPORT' ? formData.source || "" : 
                           activeTab === 'SHOP' ? `Nguồn shop chuyển lên - ${formData.source}` :
                           activeTab === 'TRADE_IN' ? "Nguồn thu cũ" : 
                           activeTab === 'WARRANTY' ? "Nguồn bảo hành" : "Nguồn khách lẻ";

        const newDevice: Device = {
          id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          imei: item.imei,
          model: formData.model || "",
          color: formData.color || "",
          capacity: formData.capacity || "",
          source: sourceName,
          importPrice,
          importDate: foundDevice?.importDate || format(new Date(), "yyyy-MM-dd HH:mm"),
          receiverId: state.currentUser!.id,
          status,
          notes: formData.notes || "",
          images: item.images,
          receptionType,
          customerInfo: formData.customerInfo,
          customerPhone: formData.customerPhone,
          receptionDate: format(new Date(), "yyyy-MM-dd HH:mm"),
        };

        dispatch({ type: "ADD_DEVICE", payload: newDevice });

        importItems.push({
          imei: item.imei,
          model: formData.model || "",
          color: formData.color || "",
          capacity: formData.capacity || "",
          importPrice,
        });
        totalAmount += importPrice;
      });

      if (importItems.length > 0) {
        const sourceName = activeTab === 'IMPORT' ? formData.source || "Không rõ" : 
                           activeTab === 'SHOP' ? `Nguồn shop chuyển lên - ${formData.source}` :
                           activeTab === 'TRADE_IN' ? "Nguồn thu cũ" : 
                           activeTab === 'WARRANTY' ? "Nguồn bảo hành" : "Nguồn khách lẻ";

        if (isEditing && editingReceiptId) {
          // Update existing receipt
          const updatedReceipt = {
            id: editingReceiptId,
            supplierName: sourceName,
            importDate: format(new Date(), "yyyy-MM-dd HH:mm"),
            totalAmount,
            notes: formData.notes || "",
            items: importItems,
            receiverId: state.currentUser!.id,
          };
          dispatch({ type: "UPDATE_IMPORT_RECEIPT", payload: updatedReceipt });
        } else {
          // Create new receipt
          const newImportReceipt = {
            id: importReceiptId,
            supplierName: sourceName,
            importDate: format(new Date(), "yyyy-MM-dd HH:mm"),
            totalAmount,
            notes: formData.notes || "",
            items: importItems,
            receiverId: state.currentUser!.id,
          };
          dispatch({ type: "ADD_IMPORT_RECEIPT", payload: newImportReceipt });

          // Record cash payment in accounting if paid amount > 0
          if (paidAmount > 0) {
            dispatch({
              type: "ADD_TRANSACTION",
              payload: {
                id: `TXN-${Date.now()}`,
                type: 'EXPENSE',
                amount: paidAmount,
                category: 'IMPORT',
                description: `Thanh toán ${paidAmount.toLocaleString()}đ nhập thiết bị nguồn: ${sourceName}`,
                date: new Date().toISOString(),
                storeId: state.currentUser?.storeId || 'KHO_TONG',
                createdBy: state.currentUser?.id || 'unknown',
                referenceId: importReceiptId
              }
            });
          }

          // Record debt if not fully paid (only for normal IMPORT or TRADE_IN from supplier list)
          const debtAmount = totalAmount - paidAmount;
          if (debtAmount > 0 && activeTab === 'IMPORT' && formData.source) {
            const supplier = state.suppliers.find(s => s.name === formData.source);
            if (supplier) {
              const storeId = state.currentUser?.storeId || 'KHO_TONG';
              dispatch({
                type: "UPDATE_SUPPLIER",
                payload: {
                  ...supplier,
                  totalDebt: (supplier.totalDebt || 0) + debtAmount,
                  storeDebts: {
                    ...supplier.storeDebts,
                    [storeId]: (supplier.storeDebts?.[storeId] || 0) + debtAmount
                  }
                }
              });
            }
          }
          
          if(debtAmount > 0 && activeTab === 'TRADE_IN' && formData.customerPhone) {
              const customer = state.customers.find(c => c.phone === formData.customerPhone);
              if(customer) {
                  const storeId = state.currentUser?.storeId || 'KHO_TONG';
                  // if buying from customer, debt is technically negative, but let's assume we owe the customer money.
                  // For now, customer doesn't have a concept of "Store owes Customer", only "Customer owes Store" (totalDebt).
                  // So we might log a negative debt for the customer, or skip it. Let's skip updating customer debt for now to avoid breaking existing models.
              }
          }
        }
      }

      // Reset form
      setFormData({ model: "", color: "", capacity: "", source: "", notes: "", customerInfo: "", customerPhone: "", importPrice: 0 });
      setFoundDevice(null);
      setSearchImei("");
      setImeiList([]);
      setCurrentImei("");
      setIsEditing(false);
      setEditingReceiptId(null);
      setPaidAmount(0);
      alert(isEditing ? "Cập nhật phiếu nhập thành công!" : "Tiếp nhận thành công!");
      
      if (activeTab === 'IMPORT') {
        navigate('/phieu-nhap-hang');
      }
    };

  const handleAddImei = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!currentImei.trim()) return;
      if (imeiList.find(i => i.imei === currentImei.trim())) {
        alert("IMEI này đã có trong danh sách");
        return;
      }
      setImeiList([...imeiList, { imei: currentImei.trim(), images: [] }]);
      setCurrentImei("");
    }
  };

  const removeImei = (index: number) => {
    setImeiList(imeiList.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Nhập Hàng</h1>
        <div className="bg-dark-card p-1 rounded-lg border border-dark-border w-full sm:w-auto overflow-hidden">
          <div className="flex overflow-x-auto p-1 gap-2">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'IMPORT' ? 'bg-dark-bg text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('IMPORT')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nhập Máy Mới
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'SHOP' ? 'bg-dark-bg text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('SHOP')}
            >
              <Store className="w-4 h-4 mr-2" />
              Nhận từ Shop
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'TRADE_IN' ? 'bg-dark-bg text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('TRADE_IN')}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Thu Cũ
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'WARRANTY' ? 'bg-dark-bg text-neon-pink shadow-sm border border-neon-pink/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('WARRANTY')}
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Bảo Hành
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'SERVICE' ? 'bg-dark-bg text-neon-green shadow-sm border border-neon-green/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('SERVICE')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sửa Lẻ
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-card p-6 rounded-xl border border-dark-border shadow-sm">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-neon-cyan" />
              Thông Tin Thiết Bị
            </h3>
            
            <div className="mb-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
              <label className="block text-sm font-medium text-dark-muted mb-2">Tra cứu IMEI (Nếu đã có trong hệ thống)</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 dark-input p-2 rounded-md"
                  placeholder="Nhập IMEI để kiểm tra lịch sử..."
                  value={searchImei}
                  onChange={(e) => setSearchImei(e.target.value)}
                />
                <button 
                  onClick={handleSearch}
                  className="px-4 py-2 bg-dark-border text-dark-text rounded-md hover:bg-dark-border/80 flex items-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Kiểm tra
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-muted">
                    {isEditing ? "Danh sách IMEI trong phiếu nhập" : "Nhập IMEI (Nhấn Enter để thêm nhiều máy)"}
                  </label>
                  <div className="space-y-2">
                    {!isEditing && (
                      <input
                        type="text"
                        className="mt-1 block w-full dark-input p-2 rounded-md text-lg font-mono tracking-wider"
                        placeholder="Nhập IMEI và nhấn Enter..."
                        value={currentImei}
                        onChange={(e) => setCurrentImei(e.target.value)}
                        onKeyDown={handleAddImei}
                      />
                    )}
                    <div className="grid grid-cols-1 gap-2">
                      {imeiList.map((item, idx) => (
                        <div key={idx} className="p-2 bg-dark-bg border border-dark-border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-neon-cyan">{item.imei}</span>
                            {!isEditing && (
                              <button type="button" onClick={() => removeImei(idx)} className="text-neon-pink hover:text-neon-pink/80">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, item.imei)}
                            className="block w-full text-sm text-dark-muted file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20"
                          />
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.images.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative">
                                <img src={img} alt="Preview" className="w-12 h-12 object-cover rounded-md" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(imgIdx, item.imei)}
                                  className="absolute -top-1 -right-1 bg-neon-pink text-white rounded-full p-0.5 hover:bg-neon-pink/80"
                                >
                                  <XCircle className="w-2 h-2" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <SearchableSelect
                    label="Model"
                    required
                    options={uniqueModels}
                    value={formData.model || ""}
                    onChange={(val) => setFormData({ ...formData, model: val })}
                    placeholder="VD: iPhone 13 Pro Max"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">Màu sắc</label>
                    <input
                      type="text"
                      className="mt-1 block w-full dark-input p-2 rounded-md"
                      placeholder="Màu"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">Dung lượng</label>
                    <input
                      type="text"
                      className="mt-1 block w-full dark-input p-2 rounded-md"
                      placeholder="GB"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                </div>
                
                {activeTab === 'TRADE_IN' || activeTab === 'IMPORT' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2">
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Giá Nhập Của 1 Máy (VNĐ) *</label>
                      <input
                        type="number" required
                        className="mt-1 block w-full dark-input p-2 rounded-md text-neon-green font-bold"
                        value={formData.importPrice}
                        onChange={(e) => setFormData({ ...formData, importPrice: Number(e.target.value) })}
                      />
                    </div>
                    {activeTab === 'IMPORT' && (
                      <div>
                        <label className="block text-sm font-medium text-dark-muted">Tổng Tiền Đã Thanh Toán (VNĐ)</label>
                        <input
                          type="number"
                          className="mt-1 block w-full dark-input p-2 rounded-md text-neon-pink font-bold"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                          placeholder={`Tối đa: ${(calculatedTotal).toLocaleString()}đ`}
                        />
                        <p className="text-xs text-dark-muted mt-1">
                          Tổng tiền: {(calculatedTotal).toLocaleString()}đ. Nợ NCC: {Math.max(0, calculatedTotal - paidAmount).toLocaleString()}đ
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
                
                {activeTab === 'SHOP' || activeTab === 'IMPORT' ? (
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      {activeTab === 'IMPORT' ? 'Nhà Cung Cấp *' : 'Shop chuyển lên *'}
                    </label>
                    {activeTab === 'IMPORT' ? (
                      <select
                        required
                        className="mt-1 block w-full dark-input p-2 rounded-md"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      >
                        <option value="">-- Chọn NCC --</option>
                        {state.suppliers.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        required
                        className="mt-1 block w-full dark-input p-2 rounded-md"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      >
                        <option value="">-- Chọn Shop --</option>
                        <option value="XStore">XStore</option>
                        <option value="PH_DN">PH_DN</option>
                        <option value="PH_HUE">PH_HUE</option>
                        <option value="PH_QNG">PH_QNG</option>
                      </select>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Tên Khách Hàng *</label>
                      <input
                        type="text" required
                        className="mt-1 block w-full dark-input p-2 rounded-md"
                        placeholder="Họ tên khách hàng"
                        value={formData.customerInfo}
                        onChange={(e) => setFormData({ ...formData, customerInfo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Số Điện Thoại *</label>
                      <input
                        type="text" required
                        className="mt-1 block w-full dark-input p-2 rounded-md"
                        placeholder="090..."
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted">
                  {activeTab === 'SHOP' ? 'Tình trạng lỗi shop báo' : 'Tình trạng máy & Yêu cầu khách'}
                </label>
                <textarea
                  className="mt-1 block w-full dark-input p-2 rounded-md"
                  rows={4}
                  placeholder="Mô tả chi tiết tình trạng máy khi nhận..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="neon-button px-8 py-3 rounded-lg font-bold flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Xác Nhận Tiếp Nhận
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {foundDevice && (
            <div className="bg-dark-card p-6 rounded-xl border border-neon-cyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
              <h3 className="text-lg font-semibold text-neon-cyan mb-4 flex items-center">
                <History className="w-5 h-5 mr-2" />
                Lịch Sử Máy
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-muted">Ngày nhập:</span>
                  <span className="text-dark-text">{format(new Date(foundDevice.importDate.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Nguồn gốc:</span>
                  <span className="text-dark-text">{foundDevice.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Trạng thái cũ:</span>
                  <span className="text-dark-text">{foundDevice.status}</span>
                </div>
                <div className="mt-4 p-3 bg-dark-bg rounded border border-dark-border">
                  <p className="text-xs font-bold text-dark-muted uppercase mb-1">Ghi chú cũ:</p>
                  <p className="text-xs text-dark-text italic">{foundDevice.notes || "Không có ghi chú cũ"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-dark-card p-6 rounded-xl border border-dark-border">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
              Quy Trình Xử Lý
            </h3>
            <ul className="space-y-4 text-sm text-dark-muted">
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5">1</span>
                <span>Máy nhận từ Shop sẽ chuyển sang mục **Test Đầu Vào** để kiểm tra lại lỗi.</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5">2</span>
                <span>Máy Bảo Hành sẽ được ưu tiên kiểm tra lỗi ngay để phản hồi khách hàng.</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5">3</span>
                <span>Máy Sửa Lẻ sẽ chuyển thẳng sang mục **Điều Phối** để giao cho kỹ thuật xử lý.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
