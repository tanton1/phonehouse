import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  ShieldX, 
  Store, 
  RefreshCcw, 
  Wrench,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

type ErrorType = 'QC_REJECT' | 'SHOP_BOUNCE' | 'REWORK' | 'WARRANTY';

interface ErrorEvent {
  id: string;
  deviceId: string;
  imei: string;
  model: string;
  type: ErrorType;
  responsiblePersonId: string;
  responsiblePersonName: string;
  notes: string;
  date: string;
}

const ERROR_LABELS: Record<ErrorType, string> = {
  QC_REJECT: 'QC Từ chối',
  SHOP_BOUNCE: 'Shop Trả Về',
  REWORK: 'Sửa Lại (Re-work)',
  WARRANTY: 'Bảo Hành'
};

const ERROR_COLORS: Record<ErrorType, string> = {
  QC_REJECT: '#FF4444', // Red
  SHOP_BOUNCE: '#FFBB33', // Orange
  REWORK: '#33B5E5', // Blue
  WARRANTY: '#AA66CC' // Purple
};

export default function ErrorRateReport() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');

  // Generate Error Events
  const errorEvents = useMemo(() => {
    const events: ErrorEvent[] = [];

    // 1. QC Rejects
    state.qcReports.forEach(report => {
      if (report.status === 'FAIL') {
        const device = state.devices.find(d => d.id === report.deviceId);
        const task = state.tasks.find(t => t.id === report.taskId);
        const responsibleUser = state.users.find(u => u.id === task?.assigneeId);
        
        if (device) {
          events.push({
            id: `qc-${report.id}`,
            deviceId: device.id,
            imei: device.imei,
            model: device.model,
            type: 'QC_REJECT',
            responsiblePersonId: responsibleUser?.id || 'unknown',
            responsiblePersonName: responsibleUser?.name || 'Không xác định',
            notes: report.notes || 'QC đánh rớt',
            date: report.testedAt
          });
        }
      }
    });

    // 2. Shop Bounce & Warranty
    state.devices.forEach(device => {
      if (device.receptionType === 'SHOP_TRANSFER') {
        // Find the last task before this reception if possible, or just mark as unknown
        const deviceTasks = state.tasks.filter(t => t.deviceId === device.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastTask = deviceTasks.length > 0 ? deviceTasks[deviceTasks.length - 1] : null;
        const responsibleUser = state.users.find(u => u.id === lastTask?.assigneeId);

        events.push({
          id: `shop-${device.id}`,
          deviceId: device.id,
          imei: device.imei,
          model: device.model,
          type: 'SHOP_BOUNCE',
          responsiblePersonId: responsibleUser?.id || 'unknown',
          responsiblePersonName: responsibleUser?.name || 'Hệ thống',
          notes: device.notes || 'Shop trả về Kho Tổng',
          date: device.receptionDate || device.importDate
        });
      }

      if (device.receptionType === 'WARRANTY') {
        events.push({
          id: `war-${device.id}`,
          deviceId: device.id,
          imei: device.imei,
          model: device.model,
          type: 'WARRANTY',
          responsiblePersonId: 'unknown',
          responsiblePersonName: 'Hệ thống',
          notes: device.notes || 'Khách bảo hành',
          date: device.receptionDate || device.importDate
        });
      }

      // 3. Re-work (Multiple tasks for the same device, excluding QC/Test)
      const repairTasks = state.tasks.filter(t => t.deviceId === device.id && t.type !== 'TEST_MAY' && t.type !== 'QC_CHECK').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      if (repairTasks.length > 1) {
        // The second task onwards is considered a rework
        for (let i = 1; i < repairTasks.length; i++) {
          const reworkTask = repairTasks[i];
          const previousTask = repairTasks[i-1];
          const responsibleUser = state.users.find(u => u.id === previousTask.assigneeId);

          events.push({
            id: `rew-${reworkTask.id}`,
            deviceId: device.id,
            imei: device.imei,
            model: device.model,
            type: 'REWORK',
            responsiblePersonId: responsibleUser?.id || 'unknown',
            responsiblePersonName: responsibleUser?.name || 'Không xác định',
            notes: `Sửa lại: ${reworkTask.type} (Trước đó: ${previousTask.type})`,
            date: reworkTask.createdAt
          });
        }
      }
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.qcReports, state.devices, state.tasks, state.users]);

  // Filter events by time
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return errorEvents.filter(event => {
      const eventDate = new Date(event.date);
      if (timeFilter === 'THIS_MONTH') {
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }
      if (timeFilter === 'LAST_MONTH') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
      }
      return true;
    });
  }, [errorEvents, timeFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalDevices = state.devices.length || 1; // Prevent division by zero
    const totalQC = state.qcReports.length || 1;

    const qcRejects = filteredEvents.filter(e => e.type === 'QC_REJECT').length;
    const shopBounces = filteredEvents.filter(e => e.type === 'SHOP_BOUNCE').length;
    const reworks = filteredEvents.filter(e => e.type === 'REWORK').length;
    const warranties = filteredEvents.filter(e => e.type === 'WARRANTY').length;

    return {
      totalErrors: filteredEvents.length,
      qcRejectRate: ((qcRejects / totalQC) * 100).toFixed(1),
      shopBounceRate: ((shopBounces / totalDevices) * 100).toFixed(1),
      reworkRate: ((reworks / totalDevices) * 100).toFixed(1),
      warrantyRate: ((warranties / totalDevices) * 100).toFixed(1),
      counts: {
        QC_REJECT: qcRejects,
        SHOP_BOUNCE: shopBounces,
        REWORK: reworks,
        WARRANTY: warranties
      }
    };
  }, [filteredEvents, state.devices.length, state.qcReports.length]);

  // Chart Data: Errors by Type
  const pieChartData = Object.keys(kpis.counts).map(key => ({
    name: ERROR_LABELS[key as ErrorType],
    value: kpis.counts[key as ErrorType],
    color: ERROR_COLORS[key as ErrorType]
  })).filter(d => d.value > 0);

  // Chart Data: Top Technicians with Errors
  const techErrorData = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    filteredEvents.forEach(e => {
      if (e.responsiblePersonId !== 'unknown') {
        if (!counts[e.responsiblePersonId]) {
          counts[e.responsiblePersonId] = { name: e.responsiblePersonName, count: 0 };
        }
        counts[e.responsiblePersonId].count += 1;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredEvents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Báo Cáo Tỷ Lệ Lỗi Kỹ Thuật
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Kiểm soát chất lượng (QA/QC), theo dõi tỷ lệ lỗi test, sửa lại và bảo hành.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-dark-card p-2 rounded-lg border border-dark-border w-full sm:w-auto">
          <Filter className="w-4 h-4 text-dark-muted shrink-0" />
          <select 
            className="bg-transparent text-sm text-dark-text outline-none border-none w-full"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
          >
            <option value="ALL">Tất cả thời gian</option>
            <option value="THIS_MONTH">Tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Tổng Ca Lỗi</span>
            <AlertTriangle className="w-4 h-4 text-neon-pink" />
          </div>
          <div className="text-3xl font-bold text-dark-text">{kpis.totalErrors}</div>
        </div>
        
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">QC Từ Chối</span>
            <ShieldX className="w-4 h-4" style={{ color: ERROR_COLORS.QC_REJECT }} />
          </div>
          <div className="flex items-end space-x-2">
            <div className="text-3xl font-bold text-dark-text">{kpis.qcRejectRate}%</div>
            <div className="text-sm text-dark-muted mb-1">({kpis.counts.QC_REJECT} ca)</div>
          </div>
        </div>

        <div className="bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Shop Trả Về</span>
            <Store className="w-4 h-4" style={{ color: ERROR_COLORS.SHOP_BOUNCE }} />
          </div>
          <div className="flex items-end space-x-2">
            <div className="text-3xl font-bold text-dark-text">{kpis.shopBounceRate}%</div>
            <div className="text-sm text-dark-muted mb-1">({kpis.counts.SHOP_BOUNCE} ca)</div>
          </div>
        </div>

        <div className="bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Sửa Lại (Re-work)</span>
            <RefreshCcw className="w-4 h-4" style={{ color: ERROR_COLORS.REWORK }} />
          </div>
          <div className="flex items-end space-x-2">
            <div className="text-3xl font-bold text-dark-text">{kpis.reworkRate}%</div>
            <div className="text-sm text-dark-muted mb-1">({kpis.counts.REWORK} ca)</div>
          </div>
        </div>

        <div className="bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Bảo Hành</span>
            <Wrench className="w-4 h-4" style={{ color: ERROR_COLORS.WARRANTY }} />
          </div>
          <div className="flex items-end space-x-2">
            <div className="text-3xl font-bold text-dark-text">{kpis.warrantyRate}%</div>
            <div className="text-sm text-dark-muted mb-1">({kpis.counts.WARRANTY} ca)</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
          <h3 className="text-sm font-bold text-dark-muted uppercase mb-4">Phân Bổ Nguồn Lỗi</h3>
          <div className="h-64">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A1D24', borderColor: '#2D3342', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-muted">
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart - Top Techs */}
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border shadow-lg">
          <h3 className="text-sm font-bold text-dark-muted uppercase mb-4">Top KTV / Tester Có Tỷ Lệ Lỗi Cao</h3>
          <div className="h-64">
            {techErrorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techErrorData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3342" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#8E9299" />
                  <YAxis dataKey="name" type="category" stroke="#8E9299" width={100} tick={{fontSize: 12}} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A1D24', borderColor: '#2D3342', color: '#fff' }}
                    cursor={{fill: '#2D3342', opacity: 0.4}}
                  />
                  <Bar dataKey="count" fill="#FF4444" radius={[0, 4, 4, 0]} name="Số ca lỗi" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-muted">
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
          <h2 className="font-bold text-neon-cyan">Chi Tiết Các Ca Lỗi</h2>
          <span className="text-xs text-dark-muted">{filteredEvents.length} bản ghi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-dark-muted uppercase bg-dark-bg/80 border-b border-dark-border">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">IMEI / Model</th>
                <th className="px-4 py-3">Loại Lỗi</th>
                <th className="px-4 py-3">Người Chịu Trách Nhiệm</th>
                <th className="px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="border-b border-dark-border hover:bg-dark-bg/50 transition-colors">
                    <td className="px-4 py-3 text-dark-muted whitespace-nowrap">
                      {format(new Date(event.date.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-neon-cyan font-bold"><button onClick={() => navigate(`/thiet-bi/${event.imei}`)} className="hover:underline">{event.imei}</button></div>
                      <div className="text-xs text-dark-muted">{event.model}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 rounded text-xs font-bold border"
                        style={{ 
                          color: ERROR_COLORS[event.type], 
                          borderColor: `${ERROR_COLORS[event.type]}40`,
                          backgroundColor: `${ERROR_COLORS[event.type]}10`
                        }}
                      >
                        {ERROR_LABELS[event.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-dark-border flex items-center justify-center text-xs mr-2">
                          {event.responsiblePersonName.charAt(0)}
                        </div>
                        <span className="text-dark-text">{event.responsiblePersonName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-muted max-w-xs truncate" title={event.notes}>
                      {event.notes}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-dark-muted">
                    Không có dữ liệu lỗi trong khoảng thời gian này
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
