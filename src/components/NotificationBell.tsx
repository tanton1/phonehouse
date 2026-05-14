import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../store/AppContext";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

export default function NotificationBell() {
  const { state, dispatch } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userNotifications = state.notifications
    .filter((n) => n.userId === state.currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    const notification = state.notifications.find((n) => n.id === id);
    if (notification && !notification.isRead) {
      dispatch({
        type: "UPDATE_NOTIFICATION",
        payload: { ...notification, isRead: true },
      });
    }
  };

  const markAllAsRead = () => {
    userNotifications.forEach((n) => {
      if (!n.isRead) {
        dispatch({
          type: "UPDATE_NOTIFICATION",
          payload: { ...n, isRead: true },
        });
      }
    });
  };

  const deleteNotification = (id: string) => {
    dispatch({ type: "DELETE_NOTIFICATION", payload: id });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-dark-muted hover:text-neon-cyan transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neon-pink text-[10px] font-bold text-white ring-2 ring-dark-bg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
              <h3 className="font-semibold text-dark-text">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-neon-cyan hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-dark-border">
              {userNotifications.length > 0 ? (
                userNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-dark-border/30 transition-colors relative group ${
                      !n.isRead ? "bg-neon-cyan/5 border-l-2 border-neon-cyan" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        n.type === 'TASK_ASSIGNED' ? 'text-neon-green' : 
                        n.type === 'TASK_UPDATED' ? 'text-neon-cyan' : 'text-dark-muted'
                      }`}>
                        {n.type === 'TASK_ASSIGNED' ? 'Task mới' : 'Cập nhật'}
                      </span>
                      <span className="text-[10px] text-dark-muted">
                        {format(new Date(n.createdAt), "HH:mm dd/MM")}
                      </span>
                    </div>
                    <h4 className={`text-sm font-medium mb-1 ${!n.isRead ? "text-dark-text" : "text-dark-muted"}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-dark-muted line-clamp-2 mb-2">
                      {n.message}
                    </p>
                    
                    <div className="flex items-center space-x-3">
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] flex items-center text-neon-cyan hover:text-neon-cyan/80"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Đã đọc
                        </button>
                      )}
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => {
                            markAsRead(n.id);
                            setIsOpen(false);
                          }}
                          className="text-[10px] flex items-center text-dark-muted hover:text-neon-cyan"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Xem chi tiết
                        </Link>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-[10px] flex items-center text-dark-muted hover:text-neon-pink ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-dark-muted">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Không có thông báo nào</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-dark-bg/50 border-t border-dark-border text-center">
              <button className="text-xs text-dark-muted hover:text-dark-text">
                Xem tất cả thông báo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
