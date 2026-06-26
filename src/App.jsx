import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  CloudRain,
  Droplets,
  Gauge,
  Grid2X2,
  History,
  House,
  LayoutDashboard,
  Lock,
  Map,
  MapPin,
  Menu,
  Navigation,
  Plane,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Route,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  ThermometerSun,
  TrendingDown,
  Upload,
  Wind,
  X,
  Zap,
  Eye,
} from "lucide-react";
import {
  extractAiTrainingFeatures,
  getAiTrainingStatus,
  getDashboardSlots,
  askChatbot,
  getDecisionConfig,
  getLocations,
  resetDecisionConfig,
  runPipeline,
  simulateAiTrainingImages,
  trainAiModel,
  updateDecisionConfig,
  overrideDecision,
} from "./api/dashboard";

const DroneScene3D = lazy(() => import("./components/DroneScene3D"));

const navItems = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "fields", label: "Điều kiện theo giờ", icon: Map },
  { id: "missions", label: "Lịch vận hành", icon: CalendarDays },
  { id: "rules", label: "Cấu hình quy tắc", icon: SlidersHorizontal },
  { id: "ai-training", label: "Huấn luyện AI", icon: Bot },
  { id: "analytics", label: "Phân tích & KPI", icon: Activity },
  { id: "history", label: "Nhật ký quyết định", icon: History },
];

const actionConfig = {
  TAKE_OFF: {
    title: "Có thể cất cánh",
    short: "Cất cánh",
    risk: "Thấp",
    tone: "healthy",
    description: "Điều kiện thời tiết nằm trong ngưỡng vận hành. UAV có thể thực hiện nhiệm vụ theo kế hoạch.",
  },
  DELAY_FLIGHT: {
    title: "Nên hoãn chuyến bay",
    short: "Hoãn bay",
    risk: "Trung bình",
    tone: "stress",
    description: "Nhiệt độ hoặc khả năng mưa đang tăng. Hệ thống khuyến nghị chờ khung giờ an toàn tiếp theo.",
  },
  LOCK_SPRAY: {
    title: "Khóa lệnh phun",
    short: "Khóa phun",
    risk: "Cao",
    tone: "dry",
    description: "Gió hoặc gió giật đã vượt ngưỡng an toàn. Khóa phun giúp tránh trôi dạt hóa chất và mất ổn định UAV.",
  },
  RETURN_TO_CHARGING: {
    title: "Đưa UAV về trạm sạc",
    short: "Về trạm sạc",
    risk: "Cao",
    tone: "dry",
    description: "Mưa hoặc thời tiết nguy hiểm đang hiện diện. UAV cần quay về trạm sạc để bảo vệ thiết bị.",
  },
};

const droneStateConfig = {
  DOCKED: { label: "Đang ở trạm", short: "Sẵn sàng tại Dock 01" },
  FLYING: { label: "Đang bay giám sát", short: "Telemetry đang truyền trực tiếp" },
  SPRAYING: { label: "Đang phun thuốc", short: "Vòi phun đang hoạt động" },
  RETURNING: { label: "Đang quay về trạm", short: "Đang điều hướng về Dock 01" },
};

const DAILY_SYNC_KEY = "agriflight:last-daily-sync";

const ruleFields = [
  { key: "max_wind_speed", label: "Gió tối đa", unit: "km/h", min: 1, max: 80, step: 0.5, icon: Wind },
  { key: "max_wind_gust", label: "Gió giật tối đa", unit: "km/h", min: 1, max: 120, step: 0.5, icon: Wind },
  { key: "max_rain_probability", label: "Ngưỡng hoãn bay", unit: "% mưa", min: 0, max: 100, step: 1, icon: CloudRain },
  { key: "return_to_charging_rain_probability", label: "Ngưỡng về trạm", unit: "% mưa", min: 0, max: 100, step: 1, icon: House },
  { key: "max_safe_temperature", label: "Nhiệt độ tối đa", unit: "°C", min: 0, max: 60, step: 0.5, icon: ThermometerSun },
  { key: "max_cloud_cover", label: "Mây tối đa", unit: "%", min: 0, max: 100, step: 1, icon: CloudRain },
  { key: "min_visibility", label: "Tầm nhìn tối thiểu", unit: "m", min: 0, max: 50000, step: 100, icon: Navigation },
];

const translateRiskLevel = (risk) => {
  if (risk === "LOW") return "Thấp";
  if (risk === "MEDIUM") return "Trung bình";
  if (risk === "HIGH") return "Cao";
  return risk || "Chưa rõ";
};

const localKpis = [
  { key: "risk_reduction", label: "Rủi ro vận hành giảm", value: 76.74, suffix: "%", note: "Tránh giông lốc & gió giật", tone: "healthy" },
  { key: "waste_reduction", label: "Lãng phí hóa chất giảm", value: 96.5, suffix: "%", note: "Khóa phun khi gió lớn", tone: "healthy" },
  { key: "evaluated_samples", label: "Mẫu dữ liệu kiểm chứng", value: 840, suffix: " mẫu", note: "240 giờ hoạt động thực tế", tone: "neutral" }
];

function getDecisionAction(slot) {
  const score = slot.decision_engine?.flyability_score ?? 0;
  const isSafe = slot.decision_engine?.is_safe_to_fly;
  
  if (isSafe || score > 0.80) {
    return "TAKE_OFF";
  }
  const rainProb = slot.weather?.precipitation_probability ?? 0;
  const rainAmt = slot.weather?.precipitation ?? 0;
  if (rainProb >= 50 || rainAmt > 0) {
    return "RETURN_TO_CHARGING";
  }
  if (score >= 0.50) {
    return "DELAY_FLIGHT";
  }
  return "LOCK_SPRAY";
}

function getRiskLevel(slot) {
  const score = slot.decision_engine?.flyability_score ?? 0;
  if (score > 0.80) return "LOW";
  if (score >= 0.50) return "MEDIUM";
  return "HIGH";
}

