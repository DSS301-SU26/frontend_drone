import { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";

function Dropdown({ id, trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface-container-high border border-outline-variant rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="p-xs flex flex-col" onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TopNav() {
  const {
    locations, locationId, setLocationId,
    dashboard, syncing, lastSyncedAt,
    notificationOpen, setNotificationOpen,
    mapModalOpen, setMapModalOpen,
    executePipelineRefresh, droneList,
    droneModel, setDroneModel, pesticide, setPesticide, cropStage, setCropStage,
  } = useApp();

  const currentLocation = locations.find((l) => l.id === locationId);

  return (
    <header className="flex justify-between items-center w-full px-margin-desktop py-sm sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-outline-variant">
      {/* Left: Brand */}
      <div className="flex items-center gap-sm">
        <span
          className="material-symbols-outlined text-primary text-[32px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          flight_takeoff
        </span>
        <span className="font-display-lg text-headline-md font-bold text-primary tracking-tight">
          AeroGuard Pro
        </span>
      </div>

      {/* Center: Selectors */}
      <div className="flex items-center gap-md">
        {/* Garden Selector */}
        <Dropdown
          id="garden"
          trigger={
            <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg px-md py-xs gap-sm hover:border-outline transition-colors hover:bg-surface-variant">
              <span className="material-symbols-outlined text-on-surface-variant">park</span>
              <span className="font-label-caps text-label-caps text-on-surface">
                {currentLocation?.name ?? locationId}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant">arrow_drop_down</span>
            </div>
          }
        >
          {locations.map((loc) => {
            const isActive = loc.id === locationId;
            return (
              <div
                key={loc.id}
                onClick={() => setLocationId(loc.id)}
                className={`flex items-center justify-between px-md py-sm rounded-sm cursor-pointer transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-surface-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="font-label-caps text-label-caps">{loc.name}</span>
                {isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hoạt động</span>
                )}
              </div>
            );
          })}
        </Dropdown>

        {/* Map Button */}
        <button
          className="p-xs bg-surface-container border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors text-primary"
          onClick={() => setMapModalOpen(true)}
        >
          <span className="material-symbols-outlined">map</span>
        </button>

        <div className="w-px h-6 bg-outline-variant mx-xs"></div>

        {/* Drone Selector (Hidden as requested, selection is now per-slot) */}
        {/*
        <Dropdown
          id="drone"
          trigger={
            <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg px-md py-xs gap-sm hover:border-outline transition-colors hover:bg-surface-variant">
              <span className="material-symbols-outlined text-on-surface-variant">flight</span>
              <div className="flex items-center gap-xs">
                <span className="font-label-caps text-label-caps text-on-surface">{droneModel}</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">arrow_drop_down</span>
            </div>
          }
        >
          {(droneList.length > 0 ? droneList.map(d => d.model_name) : ["DJI_T30", "DJI_T50", "XAG_P100_PRO"]).map((model) => (
            <div
              key={model}
              onClick={() => setDroneModel(model)}
              className={`flex items-center justify-between px-md py-sm rounded-sm transition-colors cursor-pointer ${
                model === droneModel ? "bg-primary/10 text-primary" : "hover:bg-surface-variant text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[18px]">flight</span>
                <span className="font-label-caps text-label-caps">{model}</span>
              </div>
            </div>
          ))}
        </Dropdown>
        */}

        {/* Pesticide Display (Read-only) */}
        <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg px-md py-xs gap-sm opacity-80" title="Loại thuốc lấy tự động từ CSDL cánh đồng">
          <span className="material-symbols-outlined text-on-surface-variant">science</span>
          <span className="font-label-caps text-label-caps text-on-surface">{pesticide}</span>
        </div>

        {/* Crop Stage Display (Read-only) */}
        <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg px-md py-xs gap-sm opacity-80" title="Giai đoạn lúa lấy tự động từ CSDL cánh đồng">
          <span className="material-symbols-outlined text-on-surface-variant">grass</span>
          <span className="font-label-caps text-label-caps text-on-surface">{cropStage}</span>
        </div>

        {/* Sync button */}
        <button
          className="p-xs bg-surface-container border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors text-primary disabled:opacity-50"
          disabled={syncing}
          onClick={() => executePipelineRefresh(true)}
          title="Đồng bộ dữ liệu thời tiết"
        >
          <span className={`material-symbols-outlined ${syncing ? "animate-spin" : ""}`}>sync</span>
        </button>
      </div>

      {/* Right: Actions */}

    </header>
  );
}
