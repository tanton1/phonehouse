import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import DateRangePicker from "../components/DateRangePicker";
import { startOfDay, endOfDay, isWithinInterval, parseISO, format } from "date-fns";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  AlertTriangle,
  DollarSign,
  Smartphone,
  Store,
  TrendingUp,
  ArrowRightLeft,
  ShieldAlert,
  UserPlus,
  Package,
  X
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const RECEPTION_TYPE_MAP: Record<string, string> = {
  IMPORT: "Nhập mới",
  TRADE_IN: "Thu cũ",
  WARRANTY: "Bảo hành",
  SERVICE: "Khách lẻ",
  SHOP_TRANSFER: "Shop chuyển",
};

const COLORS = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800'];

export default function Dashboard() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<{title: string, devices: any[]} | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredDevices = useMemo(() => {
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    return state.devices.filter(d => {
      try {
        const importDate = parseISO(d.importDate.replace(' ', 'T'));
        return isWithinInterval(importDate, { start, end });
      } catch (e) {
        return true;
      }
    });
  }, [state.devices, startDate, endDate]);

  const totalDevices = filteredDevices.length;

  // Group 1: Máy Đang Xử Lý (Tại Kho Tổng/Kỹ Thuật)
  const pendingTestDevices = filteredDevices.filter((d) => 
    ["MOI_NHAP", "CHO_TEST", "DA_TEST"].includes(d.status)
  );
  const pendingTest = pendingTestDevices.length;
  
  const inTechnicalDevices = filteredDevices.filter((d) => 
    ["CHO_PHAN_TASK", "DANG_XU_LY", "CHO_LINH_KIEN", "CHO_QC", "CHO_QUYET_DINH", "BAO_HANH"].includes(d.status)
  );
  const inTechnical = inTechnicalDevices.length;
  
  const inMainStockDevices = filteredDevices.filter((d) => 
    ["CHO_BAN", "TRADE_IN", "MAY_XAC"].includes(d.status) && (!d.location || d.location === "KHO_TONG")
  );
  const inMainStock = inMainStockDevices.length;
  
  // Group 2: Máy Đã Xuất Kho / Hoàn Tất
  const atShopsDevices = filteredDevices.filter((d) => 
    d.status === "CHO_BAN" && d.location && d.location !== "KHO_TONG" && d.location !== "DA_BAN"
  );
  const atShops = atShopsDevices.length;
  
  const soldDevices = filteredDevices.filter((d) => d.status === "DA_BAN" || d.location === "DA_BAN");
  const sold = soldDevices.length;
  
  const finishedDevices = filteredDevices.filter((d) => 
    d.status === "HOAN_TAT" || d.status === "DA_TRA_NCC" || d.status === "CHO_TRA_NCC"
  );
  const finished = finishedDevices.length;

  const totalActive = pendingTest + inTechnical + inMainStock;
  const totalCompleted = atShops + sold + finished;

  // 1. Biểu đồ số lượng máy kỹ thuật đang xử lý theo nguồn
  const devicesInProgress = filteredDevices.filter(d => 
    ["DANG_XU_LY", "CHO_LINH_KIEN", "CHO_QC", "CHO_PHAN_TASK", "BAO_HANH", "CHO_TEST"].includes(d.status)
  );
  
  const processingBySourceData = useMemo(() => {
    const counts: Record<string, number> = {
      IMPORT: 0,
      TRADE_IN: 0,
      WARRANTY: 0,
      SERVICE: 0,
      SHOP_TRANSFER: 0,
    };
    
    devicesInProgress.forEach(d => {
      if (d.receptionType && counts[d.receptionType] !== undefined) {
        counts[d.receptionType]++;
      } else {
        counts['IMPORT']++; // Default fallback
      }
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: RECEPTION_TYPE_MAP[key] || key,
      value
    })).filter(item => item.value > 0);
  }, [devicesInProgress]);

  // 2. Máy chậm deadline
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return state.tasks.filter(t => {
      if (t.status === "DONG_TASK" || t.status === "HUY_TASK" || t.status === "HOAN_THANH_CHO_QC") return false;
      if (!t.deadline) return false;
      return new Date(t.deadline) < now;
    }).map(t => {
      const device = filteredDevices.find(d => d.id === t.deviceId);
      const assignee = state.users.find(u => u.id === t.assigneeId);
      return { ...t, device, assignee };
    }).filter(t => t.device);
  }, [state.tasks, filteredDevices, state.users]);

  // 3. Hoa hồng team kỹ thuật
  const commissionData = useMemo(() => {
    const techUsers = state.users.filter(u => u.role === "KY_THUAT");
    const completedTasks = state.tasks.filter(t => t.status === "DONG_TASK" || t.status === "HOAN_THANH_CHO_QC");
    
    return techUsers.map(tech => {
      const tasksForTech = completedTasks.filter(t => t.assigneeId === tech.id);
      const totalCommission = tasksForTech.reduce((sum, t) => sum + (t.commission || 0), 0);
      return {
        name: tech.name,
        commission: totalCommission,
        taskCount: tasksForTech.length
      };
    }).filter(item => item.commission > 0 || item.taskCount > 0);
  }, [state.users, state.tasks]);

  const totalCommission = commissionData.reduce((sum, item) => sum + item.commission, 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Tổng Quan Hệ Thống</h1>
        <div className="w-full sm:w-auto bg-dark-card px-4 py-2 rounded-lg border border-neon-cyan/30 flex items-center justify-center">
          <Activity className="w-5 h-5 mr-2 text-neon-cyan" />
          <span className="text-sm text-dark-muted mr-2">Tổng máy hệ thống:</span>
          <span className="text-xl font-bold text-neon-cyan">{totalDevices}</span>
        </div>
      </div>

      {/* Báo cáo 1: Máy Đang Xử Lý */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark-text flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-500" />
            Báo Cáo Máy Đang Xử Lý ({totalActive})
          </h2>
          <div className="h-px flex-1 bg-dark-border mx-4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Nhập Hàng & Test" 
            value={pendingTest} 
            icon={Smartphone} 
            color="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30" 
            subtitle="Mới nhập, Chờ test, Đã test"
            onSelect={() => setSelectedReport({title: "Nhập Hàng & Test", devices: pendingTestDevices})}
            isSelected={selectedReport?.title === "Nhập Hàng & Test"}
          />
          <StatCard 
            title="Đang Xử Lý KT" 
            value={inTechnical} 
            icon={Wrench} 
            color="bg-neon-pink/10 text-neon-pink border border-neon-pink/30" 
            subtitle="Sửa chữa, Chờ linh kiện, QC"
            onSelect={() => setSelectedReport({title: "Đang Xử Lý KT", devices: inTechnicalDevices})}
            isSelected={selectedReport?.title === "Đang Xử Lý KT"}
          />
          <StatCard 
            title="Tồn Kho Tổng" 
            value={inMainStock} 
            icon={CheckCircle} 
            color="bg-neon-green/10 text-neon-green border border-neon-green/30" 
            subtitle="Chờ bán, Trade-in, Máy xác"
            onSelect={() => setSelectedReport({title: "Tồn Kho Tổng", devices: inMainStockDevices})}
            isSelected={selectedReport?.title === "Tồn Kho Tổng"}
          />
        </div>
      </section>

      {/* Báo cáo 2: Máy Đã Hoàn Tất / Xuất Kho */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark-text flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-neon-green" />
            Báo Cáo Máy Đã Hoàn Tất / Xuất Kho ({totalCompleted})
          </h2>
          <div className="h-px flex-1 bg-dark-border mx-4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Đã Chuyển Shop" 
            value={atShops} 
            icon={Store} 
            color="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30" 
            subtitle="Máy đang trưng bày tại các Shop"
            onSelect={() => setSelectedReport({title: "Đã Chuyển Shop", devices: atShopsDevices})}
            isSelected={selectedReport?.title === "Đã Chuyển Shop"}
          />
          <StatCard 
            title="Đã Xuất Bán" 
            value={sold} 
            icon={DollarSign} 
            color="bg-neon-green/10 text-neon-green border border-neon-green/30" 
            subtitle="Đã bán cho khách/shop"
            onSelect={() => setSelectedReport({title: "Đã Xuất Bán", devices: soldDevices})}
            isSelected={selectedReport?.title === "Đã Xuất Bán"}
          />
          <StatCard 
            title="Hoàn Tất / Trả NCC" 
            value={finished} 
            icon={AlertCircle} 
            color="bg-dark-border text-dark-muted border border-dark-border" 
            subtitle="Sửa lẻ xong, Trả bảo hành, Trả NCC"
            onSelect={() => setSelectedReport({title: "Hoàn Tất / Trả NCC", devices: finishedDevices})}
            isSelected={selectedReport?.title === "Hoàn Tất / Trả NCC"}
          />
        </div>
      </section>

      {/* Detailed View Section */}
      {selectedReport && (
        <section className="bg-dark-card rounded-xl border border-dark-border p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-neon-cyan">Chi tiết: {selectedReport.title} ({selectedReport.devices.length})</h3>
            <button onClick={() => setSelectedReport(null)} className="text-dark-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-dark-text">
              <thead className="text-xs text-dark-muted uppercase bg-dark-bg">
                <tr>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">IMEI</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Người xử lý / Vị trí</th>
                </tr>
              </thead>
              <tbody>
                {selectedReport.devices.map((device: any) => {
                  const activeTask = state.tasks.find(t => t.deviceId === device.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
                  const assignee = activeTask ? state.users.find(u => u.id === activeTask.assigneeId) : null;
                  const location = assignee ? assignee.name : (device.location || 'KHO_TONG');
                  return (
                    <tr key={device.id} className="border-b border-dark-border hover:bg-dark-bg/50">
                      <td className="px-4 py-3 font-medium">{device.model}</td>
                      <td className="px-4 py-3 font-mono text-neon-cyan">
                        <button onClick={() => navigate(`/thiet-bi/${device.imei}`)} className="hover:underline">
                          {device.imei}
                        </button>
                      </td>
                      <td className="px-4 py-3">{device.status}</td>
                      <td className="px-4 py-3">{location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Báo cáo 3: Báo Cáo Tồn Kho Theo Nguồn Gốc */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark-text flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-neon-cyan" />
            Báo Cáo Tồn Kho Theo Nguồn Gốc (Đang Xử Lý)
          </h2>
          <div className="h-px flex-1 bg-dark-border mx-4"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(RECEPTION_TYPE_MAP).map(([key, label]) => {
            const devices = filteredDevices.filter(d => 
              d.receptionType === key && 
              !["DA_BAN", "HOAN_TAT", "DA_TRA_NCC"].includes(d.status)
            );
            const count = devices.length;
            
            let icon = Smartphone;
            let color = "bg-dark-bg text-dark-muted border border-dark-border";
            
            if (key === 'IMPORT') { icon = Package; color = "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"; }
            if (key === 'TRADE_IN') { icon = ArrowRightLeft; color = "bg-neon-pink/10 text-neon-pink border border-neon-pink/30"; }
            if (key === 'WARRANTY') { icon = ShieldAlert; color = "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"; }
            if (key === 'SERVICE') { icon = UserPlus; color = "bg-neon-green/10 text-neon-green border border-neon-green/30"; }
            if (key === 'SHOP_TRANSFER') { icon = Store; color = "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"; }

            return (
              <div 
                key={key} 
                className={`bg-dark-card p-4 rounded-xl border border-dark-border hover:border-neon-cyan/50 transition-colors cursor-pointer group ${selectedReport?.title === label ? 'border-neon-cyan' : ''}`}
                onClick={() => setSelectedReport({title: label, devices})}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${color}`}>
                    {React.createElement(icon, { className: "w-4 h-4" })}
                  </div>
                  <span className="text-xl font-bold text-dark-text group-hover:text-neon-cyan transition-colors">{count}</span>
                </div>
                <p className="text-xs font-medium text-dark-muted">{label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Biểu đồ máy đang xử lý */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <h2 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-neon-cyan" />
            Máy Đang Xử Lý Theo Nguồn ({devicesInProgress.length})
          </h2>
          {processingBySourceData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processingBySourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {processingBySourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                    itemStyle={{ color: '#00ffff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-muted">
              Không có máy đang xử lý
            </div>
          )}
        </div>

        {/* Biểu đồ hoa hồng */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-dark-text flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-neon-green" />
              Hoa Hồng Kỹ Thuật
            </h2>
            <span className="text-neon-green font-bold text-lg">
              {totalCommission.toLocaleString()}đ
            </span>
          </div>
          {commissionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commissionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#888" tickFormatter={(value) => `${value / 1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#888" width={80} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Hoa hồng']}
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                  />
                  <Bar dataKey="commission" fill="#00ff00" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-muted">
              Chưa có dữ liệu hoa hồng
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Danh sách máy chậm deadline */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-dark-text flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-neon-pink" />
              Máy Chậm Deadline
            </h2>
            <span className="bg-neon-pink/20 text-neon-pink px-3 py-1 rounded-full text-sm font-bold">
              {overdueTasks.length} máy
            </span>
          </div>
          
          {overdueTasks.length === 0 ? (
            <p className="text-dark-muted text-sm text-center py-8">Tuyệt vời! Không có máy nào chậm trễ.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {overdueTasks.map((task) => (
                <div key={task.id} className="p-3 bg-dark-bg border border-neon-pink/30 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-dark-text">
                      {task.device?.model} - <button onClick={() => navigate(`/thiet-bi/${task.device?.imei}`)} className="text-neon-cyan hover:underline">{task.device?.imei}</button>
                    </p>
                    <span className="text-xs font-medium bg-neon-pink/10 text-neon-pink px-2 py-1 rounded">
                      {new Date(task.deadline).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-dark-muted mb-2 line-clamp-1">{task.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-dark-muted">
                      KTV: <span className="text-neon-cyan">{task.assignee?.name || 'Chưa gán'}</span>
                    </span>
                    <span className="text-yellow-500">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <h2 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-neon-cyan" />
            Máy Mới Tiếp Nhận
          </h2>
          {filteredDevices.length === 0 ? (
            <p className="text-dark-muted text-sm text-center py-8">Chưa có dữ liệu máy.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredDevices
                .slice(-8)
                .reverse()
                .map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-dark-text">
                        {device.model}
                      </p>
                      <p className="text-xs text-dark-muted mt-1">
                        IMEI: <button onClick={() => navigate(`/thiet-bi/${device.imei}`)} className="text-neon-cyan hover:underline">{device.imei}</button>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium bg-dark-border text-dark-muted px-2 py-1 rounded-full block mb-1">
                        {device.status}
                      </span>
                      <span className="text-[10px] text-dark-muted">
                        {format(new Date(device.importDate.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle, onSelect, isSelected }: any) {
  return (
    <div 
      onClick={onSelect}
      className={`bg-dark-card rounded-xl shadow-sm border p-3 sm:p-6 flex items-center cursor-pointer transition-colors ${isSelected ? 'border-neon-cyan bg-neon-cyan/5' : 'border-dark-border hover:border-neon-cyan/50'}`}
    >
      <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="ml-3 sm:ml-4 overflow-hidden">
        <p className="text-[10px] sm:text-sm font-medium text-dark-muted truncate">{title}</p>
        <p className="text-lg sm:text-2xl font-semibold text-dark-text">{value}</p>
        {subtitle && <p className="text-[9px] sm:text-[11px] text-dark-muted mt-1 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
