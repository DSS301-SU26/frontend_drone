import React, { useEffect, useState } from "react";
import { getDecisionLog } from "../../api/dashboard";
import { formatDateTime, formatNumber } from "../../utils/helpers";

const DECISION_META = {
  FLY: { label: "CẤT CÁNH", cls: "bg-primary-container text-on-primary-container", dot: "#4bddb7" },
  DELAY: { label: "HOÃN BAY", cls: "bg-tertiary-container text-on-tertiary-container", dot: "#f0bf63" },
  NO_FLY: { label: "CẤM BAY", cls: "bg-error-container text-on-error-container", dot: "#ff6b6b" },
};

function ScoreCell({ value, good = "#4bddb7" }) {
  const v = Math.round(Number(value) || 0);
  const color = v >= 70 ? good : v >= 40 ? "#f0bf63" : "#ff6b6b";
  return <span className="font-data-mono font-bold" style={{ color }}>{v}</span>;
}

export default function SafetyLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getDecisionLog(200)
      .then((data) => { setLogs(Array.isArray(data) ? data : []); setError(""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const total = logs.length;
  const noFly = logs.filter((l) => l.system_decision === "NO_FLY").length;
  const overrides = logs.filter((l) => l.is_user_overridden).length;
  const avgSafety = total
    ? Math.round(logs.reduce((s, l) => s + (Number(l.flight_safety_score) || 0), 0) / total)
    : 0;

  const stats = [
    { label: "Tổng quyết định ghi nhận", value: total, icon: "history", color: "text-on-surface" },
    { label: "Ca cấm bay (NO_FLY)", value: noFly, icon: "block", color: "text-error" },
    { label: "Ca người dùng ghi đè", value: overrides, icon: "edit_note", color: "text-tertiary" },
    { label: "Điểm an toàn TB", value: `${avgSafety}`, icon: "verified", color: "text-primary" },
  ];

  return (
    <div className="flex flex-col gap-lg h-full">
      {/* Header */}
      <header className="flex justify-between items-end mb-sm">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Nhật ký Quyết định Bay</h2>
          <div className="flex items-center gap-xs text-on-surface-variant font-label-caps text-label-caps mt-1">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Hộp đen AI · lưu 5 điểm rủi ro + ghi đè phục vụ kiểm toán & tái huấn luyện</span>
          </div>
        </div>
        <button
          onClick={load}
          className="flex px-sm py-xs border border-outline-variant rounded font-label-caps text-label-caps text-on-surface hover:bg-surface-container-highest transition-all duration-200 items-center gap-xs"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          Làm mới
        </button>
      </header>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-gutter mb-md">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md flex flex-col gap-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-100 transition-opacity">
              <span className={`material-symbols-outlined text-[48px] ${s.color}`}>{s.icon}</span>
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant">{s.label}</span>
            <span className={`font-display-lg text-display-lg ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </section>

      {/* Log Table */}
      <section className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg flex flex-col flex-1 min-h-0">
        <div className="p-md border-b border-outline-variant flex justify-between items-center">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Chi tiết quyết định</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Nhật ký thời gian thực từ decision engine 3 lớp.</p>
          </div>
        </div>

        <div className="overflow-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="p-lg text-center text-on-surface-variant">Đang tải nhật ký...</div>
          ) : error ? (
            <div className="p-lg text-center text-error">Lỗi tải log: {error}</div>
          ) : logs.length === 0 ? (
            <div className="p-lg text-center text-on-surface-variant">
              Chưa có nhật ký. Hãy mở trang Mission Control và đổi vài lựa chọn để hệ thống ghi lại quyết định.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-outline-variant bg-surface-container">
                  {["Thời điểm", "Khu vực", "Quyết định", "An toàn", "Lúa", "Phun", "Ghi đè", "Lý do / Giải thích"].map((h) => (
                    <th key={h} className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-data-mono text-data-mono text-on-surface divide-y divide-outline-variant/50">
                {logs.map((l, i) => {
                  const meta = DECISION_META[l.system_decision] || DECISION_META.DELAY;
                  return (
                    <tr key={i} className="hover:bg-surface-variant transition-colors">
                      <td className="py-sm px-md whitespace-nowrap text-on-surface-variant">{formatDateTime(l.slot_timestamp)}</td>
                      <td className="py-sm px-md whitespace-nowrap">{l.location_name ?? "—"}</td>
                      <td className="py-sm px-md">
                        <span className={`inline-flex items-center gap-xs px-2 py-1 rounded font-label-caps text-[10px] ${meta.cls}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }}></span>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-sm px-md"><ScoreCell value={l.flight_safety_score} /></td>
                      <td className="py-sm px-md"><ScoreCell value={l.crop_impact_score} good="#6fb3ff" /></td>
                      <td className="py-sm px-md"><ScoreCell value={l.spray_quality_score} good="#c9a0ff" /></td>
                      <td className="py-sm px-md">
                        {l.is_user_overridden ? (
                          <span className="inline-flex items-center gap-xs text-tertiary font-label-caps text-[10px]">
                            <span className="material-symbols-outlined text-[14px]">edit_note</span> CÓ
                          </span>
                        ) : (
                          <span className="text-on-surface-variant opacity-50">—</span>
                        )}
                      </td>
                      <td className="py-sm px-md max-w-[360px] truncate text-on-surface-variant" title={l.override_reason || l.xai_explanation || ""}>
                        {l.override_reason || l.xai_explanation || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-sm border-t border-outline-variant text-center font-label-caps text-label-caps text-on-surface-variant">
          Hiển thị {logs.length} bản ghi gần nhất
        </div>
      </section>
    </div>
  );
}
