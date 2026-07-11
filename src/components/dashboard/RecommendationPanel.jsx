import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { formatNumber, formatRecommendationText } from "../../utils/helpers";

const FACTOR_LABELS = {
  temperature: "Nhiệt độ", humidity: "Độ ẩm", wind_speed: "Tốc độ gió",
  wind_gust: "Gió giật", wind_direction: "Hướng gió", rain: "Mưa",
  visibility: "Tầm nhìn", cloud_cover: "Mây che phủ", stage_time_ban: "Khung giờ giai đoạn",
  drone_wind_limit: "Giới hạn gió drone", drone_gust_limit: "Giới hạn giật drone",
  pesticide_uv_timing: "Thời điểm phun (UV)", pesticide_rain_washout: "Rửa trôi thuốc",
  formulation: "Dạng thuốc", water_ph: "pH nước", adjuvant: "Chất trợ lực",
  nozzle: "Loại béc", canopy_density: "Mật độ tán lá",
};
const VERDICT_COLOR = { ALLOW: "#4bddb7", WARN: "#f0bf63", STOP: "#ff6b6b" };

export default function RecommendationPanel() {
  const [showFactors, setShowFactors] = useState(false);
  const { current, action, activeRisk, isOverriding, setIsOverriding, overrideDecisionValue, setOverrideDecisionValue, overrideNotes, setOverrideNotes, submittingOverride, handleOverrideDecision, handleRevertToAi, launchDrone } = useApp();

  const flyScore = current?.decision_engine?.flyability_score ?? 0;
  const scorePercent = Math.round(flyScore * 100);
  const isSafe = current?.decision_engine?.is_safe_to_fly;
  const cropImpactScore = current?.decision_engine?.crop_impact_score ?? 100;
  const sprayQualityScore = current?.decision_engine?.spray_quality_score ?? 100;
  const flowRate = current?.decision_engine?.resource_regressor?.flow_rate_l_ha ?? 0;
  const cropScore = Math.round(current?.decision_engine?.crop_impact_score ?? 0);
  const sprayScore = Math.round(current?.decision_engine?.spray_quality_score ?? 0);

  // Determine risk color based on actual derived risk level, not just the base flyScore
  const isHighRisk = activeRisk === "Cao";
  const isMediumRisk = activeRisk === "Trung bình";
  const riskColor = isHighRisk ? "#ff4a4a" : isMediumRisk ? "#f0bf63" : "#4bddb7";
  const cardBg = isHighRisk ? "bg-[#1a0f11]" : isMediumRisk ? "bg-[#1a170f]" : "bg-[#0f1a14]";
  const cardBorder = isHighRisk ? "border-[#4a1c1c]" : isMediumRisk ? "border-[#4a3f1c]" : "border-[#1c4a2d]";

  // Icons based on decision action
  const actionIcon = {
    FLY: "check_circle",
    DELAY: "schedule",
    LOCK_SPRAY: "water_drop",
    NO_FLY: "block"
  }[current?.decision_action] || "info";

  return (
    <div className="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col gap-md shadow-lg">
      <div className="flex justify-between items-center mb-sm">
        <div>
          <h2 className="font-label-caps text-primary text-[10px] uppercase tracking-[0.2em] mb-1">Hệ Thống Trí Tuệ Nhân Tạo</h2>
          <h3 className="font-headline-sm text-headline-sm font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Decision Engine Output</h3>
        </div>
        <span className="bg-surface-bright border border-outline-variant rounded-full px-3 py-1 text-[11px] font-data-mono font-bold text-primary shadow-[0_0_10px_rgba(75,221,183,0.1)]">v2.0</span>
      </div>

      <div className={`relative overflow-hidden rounded-2xl border ${cardBorder} shadow-2xl transition-all duration-500`}
           style={{ background: `linear-gradient(145deg, ${cardBg}, #0a0a0a)` }}>
        
        {/* Dynamic Animated Glow Effect */}
        <div className="absolute -top-20 -right-20 w-64 h-64 blur-[80px] opacity-30 rounded-full animate-pulse" 
             style={{ backgroundColor: riskColor, animationDuration: '4s' }}></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 blur-[60px] opacity-20 rounded-full" 
             style={{ backgroundColor: riskColor }}></div>

        <div className="relative z-10 p-lg flex flex-col gap-sm">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-sm">
              <div className="w-1.5 h-6 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: riskColor }}></div>
              <span className="font-label-caps text-[11px] font-bold text-white/90 tracking-widest uppercase">
                {current?.was_human_overridden ? "Ghi đè bởi QTV" : "Khuyến nghị từ hệ thống"}
              </span>
            </div>
            
            {/* Premium Glassmorphism Risk Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md shadow-md"
                 style={{ backgroundColor: `${riskColor}15`, borderColor: `${riskColor}40` }}>
              <span className="font-label-caps text-[9px] uppercase text-white/70 font-bold tracking-wider">Mức độ rủi ro:</span>
              <span style={{ color: riskColor, textShadow: `0 0 8px ${riskColor}80` }} className="font-bold text-[11px] uppercase tracking-widest">{activeRisk}</span>
            </div>
          </div>

          <div className="mt-1">
            {(() => {
              const rawText = current?.xai_alert || current?.decision_engine?.xai_alert || current?.xai_explanation;
              const formattedText = formatRecommendationText(rawText) || action.description;
              const parts = formattedText.split(" — ");
              const displayTitle = parts.length > 1 ? parts[0] : action.title;
              const displayContent = parts.length > 1 ? parts.slice(1).join(" — ") : formattedText;

              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[24px] drop-shadow-md" style={{ color: riskColor }}>
                      {actionIcon}
                    </span>
                    <h4 className="font-display-sm text-[20px] font-bold text-white tracking-tight drop-shadow-sm">
                      {displayTitle}
                    </h4>
                  </div>
                  {(() => {
                    let reason = displayContent;
                    let rec = "";
                    let splitFound = false;

                    if (displayContent.includes("→ Đề xuất:")) {
                      [reason, rec] = displayContent.split("→ Đề xuất:");
                      splitFound = true;
                    } else if (displayContent.includes(" — đề xuất ")) {
                      [reason, rec] = displayContent.split(" — đề xuất ");
                      splitFound = true;
                    }

                    if (splitFound) {
                      return (
                        <div className="flex flex-col gap-3">
                          <p className="font-body-md text-[14px] text-white/85 leading-relaxed font-normal">
                            {reason.trim()}
                          </p>
                          <div className="flex items-start gap-2 bg-[#1a2b25]/40 p-3 rounded-lg border border-[#2a4539] shadow-inner">
                            <span className="material-symbols-outlined text-[16px] text-[#4bddb7] mt-0.5">lightbulb</span>
                            <p className="font-body-md text-[14px] text-[#b3f0dd] leading-relaxed font-medium">
                              <span className="font-bold text-[#4bddb7]">Đề xuất:</span> {rec.trim()}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="font-body-md text-[14px] text-white/85 leading-relaxed font-normal">
                        {displayContent}
                      </p>
                    );
                  })()}
                </>
              );
            })()}

            {current?.was_human_overridden && current?.user_notes && (
              <div className="mt-lg p-md bg-white/5 backdrop-blur-sm rounded-xl border-l-4 shadow-inner" style={{ borderColor: riskColor }}>
                <span className="font-label-caps text-[11px] uppercase block mb-2 font-bold tracking-wider" style={{ color: riskColor }}>
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">speaker_notes</span>
                  Ghi chú của quản trị viên:
                </span>
                <p className="text-white/90 text-base italic leading-relaxed">"{current.user_notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Lower content section with padding */}
        <div className="relative z-10 p-lg pt-0 flex flex-col gap-md">
          <div className={`border-t pt-md mt-xs`} style={{ borderColor: isHighRisk ? '#4a1c1c' : isMediumRisk ? '#4a3f1c' : '#1c4a2d' }}>
            <div className="flex justify-between items-end mb-xs">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">ĐIỂM AN TOÀN BAY</span>
              <span className="font-bold" style={{ color: riskColor }}>{scorePercent}%</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden mb-sm">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${scorePercent}%`, backgroundColor: riskColor }}></div>
            </div>

            <div className="flex justify-between items-end mb-xs">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">ĐIỂM AN TOÀN CÂY TRỒNG</span>
              <span className="font-bold text-primary">{Math.round(cropImpactScore)}</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mb-sm">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${cropImpactScore}%` }}></div>
            </div>

            <div className="flex justify-between items-end mb-xs">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">ĐIỂM CHẤT LƯỢNG PHUN</span>
              <span className="font-bold text-primary">{Math.round(sprayQualityScore)}</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${sprayQualityScore}%` }}></div>
            </div>
          </div>

        {/* 3 điểm rủi ro DSS (BRD §2.2) */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "An toàn bay", value: scorePercent, color: riskColor },
            { label: "Tác động lúa", value: cropScore, color: "#6fb3ff" },
            { label: "Chất lượng phun", value: sprayScore, color: "#c9a0ff" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm flex flex-col items-center gap-1">
              <span className="font-label-caps text-[9px] text-on-surface-variant uppercase text-center leading-tight">{s.label}</span>
              <span className="font-display-lg text-[18px] font-bold leading-none" style={{ color: s.color }}>{s.value}</span>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }}></div>
              </div>
            </div>
          ))}
        </div>

        {isSafe ? (
          <button
            onClick={launchDrone}
            className="w-full bg-primary-container text-on-primary-container py-sm rounded-lg font-label-caps text-label-caps font-bold flex justify-center items-center gap-sm hover:bg-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
            KÍCH HOẠT CẤT CÁNH (FLY)
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-[#1e1416] border border-[#3a2024] py-sm rounded-lg font-label-caps text-label-caps font-bold flex justify-center items-center gap-sm opacity-80 cursor-not-allowed"
            style={{ color: riskColor }}
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            CẤT CÁNH BỊ KHÓA (SAFETY LOCK)
          </button>
        )}

        <div className="flex gap-2 w-full mt-2">
          {!current?.was_human_overridden ? (
            <button
              onClick={() => setIsOverriding(true)}
              className="flex-1 bg-surface-container-high border border-outline-variant hover:border-outline text-on-surface py-xs rounded-lg font-label-caps text-label-caps flex justify-center items-center gap-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              Ghi đè AI
            </button>
          ) : (
            <button
              onClick={handleRevertToAi}
              disabled={submittingOverride}
              className="flex-1 bg-primary/20 border border-primary/50 text-primary py-xs rounded-lg font-label-caps text-label-caps flex justify-center items-center gap-xs transition-colors"
            >
              <span className={`material-symbols-outlined text-[14px] ${submittingOverride ? 'animate-spin' : ''}`}>
                {submittingOverride ? 'sync' : 'restore'}
              </span>
              Khôi phục AI
            </button>
          )}
        </div>

        {/* Removed tiny XAI alert since it is now prominently displayed in the main description above */}

        {/* Ma trận tác nhân §3.3 */}
        {current?.decision_engine?.factors?.length > 0 && (
          <div className="border-t pt-sm mt-xs" style={{ borderColor: "#2a2f2c" }}>
            <button
              onClick={() => setShowFactors((v) => !v)}
              className="w-full flex justify-between items-center font-label-caps text-[10px] text-on-surface-variant uppercase hover:text-on-surface"
            >
              <span>Ma trận {current.decision_engine.factors.length} tác nhân an toàn</span>
              <span className="material-symbols-outlined text-[16px]">{showFactors ? "expand_less" : "expand_more"}</span>
            </button>
            {showFactors && (
              <div className="grid grid-cols-2 gap-1 mt-sm max-h-52 overflow-y-auto custom-scrollbar">
                {current.decision_engine.factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-xs bg-surface-container-lowest border border-outline-variant rounded px-2 py-1" title={f.message}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: VERDICT_COLOR[f.verdict] || "#9aa6a2" }}></span>
                    <span className="text-[10px] text-on-surface-variant truncate">{FACTOR_LABELS[f.factor] || f.factor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Override Modal */}
      {isOverriding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg w-full max-w-md shadow-2xl flex flex-col gap-md">
            <h3 className="font-headline-sm text-on-surface font-bold">Ghi đè Quyết định AI</h3>
            <p className="text-body-sm text-on-surface-variant">Lưu ý: Bạn đang thực hiện quyền Override logic của Engine 3 lớp.</p>
            
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-on-surface-variant">Quyết định mới</label>
              <select 
                value={overrideDecisionValue}
                onChange={(e) => setOverrideDecisionValue(e.target.value)}
                className="bg-surface-container-highest border border-outline-variant text-on-surface rounded p-sm w-full outline-none focus:border-primary"
              >
                <option value="">-- Chọn quyết định --</option>
                {[
                  { value: "FLY", label: "Cất cánh (FLY)" },
                  { value: "DELAY", label: "Hoãn bay (DELAY)" },
                  { value: "LOCK_SPRAY", label: "Khóa phun (LOCK_SPRAY)" },
                  { value: "NO_FLY", label: "Cấm bay (NO_FLY)" }
                ].filter(opt => opt.value !== current?.decision_engine?.system_decision).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-on-surface-variant">Lý do ghi đè (Bắt buộc)</label>
              <textarea 
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                className="bg-surface-container-highest border border-outline-variant text-on-surface rounded p-sm w-full h-24 outline-none focus:border-primary resize-none"
                placeholder="Ví dụ: Đã kiểm tra thực tế, gió giật thấp hơn cảm biến báo..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-sm mt-sm">
              <button 
                onClick={() => setIsOverriding(false)}
                className="px-md py-xs rounded font-label-caps text-on-surface hover:bg-surface-container-highest"
              >
                Hủy
              </button>
              <button 
                onClick={handleOverrideDecision}
                disabled={!overrideDecisionValue || !overrideNotes || submittingOverride}
                className="px-md py-xs rounded font-label-caps bg-primary text-on-primary hover:bg-primary-fixed disabled:opacity-50 flex items-center gap-1"
              >
                {submittingOverride && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
                Xác nhận Ghi đè
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
