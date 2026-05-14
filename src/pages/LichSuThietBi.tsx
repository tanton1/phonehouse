import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { 
  Smartphone, 
  History, 
  Activity, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

export default function LichSuThietBi() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const { state } = useAppContext();

  const device = state.devices.find(d => d.imei === imei);

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-dark-text">Không tìm thấy thiết bị</h2>
        <p className="text-dark-muted">Thiết bị với IMEI {imei} không tồn tại trong hệ thống.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-border/50"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Lấy lịch sử task
  const deviceTasks = state.tasks.filter(t => t.deviceId === device.id).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Lấy lịch sử QC
  const deviceQCReports = state.qcReports.filter(qc => qc.deviceId === device.id).sort((a, b) => 
    new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
  );

  // Lấy sự cố
  const deviceIncidents = state.incidents.filter(i => i.deviceId === device.id).sort((a, b) => 
    new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAN_SANG':
      case 'DA_BAN':
      case 'HOAN_TAT':
        return 'text-neon-green bg-neon-green/10 border-neon-green/30';
      case 'DANG_XU_LY':
      case 'CHO_LINH_KIEN':
      case 'CHO_QC':
        return 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30';
      case 'MAY_XAC':
      case 'DA_TRA_NCC':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-dark-muted bg-dark-border/30 border-dark-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-dark-card rounded-lg transition-colors text-dark-muted hover:text-dark-text"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
          <History className="w-6 h-6 mr-2" />
          Truy Xuất Lịch Sử Thiết Bị
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin máy & Nguồn gốc */}
        <div className="space-y-6 lg:col-span-1">
          {/* Thông tin máy */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Smartphone className="w-24 h-24 text-neon-cyan" />
            </div>
            <h2 className="text-lg font-bold text-dark-text flex items-center mb-4 border-b border-dark-border pb-2">
              <Smartphone className="w-5 h-5 mr-2 text-neon-cyan" />
              Thông Tin Máy
            </h2>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Model:</span>
                <span className="text-sm font-bold text-dark-text">{device.model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">IMEI:</span>
                <span className="text-sm font-mono text-neon-cyan">{device.imei}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Màu sắc:</span>
                <span className="text-sm text-dark-text">{device.color}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Dung lượng:</span>
                <span className="text-sm text-dark-text">{device.capacity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Trạng thái:</span>
                <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${getStatusColor(device.status)}`}>
                  {device.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Vị trí:</span>
                <span className="text-sm text-dark-text flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-neon-cyan" />
                  {device.location || 'KHO_TONG'}
                </span>
              </div>
              {(state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'KHO_MAY') && (
                <div className="flex justify-between items-center pt-2 border-t border-dark-border/50">
                  <span className="text-sm text-dark-muted">Giá nhập:</span>
                  <span className="text-sm font-bold text-neon-green">{device.importPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
            </div>
          </div>

          {/* Nguồn gốc */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark-text flex items-center mb-4 border-b border-dark-border pb-2">
              <MapPin className="w-5 h-5 mr-2 text-neon-green" />
              Nguồn Gốc
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Nguồn:</span>
                <span className="text-sm font-medium text-dark-text">{device.source}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Loại tiếp nhận:</span>
                <span className="text-sm text-dark-text">{device.receptionType || 'IMPORT'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Ngày nhập:</span>
                <span className="text-sm text-dark-text flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(device.importDate.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Người nhận:</span>
                <span className="text-sm text-neon-cyan flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {state.users.find(u => u.id === device.receiverId)?.name || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Lịch sử test đầu vào */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark-text flex items-center mb-4 border-b border-dark-border pb-2">
              <Activity className="w-5 h-5 mr-2 text-yellow-400" />
              Test Đầu Vào
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-muted">Ngoại hình:</span>
                <span className="text-sm font-bold text-dark-text">{device.appearance || 'Chưa đánh giá'}</span>
              </div>
              
              {device.testResults ? (
                <div className="space-y-2">
                  <span className="text-sm text-dark-muted block mb-2">Chi tiết chức năng:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(device.testResults).map(([key, result]) => (
                      <div key={key} className="flex justify-between items-center bg-dark-bg p-2 rounded border border-dark-border">
                        <span className="text-xs text-dark-text capitalize">{key}</span>
                        {result === 'OK' ? (
                          <CheckCircle2 className="w-4 h-4 text-neon-green" />
                        ) : result === 'FAIL' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <span className="text-[10px] text-dark-muted">UNTESTED</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-dark-muted italic text-center py-4">Chưa có dữ liệu test đầu vào</p>
              )}
            </div>
          </div>
        </div>

        {/* Cột phải: Lịch sử luân chuyển & sửa chữa */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg h-full">
            <h2 className="text-lg font-bold text-dark-text flex items-center mb-6 border-b border-dark-border pb-2">
              <Wrench className="w-5 h-5 mr-2 text-neon-cyan" />
              Lịch Sử Luân Chuyển & Sửa Chữa
            </h2>
            
            <div className="relative border-l border-dark-border ml-3 space-y-8 pb-4">
              {/* Event: Nhập kho */}
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-neon-green rounded-full -left-[6.5px] top-1.5 shadow-[0_0_8px_rgba(0,255,0,0.5)]"></div>
                <div className="text-xs text-dark-muted mb-1">{format(new Date(device.importDate.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}</div>
                <div className="bg-dark-bg border border-dark-border p-3 rounded-lg">
                  <h4 className="text-sm font-bold text-dark-text">Nhập kho hệ thống</h4>
                  <p className="text-xs text-dark-muted mt-1">Nguồn: {device.source} - Người nhận: {state.users.find(u => u.id === device.receiverId)?.name}</p>
                </div>
              </div>

              {/* Lịch sử Tasks */}
              {deviceTasks.map((task, index) => {
                const assignee = state.users.find(u => u.id === task.assigneeId);
                const assigner = state.users.find(u => u.id === task.assignerId);
                const isCompleted = task.status === 'DONG_TASK';
                
                return (
                  <div key={task.id} className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 ${isCompleted ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.5)]' : 'bg-yellow-400 shadow-[0_0_8px_rgba(255,255,0,0.5)]'}`}></div>
                    <div className="text-xs text-dark-muted mb-1">{format(new Date(task.createdAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}</div>
                    <div className="bg-dark-bg border border-dark-border p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-dark-text">{task.type}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${isCompleted ? 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-dark-text mb-2">{task.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dark-border/50">
                        <div className="text-xs">
                          <span className="text-dark-muted">Người giao: </span>
                          <span className="text-dark-text">{assigner?.name}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-dark-muted">Người nhận: </span>
                          <span className="text-neon-cyan">{assignee?.name}</span>
                        </div>
                      </div>

                      {/* Linh kiện sử dụng */}
                      {task.usedParts && task.usedParts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dark-border/50">
                          <span className="text-xs text-dark-muted block mb-1">Linh kiện đã dùng:</span>
                          <ul className="list-disc list-inside text-xs text-dark-text">
                            {task.usedParts.map((up, i) => {
                              const part = state.parts.find(p => p.id === up.partId);
                              return (
                                <li key={i}>{part?.name || 'Unknown part'} (x{up.quantity})</li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Lịch sử QC */}
              {deviceQCReports.map((qc, index) => {
                const tester = state.users.find(u => u.id === qc.testerId);
                const isPass = qc.status === 'PASS';
                
                return (
                  <div key={qc.id} className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 ${isPass ? 'bg-neon-green shadow-[0_0_8px_rgba(0,255,0,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.5)]'}`}></div>
                    <div className="text-xs text-dark-muted mb-1">{format(new Date(qc.testedAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}</div>
                    <div className="bg-dark-bg border border-dark-border p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-dark-text">Kiểm tra QC</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${isPass ? 'text-neon-green border-neon-green/30 bg-neon-green/10' : 'text-red-500 border-red-500/30 bg-red-500/10'}`}>
                          {qc.status}
                        </span>
                      </div>
                      <p className="text-xs text-dark-text mb-2">Ghi chú: {qc.notes}</p>
                      <div className="text-xs">
                        <span className="text-dark-muted">Người test: </span>
                        <span className="text-dark-text">{tester?.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {deviceTasks.length === 0 && deviceQCReports.length === 0 && (
                <div className="pl-6 text-sm text-dark-muted italic">
                  Chưa có lịch sử luân chuyển hay sửa chữa nào.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
