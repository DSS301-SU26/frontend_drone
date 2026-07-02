import React from "react";
import { useApp } from "../../context/AppContext";

export default function AiInsights() {
  const { current, locationId } = useApp();
  const engine = current?.decision_engine;

  if (!engine) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-xl text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] mb-md opacity-50">analytics</span>
        <p>Không có dữ liệu phân tích. Vui lòng chọn một khung giờ có dữ liệu.</p>
      </div>
    );
  }

  const championPercent = ((engine.champion_score || 0) * 100).toFixed(1);
  const challengerPercent = ((engine.challenger_score || 0) * 100).toFixed(1);
  const cropImpactPercent = (engine.crop_impact_score || 0).toFixed(1);
  const sprayQualityPercent = (engine.spray_quality_score || 0).toFixed(1);

  const championOffset = 351.8 - (351.8 * (engine.champion_score || 0));
  const challengerOffset = 351.8 - (351.8 * (engine.challenger_score || 0));

  return (
    <div className="flex flex-col gap-lg h-full overflow-y-auto pr-2 pb-md">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-sm gap-sm">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Dự báo & Phân tích AI</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Phân tích rủi ro thực tế cho khu vực {locationId} lúc {current?.time || "--:--"}.</p>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter auto-rows-auto flex-1">
        
        {/* ML Champion vs Challenger */}
        <section className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md md:col-span-8 flex flex-col transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,184,148,0.2)] hover:border-primary/50">
          <header className="flex justify-between items-center mb-md border-b border-outline-variant pb-xs">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Mô Hình An Toàn Bay (Safety Score)</h3>
            </div>
            {engine.was_conflict && (
              <span className="font-label-caps text-label-caps text-error-container bg-error/20 px-2 py-1 rounded">Có xung đột dự đoán</span>
            )}
          </header>
          
          <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-around gap-6 mt-4">
            {/* Champion (Random Forest) */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full border-4 border-surface-container-highest flex items-center justify-center mb-sm">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="56" fill="transparent" strokeWidth="8" className="stroke-surface-container-highest" />
                  <circle cx="60" cy="60" r="56" fill="transparent" strokeWidth="8" className="stroke-primary transition-all duration-1000" strokeDasharray={351.8} strokeDashoffset={championOffset} />
                </svg>
                <div className="text-center">
                  <span className="font-display-md text-display-md text-primary block leading-none">{championPercent}%</span>
                </div>
              </div>
              <h4 className="font-headline-sm text-on-surface mt-2">Champion</h4>
              <p className="font-body-sm text-on-surface-variant">Random Forest</p>
            </div>

            <div className="w-px h-24 bg-outline-variant hidden md:block"></div>

            {/* Challenger (XGBoost) */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full border-4 border-surface-container-highest flex items-center justify-center mb-sm">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="56" fill="transparent" strokeWidth="8" className="stroke-surface-container-highest" />
                  <circle cx="60" cy="60" r="56" fill="transparent" strokeWidth="8" className="stroke-secondary transition-all duration-1000" strokeDasharray={351.8} strokeDashoffset={challengerOffset} />
                </svg>
                <div className="text-center">
                  <span className="font-display-md text-display-md text-secondary block leading-none">{challengerPercent}%</span>
                </div>
              </div>
              <h4 className="font-headline-sm text-on-surface mt-2">Challenger</h4>
              <p className="font-body-sm text-on-surface-variant">XGBoost (Bắt dị biệt)</p>
            </div>
          </div>
        </section>

        {/* Quality Analysis */}
        <section className="bg-surface-container-low/70 backdrop-blur-md border border-outline-variant rounded-lg p-md md:col-span-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,184,148,0.2)] hover:border-primary/50">
          <header className="flex items-center gap-xs mb-sm pb-xs border-b border-outline-variant">
            <span className="material-symbols-outlined text-secondary">eco</span>
            <h3 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Phân tích Nông học</h3>
          </header>
          
          <div className="flex flex-col gap-6 mt-2 flex-1 justify-center">
            {/* Crop Impact */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body-md text-on-surface">Bảo vệ Lúa (Crop Impact)</span>
                <span className="font-data-mono text-on-surface-variant">{cropImpactPercent}/100</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className={`h-full ${engine.crop_impact_score >= 80 ? "bg-primary" : engine.crop_impact_score >= 50 ? "bg-secondary" : "bg-error"}`} style={{ width: `${cropImpactPercent}%` }}></div>
              </div>
              <p className="font-body-sm text-on-surface-variant mt-1 text-[11px]">Nguy cơ sốc nhiệt, tốc độ lúa bị táp.</p>
            </div>

            {/* Spray Quality */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body-md text-on-surface">Chất lượng Phun (Spray Quality)</span>
                <span className="font-data-mono text-on-surface-variant">{sprayQualityPercent}/100</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className={`h-full ${engine.spray_quality_score >= 80 ? "bg-primary" : engine.spray_quality_score >= 50 ? "bg-secondary" : "bg-error"}`} style={{ width: `${sprayQualityPercent}%` }}></div>
              </div>
              <p className="font-body-sm text-on-surface-variant mt-1 text-[11px]">Độ bao phủ, chống tán xạ hóa chất (Drift).</p>
            </div>
          </div>
        </section>

        {/* XAI Alert (Wide Span) */}
        <section className={`backdrop-blur-md border rounded-lg p-md md:col-span-12 transition-all duration-300 ${engine.is_safe_to_fly ? "bg-primary/5 border-primary/30" : "bg-error/5 border-error/30"}`}>
          <header className="flex items-center gap-xs mb-sm">
            <span className={`material-symbols-outlined ${engine.is_safe_to_fly ? "text-primary" : "text-error"}`}>
              {engine.is_safe_to_fly ? "verified_user" : "warning"}
            </span>
            <h3 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Hệ thống Cảnh báo XAI (Explainable AI)</h3>
          </header>
          
          <div className="p-sm bg-surface-container-lowest rounded-lg border border-outline-variant">
            <p className="font-body-md text-on-surface whitespace-pre-wrap">{engine.xai_alert || "Điều kiện lý tưởng, không phát hiện rủi ro nào."}</p>
          </div>
        </section>

      </div>
    </div>
  );
}
