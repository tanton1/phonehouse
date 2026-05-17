import React, { useState, useMemo } from "react";
import { useAppContext } from "../store/AppContext";
import { Customer, Transaction, DeviceLocation } from "../types";
import {
  Users,
  Search,
  DollarSign,
  Plus,
  X,
  Phone,
  Calendar,
  Check,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";



export default function KhachHang() {
  const { state, dispatch } = useAppContext();
  
  const SHOP_LABELS = state.storeBranches.reduce((acc, branch) => {
    acc[branch.code] = branch.name;
    return acc;
  }, {} as Record<string, string>);
  const [searchQuery, setSearchQuery] = useState("");

  // Only accessible to their store if SALE, otherwise ALL
  const [selectedStore, setSelectedStore] = useState<string>(
    state.currentUser?.role === "SALE" && state.currentUser?.storeId
      ? state.currentUser.storeId
      : "ALL",
  );

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerGroupModalOpen, setIsCustomerGroupModalOpen] =
    useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    address: "",
    notes: "",
    group:
      state.customerGroups.length > 0 ? state.customerGroups[0].id : "VANG_LAI",
  });
  const [newCustomerGroup, setNewCustomerGroup] = useState({
    name: "",
    color: "#00f3ff",
  });

  const [debtPayment, setDebtPayment] = useState({
    amount: "",
    paymentMethod: "CASH" as "CASH" | "TRANSFER" | "CARD",
    storeId: state.currentUser?.storeId || "KHO_TONG",
    notes: "",
  });

  const customers = useMemo(() => {
    return state.customers
      .filter((c) => {
        const matchSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery);
        if (!matchSearch) return false;

        if (selectedStore !== "ALL") {
          // Check if this customer has interacted with the selected store
          const hasDebt = c.storeDebts && c.storeDebts[selectedStore] > 0;
          const hasSpent = c.storeSpent && c.storeSpent[selectedStore] > 0;
          return hasDebt || hasSpent;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [state.customers, searchQuery, selectedStore]);

  const totalDebtSystem = useMemo(() => {
    if (selectedStore === "ALL") {
      return state.customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
    }
    return state.customers.reduce(
      (sum, c) => sum + (c.storeDebts?.[selectedStore] || 0),
      0,
    );
  }, [state.customers, selectedStore]);

  const handleOpenDebtModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    const maxDebt =
      selectedStore === "ALL"
        ? customer.totalDebt
        : customer.storeDebts?.[selectedStore] || 0;

    setDebtPayment({
      amount: (maxDebt || 0).toString(),
      paymentMethod: "CASH",
      storeId:
        selectedStore === "ALL"
          ? state.currentUser?.storeId || "KHO_TONG"
          : selectedStore,
      notes: `Thu nợ khách hàng ${customer.name}`,
    });
    setIsDebtModalOpen(true);
  };

  const handleCollectDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amount = Number(debtPayment.amount);
    const currentMaxDebt =
      debtPayment.storeId === "KHO_TONG" || debtPayment.storeId === "ALL"
        ? selectedCustomer.totalDebt
        : selectedCustomer.storeDebts?.[debtPayment.storeId] || 0;

    // Allow collection if it doesn't exceed total debt
    if (
      amount <= 0 ||
      amount > selectedCustomer.totalDebt ||
      amount > currentMaxDebt
    ) {
      toast.error("Số tiền thu không hợp lệ!");
      return;
    }

    const now = new Date().toISOString();

    // 1. Create Transaction
    const newTransaction: Transaction = {
      id: `TXN-${Date.now()}`,
      type: "INCOME",
      amount: amount,
      category: "DEBT_COLLECTION",
      description: debtPayment.notes,
      date: now,
      storeId: debtPayment.storeId as DeviceLocation | "KHO_TONG",
      createdBy: state.currentUser?.id || "unknown",
      referenceId: selectedCustomer.id,
    };

    dispatch({ type: "ADD_TRANSACTION", payload: newTransaction });

    // 2. Update Customer Debt
    dispatch({
      type: "UPDATE_CUSTOMER",
      payload: {
        ...selectedCustomer,
        totalDebt: Math.max(0, (selectedCustomer.totalDebt || 0) - amount),
        storeDebts: {
          ...selectedCustomer.storeDebts,
          [debtPayment.storeId]: Math.max(
            0,
            (selectedCustomer.storeDebts?.[debtPayment.storeId] || 0) - amount,
          ),
        },
      },
    });

    toast.success(
      `Thu nợ thành công cho ${SHOP_LABELS[debtPayment.storeId] || debtPayment.storeId}!`,
    );
    setIsDebtModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Vui lòng nhập tên và SĐT");
      return;
    }
    const customer: Customer = {
      id: `CUST-${Date.now()}`,
      name: newCustomer.name,
      phone: newCustomer.phone,
      address: newCustomer.address,
      notes: newCustomer.notes,
      group: newCustomer.group || "VANG_LAI",
      totalDebt: 0,
      totalSpent: 0,
      points: 0,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_CUSTOMER", payload: customer });
    toast.success("Thêm khách hàng thành công!");
    setIsCustomerModalOpen(false);
    setNewCustomer({
      name: "",
      phone: "",
      address: "",
      notes: "",
      group:
        state.customerGroups.length > 0
          ? state.customerGroups[0].id
          : "VANG_LAI",
    });
  };

  const handleCreateCustomerGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerGroup.name) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }
    const groupId = `GROUP_${Date.now()}`;
    dispatch({
      type: "ADD_CUSTOMER_GROUP",
      payload: {
        id: groupId,
        name: newCustomerGroup.name,
        color: newCustomerGroup.color,
      },
    });
    toast.success("Thêm nhóm khách hàng thành công!");
    setIsCustomerGroupModalOpen(false);
    setNewCustomer({ ...newCustomer, group: groupId });
    setNewCustomerGroup({ name: "", color: "#00f3ff" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Khách Hàng & Công Nợ
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Quản lý thông tin và công nợ khách hàng
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="w-full sm:w-auto neon-button px-4 py-2 flex items-center justify-center font-bold whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2 border-2 border-current rounded-sm" />
            Thêm Khách
          </button>

          {(!state.currentUser?.storeId ||
            state.currentUser?.role === "ADMIN" ||
            state.currentUser?.role === "KHO_MAY") && (
            <div className="flex items-center bg-dark-card border border-dark-border rounded-lg px-3 py-2 w-full sm:w-auto">
              <Store className="w-4 h-4 text-dark-muted mr-2 shrink-0" />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-transparent text-dark-text outline-none text-sm font-medium w-full"
              >
                <option value="ALL" className="bg-dark-card">
                  Tất cả chi nhánh
                </option>
                {Object.entries(SHOP_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-dark-card">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full sm:w-auto bg-dark-card border border-red-500/30 rounded-lg px-4 py-2 flex items-center shadow-[0_0_10px_rgba(239,68,68,0.1)]">
            <DollarSign className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <p className="text-xs text-dark-muted">
                {selectedStore === "ALL"
                  ? "Tổng nợ hệ thống"
                  : `Nợ tại ${SHOP_LABELS[selectedStore]}`}
              </p>
              <p className="text-lg font-bold text-red-400">
                {totalDebtSystem.toLocaleString()}đ
              </p>
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
              placeholder="Tìm tên hoặc SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-4 py-2 text-sm text-dark-text focus:border-neon-cyan outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-left text-sm text-dark-text hidden md:table">
            <thead className="text-xs text-dark-muted uppercase bg-dark-bg/50 border-b border-dark-border">
              <tr>
                <th className="px-6 py-3">Khách hàng</th>
                <th className="px-6 py-3">Phân loại</th>
                <th className="px-6 py-3">Liên hệ</th>
                <th className="px-6 py-3 text-right">Chi tiêu</th>
                <th className="px-6 py-3 text-right">Công nợ</th>
                <th className="px-6 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-dark-muted"
                  >
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const spent =
                    selectedStore === "ALL"
                      ? customer.totalSpent
                      : customer.storeSpent?.[selectedStore] || 0;
                  const debt =
                    selectedStore === "ALL"
                      ? customer.totalDebt
                      : customer.storeDebts?.[selectedStore] || 0;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-dark-bg/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{customer.name}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const grp = state.customerGroups.find(
                            (g) => g.id === customer.group,
                          );
                          if (grp) {
                            return (
                              <span
                                className="px-2 py-1 text-[10px] rounded font-bold border"
                                style={{
                                  color: grp.color || "#a1a1aa",
                                  backgroundColor: `${grp.color || "#a1a1aa"}20`,
                                  borderColor: `${grp.color || "#a1a1aa"}40`,
                                }}
                              >
                                {grp.name.toUpperCase()}
                              </span>
                            );
                          }
                          return (
                            <span className="px-2 py-1 text-[10px] rounded bg-gray-500/20 text-gray-400 font-bold border border-gray-500/30">
                              VÃNG LAI
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-dark-muted">
                          <Phone className="w-3 h-3 mr-1" />
                          {customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-dark-muted font-medium">
                        {(spent || 0).toLocaleString()}đ
                        {selectedStore === "ALL" && (
                          <div className="text-[10px] text-neon-cyan/70 mt-1">
                            {customer.points || 0} điểm
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {debt && debt > 0 ? (
                          <span className="font-bold text-red-400">
                            {debt.toLocaleString()}đ
                          </span>
                        ) : (
                          <span className="text-dark-muted">0đ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {debt && debt > 0 ? (
                          <button
                            onClick={() => handleOpenDebtModal(customer)}
                            className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded hover:bg-neon-cyan hover:text-dark-bg transition-colors text-xs font-medium"
                          >
                            Thu Nợ
                          </button>
                        ) : (
                          <span className="text-xs text-dark-muted px-3 py-1">
                            Hết nợ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Mobile Grid */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {customers.length === 0 ? (
              <div className="text-center py-8 text-dark-muted">
                Không tìm thấy khách hàng nào.
              </div>
            ) : (
              customers.map((customer) => {
                const spent =
                  selectedStore === "ALL"
                    ? customer.totalSpent
                    : customer.storeSpent?.[selectedStore] || 0;
                const debt =
                  selectedStore === "ALL"
                    ? customer.totalDebt
                    : customer.storeDebts?.[selectedStore] || 0;

                return (
                  <div
                    key={customer.id}
                    className="bg-dark-bg border border-dark-border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-dark-text text-lg">
                          {customer.name}
                        </div>
                        <div className="text-sm mt-1 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-dark-muted" />
                          <span className="text-dark-muted">
                            {customer.phone}
                          </span>
                        </div>
                      </div>
                      {(() => {
                        const grp = state.customerGroups.find(
                          (g) => g.id === customer.group,
                        );
                        if (grp) {
                          return (
                            <span
                              className="px-2 py-1 text-[10px] rounded font-bold border"
                              style={{
                                color: grp.color || "#a1a1aa",
                                backgroundColor: `${grp.color || "#a1a1aa"}20`,
                                borderColor: `${grp.color || "#a1a1aa"}40`,
                              }}
                            >
                              {grp.name.toUpperCase()}
                            </span>
                          );
                        }
                        return (
                          <span className="px-2 py-1 text-[10px] rounded bg-gray-500/20 text-gray-400 font-bold border border-gray-500/30">
                            VÃNG LAI
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-dark-border/50 text-sm">
                      <div>
                        <div className="text-dark-muted text-xs mb-1">
                          Chi tiêu
                        </div>
                        <div className="font-bold text-neon-green">
                          {(spent || 0).toLocaleString()}đ
                        </div>
                        {selectedStore === "ALL" && (
                          <div className="text-[10px] text-neon-cyan/70 mt-1">
                            {customer.points || 0} điểm
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-dark-muted text-xs mb-1">
                          Công nợ
                        </div>
                        <div
                          className={`font-bold ${debt && debt > 0 ? "text-neon-pink" : "text-dark-text"}`}
                        >
                          {(debt || 0).toLocaleString()}đ
                        </div>
                      </div>
                    </div>

                    {debt && debt > 0 && (
                      <div className="mt-4 pt-4 border-t border-dark-border/50">
                        <button
                          onClick={() => handleOpenDebtModal(customer)}
                          className="w-full flex items-center justify-center p-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan hover:text-dark-bg transition-colors font-medium text-sm"
                        >
                          <DollarSign className="w-4 h-4 mr-1" /> Thu Nợ
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsCustomerModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-neon-cyan text-dark-bg rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)] z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Debt Collection Modal */}
      {isDebtModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-bold text-neon-cyan flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Thu Nợ Khách Hàng
              </h3>
              <button
                onClick={() => setIsDebtModalOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectDebt} className="p-4 space-y-4">
              <div className="bg-dark-bg p-3 rounded-lg border border-dark-border mb-4">
                <p className="text-sm text-dark-muted mb-1">
                  Khách hàng:{" "}
                  <span className="text-dark-text font-bold">
                    {selectedCustomer.name}
                  </span>
                </p>
                <p className="text-sm text-dark-muted">
                  Nợ cần thu:{" "}
                  <span className="text-red-400 font-bold">
                    {selectedStore === "ALL" || selectedStore === "KHO_TONG"
                      ? (selectedCustomer.totalDebt || 0).toLocaleString()
                      : (
                          selectedCustomer.storeDebts?.[selectedStore] || 0
                        ).toLocaleString()}
                    đ
                    {selectedStore !== "ALL" &&
                      selectedStore !== "KHO_TONG" &&
                      ` (tại ${SHOP_LABELS[selectedStore] || selectedStore})`}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Số tiền thu
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    max={
                      selectedStore === "ALL" || selectedStore === "KHO_TONG"
                        ? selectedCustomer.totalDebt || 0
                        : selectedCustomer.storeDebts?.[selectedStore] || 0
                    }
                    value={debtPayment.amount}
                    onChange={(e) =>
                      setDebtPayment({ ...debtPayment, amount: e.target.value })
                    }
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted">
                    VNĐ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Hình thức thanh toán
                </label>
                <select
                  value={debtPayment.paymentMethod}
                  onChange={(e) =>
                    setDebtPayment({
                      ...debtPayment,
                      paymentMethod: e.target.value as any,
                    })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="TRANSFER">Chuyển khoản</option>
                  <option value="CARD">Quẹt thẻ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={debtPayment.notes}
                  onChange={(e) =>
                    setDebtPayment({ ...debtPayment, notes: e.target.value })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none h-20 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-4 py-2 bg-dark-bg text-dark-text border border-dark-border rounded-lg hover:bg-dark-border transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 neon-button rounded-lg flex items-center font-medium"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Xác Nhận Thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-bold text-neon-cyan flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Thêm Khách Hàng
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
                title="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Tên khách hàng
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="0901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Địa chỉ (Không bắt buộc)
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="Nhập địa chỉ khách hàng..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Hạng / Nhóm khách
                </label>
                <div className="flex gap-2">
                  <select
                    value={newCustomer.group}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, group: e.target.value })
                    }
                    className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  >
                    {state.customerGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomerGroupModalOpen(true)}
                    className="px-3 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan hover:text-dark-bg transition-colors whitespace-nowrap"
                    title="Tạo nhóm mới"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Ghi chú thêm
                </label>
                <textarea
                  value={newCustomer.notes}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, notes: e.target.value })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none resize-none"
                  rows={2}
                  placeholder="..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 bg-dark-bg text-dark-text border border-dark-border rounded-lg hover:bg-dark-border transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 neon-button rounded-lg flex items-center font-medium"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Xác Nhận & Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Group Modal */}
      {isCustomerGroupModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-bold text-neon-cyan flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Tạo Nhóm Khách Hàng
              </h3>
              <button
                onClick={() => setIsCustomerGroupModalOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleCreateCustomerGroup}
              className="p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerGroup.name}
                  onChange={(e) =>
                    setNewCustomerGroup({
                      ...newCustomerGroup,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-neon-cyan outline-none"
                  placeholder="Khách sỉ lẻ, Khách quen..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 mt-2 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsCustomerGroupModalOpen(false)}
                  className="px-4 py-2 bg-dark-bg text-dark-text border border-dark-border rounded-lg hover:bg-dark-border transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 neon-button rounded-lg flex items-center font-medium text-sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Xác Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
