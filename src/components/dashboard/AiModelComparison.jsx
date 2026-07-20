import { useApp } from "../../context/AppContext";

export default function AiModelComparison() {
  const { current, selectedDetailsDrone } = useApp();

  const championScore = current?.decision_engine?.champion_score != null
    ? Math.round(current.decision_engine.champion_score * 100) : 0;
  const challengerScore = current?.decision_engine?.challenger_score != null
    ? Math.round(current.decision_engine.challenger_score * 100) : 0;
  const wasConflict = current?.decision_engine?.was_conflict;

  return (
    <div className="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col gap-md">
      <div>
        <h2 className="font-label-caps text-primary text-label-caps uppercase tracking-wider mb-base">SO SÁNH MÔ HÌNH AI</h2>
        <h3 className="font-headline-sm text-headline-sm font-bold">Dual-ML AI Prediction</h3>
      </div>

      {!selectedDetailsDrone ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-60 border border-outline-variant rounded-2xl bg-surface-container-lowest mt-sm">
           <span className="material-symbols-outlined text-4xl mb-2">ads_click</span>
           <p className="text-sm">Vui lòng chọn Drone từ bảng để xem chi tiết</p>
        </div>
      ) : (
        <>
          <div className="flex gap-sm mt-sm">
        {/* Champion: Random Forest */}
        <div className="flex-1 bg-surface border border-outline-variant rounded-lg p-sm flex flex-col justify-between">
          <div>
            <div className="font-body-md text-sm text-on-surface-variant mb-xs">Champion: Random Forest</div>
            <div className="flex justify-between items-end mb-xs">
              <span className="font-label-caps text-[11px]">Khả năng bay</span>
              <span className="font-bold text-primary text-sm">{championScore}%</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-xs">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${championScore}%` }}></div>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-sm leading-relaxed opacity-80">
            Mô hình ổn định, tối ưu cho dữ liệu lịch sử dài hạn, giúp giảm thiểu rủi ro sai số trong điều kiện thời tiết biến động nhẹ.
          </p>
        </div>

        {/* Challenger: XGBoost */}
        <div className="flex-1 bg-surface border border-outline-variant rounded-lg p-sm flex flex-col justify-between">
          <div>
            <div className="font-body-md text-sm text-on-surface-variant mb-xs">Challenger: XGBoost</div>
            <div className="flex justify-between items-end mb-xs">
              <span className="font-label-caps text-[11px]">Khả năng bay</span>
              <span className="font-bold text-secondary text-sm">{challengerScore}%</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-xs">
            <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${challengerScore}%` }}></div>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-sm leading-relaxed opacity-80">
            Phản ứng nhanh với các thay đổi đột ngột của độ ẩm và áp suất, cung cấp độ chính xác cao hơn trong các kịch bản thời tiết cực đoan.
          </p>
        </div>
      </div>

      {/* Conflict/Consensus Alert */}
      {wasConflict ? (
        <div className="mt-auto border border-[#4a3f1c] bg-[#1a170f] rounded-lg p-sm flex items-start gap-sm">
          <span className="material-symbols-outlined text-[#e5b55a] text-[18px]">warning</span>
          <div>
            <h4 className="font-label-caps text-[11px] text-[#e5b55a] uppercase font-bold mb-1">
              AI XUNG ĐỘT (ĐANG ÁP DỤNG LUẬT THẬN TRỌNG TỐI ĐA)
            </h4>
            <p className="font-body-md text-[12px] text-on-surface-variant">
              Hai mô hình dự báo không đồng nhất. Hệ thống tự động kích hoạt chế độ phòng ngừa an toàn cao nhất.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-auto border border-[#1c4a2d] bg-[#0f1a14] rounded-lg p-sm flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <div>
            <h4 className="font-label-caps text-[11px] text-primary uppercase font-bold mb-1">
              AI ĐỒNG THUẬN
            </h4>
            <p className="font-body-md text-[12px] text-on-surface-variant">
              Cả hai mô hình dự báo học máy đều đồng thuận về quyết định vận hành của hệ thống.
            </p>
          </div>
        </div>
        )}
        </>
      )}
    </div>
  );
}
