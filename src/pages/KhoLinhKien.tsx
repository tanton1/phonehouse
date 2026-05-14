import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Part, PartRequest, Supplier } from "../types";
import { Package, CheckCircle, XCircle, Search, Plus, Save } from "lucide-react";
import { format } from "date-fns";

export default function KhoLinhKien() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "INVENTORY">(
    "REQUESTS",
  );
  
  // States for Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState<Partial<Part>>({
    id: "",
    name: "",
    model: "",
    cost: 0,
    stock: 0,
    supplierId: "",
  });
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // States for Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const pendingRequests = state.partRequests.filter(
    (pr) => pr.status === "CHO_XUAT",
  );
  const historyRequests = state.partRequests.filter(
    (pr) => pr.status !== "CHO_XUAT",
  );

  const handleApprove = (request: PartRequest) => {
    const part = state.parts.find((p) => p.id === request.partId);
    if (!part) return alert("Linh kiện không tồn tại");
    if (part.stock < request.quantity) return alert("Không đủ tồn kho");

    dispatch({
      type: "UPDATE_PART_REQUEST",
      payload: {
        ...request,
        status: "DA_XUAT",
        exportedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
        exportedBy: state.currentUser!.id,
      },
    });

    dispatch({
      type: "UPDATE_PART_STOCK",
      payload: { partId: request.partId, quantity: -request.quantity },
    });

    if (request.technicianId) {
      dispatch({
        type: "UPDATE_TECH_STOCK",
        payload: { technicianId: request.technicianId, partId: request.partId, quantity: request.quantity },
      });

      // Notify technician
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `noti-${Date.now()}`,
          userId: request.technicianId,
          title: "Yêu cầu linh kiện đã được duyệt!",
          message: `Linh kiện "${part.name}" x${request.quantity} đã được xuất kho cho bạn.`,
          type: "TASK_UPDATED",
          link: "/ky-thuat",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Update task status back to DANG_XU_LY if no more pending requests for this task
    const task = state.tasks.find((t) => t.id === request.taskId);
    if (task) {
      const otherPendingRequests = state.partRequests.filter(
        (pr) => pr.taskId === task.id && pr.id !== request.id && pr.status === "CHO_XUAT"
      );
      if (otherPendingRequests.length === 0) {
        dispatch({
          type: "UPDATE_TASK",
          payload: { ...task, status: "DANG_XU_LY" },
        });
      }
    }

    alert("Đã xuất linh kiện thành công!");
  };

  const handleReject = (request: PartRequest) => {
    dispatch({
      type: "UPDATE_PART_REQUEST",
      payload: {
        ...request,
        status: "TU_CHOI",
        exportedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
        exportedBy: state.currentUser!.id,
      },
    });

    // Update task status back to DANG_XU_LY if no more pending requests for this task
    const task = state.tasks.find((t) => t.id === request.taskId);
    if (task) {
      const otherPendingRequests = state.partRequests.filter(
        (pr) => pr.taskId === task.id && pr.id !== request.id && pr.status === "CHO_XUAT"
      );
      if (otherPendingRequests.length === 0) {
        dispatch({
          type: "UPDATE_TASK",
          payload: { ...task, status: "DANG_XU_LY" },
        });
      }
    }

    // Notify technician
    if (request.technicianId) {
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `noti-${Date.now()}`,
          userId: request.technicianId,
          title: "Yêu cầu linh kiện bị từ chối!",
          message: `Yêu cầu linh kiện cho task ${request.taskId || 'lưu kho'} đã bị từ chối.`,
          type: "TASK_UPDATED",
          link: "/ky-thuat",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      });
    }

    alert("Đã từ chối xuất linh kiện!");
  };

  const handleImportPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.id || !importForm.name || !importForm.cost || !importForm.stock) {
      return alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
    }

    const cost = Number(importForm.cost);
    const stock = Number(importForm.stock);
    const totalValue = cost * stock;

    if (paidAmount > totalValue) {
      return alert("Số lượng thanh toán không được vượt quá số tiền nhập!");
    }

    const existingPart = state.parts.find(p => p.id === importForm.id);
    if (existingPart) {
      dispatch({
        type: "UPDATE_PART",
        payload: {
          ...existingPart,
          stock: existingPart.stock + stock,
          cost: cost, // Update cost if changed
          supplierId: importForm.supplierId || existingPart.supplierId,
        }
      });
      alert(`Đã cập nhật số lượng cho linh kiện ${existingPart.name}`);
    } else {
      dispatch({
        type: "ADD_PART",
        payload: {
          id: importForm.id,
          name: importForm.name,
          model: importForm.model || "",
          cost: cost,
          stock: stock,
          supplierId: importForm.supplierId,
        }
      });
      alert("Đã thêm linh kiện mới thành công!");
    }

    // Process payment and debt
    if (paidAmount > 0) {
      dispatch({
        type: "ADD_TRANSACTION",
        payload: {
          id: `TXN-${Date.now()}`,
          type: 'EXPENSE',
          amount: paidAmount,
          category: 'IMPORT',
          description: `Thanh toán ${paidAmount.toLocaleString()} khi nhập linh kiện ${importForm.name}`,
          date: new Date().toISOString(),
          storeId: state.currentUser?.storeId || 'KHO_TONG',
          createdBy: state.currentUser?.id || 'unknown',
          referenceId: importForm.id
        }
      });
    }

    const debtAmount = totalValue - paidAmount;
    if (debtAmount > 0 && importForm.supplierId) {
      const supplier = state.suppliers.find(s => s.id === importForm.supplierId);
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
    
    setShowImportModal(false);
    setImportForm({ id: "", name: "", model: "", cost: 0, stock: 0, supplierId: "" });
    setPaidAmount(0);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) return alert("Vui lòng nhập tên nhà cung cấp");

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: supplierForm.name,
      phone: supplierForm.phone,
      address: supplierForm.address,
      notes: supplierForm.notes,
    };

    dispatch({ type: "ADD_SUPPLIER", payload: newSupplier });
    setImportForm({ ...importForm, supplierId: newSupplier.id });
    setShowSupplierModal(false);
    setSupplierForm({ name: "", phone: "", address: "", notes: "" });
    alert("Đã thêm nhà cung cấp mới!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">
          Quản Lý Kho Linh Kiện
        </h1>
        <div className="w-full sm:w-auto flex space-x-2 bg-dark-card p-1 rounded-lg border border-dark-border overflow-x-auto">
          <button
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === "REQUESTS" ? "bg-neon-cyan/20 text-neon-cyan shadow-sm border border-neon-cyan/30" : "text-dark-muted hover:text-dark-text"}`}
            onClick={() => setActiveTab("REQUESTS")}
          >
            Yêu Cầu Xuất
          </button>
          <button
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === "INVENTORY" ? "bg-neon-cyan/20 text-neon-cyan shadow-sm border border-neon-cyan/30" : "text-dark-muted hover:text-dark-text"}`}
            onClick={() => setActiveTab("INVENTORY")}
          >
            Tồn Kho
          </button>
        </div>
      </div>

      {activeTab === "REQUESTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chờ xuất */}
          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-yellow-500/10">
              <h3 className="text-lg font-medium text-yellow-500 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Chờ Xuất ({pendingRequests.length})
              </h3>
            </div>
            <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
              {pendingRequests.map((request) => {
                const part = state.parts.find((p) => p.id === request.partId);
                const task = state.tasks.find((t) => t.id === request.taskId);
                const device = state.devices.find(
                  (d) => d.id === task?.deviceId,
                );
                const assignee = state.users.find(
                  (u) => u.id === (task?.assigneeId || request.technicianId),
                );

                return (
                  <div
                    key={request.id}
                    className="p-4 bg-dark-bg hover:bg-dark-border/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-dark-text text-lg">
                          {part?.name}
                        </p>
                        <p className="text-sm text-dark-muted mt-1">
                          Số lượng:{" "}
                          <span className="font-bold text-neon-cyan">
                            {request.quantity}
                          </span>
                        </p>
                        <p className="text-xs text-dark-muted/70 mt-2">
                          Tồn kho hiện tại: {part?.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        {device ? (
                          <>
                            <p className="text-sm font-medium text-dark-text">
                              {device.model}
                            </p>
                            <p className="text-xs text-dark-muted">
                              IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei.slice(-4)}</button>
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-neon-cyan">
                            Yêu cầu lưu kho
                          </p>
                        )}
                        <p className="text-xs text-dark-muted mt-1">
                          KT: {assignee?.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dark-border flex justify-end space-x-3">
                      <button
                        onClick={() => handleReject(request)}
                        className="px-3 py-1.5 border border-neon-pink/30 text-neon-pink rounded-md text-sm font-medium hover:bg-neon-pink/10 flex items-center transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Từ Chối
                      </button>
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-3 py-1.5 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-md text-sm font-medium hover:bg-neon-green/30 flex items-center shadow-sm transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Xuất Kho
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingRequests.length === 0 && (
                <div className="p-8 text-center text-dark-muted text-sm">
                  Không có yêu cầu xuất linh kiện nào.
                </div>
              )}
            </div>
          </div>

          {/* Lịch sử xuất */}
          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-medium text-dark-text">
                Lịch Sử Xử Lý ({historyRequests.length})
              </h3>
            </div>
            <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
              {historyRequests.map((request) => {
                const part = state.parts.find((p) => p.id === request.partId);
                const task = state.tasks.find((t) => t.id === request.taskId);
                const assignee = state.users.find(
                  (u) => u.id === (task?.assigneeId || request.technicianId),
                );

                return (
                  <div key={request.id} className="p-4 bg-dark-bg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-dark-text">
                          {part?.name} x{request.quantity}
                        </p>
                        <p className="text-xs text-dark-muted mt-1">
                          KT: {assignee?.name} {request.requestType === 'FOR_STOCK' ? '(Lưu kho)' : ''}
                        </p>
                        <p className="text-xs text-dark-muted/70 mt-1">
                          {format(new Date(request.exportedAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
                          request.status === "DA_XUAT"
                            ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                            : "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                        }`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {historyRequests.length === 0 && (
                <div className="p-8 text-center text-dark-muted text-sm">
                  Chưa có lịch sử xử lý.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "INVENTORY" && (
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
              <input
                type="text"
                placeholder="Tìm linh kiện..."
                className="pl-9 pr-4 py-2 w-full rounded-md text-sm dark-input"
              />
            </div>
            <button 
              className="neon-button flex items-center shadow-sm px-4 py-2 rounded-md font-medium text-sm"
              onClick={() => setShowImportModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nhập Hàng
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-border dark-table">
              <thead className="bg-dark-bg/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Mã LK
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Tên Linh Kiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Model Tương Thích
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Nhà Cung Cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Giá Vốn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">
                    Tồn Kho
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-card divide-y divide-dark-border">
                {state.parts.map((part) => {
                  const supplier = state.suppliers.find(s => s.id === part.supplierId);
                  return (
                  <tr key={part.id} className="hover:bg-dark-border/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                      {part.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                      {part.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {part.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {supplier?.name || "---"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {part.cost.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          part.stock > 10
                            ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                            : "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                        }`}
                      >
                        {part.stock}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nhập Hàng */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-xl shadow-xl border border-dark-border w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neon-cyan flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Nhập Kho Linh Kiện
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-dark-muted hover:text-neon-pink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleImportPart} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Mã Sản Phẩm (ID) *</label>
                  <select
                    required
                    className="w-full rounded-md p-2 text-sm dark-input"
                    value={importForm.id}
                    onChange={e => {
                      const id = e.target.value;
                      setImportForm({ ...importForm, id });
                      // Auto-fill if exists in parts or products
                      const existingPart = state.parts.find(p => p.id === id);
                      if (existingPart) {
                        setImportForm(prev => ({
                          ...prev,
                          name: existingPart.name,
                          model: existingPart.model,
                          cost: existingPart.cost,
                          supplierId: existingPart.supplierId || "",
                        }));
                      } else {
                        const product = state.products.find(p => p.id === id);
                        if (product) {
                          setImportForm(prev => ({
                            ...prev,
                            name: product.name,
                            model: product.model,
                            cost: product.costPrice,
                          }));
                        }
                      }
                    }}
                  >
                    <option value="">-- Chọn Mã LK --</option>
                    {state.products.filter(p => p.category === 'PART').map(p => (
                      <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-dark-muted mt-1">Chọn mã linh kiện từ danh mục Hàng Hóa</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Tên Hàng Hóa *</label>
                  <input 
                    type="text" required
                    className="w-full rounded-md p-2 text-sm dark-input"
                    placeholder="VD: Pin iPhone 12 Dung Lượng Cao"
                    value={importForm.name}
                    onChange={e => setImportForm({ ...importForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Model Tương Thích</label>
                  <input 
                    type="text"
                    className="w-full rounded-md p-2 text-sm dark-input"
                    placeholder="VD: iPhone 12, 12 Pro"
                    value={importForm.model}
                    onChange={e => setImportForm({ ...importForm, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Nhà Cung Cấp</label>
                  <div className="flex space-x-2">
                    <select 
                      className="flex-1 rounded-md p-2 text-sm dark-input"
                      value={importForm.supplierId}
                      onChange={e => setImportForm({ ...importForm, supplierId: e.target.value })}
                    >
                      <option value="">-- Chọn NCC --</option>
                      {state.suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={() => setShowSupplierModal(true)}
                      className="px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-neon-cyan hover:bg-dark-border/50"
                      title="Thêm Nhà Cung Cấp Mới"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Giá Nhập (VNĐ) *</label>
                  <input 
                    type="number" required min="0"
                    className="w-full rounded-md p-2 text-sm dark-input"
                    value={importForm.cost || ''}
                    onChange={e => setImportForm({ ...importForm, cost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Số Lượng Nhập *</label>
                  <input 
                    type="number" required min="1"
                    className="w-full rounded-md p-2 text-sm dark-input"
                    value={importForm.stock || ''}
                    onChange={e => setImportForm({ ...importForm, stock: Number(e.target.value) })}
                  />
                </div>
                {importForm.cost && importForm.stock ? (
                  <div className="col-span-1 md:col-span-2 border-t border-dark-border mt-2 pt-4">
                    <p className="text-sm font-bold text-neon-cyan mb-2">Tổng giá trị: {(importForm.cost * importForm.stock).toLocaleString()}đ</p>
                    <label className="block text-sm font-medium text-dark-muted mb-1">Số Tiền Đã Thanh Toán (VNĐ)</label>
                    <input 
                      type="number" min="0" max={importForm.cost * importForm.stock}
                      className="w-full rounded-md p-2 text-sm dark-input"
                      value={paidAmount || ''}
                      placeholder="0"
                      onChange={e => setPaidAmount(Number(e.target.value))}
                    />
                    <p className="text-xs text-dark-muted mt-1">
                      Còn nợ NCC: <span className="text-red-400 font-bold">{((importForm.cost * importForm.stock) - paidAmount).toLocaleString()}đ</span>
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border/50">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu Phiếu Nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Nhà Cung Cấp */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-dark-card rounded-xl shadow-xl border border-neon-cyan/50 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-neon-cyan/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neon-cyan">Thêm Nhà Cung Cấp Mới</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-dark-muted hover:text-neon-pink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Tên NCC *</label>
                <input 
                  type="text" required
                  className="w-full rounded-md p-2 text-sm dark-input"
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Số Điện Thoại</label>
                <input 
                  type="text"
                  className="w-full rounded-md p-2 text-sm dark-input"
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Địa Chỉ</label>
                <input 
                  type="text"
                  className="w-full rounded-md p-2 text-sm dark-input"
                  value={supplierForm.address}
                  onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Ghi Chú</label>
                <textarea 
                  rows={2}
                  className="w-full rounded-md p-2 text-sm dark-input"
                  value={supplierForm.notes}
                  onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border/50">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm NCC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
