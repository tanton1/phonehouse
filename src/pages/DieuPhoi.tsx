import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Device, Task } from "../types";
import { Settings, UserPlus, Clock, AlertTriangle } from "lucide-react";
import DateRangePicker from "../components/DateRangePicker";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";

export default function DieuPhoi() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    type: "",
    description: "",
    priority: "NORMAL",
    assigneeId: "",
    deadline: format(new Date(Date.now() + 36 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
  });

  const calculateDeadline = (priority: "LOW" | "NORMAL" | "HIGH") => {
    let hours = 36; // Default NORMAL
    if (priority === "HIGH") hours = 24;
    if (priority === "LOW") hours = 120; // 5 days
    return format(new Date(Date.now() + hours * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");
  };

  const handlePriorityChange = (priority: "LOW" | "NORMAL" | "HIGH") => {
    setNewTask({
      ...newTask,
      priority,
      deadline: calculateDeadline(priority),
    });
  };

  // Filters for Task Đang Chạy
  const [activeTechTab, setActiveTechTab] = useState<string>("ALL");
  const [taskSearchImei, setTaskSearchImei] = useState("");
  const [taskDateFrom, setTaskDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [taskDateTo, setTaskDateTo] = useState(new Date().toISOString().split('T')[0]);

  const pendingDevices = state.devices.filter(
    (d) => d.status === "CHO_PHAN_TASK",
  );
  const pendingIncidents = state.incidents.filter(
    (i) => i.status === "CHO_DUYET" || i.status === "PENDING"
  );
  const technicians = state.users.filter((u) => u.role === "KY_THUAT");
  const technicalTasks = state.products.filter(p => p.category === 'SERVICE');

  const filteredActiveTasks = React.useMemo(() => {
    return state.tasks.filter((t) => {
      if (["HOAN_THANH_CHO_QC", "DONG_TASK", "HUY_TASK"].includes(t.status)) return false;

      // Filter by technician
      if (activeTechTab !== "ALL" && t.assigneeId !== activeTechTab) return false;

      // Filter by IMEI
      const device = state.devices.find(d => d.id === t.deviceId);
      if (taskSearchImei && device && !device.imei.toLowerCase().includes(taskSearchImei.toLowerCase())) return false;

      // Filter by date
      const start = startOfDay(new Date(taskDateFrom));
      const end = endOfDay(new Date(taskDateTo));

      try {
        const taskDate = parseISO(t.createdAt.replace(' ', 'T'));
        if (!isWithinInterval(taskDate, { start, end })) {
          return false;
        }
      } catch (e) {
        // Fallback if date parsing fails
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.tasks, state.devices, activeTechTab, taskSearchImei, taskDateFrom, taskDateTo]);

  const activeTasks = state.tasks.filter(
    (t) => !["HOAN_THANH_CHO_QC", "DONG_TASK", "HUY_TASK"].includes(t.status),
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDeviceIds.length === 0 || !newTask.assigneeId || selectedTaskTypes.length === 0)
      return alert("Vui lòng chọn ít nhất một máy, một task kỹ thuật và kỹ thuật viên");

    selectedDeviceIds.forEach(deviceId => {
      const device = state.devices.find(d => d.id === deviceId);
      if (!device) return;

      selectedTaskTypes.forEach(taskType => {
        const selectedProduct = state.products.find(p => p.name === taskType);
        
        const task: Task = {
          id: `task-${Date.now()}-${deviceId}-${taskType.replace(/\s+/g, '-')}`,
          deviceId: device.id,
          type: taskType,
          description: newTask.description || "",
          priority: newTask.priority as any,
          assigneeId: newTask.assigneeId!,
          assignerId: state.currentUser!.id,
          deadline: newTask.deadline!,
          status: "MOI_TAO",
          notes: "",
          createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
          commission: selectedProduct?.commission || 0,
        };

        dispatch({ type: "ADD_TASK", payload: task });

        // Add notification for technician
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id: `noti-${Date.now()}-${deviceId}-${taskType.replace(/\s+/g, '-')}`,
            userId: task.assigneeId,
            title: "Bạn có Task mới!",
            message: `Bạn vừa được giao task "${task.type}" cho máy ${device.model}.`,
            type: "TASK_ASSIGNED",
            link: "/ky-thuat",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        });
      });

      // Update device status if it's the first task
      if (device.status === "CHO_PHAN_TASK") {
        dispatch({
          type: "UPDATE_DEVICE",
          payload: { ...device, status: "DANG_XU_LY" },
        });
      }
    });

    setNewTask({ ...newTask, description: "" });
    setSelectedDeviceIds([]);
    setSelectedTaskTypes([]);
    alert(`Đã tạo task thành công!`);
  };

  const handleResolveIncident = (incident: any, action: 'RESUME' | 'NEW_TASK') => {
    dispatch({ type: "UPDATE_INCIDENT", payload: { ...incident, status: "DA_DUYET", resolution: action } });
    
    const task = state.tasks.find(t => t.id === incident.taskId);
    const device = state.devices.find(d => d.id === incident.deviceId);

    if (action === 'RESUME') {
      if (task) {
        dispatch({ type: "UPDATE_TASK", payload: { ...task, status: "DANG_XU_LY" } });
        
        // Notify technician
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id: `noti-${Date.now()}`,
            userId: task.assigneeId,
            title: "Sự cố đã được xử lý!",
            message: `Sự cố trên máy ${device?.model} đã được duyệt. Bạn có thể tiếp tục công việc.`,
            type: "TASK_UPDATED",
            link: "/ky-thuat",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        });
      }
      if (device) dispatch({ type: "UPDATE_DEVICE", payload: { ...device, status: "DANG_XU_LY" } });
      alert("Đã cho phép tiếp tục task!");
    } else if (action === 'NEW_TASK') {
      if (device) {
        setSelectedDeviceIds([device.id]);
        setNewTask({ ...newTask, description: `[Xử lý sự cố]: ${incident.description}\n` });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Điều Phối Kỹ Thuật</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Máy chờ phân task & Máy đang sửa */}
        <div className="space-y-6 col-span-1">
          {pendingIncidents.length > 0 && (
            <div className="bg-dark-card rounded-xl shadow-sm border border-neon-pink/50 overflow-hidden">
              <div className="p-4 border-b border-neon-pink/30 bg-neon-pink/10">
                <h3 className="text-lg font-medium text-neon-pink flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Sự Cố Cần Xử Lý ({pendingIncidents.length})
                </h3>
              </div>
              <div className="divide-y divide-dark-border max-h-[300px] overflow-y-auto">
                {pendingIncidents.map((incident) => {
                  const device = state.devices.find(d => d.id === incident.deviceId);
                  const task = state.tasks.find(t => t.id === incident.taskId);
                  const reporter = state.users.find(u => u.id === incident.reportedBy);
                  
                  return (
                    <div key={incident.id} className="p-4 bg-dark-bg">
                      <p className="font-medium text-neon-pink text-sm">Lỗi phát sinh: {incident.description}</p>
                      <p className="text-xs text-dark-muted mt-1">Máy: {device?.model} - {device?.imei.slice(-4)}</p>
                      <p className="text-xs text-dark-muted mt-1">Task đang làm: {task?.type}</p>
                      <p className="text-xs text-dark-muted mt-1">Báo cáo bởi: {reporter?.name}</p>
                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={() => handleResolveIncident(incident, 'RESUME')} 
                          className="flex-1 px-2 py-1.5 text-xs bg-neon-green/10 text-neon-green rounded border border-neon-green/30 hover:bg-neon-green/20 transition-colors"
                        >
                          Tiếp tục Task
                        </button>
                        <button 
                          onClick={() => handleResolveIncident(incident, 'NEW_TASK')} 
                          className="flex-1 px-2 py-1.5 text-xs bg-neon-cyan/10 text-neon-cyan rounded border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-colors"
                        >
                          Tạo Task Mới
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-yellow-500/10 flex justify-between items-center">
              <h3 className="text-lg font-medium text-yellow-500 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Cần Phân Task ({pendingDevices.length})
              </h3>
              {selectedDeviceIds.length > 0 && (
                <button 
                  onClick={() => setSelectedDeviceIds([])}
                  className="text-xs text-dark-muted hover:text-neon-pink transition-colors"
                >
                  Bỏ chọn tất cả ({selectedDeviceIds.length})
                </button>
              )}
            </div>
            <div className="divide-y divide-dark-border max-h-[400px] overflow-y-auto">
              {pendingDevices.map((device) => {
                const isSelected = selectedDeviceIds.includes(device.id);
                return (
                  <div
                    key={device.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDeviceIds(selectedDeviceIds.filter(id => id !== device.id));
                      } else {
                        setSelectedDeviceIds([...selectedDeviceIds, device.id]);
                      }
                    }}
                    className={`p-4 cursor-pointer hover:bg-dark-border transition-colors relative ${isSelected ? "bg-dark-bg border-l-4 border-yellow-500" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-yellow-500 border-yellow-500" : "border-dark-border"}`}>
                        {isSelected && <div className="w-2 h-2 bg-dark-bg rounded-sm" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-dark-text">{device.model}</p>
                        <p className="text-xs text-dark-muted font-mono mt-1">
                          IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button>
                        </p>
                        <p className="text-xs text-neon-pink mt-2 line-clamp-2">
                          Lỗi: {device.notes.split("[TEST ĐẦU VÀO]:")[1] || "Chưa rõ"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pendingDevices.length === 0 && (
                <div className="p-6 text-center text-dark-muted text-sm">
                  Không có máy chờ phân task.
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Cột phải: Form tạo task */}
        <div className="col-span-2">
          {selectedDeviceIds.length > 0 ? (
            <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border">
              <div className="p-6 border-b border-dark-border bg-dark-bg/50">
                <h2 className="text-xl font-semibold text-dark-text">
                  Tạo Task Mới ({selectedDeviceIds.length} máy)
                </h2>
                <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {selectedDeviceIds.map(id => {
                    const device = state.devices.find(d => d.id === id);
                    if (!device) return null;
                    return (
                      <div key={id} className="p-3 bg-dark-bg border border-dark-border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium text-dark-text text-sm">
                            {device.model}
                          </p>
                          <p className="text-xs text-dark-muted font-mono">
                            IMEI: {device.imei}
                          </p>
                        </div>
                        <button 
                          onClick={() => setSelectedDeviceIds(selectedDeviceIds.filter(sid => sid !== id))}
                          className="text-xs text-neon-pink hover:underline"
                        >
                          Gỡ
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-dark-muted mb-2">
                      Chọn Task Kỹ Thuật (Có thể chọn nhiều)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {technicalTasks.map(p => {
                        const isSelected = selectedTaskTypes.includes(p.name);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTaskTypes(selectedTaskTypes.filter(t => t !== p.name));
                              } else {
                                setSelectedTaskTypes([...selectedTaskTypes, p.name]);
                              }
                            }}
                            className={`p-2 text-xs font-medium rounded border transition-all text-left flex justify-between items-center ${
                              isSelected 
                                ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan" 
                                : "bg-dark-bg border-dark-border text-dark-muted hover:border-dark-muted"
                            }`}
                          >
                            <span>{p.name}</span>
                            {isSelected && <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full shadow-[0_0_5px_#00f3ff]" />}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTaskTypes.length > 0 && (
                      <p className="mt-2 text-xs text-neon-pink font-medium">
                        Tổng hoa hồng KTV ước tính: {selectedTaskTypes.reduce((sum, type) => {
                          return sum + (state.products.find(p => p.name === type)?.commission || 0);
                        }, 0).toLocaleString('vi-VN')} đ / máy
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      Mức Độ Ưu Tiên
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                      value={newTask.priority}
                      onChange={(e) => handlePriorityChange(e.target.value as any)}
                    >
                      <option value="LOW">Thấp (5 ngày)</option>
                      <option value="NORMAL">Bình thường (36h)</option>
                      <option value="HIGH">Cao (24h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      Giao Cho Kỹ Thuật Viên
                    </label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                      value={newTask.assigneeId}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assigneeId: e.target.value })
                      }
                    >
                      <option value="">-- Chọn Kỹ Thuật Viên --</option>
                      {technicians.map((tech) => {
                        const taskCount = activeTasks.filter(
                          (t) => t.assigneeId === tech.id,
                        ).length;
                        return (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({taskCount} task đang làm)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                      value={newTask.deadline}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-muted">
                    Mô tả chi tiết yêu cầu xử lý
                  </label>
                  <textarea
                    rows={4}
                    required
                    className="mt-1 block w-full rounded-md sm:text-sm p-3 dark-input"
                    placeholder="Ví dụ: Thay pin dung lượng cao, nhớ dán lại ron chống nước cẩn thận..."
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                  <button
                    type="button"
                    onClick={() => setSelectedDeviceIds([])}
                    className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border hover:text-dark-text"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Giao Việc
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-dark-bg rounded-xl border border-dark-border border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-dark-muted">
              <Settings className="w-12 h-12 mb-4 text-dark-border" />
              <p>Chọn một máy bên trái để phân task</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Đang Chạy Section */}
      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden mt-6">
        <div className="p-4 border-b border-dark-border bg-neon-cyan/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-medium text-neon-cyan flex items-center whitespace-nowrap">
            <Settings className="w-5 h-5 mr-2" />
            Task Đang Chạy ({filteredActiveTasks.length})
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Tìm IMEI..."
              className="p-2 rounded-md bg-dark-bg border border-dark-border text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
              value={taskSearchImei}
              onChange={(e) => setTaskSearchImei(e.target.value)}
            />
            <DateRangePicker 
              startDate={taskDateFrom} 
              endDate={taskDateTo} 
              onChange={(s, e) => { setTaskDateFrom(s); setTaskDateTo(e); }} 
            />
          </div>
        </div>

        {/* Technician Tabs */}
        <div className="flex overflow-x-auto border-b border-dark-border bg-dark-bg">
          <button
            onClick={() => setActiveTechTab("ALL")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTechTab === "ALL"
                ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5"
                : "text-dark-muted hover:text-dark-text hover:bg-dark-border/50"
            }`}
          >
            Tất cả KTV
          </button>
          {technicians.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setActiveTechTab(tech.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTechTab === tech.id
                  ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5"
                  : "text-dark-muted hover:text-dark-text hover:bg-dark-border/50"
              }`}
            >
              {tech.name}
            </button>
          ))}
        </div>

        <div className="divide-y divide-dark-border max-h-[500px] overflow-y-auto">
          {filteredActiveTasks.map((task) => {
            const device = state.devices.find((d) => d.id === task.deviceId);
            const assignee = state.users.find((u) => u.id === task.assigneeId);
            
            const priorityColors = {
              LOW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
              NORMAL: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30",
              HIGH: "bg-neon-pink/10 text-neon-pink border-neon-pink/30",
            };

            return (
              <div key={task.id} className="p-4 bg-dark-bg hover:bg-dark-border/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-dark-text text-sm">
                        {task.type}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      <p className="text-xs text-dark-muted flex items-center">
                        <span className="w-12">Máy:</span>
                        <span className="text-dark-text">{device?.model}</span>
                      </p>
                      <p className="text-xs text-dark-muted flex items-center">
                        <span className="w-12">IMEI:</span>
                        <button onClick={() => navigate(`/thiet-bi/${device?.imei}`)} className="text-neon-cyan hover:underline font-mono">{device?.imei}</button>
                      </p>
                      <p className="text-xs text-dark-muted flex items-center">
                        <span className="w-12">KTV:</span>
                        <span className="text-neon-cyan font-medium">{assignee?.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-[10px] font-semibold bg-dark-border text-dark-muted px-2 py-0.5 rounded-full inline-block mb-2">
                      {task.status}
                    </span>
                    <p className="text-[10px] text-neon-pink flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1" />
                      Deadline: {format(new Date(task.deadline), "dd/MM/yyyy HH:mm")}
                    </p>
                    <p className="text-[10px] text-dark-muted mt-1">
                      Ngày tạo: {format(new Date(task.createdAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredActiveTasks.length === 0 && (
            <div className="p-8 text-center text-dark-muted">
              Không tìm thấy task nào phù hợp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
