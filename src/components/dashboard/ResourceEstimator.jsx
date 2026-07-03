import { useApp } from "../../context/AppContext";
import { formatNumber } from "../../utils/helpers";

export default function ResourceEstimator() {
  const { current, farmSize, setFarmSize } = useApp();

  const reg = current?.decision_engine?.resource_regressor || {};
  const totalLiters = reg.total_liters ?? 0;
  const flowRate = reg.flow_rate_l_ha ?? 0;
  const swathWidth = reg.swath_width_m ?? 0;
  const speedMps = reg.planned_speed_mps ?? 0;
  const sorties = reg.sorties ?? 0;
  const flightTime = reg.estimated_flight_time_min ?? 0;
  const totalTime = reg.estimated_total_time_min ?? 0;

  const { pesticide, cropStage } = useApp();
  const cropType = "Lúa (Rice)";

  const cropStageMap = {
    "SEEDLING": "Giai đoạn Mạ",
    "TILLERING": "Giai đoạn Đẻ nhánh",
    "BOOTING": "Làm đòng & Thụ phấn",
    "GRAIN_FILLING": "Chín (Vào gạo)"
  };
  const cropStageVn = cropStageMap[cropStage] || cropStage;

  return (
    <div className="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col gap-md">
      <div>
        <h2 className="font-label-caps text-primary text-label-caps uppercase tracking-wider mb-base">KẾ HOẠCH BAY & TÀI NGUYÊN</h2>
        <h3 className="font-headline-sm text-headline-sm font-bold">Flight Estimator</h3>
      </div>

      <div className="flex-1 bg-surface border border-outline-variant rounded-lg p-md mt-sm flex flex-col gap-sm">
        {/* Settings */}
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Quy mô cánh đồng</span>
          <div className="flex items-center gap-xs">
            <input
              type="text"
              value={farmSize}
              onChange={(e) => setFarmSize(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-16 bg-surface-container-lowest border border-outline-variant rounded px-sm py-xs text-right font-data-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <span className="font-body-md text-sm text-on-surface-variant">ha</span>
          </div>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Loại cây trồng</span>
          <span className="font-data-mono text-sm text-on-surface font-bold">{cropType}</span>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Giai đoạn sinh trưởng</span>
          <span className="font-data-mono text-sm text-on-surface font-bold">{cropStageVn}</span>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Loại thuốc sử dụng</span>
          <span className="font-data-mono text-sm text-on-surface font-bold">{pesticide}</span>
        </div>

        <div className="w-full h-px bg-outline-variant my-xs"></div>

        {/* Configurations */}
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Tốc độ bay đề xuất</span>
          <div className="flex items-center gap-xs">
            <span className="font-data-mono text-sm text-on-surface font-bold">{formatNumber(speedMps)}</span>
            <span className="font-body-md text-xs text-on-surface-variant">m/s</span>
          </div>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Độ rộng vệt quét</span>
          <div className="flex items-center gap-xs">
            <span className="font-data-mono text-sm text-on-surface font-bold">{formatNumber(swathWidth)}</span>
            <span className="font-body-md text-xs text-on-surface-variant">m</span>
          </div>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Lưu lượng xả</span>
          <div className="flex items-center gap-xs">
            <span className="font-data-mono text-sm text-on-surface font-bold">{formatNumber(flowRate)}</span>
            <span className="font-body-md text-xs text-on-surface-variant">L/ha</span>
          </div>
        </div>

        <div className="w-full h-px bg-outline-variant my-xs"></div>

        {/* Resources */}
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Tổng lượng dung dịch</span>
          <div className="flex items-center gap-xs">
            <span className="font-display-sm text-[18px] font-bold text-on-surface">{formatNumber(totalLiters)}</span>
            <span className="font-body-md text-xs text-on-surface-variant">Lít</span>
          </div>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Số chuyến cất cánh</span>
          <div className="flex items-center gap-xs">
            <span className="font-display-sm text-[18px] font-bold text-on-surface">{sorties}</span>
            <span className="font-body-md text-xs text-on-surface-variant">chuyến</span>
          </div>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-on-surface-variant">Thời gian xả thuốc</span>
          <div className="flex items-center gap-xs">
            <span className="font-data-mono text-[16px] font-bold text-on-surface">{formatNumber(flightTime)}</span>
            <span className="font-body-md text-xs text-on-surface-variant">phút</span>
          </div>
        </div>
        <div className="flex justify-between items-center py-xs">
          <span className="font-body-md text-sm text-primary font-bold">Tổng thời gian thực địa</span>
          <div className="flex items-center gap-xs">
            <span className="font-display-md text-[24px] font-bold text-primary">{formatNumber(totalTime)}</span>
            <span className="font-body-md text-xs text-on-surface-variant">phút</span>
          </div>
        </div>


        {current?.decision_engine?.opt_flight_config && (
          <>
            <div className="w-full h-px bg-outline-variant"></div>
            
            <div className="flex justify-between items-center">
              <span className="font-body-md text-sm text-on-surface-variant">Độ cao bay khuyến nghị</span>
              <span className="font-data-mono text-sm text-on-surface font-bold">
                {current.decision_engine.opt_flight_config.alt_min} - {current.decision_engine.opt_flight_config.alt_max} m
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-body-md text-sm text-on-surface-variant">Vận tốc bay khuyến nghị</span>
              <span className="font-data-mono text-sm text-on-surface font-bold">
                {current.decision_engine.opt_flight_config.speed_min} - {current.decision_engine.opt_flight_config.speed_max} m/s
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-body-md text-sm text-on-surface-variant">Công nghệ vòi phun đề xuất</span>
              <span className="font-data-mono text-sm text-on-surface font-bold">
                {current.decision_engine.opt_flight_config.nozzle_tech === "CENTRIFUGAL" ? "Ly tâm (Centrifugal)" : "Áp lực (Pressure)"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
