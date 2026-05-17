import React, { useState, useMemo } from "react";
import { useAppContext } from "../store/AppContext";
import {
  Search,
  FileText,
  ShoppingCart,
  Calendar,
  Phone,
  User,
  Store,
} from "lucide-react";
import DateRangePicker from "../components/DateRangePicker";
import { startOfMonth, endOfMonth } from "date-fns";

export default function LichSuDonHang() {
  const { state } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()).toISOString().split("T")[0],
    end: endOfMonth(new Date()).toISOString().split("T")[0],
  });

  const filteredOrders = useMemo(() => {
    return state.orders
      .filter((order) => {
        // Search
        const searchStr = searchQuery.toLowerCase();
        const matchSearch =
          order.id.toLowerCase().includes(searchStr) ||
          order.customerName.toLowerCase().includes(searchStr) ||
          order.customerPhone.includes(searchStr);

        // Category / Store
        const matchStore =
          selectedStore === "ALL" || order.storeId === selectedStore;

        // Date Range
        const orderDate = new Date(order.createdAt).getTime();
        const startDate = new Date(dateRange.start).getTime();
        const endDate = new Date(dateRange.end + "T23:59:59").getTime();
        const matchDate = orderDate >= startDate && orderDate <= endDate;

        return matchSearch && matchStore && matchDate;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [state.orders, searchQuery, selectedStore, dateRange]);

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + order.finalAmount,
    0,
  );

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-card p-4 rounded-xl border border-dark-border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neon-cyan neon-text tracking-tight flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Lịch Sử Bán Hàng
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Tra cứu và quản lý hóa đơn đã bán
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {(!state.currentUser?.storeId ||
            state.currentUser?.role === "ADMIN") && (
            <div className="flex items-center bg-dark-bg border border-dark-border rounded-lg px-3 py-2 w-full sm:w-auto">
              <Store className="w-4 h-4 text-dark-muted mr-2 shrink-0" />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-transparent text-dark-text outline-none text-sm w-full"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                <option value="KHO_TONG">Kho Tổng</option>
                <option value="CH_1">CH 1</option>
                <option value="CH_2">CH 2</option>
                <option value="CH_3">CH 3</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-dark-card rounded-xl border border-dark-border p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm mã HĐ, tên KH, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:border-neon-cyan outline-none text-dark-text transition-colors"
            />
          </div>
          <div>
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={(start, end) => setDateRange({ start, end })}
            />
          </div>
        </div>

        <div className="flex justify-between items-center bg-dark-bg p-3 rounded-lg border border-dark-border mb-4">
          <span className="text-dark-muted">
            Tổng cộng ({filteredOrders.length} hóa đơn):
          </span>
          <span className="text-lg font-bold text-neon-cyan">
            {totalRevenue.toLocaleString()}đ
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-dark-border">
          {/* Desktop Table View */}
          <table className="min-w-full dark-table hidden md:table">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-muted">
                  Thời Gian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-muted">
                  Mã HĐ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-muted">
                  Khách Hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-muted">
                  Sản Phẩm
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-muted">
                  Tổng Tiền
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-dark-muted">
                  HTTT
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-dark-border">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-dark-border/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-muted">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-neon-cyan">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-dark-text">
                        {order.customerName}
                      </div>
                      <div className="text-dark-muted text-xs">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-muted max-w-xs break-words">
                      {order.items ? (
                        <ul className="list-disc pl-4">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="line-clamp-1">
                              {item.name} x{item.quantity}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        order.deviceImeis.join(", ")
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-neon-green">
                      {order.finalAmount.toLocaleString()}đ
                      {order.debtAmount > 0 && (
                        <div className="text-xs text-red-400">
                          Nợ: {order.debtAmount.toLocaleString()}đ
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className="px-2 py-1 text-xs rounded-lg bg-dark-bg border border-dark-border">
                        {order.paymentMethod === "CASH"
                          ? "Tiền mặt"
                          : order.paymentMethod === "TRANSFER"
                            ? "Chuyển khoản"
                            : order.paymentMethod === "CARD"
                              ? "Quẹt thẻ"
                              : `Trả góp`}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-dark-muted"
                  >
                    Không tìm thấy hóa đơn nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Grid View */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-dark-bg border border-dark-border rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-neon-cyan text-base mb-1">
                        {order.id}
                      </div>
                      <div className="text-xs text-dark-muted">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-dark-card border border-dark-border">
                      {order.paymentMethod === "CASH"
                        ? "Tiền mặt"
                        : order.paymentMethod === "TRANSFER"
                          ? "Chuyển khoản"
                          : order.paymentMethod === "CARD"
                            ? "Quẹt thẻ"
                            : `Trả góp`}
                    </span>
                  </div>

                  <div className="bg-dark-card rounded px-3 py-2 border border-dark-border">
                    <div className="font-medium text-dark-text text-sm">
                      {order.customerName}
                    </div>
                    <div className="text-dark-muted text-xs flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {order.customerPhone}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-dark-muted uppercase mb-1">
                      Sản phẩm
                    </div>
                    <div className="text-sm text-dark-text max-h-24 overflow-y-auto custom-scrollbar bg-dark-card p-2 rounded border border-dark-border">
                      {order.items ? (
                        <ul className="list-disc pl-4 text-xs">
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              {item.name} x{item.quantity}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs">
                          {order.deviceImeis.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-dark-border/50">
                    <div>
                      {order.debtAmount > 0 && (
                        <>
                          <div className="text-[10px] text-dark-muted">
                            Khách nợ
                          </div>
                          <div className="text-sm font-bold text-red-400">
                            {order.debtAmount.toLocaleString()}đ
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-dark-muted">
                        Tổng thanh toán
                      </div>
                      <div className="text-lg font-bold text-neon-green">
                        {order.finalAmount.toLocaleString()}đ
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-dark-muted">
                Không tìm thấy hóa đơn nào phù hợp.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
