import WeatherTimeline from "./WeatherTimeline";
import SafetyConfig from "./SafetyConfig";
import RecommendationPanel from "./RecommendationPanel";
import AiModelComparison from "./AiModelComparison";
import ResourceEstimator from "./ResourceEstimator";
import AwdIrrigationWidget from "./AwdIrrigationWidget";

export default function MissionControl() {
  return (
    <div className="flex flex-col gap-lg pb-lg">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        <WeatherTimeline />
        <SafetyConfig />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        <RecommendationPanel />
        <AiModelComparison />
        <ResourceEstimator />
        <AwdIrrigationWidget />
      </div>
    </div>
  );
}
