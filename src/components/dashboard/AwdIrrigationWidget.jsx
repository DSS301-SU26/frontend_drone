import { useApp } from "../../context/AppContext";
import { formatNumber } from "../../utils/helpers";

export default function AwdIrrigationWidget() {
  const { current } = useApp();

  const waterLevel = current?.weather?.water_level_cm ?? -12.0;
  const soilMoisture = current?.weather?.soil_moisture ?? 65.0;
  const awdThreshold = current?.decision_engine?.opt_flight_config?.awd_threshold_cm ?? -15.0;
  const awdRec = current?.decision_engine?.awd_recommendation ?? {
    action: "KEEP_DRYING",
    explanation: "Mực nước ngầm ở mức an toàn. Tiếp tục khô ruộng.",
  };

  const getTheme = () => {
    switch (awdRec.action) {
      case "START_PUMP":
        return {
          bgColor: "bg-[#1a110f]",
          borderColor: "border-[#4a241c]",
          textColor: "text-[#ff6b6b]",
          icon: "water_ph",
          title: "KÍCH HOẠT MÁY BƠM (START PUMP)",
        };
      case "DELAY_PUMP":
        return {
          bgColor: "bg-[#0f151a]",
          borderColor: "border-[#1c384a]",
          textColor: "text-[#6fb3ff]",
          icon: "schedule",
          title: "HOÃN BƠM CHỜ MƯA (DELAY PUMP)",
        };
      default:
        return {
          bgColor: "bg-[#0f1a14]",
          borderColor: "border-[#1c4a2d]",
          textColor: "text-[#4bddb7]",
          icon: "task_alt",
          title: "TIẾP TỤC KHÔ RUỘNG (KEEP DRYING)",
        };
    }
  };

  const theme = getTheme();

  // Map water level range [-25, 5] to [0%, 100%]
  const mapLevelToPercent = (val) => Math.min(100, Math.max(0, ((val + 25) / 30) * 100));
  const thresholdPercent = mapLevelToPercent(awdThreshold);
  const waterLevelPercent = mapLevelToPercent(waterLevel);

  return (
    <div className="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col gap-md">
      <div>
        <h2 className="font-label-caps text-primary text-label-caps uppercase tracking-wider mb-base">QUẢN LÝ NƯỚC AWD</h2>
        <h3 className="font-headline-sm text-headline-sm font-bold">Alternate Wetting & Drying</h3>
      </div>

      <div className="grid grid-cols-2 gap-sm">
        {/* Mực nước ngầm */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase text-center">Mực nước ngầm</span>
          <span className={`font-display-lg text-[22px] font-bold ${waterLevel < awdThreshold ? 'text-[#ff6b6b]' : 'text-[#6fb3ff]'}`}>
            {formatNumber(waterLevel)} <span className="text-xs font-normal text-on-surface-variant">cm</span>
          </span>
          <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-xs relative">
            {/* Safe threshold marker */}
            <div className="absolute top-0 w-0.5 h-full bg-[#ff6b6b]/60" style={{ left: `${thresholdPercent}%` }} title={`Ngưỡng an toàn ${awdThreshold}cm`}></div>
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ 
                width: `${waterLevelPercent}%`, 
                backgroundColor: waterLevel < awdThreshold ? '#ff6b6b' : '#6fb3ff' 
              }}
            ></div>
          </div>
          <span className="text-[9px] text-on-surface-variant mt-xs">Ngưỡng an toàn: {awdThreshold} cm</span>
        </div>

        {/* Độ ẩm đất */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase text-center">Độ ẩm đất</span>
          <span className="font-display-lg text-[22px] font-bold text-[#c9a0ff]">
            {formatNumber(soilMoisture)} <span className="text-xs font-normal text-on-surface-variant">%</span>
          </span>
          <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-xs">
            <div className="h-full rounded-full bg-[#c9a0ff]" style={{ width: `${soilMoisture}%` }}></div>
          </div>
          <span className="text-[9px] text-on-surface-variant mt-xs">Độ ẩm tối ưu: 60% - 80%</span>
        </div>
      </div>

      {/* AWD Recommendation Message Card */}
      <div className={`${theme.bgColor} border ${theme.borderColor} rounded-xl p-md flex flex-col gap-sm`}>
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-[18px]" style={{ color: theme.textColor.replace('text-', '') }}>
            {theme.icon}
          </span>
          <span className={`font-label-caps text-label-caps font-bold ${theme.textColor}`}>
            {theme.title}
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          {awdRec.explanation}
        </p>
      </div>
    </div>
  );
}