function App() {
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("Dong Thap");
  const [dashboard, setDashboard] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [activeNav, setActiveNav] = useState("overview");
  const [droneOpen, setDroneOpen] = useState(false);
  const [operationTimestamp, setOperationTimestamp] = useState("");
  const [droneState, setDroneState] = useState("DOCKED");
  const [sprayLocked, setSprayLocked] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [pipelineRun, setPipelineRun] = useState(null);
  const [decisionConfig, setDecisionConfig] = useState(null);
  const [ruleForm, setRuleForm] = useState({});
  const [aiTraining, setAiTraining] = useState(null);
  const [aiTrainingRun, setAiTrainingRun] = useState(null);
  const [aiTrainingBusyStep, setAiTrainingBusyStep] = useState("");
  const [aiTrainingRefreshing, setAiTrainingRefreshing] = useState(false);
  const dailySyncInFlightRef = useRef(false);

  const [farmSize, setFarmSize] = useState(10.0);
  const [distanceKm, setDistanceKm] = useState(1.0);
  const [slotViewMode, setSlotViewMode] = useState("timeline");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", text: "Chào bạn! Tôi là AI Assistant của AgriFlight DSS. Tôi có thể giải đáp các thắc mắc về lịch sử hoạt động và quyết định bay của hệ thống." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideDecisionValue, setOverrideDecisionValue] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = { sender: "user", text: chatInput };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await askChatbot(userMessage.text);
      const aiMessage = { sender: "ai", text: response.answer ?? "Tôi không nhận được phản hồi phù hợp." };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = { sender: "ai", text: `Đã xảy ra lỗi khi gửi tin nhắn: ${err.message}` };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadDashboard = useCallback(async (showToast = false, keepSelected = false) => {
    setSyncing(true);
    setError("");
    try {
      const payload = await getDashboardSlots(locationId, null, farmSize, distanceKm);
      setDashboard(payload);
      if (!keepSelected) {
        setSelectedSlot(0);
        setOperationTimestamp(payload.slots?.[0]?.timestamp || "");
      }
      setDroneOpen(false);
      setDroneState("DOCKED");
      setSprayLocked(false);
      const syncedAt = new Date();
      setLastSyncedAt(syncedAt.toISOString());
      if (showToast) notify("Đã đồng bộ dữ liệu mới nhất từ Agricultural Drone Scheduler.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSyncing(false);
    }
  }, [locationId, farmSize, distanceKm, notify]);

  const handleOverrideDecision = async (e) => {
    e?.preventDefault();
    if (!current?.id) {
      notify("Lỗi: Không tìm thấy ID cho bản ghi này.");
      return;
    }
    if (!overrideDecisionValue) {
      notify("Vui lòng chọn quyết định ghi đè.");
      return;
    }
    setSubmittingOverride(true);
    try {
      await overrideDecision(
        current.id,
        overrideDecisionValue,
        overrideNotes,
        farmSize,
        true,
        distanceKm
      );
      notify("Đã cập nhật ghi đè quyết định thành công.");
      setIsOverriding(false);
      setOverrideNotes("");
      await loadDashboard(false, true);
    } catch (err) {
      notify(`Ghi đè thất bại: ${err.message}`);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const handleRevertToAi = async () => {
    if (!current?.id) {
      notify("Lỗi: Không tìm thấy ID cho bản ghi này.");
      return;
    }
    setSubmittingOverride(true);
    try {
      const aiDecision = current.decision_engine?.champion_score > 0.80 ? "TAKE_OFF" : "DELAY_FLIGHT";
      await overrideDecision(
        current.id,
        aiDecision,
        "",
        farmSize,
        false,
        distanceKm
      );
      notify("Đã khôi phục quyết định đề xuất từ AI.");
      setIsOverriding(false);
      setOverrideNotes("");
      await loadDashboard(false, true);
    } catch (err) {
      notify(`Khôi phục thất bại: ${err.message}`);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const executePipelineRefresh = useCallback(async (showToast = true) => {
    setSyncing(true);
    setError("");
    try {
      if (showToast) notify("Hệ thống đang lấy, làm sạch và cập nhật dữ liệu thời tiết mới. Vui lòng chờ...");
      const pipelinePayload = await runPipeline({ days: 3 });
      setPipelineRun(pipelinePayload);
      window.localStorage.setItem(DAILY_SYNC_KEY, getLocalDateKey());
      await loadDashboard(false);
      if (showToast) notify("Dữ liệu mới đã sẵn sàng để tính khuyến nghị.");
    } catch (requestError) {
      setError(requestError.message);
      notify(`Cập nhật dữ liệu thất bại: ${requestError.message}`);
    } finally {
      setSyncing(false);
    }
  }, [loadDashboard, notify]);

  const loadAiTraining = useCallback(async (showToast = false) => {
    setAiTrainingRefreshing(true);
    try {
      const status = await getAiTrainingStatus(locationId);
      setAiTraining(status);
      if (showToast) notify(`Đã làm mới phần huấn luyện AI cho ${locationId}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAiTrainingRefreshing(false);
    }
  }, [locationId, notify]);

  const runAiTrainingStep = useCallback(async (step, runner, successMessage) => {
    setAiTrainingBusyStep(step);
    setError("");
    try {
      const payload = await runner(locationId);
      setAiTrainingRun(payload);
      setAiTraining(payload.ai_training);
      notify(successMessage);
    } catch (requestError) {
      setError(requestError.message);
      notify(`Bước huấn luyện AI thất bại: ${requestError.message}`);
    } finally {
      setAiTrainingBusyStep("");
    }
  }, [locationId, notify]);

  useEffect(() => {
    getLocations().then(setLocations).catch((requestError) => setError(requestError.message));
    getDecisionConfig()
      .then((config) => {
        setDecisionConfig(config);
        setRuleForm(config.thresholds ?? {});
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    loadAiTraining();
  }, [loadAiTraining]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (dashboard?.source?.updated_at) loadAiTraining();
  }, [dashboard?.source?.updated_at, loadAiTraining]);

  useEffect(() => {
    if (!dashboard?.decision_config?.thresholds) return;
    setDecisionConfig(dashboard.decision_config);
    setRuleForm(dashboard.decision_config.thresholds);
  }, [dashboard?.decision_config]);

  useEffect(() => {
    let midnightTimeout;

    const refreshIfNewDay = async () => {
      if (window.localStorage.getItem(DAILY_SYNC_KEY) !== getLocalDateKey()) {
        if (dailySyncInFlightRef.current) return;
        dailySyncInFlightRef.current = true;
        try {
          await executePipelineRefresh(false);
        } finally {
          dailySyncInFlightRef.current = false;
        }
      }
    };

    const scheduleMidnightSync = () => {
      midnightTimeout = window.setTimeout(() => {
        refreshIfNewDay();
        scheduleMidnightSync();
      }, getMsUntilNextLocalDay());
    };

    refreshIfNewDay();
    scheduleMidnightSync();
    const wakeupCheck = window.setInterval(refreshIfNewDay, 5 * 60 * 1000);

    return () => {
      window.clearTimeout(midnightTimeout);
      window.clearInterval(wakeupCheck);
    };
  }, [executePipelineRefresh]);

  const slots = useMemo(() => {
    return (dashboard?.slots ?? []).map((slot) => {
      const time = slot.timestamp?.includes("T") ? slot.timestamp.split("T")[1].substring(0, 5) : "";
      const hour = time ? Number(time.split(":")[0]) : 0;
      const end_time = time ? `${(hour + 1).toString().padStart(2, "0")}:00` : "";
      
      const decision_action = getDecisionAction(slot);
      const schedule_eligible = slot.decision_engine?.is_safe_to_fly ?? (decision_action === "TAKE_OFF");
      
      return {
        ...slot,
        time,
        end_time,
        temperature: slot.weather?.temperature,
        wind_speed: slot.weather?.wind_speed,
        wind_gust: slot.weather?.wind_gust,
        humidity: slot.weather?.humidity,
        rain_probability: slot.weather?.precipitation_probability,
        precipitation: slot.weather?.precipitation,
        cloud_cover: slot.weather?.cloud_cover,
        visibility: slot.weather?.visibility,
        weather_description: slot.weather?.weather_description,
        evapotranspiration: slot.weather?.evapotranspiration,
        soil_moisture: slot.weather?.soil_moisture,
        decision_action,
        schedule_eligible,
        risk_level: getRiskLevel(slot),
        recommendation_text: slot.decision_engine?.xai_alert,
      };
    });
  }, [dashboard]);

  const selectedRecommendedSlot = slots[selectedSlot] ?? slots[0] ?? {};
  const current = selectedRecommendedSlot;
  const action = actionConfig[current?.decision_action] ?? actionConfig.DELAY_FLIGHT;
  const canSchedule = Boolean(current?.schedule_eligible);

  const timelineTiles = useMemo(
    () => slots.map((tile) => ({
      ...tile,
      tone: actionConfig[tile.decision_action]?.tone ?? "stress",
      label: actionConfig[tile.decision_action]?.short ?? tile.decision_action,
    })),
    [slots],
  );

  const analytics = useMemo(() => buildDashboardAnalytics(dashboard), [dashboard]);
  const operationTile = timelineTiles.find((tile) => tile.timestamp === operationTimestamp) ?? current;
  const operationAction = actionConfig[operationTile?.decision_action] ?? actionConfig.DELAY_FLIGHT;
  const nextSafeSlot = timelineTiles.find((tile) => tile.schedule_eligible) ?? slots.find((tile) => tile.schedule_eligible);
  const isAirborne = droneState !== "DOCKED";
  const canControlFlight = droneState === "FLYING" || droneState === "SPRAYING";
  const weatherUnsafe = operationTile?.decision_action !== "TAKE_OFF";
  const isSpraying = droneState === "SPRAYING" && !sprayLocked;
  const countdown = formatCountdown(dashboard?.date || "", nextSafeSlot?.timestamp);
  const sceneWeather = getSceneWeather(operationTile);
  const sceneStatus = getSceneStatus({ droneState, nextSafeSlot, countdown, weatherUnsafe, sprayLocked });
  const pipelineStatus = syncing
    ? "Đang cập nhật dữ liệu thời tiết..."
    : pipelineRun
      ? "Dữ liệu mới đã sẵn sàng"
      : "Sẵn sàng cập nhật lại";

  const notificationItems = useMemo(
    () => buildRealNotifications({ dashboard, pipelineRun, syncing, lastSyncedAt }),
    [dashboard, pipelineRun, syncing, lastSyncedAt],
  );
  const notificationAlertCount = notificationItems.filter((item) => item.tone === "danger" || item.tone === "warning").length;

  const recentActivity = useMemo(() => {
    if (!dashboard || !current || !current.time) return [];
    return [
      { time: current.time, title: action.title, detail: `${dashboard.location}: ${translateWeatherDescription(current.weather_description)}`, tone: action.tone === "healthy" ? "success" : "warning" },
      { time: current.time, title: "Đã tính mức phun đề xuất", detail: `Mức đề xuất: ${current.decision_engine?.resource_regressor?.flow_rate_l_ha || 0} L/ha theo điều kiện hiện tại`, tone: "success" },
      { time: slots[0]?.time ?? "--:--", title: "Đã tìm khung giờ vận hành phù hợp", detail: slots[0] ? `${slots[0].time} - ${slots[0].end_time}, mức rủi ro ${translateRiskLevel(slots[0].risk_level).toLowerCase()}` : "Chưa có khung giờ phù hợp", tone: "success" },
    ];
  }, [action, current, dashboard, slots]);

  const targetSlot = selectedRecommendedSlot;

  if (!dashboard && error) {
    return <ErrorScreen error={error} retry={() => loadDashboard()} />;
  }

  if (!dashboard) {
    return <LoadingScreen />;
  }

  const scrollTo = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openMission = () => {
    if (!canSchedule) {
      notify("Chưa có khung giờ cất cánh an toàn. Hệ thống đã khóa thao tác lên lịch.");
      return;
    }
    setMissionOpen(true);
  };

  const selectSimulationTime = (tile) => {
    setOperationTimestamp(tile.timestamp);
    if (isAirborne && tile.decision_action !== "TAKE_OFF") {
      notify(`Cảnh báo: thời tiết lúc ${tile.time} chuyển xấu khi UAV đang hoạt động.`);
    }
  };

  const selectForecastTime = (slot) => {
    setOperationTimestamp(slot.timestamp);
    const recommendedIndex = slots.findIndex((recommendedSlot) => recommendedSlot.timestamp === slot.timestamp);
    if (recommendedIndex >= 0) setSelectedSlot(recommendedIndex);
    if (isAirborne && slot.decision_action !== "TAKE_OFF") {
      notify(`Cảnh báo: thời tiết lúc ${slot.time} chuyển xấu khi UAV đang hoạt động.`);
    }
  };

  const launchDrone = () => {
    if (!operationTile.schedule_eligible) {
      notify(`Không thể cất cánh lúc ${operationTile.time}: ${operationAction.title}.`);
      return;
    }
    setSprayLocked(false);
    setDroneState("FLYING");
    notify(`UAV-01 đã cất cánh theo dự báo lúc ${operationTile.time}.`);
  };

  const toggleSpraying = () => {
    if (droneState === "SPRAYING") {
      setDroneState("FLYING");
      notify("Đã dừng vòi phun. UAV tiếp tục bay giám sát.");
      return;
    }
    if (weatherUnsafe || sprayLocked) {
      notify("Không thể bật phun: điều kiện hiện tại không an toàn hoặc vòi phun đang bị khóa.");
      return;
    }
    setDroneState("SPRAYING");
    notify("Đã bật phun thuốc theo mức phun hệ thống đề xuất.");
  };

  const lockSpray = () => {
    setSprayLocked(true);
    if (droneState === "SPRAYING") setDroneState("FLYING");
    notify("Đã khóa vòi phun. UAV không tiếp tục phun thuốc.");
  };

  const returnToStation = () => {
    setSprayLocked(true);
    setDroneState("RETURNING");
    notify("UAV-01 đang quay về trạm Dock 01.");
  };

  const updateRuleField = (key, value) => {
    setRuleForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const buildRulePayload = () => ({
    thresholds: ruleFields.reduce((payload, field) => {
      payload[field.key] = Number(ruleForm[field.key]);
      return payload;
    }, {}),
    unsafe_weather_codes: decisionConfig?.unsafe_weather_codes ?? [],
  });

  const saveDecisionRules = async () => {
    setSavingRules(true);
    setError("");
    try {
      const updatedConfig = await updateDecisionConfig(buildRulePayload());
      setDecisionConfig(updatedConfig);
      setRuleForm(updatedConfig.thresholds ?? {});
      await loadDashboard(false);
      notify("Đã lưu cấu hình quy tắc và tính lại khuyến nghị.");
    } catch (requestError) {
      setError(requestError.message);
      notify(`Lưu quy tắc thất bại: ${requestError.message}`);
    } finally {
      setSavingRules(false);
    }
  };

  const resetDecisionRules = async () => {
    setSavingRules(true);
    setError("");
    try {
      const defaultConfig = await resetDecisionConfig();
      setDecisionConfig(defaultConfig);
      setRuleForm(defaultConfig.thresholds ?? {});
      await loadDashboard(false);
      notify("Đã đưa quy tắc về cấu hình mặc định.");
    } catch (requestError) {
      setError(requestError.message);
      notify(`Đưa quy tắc về mặc định thất bại: ${requestError.message}`);
    } finally {
      setSavingRules(false);
    }
  };

  const visibilityText = formatVisibility(targetSlot.visibility);
  const weatherDescription = translateWeatherDescription(targetSlot.weather_description);
  const precipitationText = targetSlot.precipitation > 0
    ? `Lượng mưa ${formatNumber(targetSlot.precipitation)} mm`
    : "Chưa ghi nhận mưa";
  const weatherMetrics = [
    { label: "Nhiệt độ", value: targetSlot.temperature, unit: "°C", icon: ThermometerSun, tone: "orange", note: weatherDescription },
    { label: "Tốc độ gió", value: targetSlot.wind_speed, unit: " km/h", icon: Wind, tone: "blue", note: `Gió giật ${formatNumber(targetSlot.wind_gust)} km/h` },
    { label: "Độ ẩm", value: targetSlot.humidity, unit: "%", icon: Droplets, tone: "cyan", note: `Mây ${formatNumber(targetSlot.cloud_cover)}% · Tầm nhìn ${visibilityText}` },
    { label: "Khả năng mưa", value: targetSlot.rain_probability, unit: "%", icon: CloudRain, tone: "purple", note: precipitationText },
    { label: "Bốc hơi nước", value: targetSlot.evapotranspiration != null ? formatNumber(targetSlot.evapotranspiration) : "--", unit: " ET₀", icon: Droplets, tone: "emerald", note: `Chỉ số bốc hơi nước vi khí hậu` },
    { label: "Độ ẩm đất", value: targetSlot.soil_moisture != null ? formatNumber(targetSlot.soil_moisture) : "--", unit: "%", icon: Gauge, tone: "lime", note: `Độ ẩm tầng đất 0-7cm` },
  ];
  const activeDecisionConfig = decisionConfig ?? dashboard.decision_config;
  const ruleSourceLabel = activeDecisionConfig?.source === "file" ? "Đang dùng cấu hình giao diện" : "Đang dùng cấu hình mặc định";
  const unsafeWeatherCodeCount = activeDecisionConfig?.unsafe_weather_codes?.length ?? 0;

  const activeAction = action;
  const activeRisk = translateRiskLevel(current?.risk_level ?? "LOW");

  return (
    <div className="min-h-screen bg-[#060b09] text-slate-200 font-sans pb-12 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Emergency Recall Modal */}
      <AnimatePresence>
        {current?.decision_action === "RETURN_TO_CHARGING" && droneState !== "DOCKED" && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-red-950/90 border border-red-500/40 p-6 rounded-2xl max-w-md w-full shadow-2xl text-center"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-900/50 border border-red-500/50 text-red-400 mb-4 animate-pulse">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-bold text-red-200 mb-2">THỜI TIẾT NGUY HIỂM KHẨN CẤP!</h3>
              <p className="text-sm text-red-300/80 mb-6 font-medium">
                Hệ thống khuyến nghị <strong>ĐƯA UAV VỀ TRẠM SẠC</strong>. Khả năng mưa lớn hoặc dông giật mạnh đang xuất hiện, đe dọa sự an toàn của thiết bị bay.
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                  onClick={returnToStation}
                >
                  <House size={16} /> KÍCH HOẠT GỌI UAV VỀ TRẠM
                </button>
                <button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 py-2 px-4 rounded-xl text-xs transition font-semibold"
                  onClick={() => setDroneOpen(false)}
                >
                  Bỏ qua cảnh báo (Tự chịu rủi ro)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#070d0b]/90 border-b border-[#142820]/60 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0d1c16] border border-emerald-950 px-3.5 py-1.5 rounded-xl">
            <div className="brand-symbol w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white"><Plane size={16} /></div>
            <div>
              <h1 className="font-bold text-sm text-emerald-500 tracking-tight">AgriFlight DSS</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hệ thống hỗ trợ quyết định</p>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Bảng giám sát quản lý hệ thống</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Mốc dự báo: <strong className="text-emerald-500">{formatDateTime(dashboard.source.reference_time)}</strong>
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#0b1713] border border-[#142d22] px-3.5 py-1.5 rounded-xl">
            <MapPin size={14} className="text-emerald-500" />
            <select 
              value={locationId} 
              onChange={(event) => setLocationId(event.target.value)}
              className="bg-transparent text-xs font-bold text-slate-100 border-none outline-none cursor-pointer pr-1 focus:ring-0"
            >
              {locations.map((loc) => <option value={loc.id} key={loc.id} className="bg-[#0b1713]">{loc.name}</option>)}
            </select>
          </div>
          
          <button 
            className="bg-[#0e211a] hover:bg-[#153127] border border-[#193c2f] text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            disabled={syncing}
            onClick={() => executePipelineRefresh(true)}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> 
            {syncing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu thời tiết"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-6 flex flex-col gap-6">
        
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-center gap-2 shadow-lg">
            <CircleAlert size={16} className="text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Main 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Left Content Area (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Row 1: Micro-climate & Timeline */}
            <section className="bg-[#0d1613]/80 backdrop-blur-md border border-[#142820]/40 p-6 rounded-2xl shadow-xl flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#142820]/30 pb-3">
                <div>
                  <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Thông tin vi khí hậu & Lịch trình</span>
                  <h3 className="text-lg font-bold text-slate-100 mt-0.5">Thời tiết từng khung giờ bay</h3>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-[#09100e] border border-[#142d22] p-0.5 rounded-xl shadow-inner">
                    <button
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        slotViewMode === "timeline"
                          ? "bg-emerald-600 text-white shadow-md font-extrabold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#12241b]/30"
                      }`}
                      onClick={() => setSlotViewMode("timeline")}
                    >
                      Dòng thời gian
                    </button>
                    <button
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        slotViewMode === "grid"
                          ? "bg-emerald-600 text-white shadow-md font-extrabold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#12241b]/30"
                      }`}
                      onClick={() => setSlotViewMode("grid")}
                    >
                      Bảng tổng quan cả ngày
                    </button>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-[#08110e] px-2.5 py-1.5 rounded-xl border border-[#142d22]/50">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Đồng bộ: {formatDateTime(dashboard.source.updated_at)}
                  </span>
                </div>
              </div>

              {slotViewMode === "timeline" ? (
                /* Timeline slots scrollable row */
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent">
                  {slots.map((slot, index) => {
                    const isSelected = selectedSlot === index;
                    return (
                      <button 
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-left transition flex flex-col gap-1 w-32 ${
                          isSelected 
                            ? "bg-emerald-600 border-emerald-500 text-white font-bold shadow-lg" 
                            : slot.schedule_eligible
                            ? "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700"
                            : "bg-red-950/10 border-red-500/15 text-slate-400 opacity-60 hover:opacity-80"
                        }`}
                        onClick={() => setSelectedSlot(index)} 
                        key={slot.timestamp}
                      >
                        <span className="text-xs font-bold font-mono">{slot.time}</span>
                        <div className="flex justify-between items-center mt-1 text-xs opacity-90">
                          <span>{slot.temperature}°C</span>
                          <span>{slot.flyability_score}đ</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Beautiful Daily Overview Grid Table */
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-[#142820]/30 rounded-xl scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/70 text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0 backdrop-blur-md border-b border-[#142820]/40 z-10">
                        <th className="py-3.5 px-4">Khung giờ</th>
                        <th className="py-3.5 px-4">Khả năng bay</th>
                        <th className="py-3.5 px-4">AI Khuyến nghị</th>
                        <th className="py-3.5 px-4 text-center">Nhiệt độ</th>
                        <th className="py-3.5 px-4 text-center">Xác suất mưa</th>
                        <th className="py-3.5 px-4 text-center">Gió / Gió giật</th>
                        <th className="py-3.5 px-4 text-center">Độ ẩm</th>
                        <th className="py-3.5 px-4 text-center">AI Đồng thuận</th>
                        <th className="py-3.5 px-4 text-center">Chu kỳ pin</th>
                        <th className="py-3.5 px-4 text-center">Quyết định QTV</th>
                        <th className="py-3.5 px-4 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#142820]/15">
                      {slots.map((slot, index) => {
                        const isSelected = selectedSlot === index;
                        const scorePercent = slot.decision_engine?.flyability_score != null 
                          ? Math.round(slot.decision_engine.flyability_score * 100) 
                          : Math.round(slot.flyability_score ?? 0);
                        
                        let progressBarColor = "bg-red-500";
                        let scoreTextColor = "text-red-400";
                        if (scorePercent > 80) {
                          progressBarColor = "bg-emerald-500";
                          scoreTextColor = "text-emerald-400";
                        } else if (scorePercent >= 50) {
                          progressBarColor = "bg-amber-500";
                          scoreTextColor = "text-amber-400";
                        }
                        
                        const aiAction = slot.decision_action;
                        const actionCfg = actionConfig[aiAction] ?? actionConfig.DELAY_FLIGHT;
                        
                        let badgeColor = "bg-red-950/20 text-red-400 border-red-500/20";
                        if (aiAction === "TAKE_OFF") {
                          badgeColor = "bg-emerald-950/25 text-emerald-400 border-emerald-500/20";
                        } else if (aiAction === "DELAY_FLIGHT") {
                          badgeColor = "bg-amber-950/20 text-amber-400 border-amber-500/20";
                        }
                        
                        return (
                          <tr 
                            key={slot.timestamp}
                            className={`transition-all duration-150 border-l-2 cursor-pointer ${
                              isSelected 
                                ? "bg-[#10241d]/40 border-l-emerald-500 hover:bg-[#10241d]/50" 
                                : "bg-transparent border-l-transparent hover:bg-slate-900/30"
                            }`}
                            onClick={() => setSelectedSlot(index)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                                <span className={`text-xs font-bold font-mono ${isSelected ? "text-emerald-400" : "text-slate-200"}`}>
                                  {slot.time} - {slot.end_time}
                                </span>
                              </div>
                            </td>
                            
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 min-w-[90px]">
                                <div className="w-14 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`${progressBarColor} h-full rounded-full transition-all duration-500`}
                                    style={{ width: `${scorePercent}%` }}
                                  ></div>
                                </div>
                                <span className={`text-xs font-bold font-mono ${scoreTextColor}`}>{scorePercent}%</span>
                              </div>
                            </td>
                            
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                                {actionCfg.short}
                              </span>
                            </td>
                            
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-bold font-mono text-slate-300">
                                {slot.temperature}°C
                              </span>
                            </td>
                            
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-bold font-mono text-blue-400">
                                {slot.rain_probability}%
                              </span>
                              {slot.precipitation > 0 && (
                                <span className="text-[10px] text-blue-500 ml-1">({slot.precipitation}mm)</span>
                              )}
                            </td>
                            
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-bold font-mono text-slate-300">
                                {Math.round(slot.wind_speed)}
                              </span>
                              <span className="text-[10px] text-slate-500 mx-0.5">/</span>
                              <span className="text-xs font-bold font-mono text-amber-500" title="Gió giật">
                                {Math.round(slot.wind_gust)}
                              </span>
                              <span className="text-[9px] text-slate-500 ml-1">km/h</span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-bold font-mono text-slate-400">
                                {slot.humidity}%
                              </span>
                            </td>
                            
                            <td className="py-3 px-4 text-center">
                              {slot.decision_engine?.was_conflict ? (
                                <span className="px-1.5 py-0.5 bg-amber-950/20 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold">
                                  Xung đột
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold">
                                  Đồng thuận
                                </span>
                              )}
                            </td>
                            
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-bold font-mono text-slate-300">
                                {slot.decision_engine?.resource_regressor?.battery_cycles_needed ?? 0}
                              </span>
                            </td>
                            
                            <td className="py-3 px-4 text-center">
                              {slot.was_human_overridden ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-950/30 text-indigo-400 border border-indigo-500/25 rounded text-[9px] font-bold">
                                  <ShieldCheck size={10} className="text-indigo-400" />
                                  Ghi đè
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                            </td>
                            
                            <td className="py-3 px-4 text-right">
                              <button
                                className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ml-auto ${
                                  isSelected
                                    ? "bg-emerald-600 border-emerald-500 text-white"
                                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSlot(index);
                                }}
                              >
                                <Eye size={12} />
                                <span>Xem</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Consolidated Weather Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2">
                {weatherMetrics.map(({ label, value, unit, icon: Icon, tone, note }) => {
                  const toneColors = {
                    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    lime: "bg-lime-500/10 text-lime-400 border-lime-500/20"
                  };
                  return (
                    <div className={`p-4 rounded-xl border ${toneColors[tone] ?? "bg-slate-900 border-slate-800"}`} key={label}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} />
                        <span className="text-xs font-semibold uppercase text-slate-400">{label}</span>
                      </div>
                      <div className="text-2xl font-black text-slate-100">{value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span></div>
                      <div className="text-xs text-slate-400 mt-1 truncate" title={note}>{note}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Row 2: AI Decision Engine & Resource Estimator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Decision Output & XAI Banner */}
              <div className="flex flex-col gap-4">
                <section className="bg-[#0d1613]/80 backdrop-blur-md border border-[#142820]/40 p-6 rounded-2xl shadow-xl flex-1 flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex justify-between items-center border-b border-[#142820]/30 pb-3 mb-4">
                      <div>
                        <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Trạng thái Khuyến nghị</span>
                        <h3 className="text-base font-bold text-slate-100 mt-0.5">Decision Engine Output</h3>
                      </div>
                      <span className="text-xs text-slate-400 bg-[#0e1c16] px-2.5 py-1 rounded-lg border border-[#173327] font-semibold">
                        v2.0
                      </span>
                    </div>

                    {/* Giant Recommendation Card */}
                    <div className={`border p-5 rounded-xl relative overflow-hidden shadow-lg transition duration-300 ${
                      current?.was_human_overridden
                        ? "bg-indigo-950/25 border-indigo-500/40 text-indigo-100"
                        : current?.decision_engine?.is_safe_to_fly
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-100"
                        : (current?.decision_engine?.flyability_score ?? 0) >= 0.50
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-100"
                        : "bg-red-950/20 border-red-500/30 text-red-100"
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full flex items-center justify-center border animate-pulse ${
                            current?.was_human_overridden
                              ? "bg-indigo-500 border-indigo-300"
                              : current?.decision_engine?.is_safe_to_fly
                              ? "bg-emerald-500 border-emerald-300"
                              : (current?.decision_engine?.flyability_score ?? 0) >= 0.50
                              ? "bg-amber-500 border-amber-300"
                              : "bg-red-500 border-red-300"
                          }`}></span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {current?.was_human_overridden 
                              ? "Quyết định ghi đè bởi Quản trị viên" 
                              : "Khuyến nghị tự động từ hệ thống"}
                          </span>
                        </div>
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          current?.was_human_overridden
                            ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-400"
                            : current?.decision_engine?.is_safe_to_fly
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                            : (current?.decision_engine?.flyability_score ?? 0) >= 0.50
                            ? "bg-amber-950/40 border-amber-500/40 text-amber-400"
                            : "bg-red-950/40 border-red-500/40 text-red-400"
                        }`}>
                          Rủi ro: {activeRisk}
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between items-center gap-3">
                        <div>
                          <h4 className="text-lg font-bold tracking-tight mb-1">{action.title}</h4>
                          <p className="text-xs text-slate-300 leading-normal">
                            {action.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-center bg-black/40 border border-slate-800 rounded-xl px-3 py-2 min-w-[100px]">
                          <small className="text-xs text-slate-400 font-bold uppercase block">Định mức phun</small>
                          <strong className="text-lg font-black text-emerald-400 font-mono">
                            {formatNumber(current?.decision_engine?.resource_regressor?.flow_rate_l_ha ?? 0)}
                          </strong>
                          <span className="text-xs text-slate-400 block font-semibold">L/ha</span>
                        </div>
                      </div>

                      {/* Flyability Score Progress Bar */}
                      <div className="mt-4 p-3 bg-black/35 border border-slate-800/40 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Khả năng cất cánh (AI Flyability Score)</span>
                          <span className={`font-mono font-black text-sm ${
                            (current?.decision_engine?.flyability_score ?? 0) > 0.80
                              ? "text-emerald-400"
                              : (current?.decision_engine?.flyability_score ?? 0) >= 0.50
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}>
                            {formatNumber((current?.decision_engine?.flyability_score ?? 0) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${
                              (current?.decision_engine?.flyability_score ?? 0) > 0.80
                                ? "bg-emerald-500"
                                : (current?.decision_engine?.flyability_score ?? 0) >= 0.50
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${(current?.decision_engine?.flyability_score ?? 0) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Take Off Button or Warning XAI Alert */}
                      <div className="mt-3.5">
                        {current?.decision_engine?.is_safe_to_fly ? (
                          <button
                            onClick={launchDrone}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 text-xs tracking-wide"
                          >
                            <Plane size={14} /> KÍCH HOẠT CẤT CÁNH (TAKE OFF)
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button
                              disabled
                              className="w-full bg-slate-900/50 border border-slate-800 text-slate-500 font-bold py-2 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                            >
                              <Lock size={13} /> CẤT CÁNH BỊ KHÓA (SAFETY LOCK)
                            </button>
                            <p className="text-[11px] text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg leading-relaxed font-mono flex items-start gap-1.5">
                              <CircleAlert size={14} className="flex-shrink-0 text-red-400 mt-0.5" />
                              <span>{current?.decision_engine?.xai_alert}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {current?.was_human_overridden && (
                        <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-lg text-xs flex flex-col gap-1">
                          <span className="font-bold text-indigo-450 uppercase tracking-wider text-[10px]">
                            Lý do ghi đè của Quản trị viên:
                          </span>
                          <p className="italic text-slate-300 leading-relaxed font-sans font-medium">
                            "{current.user_notes || "Không ghi chú lý do."}"
                          </p>
                        </div>
                      )}

                      {!isOverriding && (
                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800/30 pt-3">
                          {current?.was_human_overridden ? (
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => {
                                  setOverrideDecisionValue(current?.decision_action);
                                  setOverrideNotes(current?.user_notes || "");
                                  setIsOverriding(true);
                                }}
                                className="flex-1 bg-indigo-600/30 hover:bg-indigo-600/45 active:bg-indigo-700/50 border border-indigo-500/35 text-indigo-200 text-xs font-bold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                              >
                                <SlidersHorizontal size={14} /> Sửa quyết định
                              </button>
                              <button
                                onClick={handleRevertToAi}
                                disabled={submittingOverride}
                                className="flex-1 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <RotateCcw size={14} className={submittingOverride ? "animate-spin" : ""} /> Khôi phục AI
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setOverrideDecisionValue(current?.decision_action || "TAKE_OFF");
                                setOverrideNotes("");
                                setIsOverriding(true);
                              }}
                              className="w-full bg-slate-850 hover:bg-slate-800 active:bg-slate-900 border border-slate-750 text-slate-200 text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <ShieldAlert size={14} className="text-amber-500" /> Cưỡng ép / Ghi đè quyết định bay
                            </button>
                          )}
                        </div>
                      )}

                      {isOverriding && (
                        <motion.form
                          onSubmit={handleOverrideDecision}
                          className="mt-4 p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-3 relative shadow-inner"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldAlert size={14} className="text-indigo-400" /> Cấu hình ghi đè quyết định
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsOverriding(false)}
                              className="text-slate-400 hover:text-slate-200 p-0.5 rounded-lg hover:bg-slate-800 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn quyết định cưỡng ép</label>
                            <select
                              value={overrideDecisionValue}
                              onChange={(e) => setOverrideDecisionValue(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            >
                              <option value="TAKE_OFF">TAKE_OFF (Cho phép cất cánh)</option>
                              <option value="DELAY_FLIGHT">DELAY_FLIGHT (Hoãn chuyến bay)</option>
                              <option value="LOCK_SPRAY">LOCK_SPRAY (Khóa phun thuốc)</option>
                              <option value="RETURN_TO_CHARGING">RETURN_TO_CHARGING (UAV về trạm sạc)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lý do ghi đè (bắt buộc)</label>
                            <textarea
                              rows={2}
                              value={overrideNotes}
                              onChange={(e) => setOverrideNotes(e.target.value)}
                              placeholder="Ví dụ: Quan sát thấy gió lặng thực tế, độ ẩm đất phù hợp cất cánh..."
                              required
                              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
                            />
                          </div>

                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => setIsOverriding(false)}
                              className="flex-1 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-850 text-slate-400 text-xs font-bold py-2 rounded-lg transition-all"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              disabled={submittingOverride || !overrideNotes.trim()}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submittingOverride ? (
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              Lưu Ghi Đè
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </div>

                    {/* XAI Alert Banner */}
                    {!current?.decision_engine?.is_safe_to_fly && current?.decision_engine?.xai_alert && (
                      <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 ${
                        (current?.decision_engine?.flyability_score ?? 0) < 0.50 
                          ? "bg-red-950/30 border-red-500/30 text-red-200" 
                          : "bg-amber-950/30 border-amber-500/30 text-amber-200"
                      }`}>
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                          (current?.decision_engine?.flyability_score ?? 0) < 0.50 ? "bg-red-900/40 text-red-400" : "bg-amber-900/40 text-amber-400"
                        }`}>
                          <CircleAlert size={16} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Giải thích Quyết định AI (XAI Banner)
                          </span>
                          <p className="text-xs font-medium leading-relaxed font-mono">
                            {current?.decision_engine?.xai_alert}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Dual-ML & Resource Estimations */}
              <div className="flex flex-col gap-4">
                
                {/* Dual-ML Model Comparison (Champion vs Challenger) */}
                <section className="bg-[#0d1613]/80 backdrop-blur-md border border-[#142820]/40 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[#142820]/30 pb-3">
                    <div>
                      <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">So sánh Mô hình AI</span>
                      <h3 className="text-base font-bold text-slate-100 mt-0.5">Dual-ML AI Prediction</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Champion Model */}
                    <div className="p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400">Champion: Random Forest</span>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-200">
                          Khả năng bay
                        </span>
                        <span className="text-xs font-extrabold text-emerald-400 font-mono">
                          {current?.decision_engine?.champion_score != null ? Math.round(current.decision_engine.champion_score * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${current?.decision_engine?.champion_score != null ? Math.round(current.decision_engine.champion_score * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Challenger Model */}
                    <div className="p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400">Challenger: XGBoost</span>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-200">
                          Khả năng bay
                        </span>
                        <span className="text-xs font-extrabold text-blue-400 font-mono">
                          {current?.decision_engine?.challenger_score != null ? Math.round(current.decision_engine.challenger_score * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${current?.decision_engine?.challenger_score != null ? Math.round(current.decision_engine.challenger_score * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Consensus / Conflict Alert */}
                  {current?.decision_engine?.was_conflict ? (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-2 text-amber-200">
                      <CircleAlert size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">AI Xung Đột (Đang áp dụng luật Thận trọng tối đa)</span>
                        <p className="text-xs font-medium text-slate-300">
                          Hai mô hình dự báo không đồng nhất. Hệ thống tự động kích hoạt chế độ phòng ngừa an toàn cao nhất.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-950/25 border border-emerald-500/20 rounded-xl flex items-start gap-2 text-emerald-300">
                      <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">AI Đồng Thuận</span>
                        <p className="text-xs font-medium text-slate-300">
                          Cả hai mô hình dự báo học máy đều đồng thuận về quyết định vận hành của hệ thống.
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Resource Regressor Panel */}
                <section className="bg-[#0d1613]/80 backdrop-blur-md border border-[#142820]/40 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[#142820]/30 pb-3">
                    <div>
                      <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Ước tính tài nguyên</span>
                      <h3 className="text-base font-bold text-slate-100 mt-0.5">DJI Agras T30 Estimator</h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Quy mô canh tác (hecta)</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="1" 
                          max="100" 
                          step="0.5"
                          value={farmSize}
                          onChange={(e) => setFarmSize(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-16 bg-slate-900 border border-slate-800 text-slate-100 font-bold font-mono text-center rounded py-0.5 focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-slate-400">ha</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="0.5"
                      value={farmSize}
                      onChange={(e) => setFarmSize(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Travel Distance Input & Slider */}
                  <div className="flex flex-col gap-2 border-t border-[#142820]/15 pt-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Khoảng cách đến ruộng (km)</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="0.1" 
                          max="15.0" 
                          step="0.1"
                          value={distanceKm}
                          onChange={(e) => setDistanceKm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                          className="w-16 bg-slate-900 border border-slate-800 text-slate-100 font-bold font-mono text-center rounded py-0.5 focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-slate-400">km</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="15.0"
                      step="0.1"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-[#142820]/20 pt-3">
                    <div className="bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-xs text-slate-500 font-bold uppercase block">Định mức phun</span>
                      <strong className="text-base font-extrabold text-slate-200 font-mono">
                        {formatNumber(current?.decision_engine?.resource_regressor?.flow_rate_l_ha ?? 0)}
                      </strong>
                      <span className="text-xs text-slate-400 ml-1">L/ha</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-xs text-slate-500 font-bold uppercase block">Tổng hóa chất</span>
                      <strong className="text-base font-extrabold text-emerald-400 font-mono">
                        {formatNumber(current?.decision_engine?.resource_regressor?.total_liters ?? 0)}
                      </strong>
                      <span className="text-xs text-slate-400 ml-1">Lít</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-xs text-slate-500 font-bold uppercase block">Số chuyến bay (Sorties)</span>
                      <strong className="text-base font-extrabold text-slate-200 font-mono">
                        {current?.decision_engine?.resource_regressor?.sorties ?? 0}
                      </strong>
                      <span className="text-xs text-slate-400 ml-1">chuyến</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-xs text-slate-500 font-bold uppercase block">Chu kỳ pin</span>
                      <strong className="text-base font-extrabold text-slate-200 font-mono">
                        {current?.decision_engine?.resource_regressor?.battery_cycles_needed ?? 0}
                      </strong>
                      <span className="text-xs text-slate-400 ml-1">chu kỳ</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg col-span-2 flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase text-[10px]">Khoảng cách phản hồi (API)</span>
                      <div className="flex items-baseline">
                        <strong className="text-sm font-black text-slate-200 font-mono">
                          {formatNumber(current?.decision_engine?.resource_regressor?.distance_to_field_km ?? 0)}
                        </strong>
                        <span className="text-xs text-slate-400 ml-1 font-bold">km</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

            </div>

            {/* Row 3: Simulated KPIs (Executive Output) */}
            <section className="bg-[#0d1613]/80 backdrop-blur-md border border-[#142820]/40 p-6 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Gauge size={16} className="text-emerald-500" /> KPI mô phỏng của bộ khuyến nghị vận hành
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {localKpis.map((kpi) => (
                  <article className="bg-[#0b1210]/95 border border-[#142820]/40 p-4 rounded-xl flex flex-col justify-between" key={kpi.key}>
                    <div>
                      <span className="text-slate-400 text-xs font-medium">{kpi.label}</span>
                      <div className="text-3xl font-black text-slate-100 mt-2 tracking-tight">{kpi.value}{kpi.suffix}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-900/60 flex justify-between items-center">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Check size={13} className="text-emerald-500" /> {kpi.note}</span>
                      <div className="w-16 h-8 opacity-75">
                        <MiniBars tone={kpi.tone} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5"><CircleAlert size={14} /> {dashboard.backtesting_note ?? "Hệ thống tự động lưu trữ và đánh giá hiệu năng dựa trên dữ liệu lịch sử bay."}</p>
            </section>
          </div>

          {/* Right Sidebar: Permanent "What-If" Simulator */}
          <aside className="lg:col-span-1 bg-[#0d1613]/80 backdrop-blur-md border border-[#142820]/40 p-6 rounded-2xl shadow-xl flex flex-col justify-between h-fit gap-6">
            <div>
              <div className="flex justify-between items-center border-b border-[#142820]/30 pb-3 mb-5">
                <div>
                  <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Cấu hình an toàn DSS</span>
                  <h3 className="text-lg font-bold text-slate-100 mt-0.5">Mô phỏng & Cấu hình an toàn</h3>
                </div>
                <span className="text-xs text-slate-400 bg-[#0e1c16] px-2.5 py-1 rounded-lg border border-[#173327]">
                  {ruleSourceLabel}
                </span>
              </div>

              {/* Slider list */}
              <div className="flex flex-col gap-4">
                {ruleFields.map(({ key, label, unit, min, max, step, icon: Icon }) => (
                  <div className="flex flex-col gap-1.5" key={key}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Icon size={14} className="text-emerald-500/70" />
                        {label}
                      </span>
                      <span className="text-slate-100 font-bold font-mono">
                        {ruleForm[key] ?? ""} <span className="text-slate-400 font-normal">{unit}</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={ruleForm[key] ?? ""}
                      onChange={(event) => updateRuleField(key, event.target.value)}
                      className="w-full accent-emerald-500 bg-slate-950 h-1 rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#142820]/30 mt-2">
              <button 
                className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                disabled={savingRules} 
                onClick={resetDecisionRules}
              >
                <RotateCcw size={13} /> Về mặc định
              </button>
              <button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                disabled={savingRules} 
                onClick={saveDecisionRules}
              >
                <Save size={13} /> {savingRules ? "Đang lưu..." : "Lưu & Tính lại"}
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Scheduler Mission Modal */}
      <AnimatePresence>
        {missionOpen && canSchedule && (
          <MissionModal
            slot={selectedRecommendedSlot}
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={(index) => setSelectedSlot(index)}
            location={dashboard.location}
            onClose={() => setMissionOpen(false)}
            onConfirm={() => { setMissionOpen(false); notify(`Đã tạo lịch vận hành UAV lúc ${selectedRecommendedSlot.time}.`); }}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            className="fixed bottom-6 left-6 z-50 bg-[#162521] border border-emerald-500/30 text-emerald-300 font-semibold text-xs py-3 px-4 rounded-xl shadow-2xl flex items-center gap-2"
            initial={{ opacity: 0, y: 18 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 12 }}
          >
            <Check size={14} className="text-emerald-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Chatbot Toggle Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center border border-emerald-400/30"
      >
        {chatOpen ? <X size={20} /> : <Bot size={20} />}
      </button>

      {/* Floating Chat Box Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-32px)] bg-[#0d1613]/95 border border-[#142820]/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px] backdrop-blur-md"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
          >
            {/* Chat Header */}
            <div className="bg-[#0b1713] px-4 py-3 border-b border-[#142d22] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Hỏi đáp Lịch sử Bay</h4>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Trực tuyến
                  </span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-200 transition">
                <X size={16} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent">
              {chatHistory.map((msg, index) => {
                const isAi = msg.sender === "ai";
                return (
                  <div key={index} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      isAi 
                        ? "bg-slate-900/60 border border-slate-800/80 text-slate-200" 
                        : "bg-emerald-600 text-white font-medium"
                    }`}>
                      {isAi ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} 
                          className="prose prose-invert max-w-none text-xs"
                        />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                );
              })}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]"></span>
                    <span>AI đang phân tích...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-[#0b1713] border-t border-[#142d22] flex gap-2">
              <input 
                type="text" 
                placeholder="Hỏi về lịch sử bay, lý do cấm..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
                className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center"
              >
                Gửi
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelHeading({ eyebrow, title, action }) {
  return <div className="panel-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

function AiTrainingLab({ status, location, latestRun, busyStep, refreshing, onRefresh, onSimulateImages, onExtractFeatures, onTrainModel }) {
  const categories = Object.entries(status?.image_categories ?? {});
  const metrics = status?.metrics ?? [];
  const bestModel = status?.model?.best_model ?? "--";
  const maxMacroF1 = Math.max(...metrics.map((metric) => Number(metric.macro_f1) || 0), 1);
  const summary = status?.training_summary ?? {};
  const evaluation = status?.model_evaluation ?? {};
  const bestMetric = metrics[0];
  const testClassDistribution = Object.entries(evaluation.test_class_distribution ?? {})
    .sort((left, right) => Number(right[1]) - Number(left[1]));
  const running = Boolean(busyStep) || refreshing;
  const actionSteps = [
    {
      id: "simulate",
      icon: Grid2X2,
      title: "Ghép ảnh theo thời tiết",
      detail: "Chọn lại bộ ảnh phù hợp với dữ liệu thời tiết của địa điểm đang theo dõi.",
      action: onSimulateImages,
    },
    {
      id: "extract",
      icon: Sparkles,
      title: "Đọc đặc điểm ảnh",
      detail: "Phân tích màu sắc, mây, mưa và ánh sáng trong ảnh để làm dữ liệu học.",
      action: onExtractFeatures,
    },
    {
      id: "train",
      icon: Bot,
      title: "Học lại cách ra khuyến nghị",
      detail: "Kết hợp thời tiết và đặc điểm ảnh để cập nhật cách hệ thống so sánh quyết định.",
      action: onTrainModel,
    },
  ];

  return (
    <section className="panel ai-training-panel" id="ai-training">
      <PanelHeading
        eyebrow="Ảnh và thời tiết"
        title={`Khu huấn luyện AI · ${location?.name ?? "Đang tải"}`}
        action={<button className="outline-btn" disabled={running} onClick={onRefresh}><RefreshCw className={running ? "spin" : ""} size={15} /> {refreshing ? "Đang làm mới" : "Làm mới"}</button>}
      />
      <div className="ai-lab-grid">
        <div className="ai-lab-summary">
          <div className="ai-lab-intro">
            <span><Bot size={16} /> Mô hình hỗ trợ quyết định</span>
            <p>Dữ liệu đang lọc theo địa điểm đã chọn. Hệ thống lấy từng khung giờ dự báo của khu vực này, ghép ảnh thời tiết tương ứng, đọc đặc điểm ảnh và dùng chúng để kiểm tra cách ra khuyến nghị.</p>
          </div>
          <div className="ai-lab-kpis">
            <span><b>{status?.generated_image_count ?? 0}</b><small>ảnh của địa điểm</small></span>
            <span><b>{status?.image_features?.image_feature_columns ?? 0}</b><small>chỉ số/ảnh</small></span>
            <span><b>{status?.training_dataset?.rows ?? 0}</b><small>mẫu học</small></span>
            <span><b>{formatModelName(bestModel)}</b><small>cách tính tốt nhất</small></span>
          </div>
          <div className="ai-category-list">
            {categories.length ? categories.map(([name, count]) => (
              <span key={name}><i />{name}<b>{count}</b></span>
            )) : <small>Chưa đọc được thư mục ảnh nguồn.</small>}
          </div>
        </div>

        <div className="ai-step-list">
          {actionSteps.map(({ id, icon: Icon, title, detail, action }) => (
            <button className={`ai-step ${busyStep === id ? "running" : ""}`} disabled={running} onClick={action} key={id}>
              <span><Icon size={16} /></span>
              <b>{busyStep === id ? "Đang chạy..." : title}</b>
              <small>{detail}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="ai-lab-lower">
        <div className="ai-model-metrics">
          <div className="ai-subheading"><span>So sánh cách dự đoán · {status?.location ?? location?.name ?? "--"}</span><b>{metrics.length} cách tính</b></div>
          {metrics.length ? (
            <>
              <AiModelComparisonCharts metrics={metrics} bestModel={bestModel} />
              {metrics.map((metric) => {
                const width = `${Math.max((Number(metric.macro_f1) || 0) / maxMacroF1 * 100, 4)}%`;
                const testRows = Number(metric.test_rows) || Number(evaluation.test_rows) || 0;
                return (
                  <div className="ai-model-stack" key={metric.model}>
                    <div className={`ai-model-row ${metric.model === bestModel ? "best" : ""}`}>
                      <span>{formatModelName(metric.model)}</span>
                      <div><i style={{ width }} /></div>
                      <b>{formatNumber((Number(metric.macro_f1) || 0) * 100)}%</b>
                      <small>Đúng {formatNumber((Number(metric.accuracy) || 0) * 100)}%</small>
                    </div>
                    <p>
                      Đúng {metric.correct_predictions ?? 0}/{testRows} mẫu kiểm tra; độ chắc của khuyến nghị {formatNumber((Number(metric.macro_precision) || 0) * 100)}%,
                      độ bao phủ các tình huống {formatNumber((Number(metric.macro_recall) || 0) * 100)}%, điểm theo số lượng mẫu {formatNumber((Number(metric.weighted_f1) || 0) * 100)}%.
                    </p>
                  </div>
                );
              })}
              <div className="ai-metric-explain">
                <b>Vì sao ra các % này?</b>
                <p>
                  Số lớn là điểm cân bằng theo từng loại khuyến nghị: hệ thống học trên dữ liệu của {status?.location ?? location?.name ?? "địa điểm này"},
                  rồi kiểm tra trên một nhóm khung giờ chưa dùng để học. Điểm này không để nhóm xuất hiện nhiều lấn át nhóm ít xuất hiện.
                  Tỷ lệ “Đúng” bên phải là số lần hệ thống chọn đúng khuyến nghị trên nhóm kiểm tra.
                </p>
                <div className="ai-eval-grid">
                  <span><b>{evaluation.train_rows ?? summary.train_rows ?? 0}</b><small>mẫu học</small></span>
                  <span><b>{evaluation.test_rows ?? summary.test_rows ?? 0}</b><small>mẫu kiểm tra</small></span>
                  <span><b>{evaluation.train_timestamps ?? 0}</b><small>khung giờ học</small></span>
                  <span><b>{evaluation.test_timestamps ?? 0}</b><small>khung giờ kiểm tra</small></span>
                </div>
                <div className="ai-class-chips">
                  {testClassDistribution.length ? testClassDistribution.map(([label, count]) => (
                    <span key={label}>{formatDecisionLabel(label)}<b>{count}</b></span>
                  )) : <span>Chưa có phân bố khuyến nghị kiểm tra</span>}
                </div>
                {bestMetric && (
                  <p>
                    {formatModelName(bestMetric.model)} đứng đầu vì điểm cân bằng đạt {formatNumber((Number(bestMetric.macro_f1) || 0) * 100)}%,
                    với {bestMetric.correct_predictions ?? 0}/{bestMetric.test_rows ?? evaluation.test_rows ?? 0} mẫu kiểm tra được dự đoán đúng.
                  </p>
                )}
              </div>
            </>
          ) : <div className="empty-chart">Chưa có kết quả đánh giá mô hình.</div>}
        </div>

        <div className="ai-image-preview">
          <div className="ai-subheading"><span>Ảnh đã ghép theo khung giờ · {location?.name ?? "--"}</span><b>{status?.generated_image_samples?.length ?? 0} mẫu</b></div>
          <div className="ai-image-grid">
            {(status?.generated_image_samples ?? []).map((sample) => (
              <figure key={sample.filename}>
                <img src={sample.url} alt={sample.timestamp} />
                <figcaption>{sample.timestamp}<small>{sample.category ?? ""}</small></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      <div className="ai-lab-footer">
        <span><MapPin size={13} /> Địa điểm: <b>{status?.location ?? location?.name ?? "--"}</b></span>
        <span><RefreshCw size={13} /> Cập nhật AI: <b>{formatDateTimeWithSeconds(status?.refreshed_at)}</b></span>
        <span><Check size={13} /> Cách chia dữ liệu: <b>{formatSplitStrategy(evaluation.split_strategy ?? summary.strategy)}</b></span>
        <span><Clock3 size={13} /> Học/Kiểm tra: <b>{evaluation.train_rows ?? summary.train_rows ?? 0}/{evaluation.test_rows ?? summary.test_rows ?? 0}</b></span>
        <span><Radio size={13} /> Bản mô hình: <b>{formatDateTime(status?.model?.file?.updated_at) || "chưa có"}</b></span>
        {latestRun && <span><Activity size={13} /> Lần chạy mới nhất: <b>{formatAiStep(latestRun.step)} · {latestRun.duration_seconds}s</b></span>}
      </div>
    </section>
  );
}

function AiModelComparisonCharts({ metrics, bestModel }) {
  const baseline = metrics.find((metric) => metric.model === "baseline_majority") ?? metrics.at(-1) ?? {};
  const baselineMacroF1 = Number(baseline.macro_f1) || 0;
  const sortedByF1 = [...metrics].sort((left, right) => (Number(right.macro_f1) || 0) - (Number(left.macro_f1) || 0));
  const bestMetric = sortedByF1[0];
  const bestLift = ((Number(bestMetric?.macro_f1) || 0) - baselineMacroF1) * 100;

  return (
    <div className="ai-model-chart-grid">
      <ModelGroupedBarChart
        title="F1 và độ đúng"
        note="Macro F1 ưu tiên cân bằng giữa các loại quyết định"
        metrics={metrics}
        series={[
          { key: "macro_f1", label: "Macro F1", color: "#65a875" },
          { key: "accuracy", label: "Accuracy", color: "#4f8ca9" },
        ]}
        bestModel={bestModel}
      />
      <ModelGroupedBarChart
        title="Precision và Recall"
        note="Đo độ chắc và độ bao phủ tình huống"
        metrics={metrics}
        series={[
          { key: "macro_precision", label: "Precision", color: "#dca04c" },
          { key: "macro_recall", label: "Recall", color: "#8aa6cf" },
        ]}
        bestModel={bestModel}
      />
      <ModelLiftChart
        title="Cải thiện so với baseline"
        note={`${formatModelName(bestMetric?.model)} đang cao hơn baseline ${formatNumber(bestLift)} điểm F1`}
        metrics={sortedByF1}
        baselineMacroF1={baselineMacroF1}
        bestModel={bestModel}
      />
    </div>
  );
}

function ModelGroupedBarChart({ title, note, metrics, series, bestModel }) {
  return (
    <article className="ai-chart-card">
      <div className="ai-chart-head">
        <span>{title}</span>
        <small>{note}</small>
      </div>
      <div className="ai-grouped-bars">
        {metrics.map((metric) => (
          <div className={`ai-grouped-row ${metric.model === bestModel ? "best" : ""}`} key={`${title}-${metric.model}`}>
            <span>{formatModelName(metric.model)}</span>
            <div className="ai-grouped-track">
              {series.map((item) => {
                const value = clamp((Number(metric[item.key]) || 0) * 100, 0, 100);
                return (
                  <i
                    key={item.key}
                    style={{
                      width: `${Math.max(value, 3)}%`,
                      background: item.color,
                    }}
                    title={`${item.label}: ${formatNumber(value)}%`}
                  />
                );
              })}
            </div>
            <b>{formatNumber((Number(metric[series[0].key]) || 0) * 100)}%</b>
          </div>
        ))}
      </div>
      <div className="ai-chart-legend">
        {series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}
      </div>
    </article>
  );
}

function ModelLiftChart({ title, note, metrics, baselineMacroF1, bestModel }) {
  const lifts = metrics.map((metric) => ({
    ...metric,
    lift: ((Number(metric.macro_f1) || 0) - baselineMacroF1) * 100,
  }));
  const maxLift = Math.max(...lifts.map((metric) => Math.max(metric.lift, 0)), 1);

  return (
    <article className="ai-chart-card">
      <div className="ai-chart-head">
        <span>{title}</span>
        <small>{note}</small>
      </div>
      <div className="ai-lift-bars">
        {lifts.map((metric) => {
          const lift = Math.max(metric.lift, 0);
          return (
            <div className={`ai-lift-row ${metric.model === bestModel ? "best" : ""}`} key={metric.model}>
              <span>{formatModelName(metric.model)}</span>
              <div><i style={{ width: `${Math.max((lift / maxLift) * 100, metric.lift > 0 ? 4 : 0)}%` }} /></div>
              <b>{metric.lift > 0 ? `+${formatNumber(metric.lift)}` : "0"}đ</b>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function RealDataDashboard({ analytics, source, lastSyncedAt, pipelineRun }) {
  return (
    <div className="real-data-stack">
      <div className="real-summary-grid">
        {analytics.summary.map((item) => (
          <motion.article className="real-summary-card" key={item.label} whileHover={{ y: -4 }} whileTap={{ scale: .99 }}>
            <span>{item.label}</span>
            <strong>{item.value}<em>{item.suffix}</em></strong>
            <small>{item.note}</small>
          </motion.article>
        ))}
      </div>
      <div className="chart-grid analytics-charts">
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ cột" title="Xác suất mưa theo giờ" action={<span className="source-pill">{analytics.rows.length} mốc</span>} />
          <VerticalBarChart data={analytics.rows} valueKey="rain_probability" suffix="%" color="#4f8ca9" />
        </motion.article>
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ ngang" title="Điểm bay từng khung giờ" action={<Sparkles size={17} className="sparkle" />} />
          <HorizontalBarChart data={analytics.rows} valueKey="flyability_score" suffix="/100" />
        </motion.article>
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ đường" title="Nhiệt độ dự báo trong ngày" action={<ThermometerSun size={17} className="sparkle" />} />
          <LineTrendChart data={analytics.rows} valueKey="temperature" suffix="°C" />
        </motion.article>
        <motion.article className="panel chart-panel interactive-panel" whileHover={{ y: -4 }} whileTap={{ scale: .995 }}>
          <PanelHeading eyebrow="Biểu đồ tròn" title="Tỷ trọng quyết định" action={<span className="source-pill">{source.dataset}</span>} />
          <DecisionDonutChart segments={analytics.actionSegments} />
        </motion.article>
      </div>
      <div className="data-freshness">
        <span><Radio size={13} /> Mốc đang dùng: <b>{formatDateTime(source.reference_time)}</b></span>
        <span><Clock3 size={13} /> Giao diện cập nhật lần cuối: <b>{formatDateTime(lastSyncedAt)}</b></span>
        {pipelineRun && <span><Check size={13} /> Dữ liệu mới nhất: <b>đã cập nhật</b></span>}
        <span><RefreshCw size={13} /> Tự chạy lại 1 lần khi sang ngày mới</span>
      </div>
      {pipelineRun?.steps?.length > 0 && (
        <div className="pipeline-steps">
          {pipelineRun.steps.map((step, index) => (
            <span className={`pipeline-step ${step.status}`} key={step.name}>
              <b>{index + 1}</b>
              {formatPipelineStep(step)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VerticalBarChart({ data, valueKey, suffix, color }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);
  const activeItem = activeIndex === null ? null : data[activeIndex];
  const handlePointerMove = (event) => {
    if (!data.length) return;
    setActiveIndex(getPointerIndex(event, data.length));
  };

  return (
    <div
      className={`bar-chart interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
      onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsScrubbing(false)}
      onPointerLeave={() => { setActiveIndex(null); setIsScrubbing(false); }}
    >
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        return (
          <div className={`bar-column ${activeIndex === index ? "active" : ""}`} onPointerEnter={() => setActiveIndex(index)} key={item.timestamp}>
            <b>{formatNumber(value)}{suffix}</b>
            <span style={{ height: `${Math.max((value / maxValue) * 100, 3)}%`, background: color }} />
            <small>{item.time}</small>
          </div>
        );
      })}
      {activeItem && (
        <div className="chart-tooltip" style={{ left: `${getTooltipLeft(activeIndex, data.length)}%` }}>
          <b>{activeItem.time}</b>
          <span>{formatNumber(activeItem[valueKey])}{suffix} mưa</span>
          <small>{actionConfig[activeItem.decision_action]?.short ?? activeItem.decision_action}</small>
        </div>
      )}
    </div>
  );
}

function HorizontalBarChart({ data, valueKey, suffix }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const activeItem = activeIndex === null ? null : data[activeIndex];
  const handlePointerMove = (event) => {
    if (!data.length) return;
    setActiveIndex(getPointerIndexByY(event, data.length));
  };

  return (
    <div
      className={`horizontal-bars interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
      onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
      onPointerMove={(event) => { if (isScrubbing) handlePointerMove(event); }}
      onPointerUp={() => setIsScrubbing(false)}
      onPointerLeave={() => { setActiveIndex(null); setIsScrubbing(false); }}
    >
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const tone = actionConfig[item.decision_action]?.tone ?? "stress";
        return (
          <div className={`horizontal-row ${tone} ${activeIndex === index ? "active" : ""}`} onPointerEnter={() => setActiveIndex(index)} key={item.timestamp}>
            <span>{item.time}</span>
            <div><i style={{ width: `${clamp(value, 0, 100)}%` }} /></div>
            <b>{formatNumber(value)}{suffix}</b>
          </div>
        );
      })}
      {activeItem && (
        <div className="horizontal-tooltip">
          <b>{activeItem.time}</b>
          <span>{formatNumber(activeItem[valueKey])}{suffix}</span>
          <small>{actionConfig[activeItem.decision_action]?.title ?? activeItem.decision_action}</small>
        </div>
      )}
    </div>
  );
}

function LineTrendChart({ data, valueKey, suffix }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const values = data.map((item) => Number(item[valueKey]) || 0);
  if (!values.length) {
    return <div className="empty-chart">Chưa có dữ liệu dự báo để vẽ biểu đồ.</div>;
  }
  const min = Math.floor(Math.min(...values, 0));
  const max = Math.ceil(Math.max(...values, 1));
  const range = Math.max(max - min, 1);
  const width = 520;
  const step = width / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => `${index * step},${112 - ((value - min) / range) * 88}`).join(" ");
  const activeValue = activeIndex === null ? null : values[activeIndex];
  const activeX = activeIndex === null ? 0 : activeIndex * step;
  const activeY = activeValue === null ? 0 : 112 - ((activeValue - min) / range) * 88;
  const activeItem = activeIndex === null ? null : data[activeIndex];
  const handlePointerMove = (event) => {
    if (!data.length) return;
    setActiveIndex(getPointerIndex(event, data.length));
  };

  return (
    <div
      className={`line-chart interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
      onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsScrubbing(false)}
      onPointerLeave={() => { setActiveIndex(null); setIsScrubbing(false); }}
    >
      <svg viewBox="0 0 520 136" preserveAspectRatio="none">
        {[24, 56, 88, 120].map((y) => <line x1="0" x2="520" y1={y} y2={y} key={y} />)}
        {activeItem && <line className="line-guide" x1={activeX} x2={activeX} y1="18" y2="123" />}
        <polyline points={points} fill="none" stroke="#db7c34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => <circle className={activeIndex === index ? "active" : ""} cx={index * step} cy={112 - ((value - min) / range) * 88} r={activeIndex === index ? "6" : "4"} key={`${data[index]?.timestamp}-${value}`} />)}
        {activeItem && <circle className="line-pulse" cx={activeX} cy={activeY} r="10" />}
      </svg>
      {activeItem && (
        <div className="chart-tooltip line-tooltip" style={{ left: `${getTooltipLeft(activeIndex, data.length)}%` }}>
          <b>{activeItem.time}</b>
          <span>{formatNumber(activeValue)}{suffix}</span>
          <small>Gió {formatNumber(activeItem.wind_speed)} km/h · Mưa {formatNumber(activeItem.rain_probability)}%</small>
        </div>
      )}
      <div className="line-chart-meta">
        <span>Thấp nhất <b>{formatNumber(Math.min(...values))}{suffix}</b></span>
        <span>Cao nhất <b>{formatNumber(Math.max(...values))}{suffix}</b></span>
        <span>Trung bình <b>{formatNumber(average(values))}{suffix}</b></span>
      </div>
    </div>
  );
}

function DecisionDonutChart({ segments }) {
  const [activeKey, setActiveKey] = useState("");
  const gradient = buildDecisionGradient(segments);
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const activeSegment = segments.find((segment) => segment.key === activeKey);
  return (
    <div className="donut-chart-wrap interactive-chart">
      <motion.div className={`donut-chart ${activeSegment ? "active" : ""}`} style={{ background: gradient }} whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }}>
        <span><b>{total}</b><small>quyết định</small></span>
      </motion.div>
      <div className="donut-legend">
        {segments.map((segment) => (
          <span className={activeKey === segment.key ? "active" : ""} onPointerEnter={() => setActiveKey(segment.key)} onPointerLeave={() => setActiveKey("")} key={segment.key}><i style={{ background: segment.color }} /> {segment.label} <b>{segment.count}</b></span>
        ))}
      </div>
      {activeSegment && <div className="donut-tooltip"><b>{activeSegment.label}</b><span>{activeSegment.count}/{total} quyết định</span></div>}
    </div>
  );
}

function formatCountdown(referenceTime, slotTimestamp) {
  if (!referenceTime || !slotTimestamp) return "";
  const minutes = Math.round((new Date(slotTimestamp) - new Date(referenceTime)) / 60000);
  if (minutes <= 0) return "đang trong khung giờ bay";
  if (minutes < 60) return `còn ${minutes} phút`;
  return `còn ${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

function getSceneStatus({ droneState, nextSafeSlot, countdown, weatherUnsafe, sprayLocked }) {
  if (droneState === "RETURNING") return { tone: "danger", title: "UAV đang quay về trạm", detail: "Đường bay về Dock 01 đã được kích hoạt" };
  if (droneState === "SPRAYING" && weatherUnsafe) return { tone: "danger", title: "Thời tiết xấu khi đang phun", detail: "Khóa vòi phun hoặc đưa UAV về trạm ngay" };
  if (droneState === "FLYING" && weatherUnsafe) return { tone: "danger", title: "Thời tiết thay đổi khi đang bay", detail: "Kiểm tra telemetry và cân nhắc quay về trạm" };
  if (sprayLocked && droneState !== "DOCKED") return { tone: "warning", title: "Vòi phun đã bị khóa", detail: "UAV vẫn bay nhưng không còn phun thuốc" };
  if (droneState === "SPRAYING") return { tone: "safe", title: "Đang phun theo mức đề xuất", detail: "Hệ thống đang giám sát điều kiện vận hành" };
  if (droneState === "FLYING") return { tone: "safe", title: "UAV đang bay giám sát", detail: "Chọn một mốc giờ xấu để mô phỏng thay đổi thời tiết" };
  if (nextSafeSlot) return { tone: "safe", title: `Sắp tới giờ bay · ${nextSafeSlot.time}`, detail: countdown };
  return { tone: "warning", title: "UAV đang chờ tại trạm", detail: "Chưa có khung giờ cất cánh an toàn trong dự báo" };
}

function buildRealNotifications({ dashboard, pipelineRun, syncing, lastSyncedAt }) {
  if (!dashboard?.slots?.length) return [];

  const slots = dashboard.slots.map((slot) => {
    const time = slot.timestamp?.includes("T") ? slot.timestamp.split("T")[1].substring(0, 5) : "";
    return {
      ...slot,
      time,
      temperature: slot.weather?.temperature,
      wind_speed: slot.weather?.wind_speed,
      wind_gust: slot.weather?.wind_gust,
      humidity: slot.weather?.humidity,
      rain_probability: slot.weather?.precipitation_probability,
      precipitation: slot.weather?.precipitation,
      cloud_cover: slot.weather?.cloud_cover,
      visibility: slot.weather?.visibility,
      weather_description: slot.weather?.weather_description,
      decision_action: slot.decision_engine?.final_decision,
      schedule_eligible: slot.decision_engine?.final_decision === "TAKE_OFF",
      risk_level: slot.decision_engine?.risk_level,
    };
  });

  const current = slots[0];
  const forecast = slots;
  const recommendedSlots = slots.filter((slot) => slot.schedule_eligible);
  const action = actionConfig[current.decision_action] ?? actionConfig.DELAY_FLIGHT;
  const notifications = [
    {
      id: `decision-${current.timestamp}`,
      icon: current.decision_action === "TAKE_OFF" ? Check : ShieldAlert,
      tone: current.decision_action === "TAKE_OFF" ? "success" : "warning",
      title: action.title,
      detail: `${dashboard.location}: mức rủi ro ${translateRiskLevel(current.risk_level).toLowerCase()}.`,
      time: current.time,
    },
  ];

  if (current.wind_speed > 20 || current.wind_gust > 28 || current.decision_action === "LOCK_SPRAY") {
    notifications.push({
      id: `wind-${current.timestamp}`,
      icon: Wind,
      tone: "danger",
      title: "Gió vượt ngưỡng vận hành",
      detail: `Gió ${formatNumber(current.wind_speed)} km/h, gió giật ${formatNumber(current.wind_gust)} km/h. Ngưỡng an toàn: 20/28 km/h.`,
      time: current.time,
    });
  }

  if (current.precipitation > 0 || current.rain_probability > 30 || current.decision_action === "RETURN_TO_CHARGING") {
    notifications.push({
      id: `rain-${current.timestamp}`,
      icon: CloudRain,
      tone: current.precipitation > 0 || current.rain_probability > 60 ? "danger" : "warning",
      title: "Rủi ro mưa trong dự báo",
      detail: `Xác suất mưa ${formatNumber(current.rain_probability)}%, lượng mưa ${formatNumber(current.precipitation)} mm.`,
      time: current.time,
    });
  }

  if (current.temperature > 35) {
    notifications.push({
      id: `temp-${current.timestamp}`,
      icon: ThermometerSun,
      tone: "warning",
      title: "Nhiệt độ cao",
      detail: `Nhiệt độ hiện tại ${formatNumber(current.temperature)}°C, vượt ngưỡng khuyến nghị 35°C.`,
      time: current.time,
    });
  }

  const riskySlots = forecast.filter((slot) => slot.decision_action !== "TAKE_OFF");
  if (riskySlots.length > 0) {
    const firstRiskySlot = riskySlots[0];
    notifications.push({
      id: `risk-window-${firstRiskySlot.timestamp}`,
      icon: CircleAlert,
      tone: riskySlots.length >= Math.ceil(forecast.length / 2) ? "danger" : "warning",
      title: `${riskySlots.length}/${forecast.length} mốc không an toàn`,
      detail: `Mốc đầu tiên: ${firstRiskySlot.time} - ${actionConfig[firstRiskySlot.decision_action]?.short ?? firstRiskySlot.decision_action}.`,
      time: firstRiskySlot.time,
    });
  }

  const safeSlot = recommendedSlots[0];
  notifications.push({
    id: safeSlot ? `safe-${safeSlot.timestamp}` : "safe-missing",
    icon: safeSlot ? CalendarDays : Lock,
    tone: safeSlot ? "success" : "danger",
    title: safeSlot ? "Có khung giờ cất cánh đề xuất" : "Chưa có khung giờ cất cánh",
    detail: safeSlot
      ? `${safeSlot.time} - ${safeSlot.end_time}, mức rủi ro ${translateRiskLevel(safeSlot.risk_level).toLowerCase()}.`
      : "Hệ thống chưa tìm thấy khung giờ đủ an toàn trong dữ liệu hiện tại.",
    time: safeSlot?.time ?? current.time,
  });

  notifications.push({
    id: syncing ? "pipeline-running" : `source-${dashboard.source}`,
    icon: syncing ? RefreshCw : Radio,
    tone: syncing ? "info" : "success",
    title: syncing ? "Đang đồng bộ dữ liệu" : "Nguồn dữ liệu đã sẵn sàng",
    detail: syncing
      ? "Hệ thống đang lấy và làm sạch dự báo mới."
      : `${dashboard.source || "Dữ liệu thời tiết"}.`,
    time: lastSyncedAt ? `Giao diện: ${formatDateTime(lastSyncedAt)}` : "",
  });

  if (pipelineRun?.clean_path) {
    notifications.push({
      id: `pipeline-${pipelineRun.clean_path}`,
      icon: Check,
      tone: "success",
      title: "Dữ liệu mới đã cập nhật",
      detail: "Dự báo đã được làm sạch và đưa vào tính toán.",
      time: "",
    });
  }

  return notifications.slice(0, 7);
}

function getSceneWeather(slot) {
  if (!slot) return { type: "clear", label: "Điều kiện ổn định" };

  const rainProbability = Number(slot.rain_probability) || 0;
  const precipitation = Number(slot.precipitation) || 0;
  const windSpeed = Number(slot.wind_speed) || 0;
  const windGust = Number(slot.wind_gust) || 0;
  const temperature = Number(slot.temperature) || 0;
  const description = `${slot.weather_description ?? ""}`.toLowerCase();
  const isRainyDescription = /rain|drizzle|thunder|storm|mưa|giông|dông/.test(description);

  if (precipitation > 0 || rainProbability >= 65 || isRainyDescription) {
    return { type: "rain", label: precipitation > 0 ? `Mưa ${precipitation} mm` : `Nguy cơ mưa ${rainProbability}%` };
  }
  if (windSpeed > 20 || windGust > 28 || slot.decision_action === "LOCK_SPRAY") {
    return { type: "wind", label: "Gió mạnh" };
  }
  if (temperature > 35) {
    return { type: "heat", label: `Nắng nóng ${temperature}°C` };
  }
  return { type: "clear", label: `Ổn định ${temperature}°C` };
}

function buildDashboardAnalytics(dashboard) {
  const rows = (dashboard?.slots ?? []).slice(0, 12).map((slot) => {
    const time = slot.timestamp?.includes("T") ? slot.timestamp.split("T")[1].substring(0, 5) : "";
    return {
      ...slot,
      time,
      temperature: slot.weather?.temperature,
      wind_speed: slot.weather?.wind_speed,
      wind_gust: slot.weather?.wind_gust,
      humidity: slot.weather?.humidity,
      rain_probability: slot.weather?.precipitation_probability,
      precipitation: slot.weather?.precipitation,
      cloud_cover: slot.weather?.cloud_cover,
      visibility: slot.weather?.visibility,
      weather_description: slot.weather?.weather_description,
      decision_action: slot.decision_engine?.final_decision,
      schedule_eligible: slot.decision_engine?.final_decision === "TAKE_OFF",
      risk_level: slot.decision_engine?.risk_level,
    };
  });

  const winds = rows.map((row) => Number(row.wind_speed) || 0);
  const rains = rows.map((row) => Number(row.rain_probability) || 0);
  const temps = rows.map((row) => Number(row.temperature) || 0);
  const safeSlots = rows.filter((row) => row.schedule_eligible).length;
  const actionSegments = buildActionSegments(rows);

  return {
    rows,
    actionSegments,
    summary: [
      { label: "Mốc dự báo nhận được", value: rows.length, suffix: " mốc", note: dashboard?.source ?? "Đang chờ dữ liệu" },
      { label: "Khung giờ bay an toàn", value: safeSlots, suffix: `/${rows.length}`, note: `${formatNumber((safeSlots / Math.max(rows.length, 1)) * 100)}% khung giờ cất cánh` },
      { label: "Điểm bay trung bình", value: safeSlots ? "Tốt" : "Hạn chế", suffix: "", note: "Ước tính từ các mô hình AI" },
      { label: "Điều kiện nổi bật", value: formatNumber(Math.max(...rains, 0)), suffix: "% mưa", note: `Gió TB ${formatNumber(average(winds))} km/h · Nhiệt TB ${formatNumber(average(temps))}°C` },
    ],
  };
}

function buildActionSegments(rows) {
  const colors = {
    TAKE_OFF: "#65a875",
    DELAY_FLIGHT: "#dca04c",
    LOCK_SPRAY: "#c56d51",
    RETURN_TO_CHARGING: "#4f8ca9",
  };
  const counts = rows.reduce((totals, row) => {
    const act = row.decision_action || "DELAY_FLIGHT";
    totals[act] = (totals[act] ?? 0) + 1;
    return totals;
  }, {});
  return Object.entries(counts).map(([key, count]) => ({
    key,
    count,
    label: actionConfig[key]?.short ?? key,
    color: colors[key] ?? "#9aa6a2",
  }));
}

function buildDecisionGradient(segments) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (!total) return "conic-gradient(#edf0ed 0deg 360deg)";
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += (segment.count / total) * 360;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMsUntilNextLocalDay() {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 5, 0);
  return Math.max(nextDay.getTime() - now.getTime(), 1000);
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTimeWithSeconds(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function translatePrediction(pred) {
  if (!pred) return "--";
  const mapping = {
    TAKE_OFF: "CẤT CÁNH",
    DELAY_FLIGHT: "HOÃN BAY",
    LOCK_SPRAY: "KHÓA PHUN",
    RETURN_TO_CHARGING: "VỀ TRẠM SẠC",
  };
  return mapping[pred] ?? pred;
}

function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Bullet points: - item
  html = html.split("\n").map(line => {
    if (line.trim().startsWith("- ")) {
      return `<li class="ml-4 list-disc text-xs mt-1">${line.trim().substring(2)}</li>`;
    }
    return line;
  }).join("\n");
  
  // Line breaks
  html = html.replace(/\n/g, "<br />");
  return html;
}

function formatModelName(value) {
  if (!value) return "--";
  const labels = {
    decision_tree: "Decision Tree",
    random_forest: "Random Forest",
    logistic_regression: "Logistic Regression",
    baseline_majority: "Majority Baseline",
  };
  if (labels[value]) return labels[value];
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDecisionLabel(value) {
  return actionConfig[value]?.title ?? value ?? "--";
}

function formatSplitStrategy(value) {
  if (!value) return "--";
  if (`${value}`.includes("GroupShuffleSplit")) return "Chia theo khung giờ để kiểm tra công bằng";
  return value;
}

function formatAiStep(step) {
  const labels = {
    simulate_images: "Ghép ảnh theo thời tiết",
    extract_features: "Đọc đặc điểm ảnh",
    train_model: "Học lại cách ra khuyến nghị",
    simulate: "Ghép ảnh theo thời tiết",
    extract: "Đọc đặc điểm ảnh",
    train: "Học lại cách ra khuyến nghị",
  };
  return labels[step] ?? step ?? "--";
}

function getFilename(path) {
  if (!path) return "--";
  return path.split(/[\\/]/).pop();
}

function formatPipelineStep(step) {
  const labels = {
    fetch_weather: "Lấy dự báo thời tiết",
    clean_data: "Làm sạch dữ liệu",
    upload_supabase: "Cập nhật kho dữ liệu",
  };
  const rows = step.rows ? ` · ${step.rows} dòng` : "";
  const warning = step.status === "warning" ? " · cảnh báo" : "";
  const skipped = step.status === "skipped" ? " · bỏ qua" : "";
  return `${labels[step.name] ?? step.name}${rows}${warning}${skipped}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function formatVisibility(value) {
  const meters = Number(value) || 0;
  if (meters >= 1000) return `${formatNumber(meters / 1000)} km`;
  return `${formatNumber(meters)} m`;
}


function translateWeatherDescription(description) {
  if (!description) return "Điều kiện ổn định";
  const key = description.trim().toLowerCase();
  
  const wmoCodes = {
    "0": "Trời quang",
    "1": "Trời quang / Ít mây",
    "2": "Mây rải rác",
    "3": "Nhiều mây / Âm u",
    "45": "Có sương mù",
    "48": "Sương mù đóng băng",
    "51": "Mưa phùn nhẹ",
    "53": "Mưa phùn vừa",
    "55": "Mưa phùn dày đặc",
    "56": "Mưa phùn lạnh nhẹ",
    "57": "Mưa phùn lạnh mạnh",
    "61": "Mưa nhỏ",
    "63": "Mưa vừa",
    "65": "Mưa lớn",
    "66": "Mưa lạnh nhẹ",
    "67": "Mưa lạnh mạnh",
    "71": "Tuyết rơi nhẹ",
    "73": "Tuyết rơi vừa",
    "75": "Tuyết rơi dày",
    "77": "Tuyết hạt",
    "80": "Mưa rào nhẹ",
    "81": "Mưa rào vừa",
    "82": "Mưa rào lớn",
    "85": "Mưa rào tuyết nhẹ",
    "86": "Mưa rào tuyết lớn",
    "95": "Có dông",
    "96": "Dông kèm mưa đá nhẹ",
    "99": "Dông kèm mưa đá mạnh"
  };

  if (key.startsWith("code ")) {
    const codeNum = key.replace("code ", "").trim();
    if (wmoCodes[codeNum]) return wmoCodes[codeNum];
  }

  const labels = {
    sunny: "Nắng",
    clear: "Trời quang",
    "partly cloudy": "Có mây rải rác",
    cloudy: "Nhiều mây",
    overcast: "Âm u",
    mist: "Sương mù nhẹ",
    fog: "Sương mù",
    "patchy rain nearby": "Có mưa rải rác gần khu vực",
    "patchy light drizzle": "Mưa phùn nhẹ rải rác",
    "light drizzle": "Mưa phùn nhẹ",
    "patchy light rain": "Mưa nhỏ rải rác",
    "light rain": "Mưa nhỏ",
    "moderate rain": "Mưa vừa",
    "heavy rain": "Mưa lớn",
    "moderate or heavy rain shower": "Mưa rào vừa hoặc lớn",
    "light rain shower": "Mưa rào nhẹ",
    "torrential rain shower": "Mưa rào rất lớn",
    "patchy thunderstorm nearby": "Có dông rải rác gần khu vực",
    "thundery outbreaks nearby": "Có dông gần khu vực",
  };
  if (labels[key]) return labels[key];
  if (key.includes("thunder")) return "Có dông";
  if (key.includes("rain")) return "Có mưa";
  if (key.includes("drizzle")) return "Có mưa phùn";
  if (key.includes("cloud")) return "Có mây";
  if (key.includes("fog") || key.includes("mist")) return "Có sương mù";
  return description;
}

function formatRecommendationText(text) {
  if (!text) return "--";
  return `${text}`
    .replace(/^TAKE_OFF:/, "Có thể cất cánh:")
    .replace(/^LOCK_SPRAY:/, "Khóa lệnh phun:")
    .replace(/^RETURN_TO_CHARGING:/, "Đưa UAV về trạm sạc:")
    .replace(/^DELAY_FLIGHT:/, "Nên hoãn chuyến bay:")
    .replace("Dieu kien bay chap nhan duoc.", "Điều kiện bay chấp nhận được.")
    .replace(/Gio ([\d.]+) km\/h, gio giat ([\d.]+) km\/h, xac suat mua ([\d.]+)%\./, "Gió $1 km/h, gió giật $2 km/h, khả năng mưa $3%.")
    .replace(/De xuat flow-rate ([\d.]+)%\./, "Mức phun đề xuất $1%.")
    .replace("Khoa lenh phun vi gio/gio giat vuot nguong an toan", "Khóa phun vì gió hoặc gió giật vượt ngưỡng an toàn")
    .replace("Tranh pesticide drift va mat on dinh UAV.", "Tránh thuốc bị gió cuốn lệch và giữ UAV ổn định.")
    .replace("Thoi tiet mua/nguy hiem", "Thời tiết có mưa hoặc nguy hiểm")
    .replace("xac suat mua", "khả năng mưa")
    .replace("Dua drone ve tram sac de bao ve thiet bi.", "Đưa UAV về trạm sạc để bảo vệ thiết bị.")
    .replace(/Tam hoan bay do nhiet do ([\d.]+)C hoac rui ro mua ([\d.]+)%\./, "Tạm hoãn bay do nhiệt độ $1°C hoặc rủi ro mưa $2%.")
    .replace("Kiem tra lai khung gio ke tiep.", "Kiểm tra lại khung giờ kế tiếp.");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPointerIndex(event, count) {
  const rect = event.currentTarget.getBoundingClientRect();
  const progress = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
  return clamp(Math.round(progress * (count - 1)), 0, count - 1);
}

function getPointerIndexByY(event, count) {
  const rect = event.currentTarget.getBoundingClientRect();
  const progress = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
  return clamp(Math.round(progress * (count - 1)), 0, count - 1);
}

function getTooltipLeft(index, count) {
  if (index === null || count <= 1) return 0;
  return clamp((index / (count - 1)) * 100, 8, 92);
}

function WeatherChart({ forecast = [], selectedTimestamp, onSelect }) {
  const [previewIndex, setPreviewIndex] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  if (!forecast.length) {
    return <div className="empty-chart">Chưa có dữ liệu dự báo để vẽ xu hướng khí hậu.</div>;
  }
  const temperatures = forecast.map((slot) => slot.temperature);
  const min = Math.floor(Math.min(...temperatures) - 1);
  const max = Math.ceil(Math.max(...temperatures) + 1);
  const range = Math.max(max - min, 1);
  const width = 550;
  const step = width / Math.max(forecast.length - 1, 1);
  const points = forecast.map((slot, index) => `${index * step},${115 - ((slot.temperature - min) / range) * 92}`).join(" ");
  const selectedIndex = forecast.findIndex((slot) => slot.timestamp === selectedTimestamp);
  const activeIndex = previewIndex ?? (selectedIndex >= 0 ? selectedIndex : null);
  const activeSlot = activeIndex === null ? null : forecast[activeIndex];
  const previewSlot = previewIndex === null ? null : forecast[previewIndex];
  const previewX = previewIndex === null ? 0 : previewIndex * step;
  const previewY = previewSlot ? 115 - ((previewSlot.temperature - min) / range) * 92 : 0;
  const handlePointerMove = (event) => {
    setPreviewIndex(getPointerIndex(event, forecast.length));
  };
  const selectIndex = (index) => {
    const slot = forecast[index];
    if (slot) onSelect?.(slot);
  };

  return (
    <div className="chart-wrap">
      <div className="chart-labels"><span>{max}°</span><span>{Math.round((max + min) / 2)}°</span><span>{min}°</span></div>
      <div
        className={`weather-plot interactive-chart ${isScrubbing ? "scrubbing" : ""}`}
        onPointerDown={(event) => { setIsScrubbing(true); handlePointerMove(event); }}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => { const nextIndex = getPointerIndex(event, forecast.length); setPreviewIndex(nextIndex); selectIndex(nextIndex); setIsScrubbing(false); }}
        onPointerCancel={() => { setPreviewIndex(null); setIsScrubbing(false); }}
        onPointerLeave={() => { setPreviewIndex(null); setIsScrubbing(false); }}
      >
        <svg className="weather-chart" viewBox="0 0 550 140" preserveAspectRatio="none">
          <defs><linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e69952" stopOpacity=".28" /><stop offset="100%" stopColor="#e69952" stopOpacity="0" /></linearGradient></defs>
          {[20, 52, 84, 116].map((y) => <line x1="0" x2="550" y1={y} y2={y} key={y} />)}
          {previewSlot && <line className="line-guide" x1={previewX} x2={previewX} y1="16" y2="124" />}
          <polygon points={`${points} 550,122 0,122`} fill="url(#chartArea)" /><polyline points={points} fill="none" stroke="#db7c34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {forecast.map((slot, index) => <circle className={activeIndex === index ? "active" : ""} cx={index * step} cy={115 - ((slot.temperature - min) / range) * 92} r={activeIndex === index ? "6" : "4"} key={slot.timestamp} />)}
          {previewSlot && <circle className="line-pulse" cx={previewX} cy={previewY} r="10" />}
        </svg>
      </div>
      <div className="chart-times">
        {forecast.map((slot, index) => (
          <button className={activeIndex === index ? "active" : ""} onClick={() => selectIndex(index)} key={slot.timestamp}>
            {slot.time}
          </button>
        ))}
      </div>
      {activeSlot && (
        <div className="weather-readout">
          <b>{activeSlot.time}</b>
          <span>{formatNumber(activeSlot.temperature)}°C</span>
          <span><Wind size={12} /> Gió {formatNumber(activeSlot.wind_speed)} km/h</span>
          <span><CloudRain size={12} /> Mưa {formatNumber(activeSlot.rain_probability)}%</span>
          {activeSlot.evapotranspiration != null && <span><Droplets size={12} /> ET₀ {formatNumber(activeSlot.evapotranspiration)}</span>}
          {activeSlot.soil_moisture != null && <span><Gauge size={12} /> Đất {formatNumber(activeSlot.soil_moisture)}%</span>}
        </div>
      )}
      <div className="chart-summary"><span><i className="temp-line" /> Nhiệt độ</span><span><Wind size={13} /> Gió mạnh nhất <b>{Math.max(...forecast.map((slot) => slot.wind_speed))} km/h</b></span><span><CloudRain size={13} /> Mưa cao nhất <b>{Math.max(...forecast.map((slot) => slot.rain_probability))}%</b></span></div>
    </div>
  );
}

function MiniBars({ tone }) {
  return <div className={`mini-bars ${tone}`}>{[28, 42, 36, 53, 48, 66, 58, 72, 76, 90].map((height, index) => <i style={{ height: `${height}%` }} key={index} />)}</div>;
}

function MissionModal({ slot, slots, selectedSlot, onSelectSlot, location, onClose, onConfirm }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mission-modal" initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 12 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button><span className="modal-eyebrow"><Plane size={14} /> Nhiệm vụ mới</span><h2>Lập lịch vận hành UAV</h2><p>Khung giờ được gợi ý từ dữ liệu thời tiết và các ngưỡng an toàn hiện tại.</p>
        <div className="mission-fields">
          <label><span>Điểm giám sát</span><b><MapPin size={15} /> {location.name}</b></label>
          <label>
            <span>Khung giờ cất cánh</span>
            <select className="mission-slot-select" value={selectedSlot} onChange={(event) => onSelectSlot(Number(event.target.value))}>
              {slots.map((candidate, index) => (
                <option value={index} disabled={!candidate.schedule_eligible} key={candidate.timestamp}>
                  {candidate.time} - {candidate.end_time} · {formatNumber(candidate.flyability_score)}/100
                </option>
              ))}
            </select>
          </label>
          <label><span>Loại nhiệm vụ</span><select><option>Tưới chính xác</option><option>Phun bảo vệ thực vật</option><option>Trinh sát hình ảnh</option></select></label>
          <label><span>Mức phun đề xuất</span><b><Grid2X2 size={15} /> {slot.dynamic_flow_rate_pct}%</b></label>
        </div>
        <div className="mission-note"><CircleAlert size={16} /><span>Đang chọn {slot.time} - {slot.end_time}, điểm bay {slot.flyability_score}/100. Hệ thống cần kiểm tra lại dự báo trước khi cất cánh.</span></div>
        <div className="modal-actions"><button className="outline-btn" onClick={onClose}>Hủy bỏ</button><button className="primary-btn" onClick={onConfirm}><Check size={16} /> Xác nhận lịch bay</button></div>
      </motion.div>
    </motion.div>
  );
}

function LoadingScreen() {
  return <div className="loading-screen"><Plane size={24} /><h2>Đang kết nối Agricultural Drone Scheduler</h2><p>Đang đọc dữ liệu thời tiết và tính khuyến nghị...</p></div>;
}

function ErrorScreen({ error, retry }) {
  return <div className="loading-screen error-screen"><CircleAlert size={26} /><h2>Chưa kết nối được dịch vụ dữ liệu</h2><p>{error}</p><button className="primary-btn" onClick={retry}><RefreshCw size={15} /> Thử lại</button></div>;
}

export default App;
