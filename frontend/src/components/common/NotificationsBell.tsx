import React, { useState, useRef, useEffect } from "react";
import { useNotificationsStore, type AppNotification } from "../../sync/notificationsStore";

interface NotificationsBellProps {
  role?: "asha" | "block" | "district";
  onNotificationClick?: (notif: AppNotification) => void;
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({
  role = "asha",
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getForRole, getUnreadCount, markAsRead, markAllAsRead } =
    useNotificationsStore();

  const notifications = getForRole(role);
  const unreadCount = getUnreadCount(role);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "emergency":
        return { icon: "warning", color: "text-rose-600 bg-rose-50" };
      case "alert":
        return { icon: "priority_high", color: "text-amber-600 bg-amber-50" };
      case "success":
        return { icon: "check_circle", color: "text-emerald-600 bg-emerald-50" };
      case "info":
      default:
        return { icon: "notifications", color: "text-primary bg-primary/10" };
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container transition"
        title="Notifications & Clinical Alerts"
        aria-label="Open notifications"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-outline-variant bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-on-surface">Notifications</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {unreadCount} new
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead(role)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">
                No recent alerts or notifications.
              </div>
            ) : (
              notifications.map((item) => {
                const { icon, color } = getTypeIcon(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      onNotificationClick?.(item);
                    }}
                    className={`flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-surface-container-low ${
                      !item.read ? "bg-primary/5 font-medium" : "opacity-80"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${color}`}
                    >
                      <span className="material-symbols-outlined text-sm">{icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <h4 className="text-xs font-bold text-on-surface truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-on-surface-variant shrink-0 font-mono">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                    </div>

                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-outline-variant bg-surface-container-low p-2 text-center text-[11px] text-on-surface-variant">
            Filtered for <strong className="uppercase">{role}</strong> portal context
          </div>
        </div>
      )}
    </div>
  );
};
