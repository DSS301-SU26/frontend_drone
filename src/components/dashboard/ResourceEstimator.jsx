import { useApp } from "../../context/AppContext";
import { formatNumber } from "../../utils/helpers";

export default function ResourceEstimator() {
  const { current, farmSize, setFarmSize } = useApp();

  const totalLiters = current?.decision_engine?.resource_regressor?.total_liters ?? 150;
  const cropType = "Lúa (Rice)";
  const { pesticide } = useApp();
  const chemicalType = pesticide;

  return (
    <div className="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-surface-variant p-lg flex flex-col gap-md">
      <div>
        <h2 className="font-label-caps text-primary text-label-caps uppercase tracking-wider mb-base">ƯỚC TÍNH TÀI NGUYÊN</h2>
        <h3 className="font-headline-sm text-headline-sm font-bold">Estimator</h3>
      </div>

      <div className="flex-1 bg-surface border border-outline-variant rounded-lg p-md mt-sm flex flex-col gap-md">
        <div className="flex justify-between items-center">
          <span className="font-body-md text-sm text-on-surface-variant">Loại cây trồng</span>
          <span className="font-data-mono text-sm text-on-surface font-bold">{cropType}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-body-md text-sm text-on-surface-variant">Loại thuốc sử dụng</span>
          <span className="font-data-mono text-sm text-on-surface font-bold">{chemicalType}</span>
        </div>

        <div className="w-full h-px bg-outline-variant"></div>

        <div className="flex justify-between items-center">
          <span className="font-body-md text-sm text-on-surface-variant">Quy mô canh tác (hecta)</span>
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

        <div className="w-full h-px bg-outline-variant"></div>

        <div className="flex justify-between items-center">
          <span className="font-body-md text-sm text-on-surface-variant">Ước tính dung dịch</span>
          <div className="flex items-center gap-xs">
            <span className="font-display-lg text-[20px] font-bold text-on-surface">{formatNumber(totalLiters)}</span>
            <span className="font-body-md text-sm text-on-surface-variant">Lít</span>
          </div>
        </div>
      </div>
    </div>
  );
}
