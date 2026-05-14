import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Device, DeviceLocation, Order, Transaction, Customer, Product } from '../types';
import { ShoppingCart, Search, Plus, Trash2, CreditCard, User, Store, DollarSign, Printer, X, Package, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SHOP_LABELS: Record<string, string> = {
  XSTORE: 'Xstore',
  PH_DN: 'PH Đà Nẵng',
  PH_HUE: 'PH Huế',
  PH_QNG: 'PH Quảng Ngãi',
};

const QUICK_DISCOUNTS = [50000, 100000, 200000, 500000];

type UnifiedCartItem = {
  cartId: string;
  type: 'DEVICE' | 'PART';
  id: string; // db id (deviceId or productId)
  imei?: string;
  model: string;
  cartPrice: number;
  quantity: number;
  deviceObj?: Device;
  productObj?: Product;
};

type CartItem = UnifiedCartItem;

export default function BanHang() {
  const { state, dispatch } = useAppContext();
  const [selectedStore, setSelectedStore] = useState<DeviceLocation>(state.currentUser?.storeId || 'XSTORE');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD' | 'INSTALLMENT'>('CASH');
  const [installmentPartner, setInstallmentPartner] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerDetail, setNewCustomerDetail] = useState({ address: '', group: 'VANG_LAI' as any, notes: '' });

  // Auto-fill customer info if phone exists
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const existing = state.customers.find(c => c.phone === customerPhone);
      if (existing) {
        setCurrentCustomer(existing);
        if (!customerName) {
          setCustomerName(existing.name);
          toast.success(`Khách ${existing.name} - ${existing.group || 'Vãng Lai'} (${existing.points || 0} điểm)`);
        }
      } else {
        setCurrentCustomer(null);
      }
    } else {
      setCurrentCustomer(null);
    }
  }, [customerPhone, state.customers]);

  const availableDevices = useMemo(() => {
    return state.devices.filter(d => 
      d.location === selectedStore && 
      d.status === 'CHO_BAN' &&
      (d.imei.includes(searchQuery) || d.model.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !cart.find(c => c.type === 'DEVICE' && c.id === d.id)
    );
  }, [state.devices, selectedStore, searchQuery, cart]);

  const availableProducts = useMemo(() => {
    if (!searchQuery) return [];
    return state.products.filter(p => 
      p.category === 'PART' &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [state.products, searchQuery]);

  const groupedDevices = useMemo(() => {
    const groups: Record<string, Device[]> = {};
    availableDevices.forEach(device => {
      if (!groups[device.model]) {
        groups[device.model] = [];
      }
      groups[device.model].push(device);
    });
    return groups;
  }, [availableDevices]);

  const totalAmount = cart.reduce((sum, d) => sum + (d.cartPrice * d.quantity), 0);
  const finalAmount = totalAmount - discount;
  
  const paidAmount = paidAmountInput === '' ? finalAmount : Number(paidAmountInput);
  const debtAmount = Math.max(0, finalAmount - paidAmount);

  const addToCart = (device: Device) => {
    setCart([...cart, { 
      cartId: `DEV-${device.id}`,
      type: 'DEVICE',
      id: device.id,
      imei: device.imei,
      model: device.model,
      cartPrice: device.sellPrice || 0,
      quantity: 1,
      deviceObj: device
    }]);
  };

  const addProductToCart = (product: Product) => {
    const existingIndex = cart.findIndex(c => c.type === 'PART' && c.id === product.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        cartId: `PRD-${product.id}`,
        type: 'PART',
        id: product.id,
        model: product.name,
        cartPrice: product.sellPrice || 0,
        quantity: 1,
        productObj: product
      }]);
    }
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(d => d.cartId !== cartId));
  };

  const updateCartPrice = (cartId: string, newPrice: number) => {
    setCart(cart.map(d => d.cartId === cartId ? { ...d, cartPrice: newPrice } : d));
  };
  
  const updateCartQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(cart.map(d => d.cartId === cartId ? { ...d, quantity: newQuantity } : d));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      const exactMatch = availableDevices.find(d => d.imei === searchQuery);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
        toast.success(`Đã thêm ${exactMatch.model} vào giỏ hàng`);
      } else if (availableDevices.length === 1 && availableProducts.length === 0) {
        addToCart(availableDevices[0]);
        setSearchQuery('');
        toast.success(`Đã thêm ${availableDevices[0].model} vào giỏ hàng`);
      } else if (availableProducts.length === 1 && availableDevices.length === 0) {
        addProductToCart(availableProducts[0]);
        setSearchQuery('');
        toast.success(`Đã thêm ${availableProducts[0].name} vào giỏ hàng`);
      }
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    if (!customerName || !customerPhone) {
      toast.error('Vui lòng nhập thông tin khách hàng!');
      return;
    }
    if (paidAmount < 0 || paidAmount > finalAmount) {
      toast.error('Số tiền khách trả không hợp lệ!');
      return;
    }

    if (paymentMethod === 'INSTALLMENT' && !installmentPartner) {
      toast.error('Vui lòng nhập tên đối tác trả góp!');
      return;
    }

    const orderId = `ORD-${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Create Order
    const newOrder: Order = {
      id: orderId,
      storeId: selectedStore,
      customerName,
      customerPhone,
      deviceImeis: cart.filter(c => c.type === 'DEVICE' && c.imei).map(c => c.imei!),
      items: cart.map(c => ({
        id: c.id,
        name: c.model,
        imei: c.imei,
        quantity: c.quantity,
        price: c.cartPrice,
        discount: 0
      })),
      totalAmount,
      discount,
      finalAmount,
      paidAmount,
      debtAmount,
      paymentMethod,
      installmentPartner,
      createdAt: now,
      createdBy: state.currentUser?.id || 'unknown',
      status: 'COMPLETED'
    };

    dispatch({ type: 'ADD_ORDER', payload: newOrder });

    // 2. Update Devices & Parts
    cart.forEach(c => {
      if (c.type === 'DEVICE' && c.deviceObj) {
        const device = c.deviceObj;
        dispatch({
          type: 'UPDATE_DEVICE',
          payload: {
            ...device,
            status: 'DA_BAN',
            location: 'DA_BAN',
            sellPrice: c.cartPrice,
            sellDate: now,
            customerInfo: `${customerName} - ${customerPhone}`,
            notes: `${device.notes || ''}\n[BÁN HÀNG]: Đơn hàng ${orderId}`
          }
        });
      } else if (c.type === 'PART') {
        // Decrease part stock
        const part = state.parts.find(p => p.id === c.id);
        if (part) {
          dispatch({
            type: 'UPDATE_PART',
            payload: {
              ...part,
              stock: Math.max(0, part.stock - c.quantity)
            }
          });
        }
      }
    });

    // 3. Create Transaction (Income) for the paid amount
    if (paidAmount > 0) {
      const newTransaction: Transaction = {
        id: `TXN-${Date.now()}`,
        type: 'INCOME',
        amount: paidAmount,
        category: 'SALE',
        description: `Bán hàng đơn ${orderId} - Khách: ${customerName}`,
        date: now,
        storeId: selectedStore,
        createdBy: state.currentUser?.id || 'unknown',
        referenceId: orderId
      };
      dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
    }

    // 4. Save/Update Customer
    const existingCustomer = state.customers.find(c => c.phone === customerPhone);
    const newPoints = Math.floor(finalAmount / 100000); // 1 điểm mỗi 100k
    
    if (existingCustomer) {
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: {
          ...existingCustomer,
          name: customerName,
          address: existingCustomer.address || newCustomerDetail.address,
          notes: existingCustomer.notes || newCustomerDetail.notes,
          group: newCustomerDetail.group !== 'VANG_LAI' ? newCustomerDetail.group : existingCustomer.group,
          totalDebt: (existingCustomer.totalDebt || 0) + debtAmount,
          totalSpent: (existingCustomer.totalSpent || 0) + finalAmount,
          storeDebts: {
            ...existingCustomer.storeDebts,
            [selectedStore]: (existingCustomer.storeDebts?.[selectedStore] || 0) + debtAmount
          },
          storeSpent: {
            ...existingCustomer.storeSpent,
            [selectedStore]: (existingCustomer.storeSpent?.[selectedStore] || 0) + finalAmount
          },
          points: (existingCustomer.points || 0) + newPoints,
        }
      });
    } else {
      dispatch({
        type: 'ADD_CUSTOMER',
        payload: {
          id: `CUST-${Date.now()}`,
          name: customerName,
          phone: customerPhone,
          address: newCustomerDetail.address,
          notes: newCustomerDetail.notes,
          group: newCustomerDetail.group,
          totalDebt: debtAmount,
          totalSpent: finalAmount,
          storeDebts: { [selectedStore]: debtAmount },
          storeSpent: { [selectedStore]: finalAmount },
          points: newPoints,
          createdAt: now
        }
      });
    }

    toast.success('Thanh toán thành công!');
    setCompletedOrder(newOrder);
    setCart([]);
    // Do not clear customer info immediately if they want to print, wait for modal close, but okay to clear state.
    setDiscount(0);
    setPaidAmountInput('');
    setInstallmentPartner('');
  };

  const printReceipt = () => {
    toast.success('Đang in hóa đơn...');
    setTimeout(() => {
      setCompletedOrder(null);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-48 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2" />
            Bán Hàng (POS)
          </h1>
          <p className="text-dark-muted text-sm mt-1">Quản lý bán hàng tại cửa hàng</p>
        </div>
        
        <div className="flex items-center w-full sm:w-auto">
          <div className="flex items-center bg-dark-card border border-dark-border rounded-lg px-3 py-2 w-full sm:w-auto">
            <Store className="w-4 h-4 text-dark-muted mr-2 shrink-0" />
            <select
              value={selectedStore}
              disabled={state.currentUser?.role === 'SALE' && !!state.currentUser?.storeId}
              onChange={(e) => {
                setSelectedStore(e.target.value as DeviceLocation);
                setCart([]); // Clear cart when changing store
              }}
              className="bg-transparent text-dark-text outline-none text-sm font-medium w-full disabled:opacity-50 appearance-none"
            >
              {Object.entries(SHOP_LABELS).map(([key, label]) => {
                if (state.currentUser?.role === 'SALE' && state.currentUser?.storeId && state.currentUser?.storeId !== key) {
                  return null;
                }
                return <option key={key} value={key} className="bg-dark-card">{label}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-dark-card rounded-xl border border-dark-border p-4 shadow-lg">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
              <input
                type="text"
                placeholder="Quét mã vạch, tìm kiếm IMEI hoặc Model (Nhấn Enter để thêm nhanh)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-dark-text focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {availableProducts.length > 0 && searchQuery && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-neon-cyan mb-3 flex items-center border-b border-dark-border pb-2">
                    <Package className="w-4 h-4 mr-2" /> Phụ kiện / Linh kiện
                  </h3>
                  <div className="space-y-2">
                    {availableProducts.map(product => (
                      <div key={product.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-dark-card border border-dark-border rounded-lg p-3 hover:border-neon-cyan transition-colors group/item gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-dark-text group-hover/item:text-neon-cyan transition-colors">{product.name}</p>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                          <span className="font-bold text-neon-cyan text-sm">
                            {product.sellPrice?.toLocaleString()}đ
                          </span>
                          <button
                            onClick={() => addProductToCart(product)}
                            className="p-1.5 bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan hover:text-dark-bg transition-colors shrink-0"
                            title="Thêm vào giỏ"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Object.keys(groupedDevices).length === 0 && !searchQuery ? (
                <div className="col-span-full text-center py-12 text-dark-muted border-2 border-dashed border-dark-border rounded-lg">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Không tìm thấy thiết bị nào sẵn sàng bán tại cửa hàng này.</p>
                </div>
              ) : (
                Object.entries(groupedDevices).map(([model, devices]) => {
                  const deviceList = devices as Device[];
                  return (
                  <details key={model} className="bg-dark-bg border border-dark-border rounded-lg p-4 group" open>
                    <summary className="font-bold text-neon-cyan mb-3 border-b border-dark-border pb-2 cursor-pointer list-none flex justify-between items-center">
                      <span>{model} <span className="text-dark-muted text-sm font-normal">({deviceList.length} máy)</span></span>
                      <span className="text-dark-muted group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="space-y-2 mt-3">
                      {deviceList.map(device => (
                        <div key={device.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-dark-card border border-dark-border rounded-lg p-3 hover:border-neon-cyan transition-colors group/item gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-mono text-dark-text group-hover/item:text-neon-cyan transition-colors">IMEI: {device.imei}</p>
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-dark-bg rounded text-dark-muted border border-dark-border">
                                {device.appearance || 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-dark-muted">{device.color} - {device.capacity}</p>
                          </div>
                          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                            <span className="font-bold text-neon-cyan text-sm">
                              {device.sellPrice?.toLocaleString()}đ
                            </span>
                            <button
                              onClick={() => addToCart(device)}
                              className="p-1.5 bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan hover:text-dark-bg transition-colors shrink-0"
                              title="Thêm vào giỏ"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart & Checkout */}
        <div className="space-y-4">
          <div className="bg-dark-card rounded-xl border border-dark-border p-4 shadow-lg flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-dark-text flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-neon-cyan" />
                Giỏ Hàng
              </h2>
              <span className="bg-neon-cyan/20 text-neon-cyan text-xs font-bold px-2 py-1 rounded-full">
                {cart.length} SP
              </span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-3 min-h-[200px] border-b border-dark-border pb-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-dark-muted text-sm">
                  <Package className="w-10 h-10 mb-2 opacity-20" />
                  Chưa có sản phẩm nào
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-red-400/30 transition-colors group">
                    <div className="flex-1 w-full">
                      <p className="font-medium text-dark-text text-sm flex items-center">
                        {item.type === 'PART' && <Package className="w-3 h-3 text-neon-cyan mr-1" />}
                        {item.model}
                      </p>
                      {item.imei && <p className="text-xs text-dark-muted font-mono">IMEI: {item.imei}</p>}
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
                      {item.type === 'PART' && (
                        <div className="flex items-center bg-dark-card border border-dark-border rounded">
                          <button 
                            onClick={() => updateCartQuantity(item.cartId, item.quantity - 1)}
                            className="px-2 py-1 text-dark-muted hover:text-white"
                          >-</button>
                          <span className="px-2 text-sm text-dark-text">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.cartId, item.quantity + 1)}
                            className="px-2 py-1 text-dark-muted hover:text-white"
                          >+</button>
                        </div>
                      )}
                      <div className="flex items-center flex-1 sm:flex-none">
                        <input
                          type="number"
                          value={item.cartPrice || ''}
                          onChange={(e) => updateCartPrice(item.cartId, Number(e.target.value))}
                          className="w-full sm:w-24 bg-dark-card border border-dark-border rounded px-2 py-1 text-right text-neon-cyan font-bold text-sm outline-none focus:border-neon-cyan"
                          placeholder="Giá bán"
                        />
                        <span className="ml-1 text-dark-muted text-sm">đ</span>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-dark-muted hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100 p-1"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Info */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                <input
                  type="text"
                  placeholder="Số điện thoại khách hàng"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                  <input
                    type="text"
                    placeholder="Tên khách hàng"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="p-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan hover:text-dark-bg transition-colors"
                  title="Thêm chi tiết khách hàng"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {currentCustomer && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-dark-muted block">Hạng:</span>
                    <span className={`font-bold ${
                      currentCustomer.group === 'VIP' ? 'text-purple-400' :
                      currentCustomer.group === 'SI_DAI_LY' ? 'text-blue-400' :
                      currentCustomer.group === 'THUONG_XUYEN' ? 'text-green-400' : 'text-gray-400'
                    }`}>{currentCustomer.group === 'VIP' ? 'VIP' : currentCustomer.group === 'SI_DAI_LY' ? 'SỈ/ĐẠI LÝ' : currentCustomer.group === 'THUONG_XUYEN' ? 'THƯỜNG XUYÊN' : 'VÃNG LAI'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-dark-muted block">Điểm tích luỹ:</span>
                    <span className="font-bold text-neon-cyan">{currentCustomer.points || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-dark-muted block">Công nợ cũ:</span>
                    <span className={`font-bold ${currentCustomer.totalDebt && currentCustomer.totalDebt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {(currentCustomer.totalDebt || 0).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Summary - Hidden on mobile, shown in sticky bar instead */}
            <div className="hidden lg:block space-y-3 mb-6 bg-dark-bg p-4 rounded-lg border border-dark-border">
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Tổng tiền:</span>
                <span className="text-dark-text font-medium">{totalAmount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-muted">Giảm giá:</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-24 bg-dark-card border border-dark-border rounded px-2 py-1 text-right text-dark-text focus:border-neon-cyan outline-none"
                  />
                  <span className="ml-1 text-dark-muted">đ</span>
                </div>
              </div>
              {/* Quick Discounts */}
              <div className="flex justify-end space-x-2 mt-1">
                {QUICK_DISCOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setDiscount(amount)}
                    className="text-[10px] px-2 py-1 bg-dark-card border border-dark-border rounded text-dark-muted hover:text-neon-cyan hover:border-neon-cyan transition-colors"
                  >
                    -{amount / 1000}k
                  </button>
                ))}
                <button
                  onClick={() => setDiscount(0)}
                  className="text-[10px] px-2 py-1 bg-dark-card border border-dark-border rounded text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Xóa
                </button>
              </div>
              <div className="pt-3 border-t border-dark-border flex justify-between items-center">
                <span className="font-bold text-dark-text">Khách cần trả:</span>
                <span className="text-xl font-bold text-neon-cyan">{finalAmount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-dark-muted">Khách thanh toán:</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    placeholder={finalAmount.toString()}
                    className="w-28 bg-dark-card border border-dark-border rounded px-2 py-1 text-right text-dark-text focus:border-neon-cyan outline-none"
                  />
                  <span className="ml-1 text-dark-muted">đ</span>
                </div>
              </div>
              {debtAmount > 0 && (
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-red-400 font-medium">Còn nợ:</span>
                  <span className="text-red-400 font-bold">{debtAmount.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="hidden lg:block mb-6">
              <label className="block text-xs font-medium text-dark-muted mb-2">Phương thức thanh toán</label>
              <div className="grid grid-cols-4 gap-2">
                {(['CASH', 'TRANSFER', 'CARD', 'INSTALLMENT'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                      paymentMethod === method 
                        ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' 
                        : 'bg-dark-bg border-dark-border text-dark-muted hover:border-dark-muted'
                    }`}
                  >
                    {method === 'CASH' ? 'Tiền mặt' : method === 'TRANSFER' ? 'Chuyển khoản' : method === 'CARD' ? 'Quẹt thẻ' : 'Trả góp'}
                  </button>
                ))}
              </div>
              {paymentMethod === 'INSTALLMENT' && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Đối tác (VD: Home Credit, HD Saison...)"
                    value={installmentPartner}
                    onChange={(e) => setInstallmentPartner(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text outline-none focus:border-neon-cyan"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="hidden lg:flex w-full neon-button py-3 items-center justify-center font-bold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Thanh Toán
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar for Cart & Checkout */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col">
              <span className="text-xs text-dark-muted">Khách cần trả ({cart.length} SP)</span>
              <span className="text-lg font-bold text-neon-cyan">{finalAmount.toLocaleString()}đ</span>
            </div>
            {debtAmount > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-dark-muted">Còn nợ</span>
                <span className="text-sm font-bold text-red-400">{debtAmount.toLocaleString()}đ</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative flex items-center">
              <span className="absolute left-3 text-xs text-dark-muted">Khách đưa:</span>
              <input
                type="number"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                placeholder={finalAmount.toString()}
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-20 pr-3 py-2 text-right text-neon-cyan font-bold outline-none focus:border-neon-cyan text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="bg-dark-bg border border-dark-border rounded-lg px-2 py-2 text-dark-text outline-none text-sm w-1/3"
              >
                <option value="CASH">Tiền mặt</option>
                <option value="TRANSFER">CK</option>
                <option value="CARD">Quẹt thẻ</option>
                <option value="INSTALLMENT">Trả góp</option>
              </select>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center transition-all bg-neon-cyan text-dark-bg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Thanh Toán
              </button>
            </div>
            {paymentMethod === 'INSTALLMENT' && (
              <input
                type="text"
                placeholder="Đối tác (VD: Home Credit)"
                value={installmentPartner}
                onChange={(e) => setInstallmentPartner(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text outline-none focus:border-neon-cyan"
              />
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden text-gray-900">
            <div className="p-6 text-center border-b border-gray-200 border-dashed">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Thanh toán thành công</h2>
              <p className="text-sm text-gray-500 mt-1">{completedOrder.id}</p>
            </div>
            
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-medium">{completedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="font-medium">{completedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cửa hàng:</span>
                <span className="font-medium">{SHOP_LABELS[completedOrder.storeId]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian:</span>
                <span className="font-medium">{format(new Date(completedOrder.createdAt), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              
                  <div className="border-t border-gray-200 border-dashed pt-4 mt-4">
                    <p className="text-gray-500 mb-2">Sản phẩm ({completedOrder.items ? completedOrder.items.reduce((s, i) => s + i.quantity, 0) : completedOrder.deviceImeis.length}):</p>
                    {completedOrder.items ? completedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between mb-1">
                        <span className="font-medium text-xs">
                          {item.quantity}x {item.name} {item.imei && <span className="font-mono text-gray-400">({item.imei})</span>}
                        </span>
                        <span className="text-xs">{(item.price * item.quantity).toLocaleString()}đ</span>
                      </div>
                    )) : completedOrder.deviceImeis.map((imei, idx) => (
                      <div key={idx} className="flex justify-between mb-1">
                        <span className="font-mono text-xs">{imei}</span>
                      </div>
                    ))}
                  </div>

              <div className="border-t border-gray-200 border-dashed pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng tiền:</span>
                  <span>{completedOrder.totalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Giảm giá:</span>
                  <span>-{completedOrder.discount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Thanh toán:</span>
                  <span className="text-blue-600">{completedOrder.finalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Hình thức:</span>
                  <span>
                    {completedOrder.paymentMethod === 'CASH' ? 'Tiền mặt' : 
                     completedOrder.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 
                     completedOrder.paymentMethod === 'CARD' ? 'Quẹt thẻ' : 
                     `Trả góp (${completedOrder.installmentPartner})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex space-x-3">
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={printReceipt}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                In Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-bold text-neon-cyan flex items-center">
                <User className="w-5 h-5 mr-2" />
                Chi Tiết Khách Hàng
              </h3>
              <button 
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
                title="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="0901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Địa chỉ (Không bắt buộc)</label>
                <input
                  type="text"
                  value={newCustomerDetail.address}
                  onChange={(e) => setNewCustomerDetail({ ...newCustomerDetail, address: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="Nhập địa chỉ khách hàng..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Hạng khách</label>
                <select
                  value={newCustomerDetail.group}
                  onChange={(e) => setNewCustomerDetail({ ...newCustomerDetail, group: e.target.value as any })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                >
                  {state.customerGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Ghi chú thêm</label>
                <textarea
                  value={newCustomerDetail.notes}
                  onChange={(e) => setNewCustomerDetail({ ...newCustomerDetail, notes: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none resize-none"
                  rows={2}
                  placeholder="..."
                ></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-dark-border flex">
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-full neon-button py-2 items-center justify-center font-bold"
              >
                Xác Nhận & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
