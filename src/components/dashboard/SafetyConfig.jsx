import { useApp } from "../../context/AppContext";
import { ruleFields } from "../../utils/helpers";

export default function SafetyConfig() {
  const {
    ruleForm, ruleSourceLabel, savingRules,
    updateRuleField, saveDecisionRules, resetDecisionRules,
  } = useApp();

  // Only show first 4 rules to match design (wind, gust, rain delay, rain return)
  const visibleRules = ruleFields.slice(0, 4);

  return (
    <div className="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col">
      <div className="flex justify-between items-start mb-md">
        <div>
          <h2 className="font-label-caps text-primary text-label-caps uppercase tracking-wider mb-base">CẤU HÌNH AN TOÀN DSS</h2>
          <h3 className="font-headline-sm text-headline-sm font-bold">Mô phỏng & Cấu hình an toàn</h3>
        </div>
        <div className="bg-surface-bright border border-outline-variant rounded px-sm py-xs flex flex-col items-end">
          <span className="text-[10px] text-on-surface-variant">Đang dùng cấu hình</span>
          <span className="text-[11px] font-bold text-on-surface">{ruleSourceLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-md flex-1">
        {visibleRules.map(({ key, label, unit, min, max, step, icon }) => (
          <div key={key} className="flex flex-col gap-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                <span className="font-data-mono text-[12px]">{label}</span>
              </div>
              <div className="font-data-mono text-[12px]">
                <span className="font-bold text-on-surface">{ruleForm[key] ?? ""}</span> {unit}
              </div>
            </div>
            <input
              type="range"
              className="w-full"
              min={min}
              max={max}
              step={step}
              value={ruleForm[key] ?? ""}
              onChange={(e) => updateRuleField(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-sm mt-lg">
        <button
          className="flex-1 bg-surface-bright text-on-surface py-sm rounded-lg font-label-caps text-label-caps border border-outline-variant hover:bg-surface-variant flex items-center justify-center gap-xs disabled:opacity-50"
          disabled={savingRules}
          onClick={resetDecisionRules}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          Về mặc định
        </button>
        <button
          className="flex-1 bg-primary text-on-primary-container py-sm rounded-lg font-label-caps text-label-caps font-bold hover:bg-primary-fixed flex items-center justify-center gap-xs disabled:opacity-50"
          disabled={savingRules}
          onClick={saveDecisionRules}
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          {savingRules ? "Đang lưu..." : "Lưu & Tính lại"}
        </button>
      </div>
    </div>
  );
}
