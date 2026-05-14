import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import DateRangePicker from "../components/DateRangePicker";
import SearchableSelect from "../components/SearchableSelect";
import { Task, PartRequest, Incident } from "../types";
import {
  Wrench,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Box,
} from "lucide-react";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";

export default function KyThuat() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<"TASKS" | "INVENTORY">("TASKS");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<
    "INFO" | "PARTS" | "INCIDENT" | "COMPLETE"
  >("INFO");
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // States for forms
  const [partId, setPartId] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [incidentDesc, setIncidentDesc] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [usedParts, setUsedParts] = useState<{partId: string, quantity: number}[]>([]);

  const myTasks = useMemo(() => {
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    return state.tasks.filter(
      (t) => {
        if (t.assigneeId !== state.currentUser?.id) return false;
        if (["DONG_TASK", "HUY_TASK"].includes(t.status)) return false;
        
        try {
          const taskDate = parseISO(t.createdAt.replace(' ', 'T'));
          return isWithinInterval(taskDate, { start, end });
        } catch (e) {
          return true; // Fallback
        }
      }
    );
  }, [state.tasks, state.currentUser?.id, startDate, endDate]);

  const myStock = state.technicianStocks.filter(
    (ts) => ts.technicianId === state.currentUser?.id
  );

  const handleAcceptTask = (task: Task) => {
    dispatch({
      type: "UPDATE_TASK",
      payload: { ...task, status: "DANG_XU_LY" },
    });
    setSelectedTask({ ...task, status: "DANG_XU_LY" });
  };

  const handleRequestPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partId) return;

    const request: PartRequest = {
      id: `pr-${Date.now()}`,
      taskId: selectedTask?.id,
      partId,
      quantity: partQty,
      status: "CHO_XUAT",
      requestedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      requestType: selectedTask ? 'FOR_TASK' : 'FOR_STOCK',
      technicianId: state.currentUser!.id,
    };

    dispatch({ type: "ADD_PART_REQUEST", payload: request });
    
    if (selectedTask) {
      dispatch({
        type: "UPDATE_TASK",
        payload: { ...selectedTask, status: "CHO_LINH_KIEN" },
      });
      setSelectedTask({ ...selectedTask, status: "CHO_LINH_KIEN" });
    }

    setPartId("");
    setPartQty(1);
    alert("Đã gửi yêu cầu linh kiện!");
  };

  const handleRequestStockPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partId) return;

    const request: PartRequest = {
      id: `pr-${Date.now()}`,
      partId,
      quantity: partQty,
      status: "CHO_XUAT",
      requestedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      requestType: 'FOR_STOCK',
      technicianId: state.currentUser!.id,
    };

    dispatch({ type: "ADD_PART_REQUEST", payload: request });
    
    setPartId("");
    setPartQty(1);
    alert("Đã gửi yêu cầu cấp linh kiện lưu kho!");
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !incidentDesc) return;

    const incident: Incident = {
      id: `inc-${Date.now()}`,
      deviceId: selectedTask.deviceId,
      taskId: selectedTask.id,
      description: incidentDesc,
      reportedBy: state.currentUser!.id,
      reportedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      status: "CHO_DUYET",
    };

    dispatch({ type: "ADD_INCIDENT", payload: incident });
    dispatch({
      type: "UPDATE_TASK",
      payload: { ...selectedTask, status: "CHO_DUYET_PHAT_SINH" },
    });
    setSelectedTask({ ...selectedTask, status: "CHO_DUYET_PHAT_SINH" });

    setIncidentDesc("");
    alert("Đã báo cáo lỗi phát sinh!");
  };

  const handleCompleteTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    // Deduct used parts from technician stock
    usedParts.forEach(up => {
      dispatch({
        type: "UPDATE_TECH_STOCK",
        payload: { technicianId: state.currentUser!.id, partId: up.partId, quantity: -up.quantity }
      });
    });

    dispatch({
      type: "UPDATE_TASK",
      payload: {
        ...selectedTask,
        status: "HOAN_THANH_CHO_QC",
        notes: `${selectedTask.notes}\n[HOÀN THÀNH]: ${completionNotes}`,
        usedParts
      },
    });

    // Update device status
    const device = state.devices.find((d) => d.id === selectedTask.deviceId);
    if (device) {
      dispatch({
        type: "UPDATE_DEVICE",
        payload: { ...device, status: "CHO_QC" },
      });
    }

    setSelectedTask(null);
    setCompletionNotes("");
    setUsedParts([]);
    alert("Đã hoàn thành task, chuyển sang chờ QC!");
  };

  const handleAddUsedPart = (partId: string) => {
    if (!partId) return;
    const existing = usedParts.find(up => up.partId === partId);
    if (existing) {
      setUsedParts(usedParts.map(up => up.partId === partId ? { ...up, quantity: up.quantity + 1 } : up));
    } else {
      setUsedParts([...usedParts, { partId, quantity: 1 }]);
    }
  };

  const handleRemoveUsedPart = (partId: string) => {
    setUsedParts(usedParts.filter(up => up.partId !== partId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">
          Không Gian Làm Việc Kỹ Thuật
        </h1>
        <div className="w-full sm:w-auto flex space-x-2 bg-dark-card p-1 rounded-lg border border-dark-border overflow-x-auto">
          <button 
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${mainTab === 'TASKS' ? 'bg-dark-bg text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
            onClick={() => setMainTab('TASKS')}
          >
            Công Việc
          </button>
          <button 
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${mainTab === 'INVENTORY' ? 'bg-dark-bg text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
            onClick={() => setMainTab('INVENTORY')}
          >
            Kho Cá Nhân
          </button>
        </div>
      </div>

      {mainTab === 'TASKS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Danh sách task của tôi */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden col-span-1">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex flex-col gap-4">
            <h3 className="text-lg font-medium text-dark-text flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-neon-cyan" />
              Task Của Tôi ({myTasks.length})
            </h3>
            <DateRangePicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
          </div>
          <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
            {myTasks.map((task) => {
              const device = state.devices.find((d) => d.id === task.deviceId);
              
              // Deadline logic
              const now = new Date();
              const deadline = new Date(task.deadline);
              const isOverdue = deadline < now;
              const isApproaching = !isOverdue && (deadline.getTime() - now.getTime()) < (2 * 60 * 60 * 1000); // 2 hours

              let deadlineColor = "text-neon-pink";
              let cardBorder = "";
              let cardBg = "";

              if (isOverdue) {
                deadlineColor = "text-red-500 font-bold animate-pulse";
                cardBorder = "border-l-4 border-red-500";
                cardBg = "bg-red-500/5";
              } else if (isApproaching) {
                deadlineColor = "text-yellow-500 font-bold";
                cardBorder = "border-l-4 border-yellow-500";
                cardBg = "bg-yellow-500/5";
              } else if (selectedTask?.id === task.id) {
                cardBorder = "border-l-4 border-neon-cyan";
                cardBg = "bg-dark-bg";
              }

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 cursor-pointer hover:bg-dark-border transition-colors border-b border-dark-border last:border-0 ${cardBg} ${cardBorder}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-dark-text">{task.type}</p>
                    <span
                      className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
                        task.status === "MOI_TAO"
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                          : task.status === "DANG_XU_LY"
                            ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                            : task.status === "CHO_LINH_KIEN"
                              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                              : "bg-dark-border text-dark-muted"
                      }`}
                    >
                      {task.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-dark-muted mt-1">
                    {device?.model} - {device?.imei.slice(-4)}
                  </p>
                  <div className={`mt-2 flex items-center text-xs ${deadlineColor}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    Deadline: {format(new Date(task.deadline), "dd/MM/yyyy HH:mm")}
                    {isOverdue && <span className="ml-2 uppercase text-[10px]">[Quá hạn]</span>}
                    {isApproaching && <span className="ml-2 uppercase text-[10px]">[Sắp hết hạn]</span>}
                  </div>
                </div>
              );
            })}
            {myTasks.length === 0 && (
              <div className="p-8 text-center text-dark-muted text-sm">
                Bạn chưa có task nào được giao.
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Chi tiết task và xử lý */}
        <div className="col-span-2">
          {selectedTask ? (
            <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border h-full flex flex-col">
              {/* Task Header */}
              <div className="p-6 border-b border-dark-border bg-dark-bg/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-dark-text">
                      {selectedTask.type}
                    </h2>
                    {(() => {
                      const device = state.devices.find(
                        (d) => d.id === selectedTask.deviceId,
                      );
                      return (
                        device && (
                          <p className="text-sm text-dark-muted mt-1">
                            Máy: {device.model} (IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button>)
                          </p>
                        )
                      );
                    })()}
                  </div>
                  {selectedTask.status === "MOI_TAO" && (
                    <button
                      onClick={() => handleAcceptTask(selectedTask)}
                      className="px-4 py-2 rounded-lg text-sm font-medium neon-button"
                    >
                      Nhận Task
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-dark-border bg-dark-card">
                <button
                  className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === "INFO" ? "border-neon-cyan text-neon-cyan" : "border-transparent text-dark-muted hover:text-dark-text"}`}
                  onClick={() => setActiveTab("INFO")}
                >
                  Thông Tin
                </button>
                <button
                  className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === "PARTS" ? "border-neon-cyan text-neon-cyan" : "border-transparent text-dark-muted hover:text-dark-text"}`}
                  onClick={() => setActiveTab("PARTS")}
                  disabled={selectedTask.status === "MOI_TAO"}
                >
                  Linh Kiện
                </button>
                <button
                  className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === "INCIDENT" ? "border-neon-pink text-neon-pink" : "border-transparent text-dark-muted hover:text-dark-text"}`}
                  onClick={() => setActiveTab("INCIDENT")}
                  disabled={selectedTask.status === "MOI_TAO"}
                >
                  Phát Sinh Lỗi
                </button>
                <button
                  className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === "COMPLETE" ? "border-neon-green text-neon-green" : "border-transparent text-dark-muted hover:text-dark-text"}`}
                  onClick={() => setActiveTab("COMPLETE")}
                  disabled={
                    selectedTask.status === "MOI_TAO" ||
                    state.partRequests.some(pr => pr.taskId === selectedTask.id && pr.status === "CHO_XUAT")
                  }
                >
                  Hoàn Thành
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === "INFO" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-dark-muted">
                        Mô tả công việc
                      </h4>
                      <p className="mt-1 text-sm text-dark-text bg-dark-bg p-4 rounded-lg border border-dark-border whitespace-pre-wrap">
                        {selectedTask.description}
                      </p>
                    </div>
                    {(() => {
                      const device = state.devices.find(
                        (d) => d.id === selectedTask.deviceId,
                      );
                      return (
                        device && (
                          <div>
                            <h4 className="text-sm font-medium text-dark-muted">
                              Ghi chú đầu vào (Bệnh nền)
                            </h4>
                            <p className="mt-1 text-sm text-yellow-500 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30 whitespace-pre-wrap">
                              {device.notes}
                            </p>
                          </div>
                        )
                      );
                    })()}
                  </div>
                )}

                {activeTab === "PARTS" && (
                  <div className="space-y-6">
                    <form
                      onSubmit={handleRequestPart}
                      className="bg-dark-bg p-4 rounded-lg border border-dark-border"
                    >
                      <h4 className="text-sm font-medium text-dark-text mb-4 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-neon-cyan" />
                        Yêu Cầu Linh Kiện
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <SearchableSelect
                            options={state.parts.map(p => `${p.name} (Tồn: ${p.stock})`)}
                            value={partId ? `${state.parts.find(p => p.id === partId)?.name} (Tồn: ${state.parts.find(p => p.id === partId)?.stock})` : ""}
                            onChange={(val) => {
                              const selectedPart = state.parts.find(p => `${p.name} (Tồn: ${p.stock})` === val);
                              setPartId(selectedPart ? selectedPart.id : "");
                            }}
                            placeholder="Chọn linh kiện..."
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            required
                            className="block w-full rounded-md sm:text-sm p-2 dark-input"
                            value={partQty}
                            onChange={(e) => setPartQty(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg text-sm font-medium neon-button"
                        >
                          Gửi Yêu Cầu
                        </button>
                      </div>
                    </form>

                    <div>
                      <h4 className="text-sm font-medium text-dark-text mb-3">
                        Lịch Sử Yêu Cầu Linh Kiện
                      </h4>
                      <div className="divide-y divide-dark-border border border-dark-border rounded-lg overflow-hidden">
                        {state.partRequests
                          .filter((pr) => pr.taskId === selectedTask.id)
                          .map((pr) => {
                            const part = state.parts.find(
                              (p) => p.id === pr.partId,
                            );
                            return (
                              <div
                                key={pr.id}
                                className="p-3 bg-dark-card flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-sm font-medium text-dark-text">
                                    {part?.name} x{pr.quantity}
                                  </p>
                                  <p className="text-xs text-dark-muted">
                                    {format(new Date(pr.requestedAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
                                      pr.status === "CHO_XUAT"
                                        ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                                        : pr.status === "DA_XUAT"
                                          ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                                          : "bg-neon-pink/10 text-neon-pink border border-neon-pink/30"
                                    }`}
                                  >
                                    {pr.status === 'TU_CHOI' ? 'BỊ TỪ CHỐI' : pr.status}
                                  </span>
                                  {pr.status === "CHO_XUAT" && (
                                    <button
                                      onClick={() => {
                                        dispatch({
                                          type: "UPDATE_PART_REQUEST",
                                          payload: { ...pr, status: "TU_CHOI" }
                                        });
                                        // Check if we should reset task status
                                        const otherPendings = state.partRequests.filter(p => p.taskId === selectedTask.id && p.id !== pr.id && p.status === 'CHO_XUAT');
                                        if (otherPendings.length === 0) {
                                          dispatch({ type: 'UPDATE_TASK', payload: { ...selectedTask, status: 'DANG_XU_LY' } });
                                        }
                                      }}
                                      className="text-[10px] text-dark-muted hover:text-neon-pink underline"
                                    >
                                      Hủy
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {state.partRequests.filter(
                          (pr) => pr.taskId === selectedTask.id,
                        ).length === 0 && (
                          <div className="p-4 text-center text-sm text-dark-muted bg-dark-card">
                            Chưa có yêu cầu linh kiện nào.
                          </div>
                        )}
                      </div>
                      {state.partRequests.some(pr => pr.taskId === selectedTask.id && pr.status === 'TU_CHOI') && (
                        <div className="mt-4 p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-lg flex items-start">
                          <AlertTriangle className="w-4 h-4 text-neon-pink mr-2 mt-0.5" />
                          <p className="text-xs text-neon-pink">
                            Có yêu cầu bị từ chối. Nếu không thể tiếp tục, hãy qua tab <strong>Phát Sinh Lỗi</strong> để báo cáo cho Trưởng KT xử lý.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "INCIDENT" && (
                  <div className="space-y-6">
                    <form
                      onSubmit={handleReportIncident}
                      className="bg-neon-pink/5 p-4 rounded-lg border border-neon-pink/30"
                    >
                      <h4 className="text-sm font-medium text-neon-pink mb-4 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Báo Cáo Lỗi Phát Sinh
                      </h4>
                      <p className="text-xs text-neon-pink/70 mb-4">
                        Chỉ báo cáo khi phát hiện lỗi MỚI không có trong biên
                        bản test đầu vào, hoặc lỗi do quá trình xử lý gây ra.
                      </p>
                      <textarea
                        rows={4}
                        required
                        className="block w-full rounded-md sm:text-sm p-3 dark-input"
                        placeholder="Mô tả chi tiết lỗi phát sinh (VD: Thay pin xong mất Face ID, đứt cáp loa trong...)"
                        value={incidentDesc}
                        onChange={(e) => setIncidentDesc(e.target.value)}
                      />
                      <div className="mt-4 flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg text-sm font-medium neon-button-pink"
                        >
                          Gửi Báo Cáo
                        </button>
                      </div>
                    </form>

                    <div>
                      <h4 className="text-sm font-medium text-dark-text mb-3">
                        Lịch Sử Lỗi Phát Sinh
                      </h4>
                      <div className="divide-y divide-dark-border border border-dark-border rounded-lg overflow-hidden">
                        {state.incidents
                          .filter((i) => i.taskId === selectedTask.id)
                          .map((i) => (
                            <div key={i.id} className="p-4 bg-dark-card">
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
                                    i.status === "CHO_DUYET"
                                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                                      : i.status === "DA_DUYET"
                                        ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                                        : "bg-neon-pink/10 text-neon-pink border border-neon-pink/30"
                                  }`}
                                >
                                  {i.status}
                                </span>
                                <p className="text-xs text-dark-muted">
                                  {format(new Date(i.reportedAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}
                                </p>
                              </div>
                              <p className="text-sm text-dark-text whitespace-pre-wrap">
                                {i.description}
                              </p>
                              {i.resolution && (
                                <div className="mt-2 p-2 bg-dark-bg rounded border border-dark-border text-sm text-dark-muted">
                                  <strong className="text-dark-text">Hướng xử lý:</strong> {i.resolution}
                                </div>
                              )}
                            </div>
                          ))}
                        {state.incidents.filter(
                          (i) => i.taskId === selectedTask.id,
                        ).length === 0 && (
                          <div className="p-4 text-center text-sm text-dark-muted bg-dark-card">
                            Chưa có lỗi phát sinh nào.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "COMPLETE" && (
                  <form onSubmit={handleCompleteTask} className="space-y-6">
                    <div className="bg-neon-green/5 p-6 rounded-lg border border-neon-green/30 text-center">
                      <CheckCircle className="w-12 h-12 text-neon-green mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neon-green">
                        Xác Nhận Hoàn Thành
                      </h3>
                      <p className="text-sm text-neon-green/70 mt-2">
                        Đảm bảo bạn đã hoàn tất mọi công việc và kiểm tra kỹ
                        trước khi chuyển sang QC.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-muted mb-2">
                        Linh kiện đã sử dụng (từ kho cá nhân)
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <select 
                          className="flex-1 rounded-md sm:text-sm p-2 dark-input"
                          onChange={(e) => { handleAddUsedPart(e.target.value); e.target.value = ''; }}
                          defaultValue=""
                        >
                          <option value="" disabled>-- Chọn linh kiện đã dùng --</option>
                          {myStock.map(stock => {
                            const part = state.parts.find(p => p.id === stock.partId);
                            return (
                              <option key={stock.id} value={stock.partId}>
                                {part?.name} (Tồn: {stock.quantity})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      {usedParts.length > 0 && (
                        <ul className="mt-2 divide-y divide-dark-border border border-dark-border rounded-md">
                          {usedParts.map(up => {
                            const part = state.parts.find(p => p.id === up.partId);
                            return (
                              <li key={up.partId} className="flex justify-between items-center p-2 text-sm">
                                <span className="text-dark-text">{part?.name}</span>
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium text-neon-cyan">x{up.quantity}</span>
                                  <button type="button" onClick={() => handleRemoveUsedPart(up.partId)} className="text-neon-pink hover:text-neon-pink/80">Xóa</button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-muted mb-2">
                        Ghi chú kết quả xử lý
                      </label>
                      <textarea
                        rows={4}
                        required
                        className="block w-full rounded-md sm:text-sm p-3 dark-input"
                        placeholder="Ghi chú những gì đã làm, linh kiện đã thay, lưu ý cho QC..."
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-lg text-sm font-medium neon-button-green"
                      >
                        Chuyển Chờ QC
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-dark-bg rounded-xl border border-dark-border border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-dark-muted">
              <Wrench className="w-12 h-12 mb-4 text-dark-border" />
              <p>Chọn một task bên trái để bắt đầu làm việc</p>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
              <h3 className="text-lg font-medium text-dark-text flex items-center">
                <Box className="w-5 h-5 mr-2 text-neon-cyan" />
                Tồn Kho Hiện Tại
              </h3>
            </div>
            <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
              {myStock.map(stock => {
                const part = state.parts.find(p => p.id === stock.partId);
                const isLowStock = stock.quantity < 3;
                return (
                  <div key={stock.id} className="p-4 flex justify-between items-center bg-dark-card hover:bg-dark-bg transition-colors">
                    <div>
                      <p className="font-medium text-dark-text">{part?.name}</p>
                      <p className="text-xs text-dark-muted">{part?.model}</p>
                      {isLowStock && (
                        <span className="text-[10px] text-neon-pink font-bold uppercase flex items-center mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Sắp hết hàng
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full font-bold border ${
                        isLowStock 
                          ? "bg-neon-pink/10 text-neon-pink border-neon-pink/30" 
                          : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30"
                      }`}>
                        {stock.quantity}
                      </span>
                      <button
                        onClick={() => {
                          setPartId(stock.partId);
                          setPartQty(5); // Default suggest 5
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="p-2 rounded-lg bg-dark-border text-dark-text hover:text-neon-cyan hover:border-neon-cyan/50 border border-transparent transition-all"
                        title="Yêu cầu thêm"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {myStock.length === 0 && (
                <div className="p-8 text-center text-dark-muted text-sm">
                  Kho cá nhân đang trống.
                </div>
              )}
            </div>
          </div>

          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-dark-bg/50">
              <h3 className="text-lg font-medium text-dark-text flex items-center">
                <Package className="w-5 h-5 mr-2 text-neon-cyan" />
                Yêu Cầu Cấp Linh Kiện (Lưu Kho)
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleRequestStockPart} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-muted">Linh Kiện</label>
                  <SearchableSelect
                    options={state.parts.map(p => `${p.name} (Tồn: ${p.stock})`)}
                    value={partId ? `${state.parts.find(p => p.id === partId)?.name} (Tồn: ${state.parts.find(p => p.id === partId)?.stock})` : ""}
                    onChange={(val) => {
                      const selectedPart = state.parts.find(p => `${p.name} (Tồn: ${p.stock})` === val);
                      setPartId(selectedPart ? selectedPart.id : "");
                    }}
                    placeholder="Chọn linh kiện..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted">Số Lượng</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                    value={partQty}
                    onChange={(e) => setPartQty(Number(e.target.value))}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium neon-button"
                  >
                    Gửi Yêu Cầu
                  </button>
                </div>
              </form>
            </div>

            {/* Danh sách yêu cầu đang chờ */}
            <div className="border-t border-dark-border">
              <div className="p-4 bg-dark-bg/50 border-b border-dark-border">
                <h4 className="text-sm font-medium text-dark-text">Lịch sử yêu cầu gần đây</h4>
              </div>
              <div className="divide-y divide-dark-border max-h-[300px] overflow-y-auto">
                {state.partRequests
                  .filter(pr => pr.technicianId === state.currentUser?.id && pr.requestType === 'FOR_STOCK')
                  .reverse()
                  .map(pr => {
                    const part = state.parts.find(p => p.id === pr.partId);
                    return (
                      <div key={pr.id} className="p-4 flex justify-between items-center bg-dark-card">
                        <div>
                          <p className="font-medium text-dark-text">{part?.name}</p>
                          <p className="text-xs text-dark-muted">{format(new Date(pr.requestedAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-dark-text mr-3">x{pr.quantity}</span>
                          <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
                            pr.status === 'CHO_XUAT' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
                            pr.status === 'DA_XUAT' ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' :
                            'bg-neon-pink/10 text-neon-pink border border-neon-pink/30'
                          }`}>
                            {pr.status === 'CHO_XUAT' ? 'Chờ xuất' : pr.status === 'DA_XUAT' ? 'Đã xuất' : 'Từ chối'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {state.partRequests.filter(pr => pr.technicianId === state.currentUser?.id && pr.requestType === 'FOR_STOCK').length === 0 && (
                  <div className="p-6 text-center text-dark-muted text-sm">
                    Chưa có yêu cầu nào.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
