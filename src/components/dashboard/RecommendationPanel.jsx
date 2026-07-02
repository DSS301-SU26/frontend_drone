import { useApp } from "../../context/AppContext";
import { formatNumber } from "../../utils/helpers";

export default function RecommendationPanel() {
  const { current, action, activeRisk, isOverriding, setIsOverriding, overrideDecisionValue, setOverrideDecisionValue, overrideNotes, setOverrideNotes, submittingOverride, handleOverrideDecision, handleRevertToAi, launchDrone } = useApp();

  const flyScore = current?.decision_engine?.flyability_score ?? 0;
  const scorePercent = Math.round(flyScore * 100);
  const isSafe = current?.decision_engine?.is_safe_to_fly;
  const isHighRisk = flyScore < 0.50;
  const flowRate = current?.decision_engine?.resource_regressor?.flow_rate_l_ha ?? 0;

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

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">ĐỊNH MỨC PHUN</span>
            <span className="font-display-lg text-primary text-[24px] font-bold leading-none">
              {formatNumber(flowRate)} <span className="text-sm font-normal text-on-surface-variant">L/ha</span>
            </span>
          </div>
        </div>

        <div className={`border-t pt-md mt-xs`} style={{ borderColor: isHighRisk ? '#4a1c1c' : flyScore >= 0.80 ? '#1c4a2d' : '#4a3f1c' }}>
          <div className="flex justify-between items-end mb-xs">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">KHẢ NĂNG CẤT CÁNH (AI FLYABILITY SCORE)</span>
            <span className="font-bold" style={{ color: riskColor }}>{scorePercent}%</span>
          </div>
          <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${scorePercent}%`, backgroundColor: riskColor }}></div>
          </div>
        </div>

        {isSafe ? (
          <button
            onClick={launchDrone}
            className="w-full bg-primary-container text-on-primary-container py-sm rounded-lg font-label-caps text-label-caps font-bold flex justify-center items-center gap-sm hover:bg-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
            KÍCH HOẠT CẤT CÁNH (TAKE OFF)
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
                <option value="TAKE_OFF">Cất cánh (Bỏ qua cảnh báo)</option>
                <option value="DELAY_FLIGHT">Hoãn bay</option>
                <option value="LOCK_SPRAY">Khóa phun</option>
                <option value="RETURN_TO_CHARGING">Quay về trạm</option>
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
