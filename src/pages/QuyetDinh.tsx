import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Device } from "../types";
import { 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  ArrowRight,
  AlertCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

export default function QuyetDinh() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  const pendingDevices = state.devices.filter(d => d.status === 'CHO_QUYET_DINH');

  const handleDecision = (status: Device['status'], label: string) => {
    if (!selectedDevice) return;

    const updatedDevice = {
      ...selectedDevice,
      status,
      notes: `${selectedDevice.notes}\n\n[QUYẾT ĐỊNH - ${label}]: ${decisionNotes}`,
    };

    dispatch({ type: 'UPDATE_DEVICE', payload: updatedDevice });

    // Add notification for relevant roles
    let targetRole = '';
    let message = '';
    let link = '';

    if (status === 'CHO_PHAN_TASK') {
      targetRole = 'TRUONG_KT';
      message = `Máy ${selectedDevice.model} đã được duyệt sửa. Vui lòng phân task.`;
      link = '/dieu-phoi';
    } else if (status === 'CHO_TRA_NCC') {
      targetRole = 'KHO_MAY';
      message = `Máy ${selectedDevice.model} được quyết định trả NCC.`;
      link = '/kho-may';
    }

    if (targetRole) {
      const targetUsers = state.users.filter(u => u.role === targetRole || u.role === 'ADMIN');
      targetUsers.forEach(user => {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: `noti-${Date.now()}-${user.id}`,
            userId: user.id,
            title: 'Quyết định mới!',
            message,
            type: 'DEVICE_UPDATED',
            link,
            isRead: false,
            createdAt: new Date().toISOString(),
          }
        });
      });
    }

    alert(`Đã thực hiện quyết định: ${label}`);
    setSelectedDevice(null);
    setDecisionNotes("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Duyệt Quyết Định</h1>
        <div className="flex items-center space-x-2 text-dark-muted text-sm bg-dark-card px-3 py-1.5 rounded-lg border border-dark-border">
          <Clock className="w-4 h-4" />
          <span>{pendingDevices.length} máy đang chờ xử lý</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách máy chờ quyết định */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden col-span-1">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50">
            <h3 className="text-lg font-medium text-dark-text">Máy Chờ Quyết Định</h3>
          </div>
          <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
            {pendingDevices.map((device) => (
              <div
                key={device.id}
                onClick={() => setSelectedDevice(device)}
                className={`p-4 cursor-pointer hover:bg-dark-border/50 transition-colors ${selectedDevice?.id === device.id ? "bg-dark-bg border-l-4 border-neon-cyan" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-dark-text">{device.model}</p>
                    <p className="text-xs text-dark-muted font-mono mt-1">IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button></p>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                    Chờ QĐ
                  </span>
                </div>
                <p className="text-xs text-neon-pink mt-2 line-clamp-2 italic">
                  Lỗi báo cáo: {device.notes.split("[TEST ĐẦU VÀO]:")[1] || "Chưa rõ"}
                </p>
              </div>
            ))}
            {pendingDevices.length === 0 && (
              <div className="p-12 text-center text-dark-muted">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Không có máy nào cần quyết định.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chi tiết & Hành động */}
        <div className="lg:col-span-2">
          {selectedDevice ? (
            <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
              <div className="p-6 border-b border-dark-border bg-dark-bg/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-dark-text">{selectedDevice.model}</h2>
                    <p className="text-sm text-dark-muted font-mono">IMEI: <button onClick={() => navigate(`/thiet-bi/${selectedDevice.imei}`)} className="text-neon-cyan hover:underline">{selectedDevice.imei}</button></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-muted">Nguồn: {selectedDevice.source}</p>
                    <p className="text-xs text-dark-muted">Ngày nhận: {selectedDevice.receivedDate}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                  <h4 className="text-sm font-bold text-neon-cyan mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Báo cáo tình trạng từ Tester
                  </h4>
                  <p className="text-sm text-dark-text whitespace-pre-wrap italic">
                    {selectedDevice.notes.split("[TEST ĐẦU VÀO]:")[1] || "Không có thông tin chi tiết."}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-2">
                    Ghi chú quyết định của Quản lý
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md sm:text-sm p-3 dark-input"
                    placeholder="Nhập lý do hoặc chỉ đạo cụ thể..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDecision('CHO_PHAN_TASK', 'DUYỆT SỬA')}
                    className="flex items-center justify-between p-4 bg-neon-green/10 border border-neon-green/30 rounded-xl hover:bg-neon-green/20 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-neon-green">Duyệt Sửa Chữa</p>
                      <p className="text-xs text-dark-muted">Chuyển sang chờ phân task</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neon-green group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDecision('CHO_TRA_NCC', 'TRẢ NCC')}
                    className="flex items-center justify-between p-4 bg-neon-pink/10 border border-neon-pink/30 rounded-xl hover:bg-neon-pink/20 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-neon-pink">Trả NCC / Đổi Trả</p>
                      <p className="text-xs text-dark-muted">Máy lỗi nặng, không hiệu quả</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neon-pink group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDecision('MAY_XAC', 'LƯU XÁC')}
                    className="flex items-center justify-between p-4 bg-dark-border/30 border border-dark-border rounded-xl hover:bg-dark-border/50 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-dark-text">Lưu Kho Xác</p>
                      <p className="text-xs text-dark-muted">Rã linh kiện hoặc bán xác</p>
                    </div>
                    <Trash2 className="w-5 h-5 text-dark-muted group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDecision('CHO_BAN', 'BÁN NGAY')}
                    className="flex items-center justify-between p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl hover:bg-neon-cyan/20 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-neon-cyan">Bán Ngay (As-is)</p>
                      <p className="text-xs text-dark-muted">Chấp nhận tình trạng hiện tại</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-neon-cyan group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-bg rounded-xl border border-dark-border border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-dark-muted">
              <HelpCircle className="w-12 h-12 mb-4 text-dark-border" />
              <p>Chọn một máy bên trái để thực hiện quyết định</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
