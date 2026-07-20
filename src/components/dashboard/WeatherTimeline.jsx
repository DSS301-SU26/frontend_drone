import { useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { formatDateTime, formatDateOnly, formatNumber, formatVisibility, translateWeatherDescription } from "../../utils/helpers";

export default function WeatherTimeline() {
  const {
    dashboard, slots, selectedSlot, setSelectedSlot,
    slotViewMode, setSlotViewMode, current,
    selectedDetailsDrone, setSelectedDetailsDrone, droneList
  } = useApp();

  const timelineRef = useRef(null);

  useEffect(() => {
    if (slotViewMode === "timeline" && timelineRef.current) {
      const selectedBtn = timelineRef.current.children[selectedSlot];
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedSlot, slotViewMode]);

  const targetSlot = current;
  const visibilityText = formatVisibility(targetSlot?.visibility);
  const weatherDescription = translateWeatherDescription(targetSlot?.weather_description);
  const precipitationText = targetSlot?.precipitation > 0
    ? `Lượng mưa ${formatNumber(targetSlot.precipitation)} mm`
    : "Chưa ghi nhận mưa";

  const weatherMetrics = [
    { label: "Nhiệt độ", value: targetSlot?.temperature, unit: "°C", icon: "device_thermostat", colorClass: "text-[#E5A85A]", borderClass: "border-[#3A2D1F]", note: weatherDescription },
    { label: "Tốc độ gió", value: targetSlot?.wind_speed, unit: "", icon: "air", colorClass: "text-[#5A9EE5]", borderClass: "border-[#1F2F3A]", note: `Gió giật ${formatNumber(targetSlot?.wind_gust)} km/h` },
    { label: "Độ ẩm", value: targetSlot?.humidity, unit: "%", icon: "water_drop", colorClass: "text-primary", borderClass: "border-[#1F3A3A]", note: `Mây ${formatNumber(targetSlot?.cloud_cover)}% - ${visibilityText}` },
    { label: "Khả năng mưa", value: targetSlot?.rain_probability, unit: "%", icon: "rainy", colorClass: "text-[#B45AE5]", borderClass: "border-[#2D1F3A]", note: precipitationText },
  ];

  if (!dashboard) return null;

  return (
    <div className="col-span-1 md:col-span-8 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col gap-md">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-label-caps text-primary text-label-caps uppercase tracking-wider mb-base">THÔNG TIN VI KHÍ HẬU & LỊCH TRÌNH</h2>
          <h3 className="font-headline-md text-headline-md font-bold">Thời tiết từng khung giờ bay</h3>
        </div>
        <div className="flex gap-sm">
          <button
            className={`px-md py-xs rounded font-label-caps text-label-caps font-bold transition-colors ${
              slotViewMode === "timeline" ? "bg-primary text-on-primary-container" : "bg-surface-bright text-on-surface border border-outline-variant hover:bg-surface-variant"
            }`}
            onClick={() => setSlotViewMode("timeline")}
          >
            Đồng thời gian
          </button>
          <button
            className={`px-md py-xs rounded font-label-caps text-label-caps font-bold transition-colors ${
              slotViewMode === "grid" ? "bg-primary text-on-primary-container" : "bg-surface-bright text-on-surface border border-outline-variant hover:bg-surface-variant"
            }`}
            onClick={() => setSlotViewMode("grid")}
          >
            Bảng tổng quan cả ngày
          </button>
          <div className="flex items-center gap-xs bg-surface-bright border border-outline-variant px-sm py-xs rounded whitespace-nowrap">
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            <span className="font-body-md text-body-md text-on-surface-variant text-sm">
              Dữ liệu: <strong className="text-on-surface">{formatDateOnly(dashboard.date || dashboard.slots?.[0]?.timestamp)}</strong>
            </span>
          </div>
        </div>
      </div>

      {slotViewMode === "timeline" ? (
        <>
          {/* Timeline */}
          <div ref={timelineRef} className="flex gap-sm overflow-x-auto timeline-scroll pb-sm">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot === index;
          return (
            <button
              key={slot.timestamp}
              onClick={() => setSelectedSlot(index)}
              className={`flex-shrink-0 w-32 rounded-lg p-sm border transition-all ${
                isSelected
                  ? "bg-primary-container text-on-primary-container border-primary"
                  : "bg-surface text-on-surface-variant border-outline-variant hover:border-outline"
              }`}
            >
              <div className={`text-sm mb-xs ${isSelected ? "font-bold" : ""}`}>{slot.time}</div>
              <div className="flex justify-between items-end">
                <span className={isSelected ? "font-headline-sm text-headline-sm font-bold" : "font-body-lg text-body-lg"}>
                  {slot.temperature}°C
                </span>
                <span className="material-symbols-outlined text-[16px]">
                  {slot.rain_probability > 60 ? "rainy" : slot.cloud_cover > 70 ? "cloud" : slot.temperature > 32 ? "sunny" : "partly_cloudy_day"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

        </>
      ) : (
        <div className="overflow-x-auto bg-surface-container-lowest border border-outline-variant rounded-lg mt-sm flex-1 max-h-[400px] timeline-scroll">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="p-sm text-[11px] font-label-caps uppercase text-on-surface-variant font-bold">Khung giờ</th>
                {/* <th className="p-sm text-[11px] font-label-caps uppercase text-on-surface-variant font-bold">Khả năng bay</th> */}
                <th className="p-sm text-[11px] font-label-caps uppercase text-on-surface-variant font-bold">AI Khuyến nghị</th>
                <th className="p-sm text-[11px] font-label-caps uppercase text-on-surface-variant font-bold text-center">AI Đồng thuận</th>
                <th className="p-sm text-[11px] font-label-caps uppercase text-on-surface-variant font-bold text-center">Drones bay được</th>
                <th className="p-sm text-[11px] font-label-caps uppercase text-on-surface-variant font-bold text-center">Quyết định QTV</th>
                <th className="p-sm text-[11px] font-label-caps uppercase text-on-surface-variant font-bold text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, index) => {
                const isSelected = selectedSlot === index;
                const originalDec = slot.decision_engine?.original_ai_decision || slot.decision_engine?.final_decision || slot.decision_engine?.system_decision;
                const actionLabel = (originalDec === "FLY" || originalDec === "TAKE_OFF") ? "Cất cánh" :
                                   (originalDec === "NO_FLY" || originalDec === "RETURN_TO_CHARGING") ? "Cấm bay" :
                                   originalDec === "LOCK_SPRAY" ? "Khóa phun" : "Hoãn bay";
                const actionBg = (originalDec === "FLY" || originalDec === "TAKE_OFF") ? "border-[#1c4a2d] text-[#4bddb7]" : 
                               (originalDec === "NO_FLY" || originalDec === "RETURN_TO_CHARGING") ? "border-[#4a1c1c] text-[#ff4a4a]" :
                               originalDec === "LOCK_SPRAY" ? "border-[#4a1c1c] text-[#ff4a4a]" : "border-[#4a3f1c] text-[#f0bf63]";
                
                const overrideDec = slot.decision_engine?.system_decision;
                const overrideLabel = (overrideDec === "FLY" || overrideDec === "TAKE_OFF") ? "Cất cánh" :
                                   (overrideDec === "NO_FLY" || overrideDec === "RETURN_TO_CHARGING") ? "Cấm bay" :
                                   overrideDec === "LOCK_SPRAY" ? "Khóa phun" : "Hoãn bay";
                const overrideColor = (overrideDec === "FLY" || overrideDec === "TAKE_OFF") ? "text-[#4bddb7]" : 
                               (overrideDec === "NO_FLY" || overrideDec === "RETURN_TO_CHARGING") ? "text-[#ff4a4a]" :
                               overrideDec === "LOCK_SPRAY" ? "text-[#ff4a4a]" : "text-[#f0bf63]";

                const isConsensus = !slot.decision_engine?.was_conflict;
                const wasOverridden = slot.was_human_overridden;

                return (
                  <tr key={slot.timestamp} className={`border-b border-outline-variant hover:bg-surface transition-colors cursor-pointer ${isSelected ? "bg-surface-container-high" : ""}`} onClick={() => setSelectedSlot(index)}>
                    <td className="p-sm font-data-mono text-[13px] text-on-surface-variant leading-tight">
                      <div className="font-bold text-on-surface">{slot.time} -</div>
                      <div>{slot.end_time}</div>
                    </td>
                    {/* <td className="p-sm">
                      <div className="flex items-center gap-sm">
                        <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `0%`, backgroundColor: "gray" }}></div>
                        </div>
                        <span className="font-data-mono text-[12px] font-bold">-</span>
                      </div>
                    </td> */}
                    <td className="p-sm">
                      <span className={`px-2 py-1 rounded border ${actionBg} text-[11px] font-bold`}>{actionLabel}</span>
                    </td>
                    <td className="p-sm text-center">
                      {isConsensus ? (
                        <span className="px-2 py-1 rounded border border-[#1c4a2d] text-primary text-[11px] font-bold">Đồng thuận</span>
                      ) : (
                        <span className="px-2 py-1 rounded border border-[#4a3f1c] text-[#f0bf63] text-[11px] font-bold">Xung đột</span>
                      )}
                    </td>
                    <td className="p-sm text-center font-data-mono font-bold text-[11px] text-on-surface">
                      {(() => {
                         const flyingDrones = Object.entries(slot.decision_engine?.drones_eval || {})
                           .filter(([_, evalData]) => evalData.decision === "FLY")
                           .map(([name]) => name);
                         if (flyingDrones.length === 0) return "-";
                         return (
                           <div className="truncate max-w-[120px] mx-auto" title={flyingDrones.join(", ")}>
                             {flyingDrones.join(", ")}
                           </div>
                         );
                      })()}
                    </td>
                    <td className="p-sm text-center">
                      {wasOverridden ? (
                        <span className={`font-data-mono text-[11px] font-bold ${overrideColor}`}>{overrideLabel}</span>
                      ) : (
                        <span className="text-on-surface-variant">-</span>
                      )}
                    </td>
                    <td className="p-sm text-center">
                      <select 
                        className="bg-surface border border-outline-variant rounded p-1 text-[11px] text-on-surface outline-none cursor-pointer w-full text-center"
                        value={isSelected && selectedDetailsDrone ? selectedDetailsDrone : ""}
                        onChange={(e) => {
                           e.stopPropagation();
                           setSelectedSlot(index);
                           setSelectedDetailsDrone(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="" disabled>Xem</option>
                        {droneList.map(d => (
                          <option key={d.model_name} value={d.model_name}>{d.model_name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm mt-sm">
        {weatherMetrics.map(({ label, value, unit, icon, colorClass, borderClass, note }) => (
          <div key={label} className={`bg-surface border ${borderClass} p-sm rounded-lg flex flex-col justify-between h-24`}>
            <div className={`flex items-center gap-xs ${colorClass}`}>
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              <span className="font-label-caps text-[10px] uppercase">{label}</span>
            </div>
            <div>
              <div className="flex items-baseline gap-xs">
                <span className="font-display-lg text-[24px] font-bold">{value ?? "--"}</span>
                {unit && <span className="text-on-surface-variant text-sm">{unit}</span>}
              </div>
              <div className="text-on-surface-variant text-[11px] truncate" title={note}>{note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
