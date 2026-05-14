import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Device } from "../types";
import {
  ClipboardCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  XCircle,
} from "lucide-react";

const CHECKLIST_ITEMS = [
  { id: "power", label: "Lên nguồn" },
  { id: "screen", label: "Màn hình hiển thị" },
  { id: "touch", label: "Cảm ứng" },
  { id: "faceid", label: "Face ID / Touch ID" },
  { id: "battery", label: "Pin (%)" },
  { id: "speaker_in", label: "Loa trong" },
  { id: "speaker_out", label: "Loa ngoài" },
  { id: "mic", label: "Mic" },
  { id: "cam_front", label: "Camera trước" },
  { id: "cam_back", label: "Camera sau" },
  { id: "vibrate", label: "Rung" },
  { id: "wifi", label: "Wifi / Bluetooth" },
  { id: "signal", label: "Sóng / Sim" },
];

export default function TestDauVao() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TESTING' | 'HISTORY'>('TESTING');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<'ALL' | 'WEEK' | 'MONTH' | 'LAST_MONTH' | 'CUSTOM'>('ALL');
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [selectedHistoryDevice, setSelectedHistoryDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  useEffect(() => {
    if (selectedHistoryDevice) {
      const updatedDevice = state.devices.find(d => d.id === selectedHistoryDevice.id);
      if (updatedDevice) {
        setSelectedHistoryDevice(updatedDevice);
      }
    }
  }, [state.devices, selectedHistoryDevice]);

  const [testResults, setTestResults] = useState<
    Record<string, "OK" | "FAIL" | "UNTESTED">
  >({});
  const [notes, setNotes] = useState("");
  const [conclusion, setConclusion] = useState("CHO_PHAN_TASK");
  const [appearance, setAppearance] = useState<'LN' | '99%' | '98%'>('99%');
  
  const pendingDevices = state.devices.filter((d) => d.status === "CHO_TEST");
  
  const historicalDevices = state.devices.filter((d) => d.status !== "CHO_TEST").filter(d => {
    const matchesSearch = d.imei.includes(searchTerm) || d.model.includes(searchTerm);
    
    // Date filtering logic
    let matchesDate = true;
    if (dateRange !== 'ALL') {
      const deviceDate = d.receptionDate ? new Date(d.receptionDate) : null;
      if (!deviceDate) return false;
      const now = new Date();
      
      if (dateRange === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = deviceDate >= weekAgo;
      } else if (dateRange === 'MONTH') {
        matchesDate = deviceDate.getMonth() === now.getMonth() && deviceDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'LAST_MONTH') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        matchesDate = deviceDate.getMonth() === lastMonth.getMonth() && deviceDate.getFullYear() === lastMonth.getFullYear();
      } else if (dateRange === 'CUSTOM') {
        if (customDateFrom) matchesDate = matchesDate && deviceDate >= new Date(customDateFrom);
        if (customDateTo) matchesDate = matchesDate && deviceDate <= new Date(customDateTo);
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
    const initialResults: Record<string, "OK" | "FAIL" | "UNTESTED"> = {};
    CHECKLIST_ITEMS.forEach((item) => (initialResults[item.id] = "UNTESTED"));
    setTestResults(initialResults);
    setNotes("");
    setAppearance(device.appearance || '99%');
  };

  const handleResultChange = (
    id: string,
    result: "OK" | "FAIL" | "UNTESTED",
  ) => {
    setTestResults((prev) => ({ ...prev, [id]: result }));
  };

  const handleSubmit = () => {
    if (!selectedDevice) return;
    console.log("Submitting test results:", testResults);

    // In a real app, we would save the test report to the database.
    // Here we just update the device status.

    const updatedDevice = {
      ...selectedDevice,
      status: conclusion as any,
      appearance,
      testResults,
      notes: `${selectedDevice.notes}\n\n[TEST ĐẦU VÀO]: ${notes}`,
    };

    dispatch({ type: "UPDATE_DEVICE", payload: updatedDevice });
    setSelectedDevice(null);
  };

  const handleBackNCC = () => {
    if (!selectedDevice) return;

    const updatedDevice = {
      ...selectedDevice,
      status: "CHO_TRA_NCC" as any,
      appearance,
      testResults,
      notes: `${selectedDevice.notes}\n\n[TEST ĐẦU VÀO - BACK NCC]: ${notes}`,
    };

    dispatch({ type: "UPDATE_DEVICE", payload: updatedDevice });
    setSelectedDevice(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Test Đầu Vào</h1>
      </div>

      <div className="flex space-x-4 border-b border-dark-border mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('TESTING')}
          className={`pb-2 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'TESTING' ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-dark-muted hover:text-dark-text'}`}
        >
          Đang Chờ Test ({pendingDevices.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-2 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'HISTORY' ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-dark-muted hover:text-dark-text'}`}
        >
          Lịch Sử Test
        </button>
      </div>

      {activeTab === 'HISTORY' ? (
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-dark-muted mb-1">Tìm kiếm</label>
              <input
                type="text"
                placeholder="IMEI hoặc Model..."
                className="w-full dark-input p-2 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <label className="block text-xs text-dark-muted mb-1">Khung thời gian</label>
              <select
                className="w-full dark-input p-2 rounded-md"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="ALL">Tất cả</option>
                <option value="WEEK">Trong tuần</option>
                <option value="MONTH">Trong tháng</option>
                <option value="LAST_MONTH">Tháng trước</option>
                <option value="CUSTOM">Tùy chỉnh</option>
              </select>
            </div>
            {dateRange === 'CUSTOM' && (
              <>
                <div className="w-[150px]">
                  <label className="block text-xs text-dark-muted mb-1">Từ ngày</label>
                  <input type="date" className="w-full dark-input p-2 rounded-md" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} />
                </div>
                <div className="w-[150px]">
                  <label className="block text-xs text-dark-muted mb-1">Đến ngày</label>
                  <input type="date" className="w-full dark-input p-2 rounded-md" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} />
                </div>
              </>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-dark-muted">
              <thead className="text-xs text-dark-text uppercase bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">IMEI</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {historicalDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-dark-bg/50 cursor-pointer">
                    <td className="px-4 py-3" onClick={() => setSelectedHistoryDevice(device)}>{device.receptionDate}</td>
                    <td className="px-4 py-3 font-mono">
                      <button onClick={() => navigate(`/thiet-bi/${device.imei}`)} className="text-neon-cyan hover:underline">
                        {device.imei}
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={() => setSelectedHistoryDevice(device)}>{device.model}</td>
                    <td className="px-4 py-3" onClick={() => setSelectedHistoryDevice(device)}>
                      <span className="px-2 py-1 bg-dark-border rounded-full text-xs text-dark-text">
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neon-cyan hover:underline" onClick={() => setSelectedHistoryDevice(device)}>Xem chi tiết</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedHistoryDevice && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              {console.log("Selected History Device:", selectedHistoryDevice)}
              <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-dark-text">Chi tiết máy: {selectedHistoryDevice.model}</h2>
                  <button onClick={() => setSelectedHistoryDevice(null)} className="text-dark-muted hover:text-neon-pink"><XCircle /></button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-dark-muted mb-1">IMEI</p>
                      <p className="font-mono text-dark-text">{selectedHistoryDevice.imei}</p>
                    </div>
                    <div>
                      <p className="text-dark-muted mb-1">Trạng thái</p>
                      <p className="font-medium text-neon-cyan">{selectedHistoryDevice.status}</p>
                    </div>
                    <div>
                      <p className="text-dark-muted mb-1">Ngoại hình</p>
                      <p className="font-medium text-dark-text">{selectedHistoryDevice.appearance || 'Không rõ'}</p>
                    </div>
                    <div>
                      <p className="text-dark-muted mb-1">Nguồn gốc</p>
                      <p className="font-medium text-dark-text">{selectedHistoryDevice.source}</p>
                    </div>
                  </div>

                  {selectedHistoryDevice.testResults && (
                    <div>
                      <h3 className="text-sm font-medium text-neon-cyan mb-3 border-b border-dark-border pb-2">Kết quả Test</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CHECKLIST_ITEMS.map(item => {
                          const result = selectedHistoryDevice.testResults?.[item.id] || 'UNTESTED';
                          return (
                            <div key={item.id} className="flex justify-between items-center bg-dark-bg p-2 rounded border border-dark-border">
                              <span className="text-sm text-dark-text">{item.label}</span>
                              {result === 'OK' && <span className="text-xs font-bold text-neon-green px-2 py-1 bg-neon-green/10 rounded flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> OK</span>}
                              {result === 'FAIL' && <span className="text-xs font-bold text-neon-pink px-2 py-1 bg-neon-pink/10 rounded flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Lỗi</span>}
                              {result === 'UNTESTED' && <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-500/10 rounded flex items-center"><HelpCircle className="w-3 h-3 mr-1"/> Chưa test</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-neon-cyan mb-2 border-b border-dark-border pb-2">Ghi chú</h3>
                    <div className="bg-dark-bg p-3 rounded border border-dark-border text-sm text-dark-text whitespace-pre-wrap">
                      {selectedHistoryDevice.notes || 'Không có ghi chú'}
                    </div>
                  </div>

                  {selectedHistoryDevice.images && selectedHistoryDevice.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-neon-cyan mb-2 border-b border-dark-border pb-2">Ảnh tình trạng</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedHistoryDevice.images.map((img, idx) => <img key={idx} src={img} className="w-24 h-24 object-cover rounded border border-dark-border" />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Danh sách máy chờ test */}
          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden col-span-1">
            <div className="p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-medium text-dark-text">
                Máy Chờ Test ({pendingDevices.length})
              </h3>
            </div>
            <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
              {pendingDevices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => handleSelectDevice(device)}
                  className={`p-4 cursor-pointer hover:bg-dark-border/50 transition-colors ${selectedDevice?.id === device.id ? "bg-dark-bg border-l-4 border-neon-cyan" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-dark-text">{device.model}</p>
                      <p className="text-xs text-dark-muted font-mono mt-1">
                        IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button>
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-1 text-[10px] font-semibold rounded-full mb-1 ${
                          device.receptionType === 'WARRANTY' ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' :
                          device.receptionType === 'SHOP_TRANSFER' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' :
                          device.receptionType === 'SERVICE' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {device.receptionType === 'WARRANTY' ? 'Bảo Hành' : 
                         device.receptionType === 'SHOP_TRANSFER' ? 'Shop Gửi' :
                         device.receptionType === 'SERVICE' ? 'Sửa Lẻ' : 'Nhập Kho'}
                      </span>
                      <span className="text-[10px] text-dark-muted">{device.source}</span>
                    </div>
                  </div>
                  <p className="text-xs text-dark-muted mt-2 line-clamp-2">
                    Ghi chú: {device.notes}
                  </p>
                </div>
              ))}
              {pendingDevices.length === 0 && (
                <div className="p-8 text-center text-dark-muted text-sm">
                  Không có máy nào đang chờ test.
                </div>
              )}
            </div>
          </div>

          {/* Form Test */}
          {selectedDevice ? (
            <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border col-span-2 flex flex-col h-[calc(100vh-8rem)]">
              <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-dark-text">
                    Biên Bản Test: {selectedDevice.model}
                  </h3>
                  <p className="text-sm text-dark-muted font-mono">
                    IMEI: <button onClick={() => navigate(`/thiet-bi/${selectedDevice.imei}`)} className="text-neon-cyan hover:underline">{selectedDevice.imei}</button>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="text-dark-muted hover:text-neon-pink transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {selectedDevice.images && selectedDevice.images.length > 0 && (
                  <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <label className="block text-sm font-medium text-neon-cyan mb-3">Ảnh hiện trạng</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDevice.images.map((img, idx) => (
                        <img key={idx} src={img} alt="Device" className="w-20 h-20 object-cover rounded-md border border-dark-border" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2 bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <label className="block text-sm font-medium text-neon-cyan mb-3">
                      Ngoại hình máy
                    </label>
                    <div className="flex space-x-4">
                      {['LN', '99%', '98%'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAppearance(opt as any)}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                            appearance === opt 
                              ? "bg-neon-cyan text-dark-bg shadow-[0_0_10px_rgba(0,255,255,0.5)]" 
                              : "bg-dark-card text-dark-muted border border-dark-border hover:border-neon-cyan/50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {CHECKLIST_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border"
                    >
                      <span className="text-sm font-medium text-dark-text">
                        {item.label}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResultChange(item.id, "OK")}
                          className={`p-1.5 rounded-md transition-colors ${testResults[item.id] === "OK" ? "bg-neon-green/20 text-neon-green border border-neon-green/30" : "bg-dark-card text-dark-muted border border-dark-border hover:bg-dark-border/50"}`}
                          title="OK"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResultChange(item.id, "FAIL")}
                          className={`p-1.5 rounded-md transition-colors ${testResults[item.id] === "FAIL" ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30" : "bg-dark-card text-dark-muted border border-dark-border hover:bg-dark-border/50"}`}
                          title="Lỗi"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResultChange(item.id, "UNTESTED")}
                          className={`p-1.5 rounded-md transition-colors ${testResults[item.id] === "UNTESTED" ? "bg-gray-500/20 text-gray-400 border border-gray-500/30" : "bg-dark-card text-dark-muted border border-dark-border hover:bg-dark-border/50"}`}
                          title="Chưa Test"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-2">
                    Ghi chú chi tiết lỗi (Bệnh nền)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-md sm:text-sm p-3 dark-input"
                    placeholder="Ví dụ: Pin chai 74%, Face ID mất do đứt cáp loa trong..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="bg-neon-cyan/10 p-4 rounded-lg border border-neon-cyan/20">
                  <label className="block text-sm font-medium text-neon-cyan mb-2">
                    Kết Luận Hướng Xử Lý
                  </label>
                  <select
                    className="w-full rounded-md sm:text-sm p-2 dark-input"
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                  >
                    <option value="CHO_BAN">
                      Máy đẹp - Bán ngay (Không cần sửa)
                    </option>
                    <option value="CHO_PHAN_TASK">
                      Cần sửa - Chờ phân task kỹ thuật
                    </option>
                    <option value="CHO_QUYET_DINH">
                      Máy nặng / Thu cũ - Chờ quyết định
                    </option>
                    <option value="MAY_XAC">Lưu kho xác</option>
                    <option value="CHO_TRA_NCC">Lỗi nặng - Trả NCC</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-dark-border bg-dark-bg/50 flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border/50 bg-dark-card transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBackNCC}
                  className="px-4 py-2 border border-neon-pink/30 rounded-md text-sm font-medium text-neon-pink hover:bg-neon-pink/10 bg-dark-card transition-colors flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  BACK NCC
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button flex items-center"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Lưu Biên Bản & Tiếp Tục
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-dark-bg rounded-xl border border-dark-border border-dashed col-span-2 flex flex-col items-center justify-center text-dark-muted h-[calc(100vh-8rem)]">
              <ClipboardCheck className="w-12 h-12 mb-4 text-dark-border" />
              <p>Chọn một máy từ danh sách để bắt đầu test</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
