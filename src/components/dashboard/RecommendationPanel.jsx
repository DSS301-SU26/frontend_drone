import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { formatNumber } from "../../utils/helpers";

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
  const isHighRisk = flyScore < 0.50;
  const cropImpactScore = current?.decision_engine?.crop_impact_score ?? 100;
  const sprayQualityScore = current?.decision_engine?.spray_quality_score ?? 100;
  const flowRate = current?.decision_engine?.resource_regressor?.flow_rate_l_ha ?? 0;
  const cropScore = Math.round(current?.decision_engine?.crop_impact_score ?? 0);
  const sprayScore = Math.round(current?.decision_engine?.spray_quality_score ?? 0);

  // Determine risk color
  const riskColor = isHighRisk ? "#ff4a4a" : flyScore >= 0.80 ? "#4bddb7" : "#f0bf63";
  const cardBg = isHighRisk ? "bg-[#1a0f11]" : flyScore >= 0.80 ? "bg-[#0f1a14]" : "bg-[#1a170f]";
  const cardBorder = isHighRisk ? "border-[#4a1c1c]" : flyScore >= 0.80 ? "border-[#1c4a2d]" : "border-[#4a3f1c]";

  return (
    <div className="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col gap-md">
      <div className="flex justify-between items-center mb-sm">
        <div>
          <h2 className="font-label-caps text-primary text-label-caps uppercase tracking-wider mb-base">TRẠNG THÁI KHUYẾN NGHỊ</h2>
          <h3 className="font-headline-sm text-headline-sm font-bold">Decision Engine Output</h3>
        </div>
        <span className="bg-surface-bright border border-outline-variant rounded px-sm py-xs text-[12px] font-data-mono">v2.0</span>
      </div>

      <div className={`${cardBg} border ${cardBorder} rounded-xl p-md flex flex-col gap-md`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-sm">
            <div className="w-2 h-4 rounded-sm" style={{ backgroundColor: riskColor }}></div>
            <span className="font-label-caps text-label-caps text-on-surface">
              {current?.was_human_overridden ? "QUYẾT ĐỊNH GHI ĐÈ BỞI QUẢN TRỊ VIÊN" : "KHUYẾN NGHỊ TỰ ĐỘNG TỪ HỆ THỐNG"}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span style={{ color: riskColor }} className="font-bold text-sm">Rủi ro:</span>
            <span style={{ color: riskColor }} className="font-bold">{activeRisk}</span>
          </div>
        </div>

        <div>
          <h4 className="font-headline-md text-headline-sm font-bold text-white mb-xs">{action.title}</h4>
          <p className="font-body-md text-body-md text-on-surface-variant">{action.description}</p>
        </div>

        <div className={`border-t pt-md mt-xs`} style={{ borderColor: isHighRisk ? '#4a1c1c' : flyScore >= 0.80 ? '#1c4a2d' : '#4a3f1c' }}>
          <div className="flex justify-between items-end mb-xs">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">KHẢ NĂNG CẤT CÁNH (AI SCORE)</span>
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

        {!isSafe && current?.decision_engine?.xai_alert && (
          <div className="flex items-start gap-sm mt-xs text-[11px]" style={{ color: riskColor }}>
            <span className="material-symbols-outlined text-[14px]">error</span>
            <span>{current.decision_engine.xai_alert}</span>
          </div>
        )}

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
                <option value="FLY">Cất cánh (FLY)</option>
                <option value="DELAY">Hoãn bay (DELAY)</option>
                <option value="LOCK_SPRAY">Khóa phun (LOCK_SPRAY)</option>
                <option value="NO_FLY">Cấm bay (NO_FLY)</option>
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
