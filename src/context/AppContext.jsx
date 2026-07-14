import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getDashboardSlots,
  getLocations,
  getDecisionConfig,
  updateDecisionConfig,
  resetDecisionConfig,
  runPipeline,
  getAiTrainingStatus,
  simulateAiTrainingImages,
  extractAiTrainingFeatures,
  trainAiModel,
  askChatbot,
  overrideDecision,
  getDronesList,
} from "../api/dashboard";
import {
  actionConfig,
  DAILY_SYNC_KEY,
  getDecisionAction,
  getRiskLevel,
  getLocalDateKey,
  getMsUntilNextLocalDay,
  formatDateTime,
  formatNumber,
  formatVisibility,
  translateWeatherDescription,
  translateRiskLevel,
  buildDashboardAnalytics,
  buildRealNotifications,
  formatCountdown,
  getSceneWeather,
  getSceneStatus,
  ruleFields,
} from "../utils/helpers";


const PLOTS_DATA = [
  { id: "plot_1", name: "Vườn Lúa Tiền Giang", province: "Tien Giang", area: 2.5, cropStage: "SEEDLING", pesticide: "Tricyclazole", lat: 10.25, lng: 106.33 },
  { id: "plot_3", name: "Vườn Lúa Đồng Tháp", province: "Dong Thap", area: 5.0, cropStage: "TILLERING", pesticide: "Abamectin", lat: 10.45, lng: 105.63 },
  { id: "plot_5", name: "Vườn Lúa An Giang", province: "An Giang", area: 10.0, cropStage: "BOOTING", pesticide: "Hexaconazole", lat: 10.38, lng: 105.42 },
  { id: "plot_7", name: "Vườn Lúa Cần Thơ", province: "Can Tho", area: 1.5, cropStage: "GRAIN_FILLING", pesticide: "Tricyclazole", lat: 10.03, lng: 105.78 },
  { id: "plot_9", name: "Vườn Lúa Long An", province: "Long An", area: 6.0, cropStage: "TILLERING", pesticide: "Abamectin", lat: 10.53, lng: 106.38 },
  { id: "plot_11", name: "Vườn Mẫu Đồng Tháp", province: "Dong Thap", area: 15.0, cropStage: "SEEDLING", pesticide: "Hexaconazole", lat: 10.42, lng: 105.68 },
  { id: "plot_12", name: "Ruộng Thử Nghiệm An Giang", province: "An Giang", area: 2.8, cropStage: "GRAIN_FILLING", pesticide: "Tricyclazole", lat: 10.39, lng: 105.45 },
  { id: "plot_13", name: "Nông Trại Cần Thơ", province: "Can Tho", area: 5.5, cropStage: "BOOTING", pesticide: "Abamectin", lat: 10.05, lng: 105.75 },
  { id: "plot_14", name: "Vườn Rau Củ Chi - Hồ Chí Minh", province: "Ho Chi Minh", area: 4.5, cropStage: "TILLERING", pesticide: "Hexaconazole", lat: 10.95, lng: 106.50 },
  { id: "plot_15", name: "Nông Trại Gia Lâm - Hà Nội", province: "Ha Noi", area: 3.5, cropStage: "GRAIN_FILLING", pesticide: "Tricyclazole", lat: 21.02, lng: 105.90 }
];

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // === Core Data State ===
  const [locations, setLocations] = useState([]);
  const [droneList, setDroneList] = useState([]);
  const [locationId, setLocationId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [activeNav, setActiveNav] = useState("mission-control");
  const [operationTimestamp, setOperationTimestamp] = useState("");
  const [decisionConfig, setDecisionConfig] = useState(null);
  const [ruleForm, setRuleForm] = useState({});
  const [pipelineRun, setPipelineRun] = useState(null);
  const [aiTraining, setAiTraining] = useState(null);
  const [aiTrainingRun, setAiTrainingRun] = useState(null);

  // === Drone State ===
  const [droneState, setDroneState] = useState("DOCKED");
  const [droneOpen, setDroneOpen] = useState(false);
  const [sprayLocked, setSprayLocked] = useState(false);

  // === UI State ===
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [slotViewMode, setSlotViewMode] = useState("timeline");
  const [farmSize, setFarmSize] = useState(10.0);
  const [distanceKm, setDistanceKm] = useState(1.0);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [droneModel, setDroneModel] = useState("DJI_T30");
  const [pesticide, setPesticide] = useState("Tricyclazole");
  const [cropStage, setCropStage] = useState("TILLERING");

  // === Chatbot State ===
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", text: "Chào bạn! Tôi là AI Assistant của AeroGuard Pro. Tôi có thể giải đáp các thắc mắc về lịch sử hoạt động và quyết định bay của hệ thống." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // === Override State ===
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideDecisionValue, setOverrideDecisionValue] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);

  // === AI Training State ===
  const [aiTrainingBusyStep, setAiTrainingBusyStep] = useState("");
  const [aiTrainingRefreshing, setAiTrainingRefreshing] = useState(false);

  const dailySyncInFlightRef = useRef(false);

  // === Callbacks ===
  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const loadDashboard = useCallback(async (showToast = false, keepSelected = false) => {
    setSyncing(true);
    setError("");
    try {
      const activePlot = locations.find(p => p.id === locationId) || locations[0] || PLOTS_DATA[0];
      const locationForApi = activePlot.location_name || activePlot.province || "Dong Thap";
      const payload = await getDashboardSlots(locationForApi, null, activePlot.area_hectares || activePlot.area || 10.0, distanceKm, droneModel, pesticide, activePlot.current_crop_stage || activePlot.cropStage || "TILLERING");
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
  }, [locationId, locations, distanceKm, droneModel, pesticide, notify]);

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
      const activePlot = locations.find(p => p.id === locationId) || locations[0] || PLOTS_DATA[0];
      const locationForApi = activePlot.location_name || activePlot.province || "Dong Thap";
      const status = await getAiTrainingStatus(locationForApi);
      setAiTraining(status);
      if (showToast) notify(`Đã làm mới phần huấn luyện AI cho ${activePlot.name}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAiTrainingRefreshing(false);
    }
  }, [locationId, notify]);

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

  // === Effects ===
  useEffect(() => {
    const activePlot = locations.find(p => p.id === locationId) || locations[0];
    if (!activePlot) return;
    setFarmSize(activePlot.area_hectares || activePlot.area || 10.0);
    setCropStage(activePlot.current_crop_stage || activePlot.cropStage || "TILLERING");
    setPesticide(activePlot.current_pesticide || activePlot.pesticide || "Tricyclazole");
  }, [locationId, locations]);

  useEffect(() => {
    getLocations()
      .then((data) => {
        const plotList = (data && data.length > 0) ? data : PLOTS_DATA;
        setLocations(plotList);
        if (!locationId && plotList.length > 0) {
          setLocationId(plotList[0].id);
        }
      })
      .catch((e) => {
        setError(e.message);
        setLocations(PLOTS_DATA);
        if (!locationId && PLOTS_DATA.length > 0) {
          setLocationId(PLOTS_DATA[0].id);
        }
      });
    getDronesList().then(setDroneList).catch((e) => setError(e.message));
    getDecisionConfig()
      .then((config) => { setDecisionConfig(config); setRuleForm(config.thresholds ?? {}); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { loadAiTraining(); }, [loadAiTraining]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (dashboard?.source?.updated_at) loadAiTraining(); }, [dashboard?.source?.updated_at, loadAiTraining]);
  useEffect(() => {
    if (!dashboard?.decision_config?.thresholds) return;
    setDecisionConfig(dashboard.decision_config);
    setRuleForm(dashboard.decision_config.thresholds);
  }, [dashboard?.decision_config]);

  // Sync ruleForm limits with the currently selected drone
  useEffect(() => {
    const activeDrone = droneList?.find(d => d.model_name === droneModel);
    if (activeDrone && ruleForm) {
      setRuleForm(prev => {
        if (prev.max_wind_speed === activeDrone.max_wind_resistance_kph && 
            prev.max_wind_gust === activeDrone.max_gust_resistance_kph) {
          return prev;
        }
        return {
          ...prev,
          max_wind_speed: activeDrone.max_wind_resistance_kph,
          max_wind_gust: activeDrone.max_gust_resistance_kph
        };
      });
    }
  }, [droneModel, droneList, dashboard?.decision_config]);

  useEffect(() => {
    let midnightTimeout;
    const refreshIfNewDay = async () => {
      if (window.localStorage.getItem(DAILY_SYNC_KEY) !== getLocalDateKey()) {
        if (dailySyncInFlightRef.current) return;
        dailySyncInFlightRef.current = true;
        try { await executePipelineRefresh(false); } finally { dailySyncInFlightRef.current = false; }
      }
    };
    const scheduleMidnightSync = () => {
      midnightTimeout = window.setTimeout(() => { refreshIfNewDay(); scheduleMidnightSync(); }, getMsUntilNextLocalDay());
    };
    refreshIfNewDay();
    scheduleMidnightSync();
    const wakeupCheck = window.setInterval(refreshIfNewDay, 5 * 60 * 1000);
    return () => { window.clearTimeout(midnightTimeout); window.clearInterval(wakeupCheck); };
  }, [executePipelineRefresh]);

  // === Derived State ===
  const slots = useMemo(() => {
    return (dashboard?.slots ?? []).map((slot) => {
      const time = slot.timestamp?.includes("T") ? slot.timestamp.split("T")[1].substring(0, 5) : "";
      const hour = time ? Number(time.split(":")[0]) : 0;
      const end_time = time ? `${(hour + 1).toString().padStart(2, "0")}:00` : "";
      const decision_action = getDecisionAction(slot);
      const schedule_eligible = slot.decision_engine?.is_safe_to_fly ?? (decision_action === "FLY");
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

  const current = slots[selectedSlot] ?? slots[0] ?? {};
  const action = actionConfig[current?.decision_action] ?? actionConfig.DELAY;
  const canSchedule = Boolean(current?.schedule_eligible);
  const activeDecisionConfig = decisionConfig ?? dashboard?.decision_config;
  const ruleSourceLabel = activeDecisionConfig?.source === "file" ? "giao diện" : "mặc định";

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
  const nextSafeSlot = timelineTiles.find((tile) => tile.schedule_eligible) ?? slots.find((tile) => tile.schedule_eligible);
  const isAirborne = droneState !== "DOCKED";
  const weatherUnsafe = operationTile?.decision_action !== "FLY";
  const isSpraying = droneState === "SPRAYING" && !sprayLocked;
  const countdown = formatCountdown(dashboard?.date || "", nextSafeSlot?.timestamp);
  const sceneWeather = getSceneWeather(operationTile);
  const activeRisk = translateRiskLevel(current?.risk_level ?? "LOW");

  const notificationItems = useMemo(
    () => buildRealNotifications({ dashboard, pipelineRun, syncing, lastSyncedAt }),
    [dashboard, pipelineRun, syncing, lastSyncedAt],
  );

  // === Handlers for safety config ===
  const updateRuleField = (key, value) => setRuleForm((f) => ({ ...f, [key]: value }));

  const saveDecisionRules = async () => {
    setSavingRules(true);
    setError("");
    try {
      const payload = {
        thresholds: ruleFields.reduce((p, f) => { p[f.key] = Number(ruleForm[f.key]); return p; }, {}),
        unsafe_weather_codes: decisionConfig?.unsafe_weather_codes ?? [],
      };
      const updatedConfig = await updateDecisionConfig(payload);
      setDecisionConfig(updatedConfig);
      setRuleForm(updatedConfig.thresholds ?? {});
      await loadDashboard(false);
      notify("Đã lưu cấu hình quy tắc và tính lại khuyến nghị.");
    } catch (e) {
      setError(e.message);
      notify(`Lưu quy tắc thất bại: ${e.message}`);
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
    } catch (e) {
      setError(e.message);
      notify(`Đưa quy tắc về mặc định thất bại: ${e.message}`);
    } finally {
      setSavingRules(false);
    }
  };

  // === Override handlers ===
  const handleOverrideDecision = async (e) => {
    e?.preventDefault();
    if (!overrideDecisionValue) { notify("Vui lòng chọn quyết định ghi đè."); return; }
    setSubmittingOverride(true);
    try {
      const rawWeather = {
        temperature_2m: current.weather?.temperature || 0,
        relative_humidity_2m: current.weather?.humidity || 0,
        precipitation: current.weather?.precipitation || 0,
        precipitation_probability: current.weather?.precipitation_probability || current.weather?.rain_probability || 0,
        wind_speed_10m: current.weather?.wind_speed || 0,
        wind_gusts_10m: current.weather?.wind_gust || 0,
        cloud_cover: current.weather?.cloud_cover || 0,
        visibility: current.weather?.visibility || 10000,
        weather_code: current.weather?.weather_code || 0,
        et0_fao_evapotranspiration: current.weather?.evapotranspiration || 0,
        soil_moisture_0_to_7cm: current.weather?.soil_moisture || 0,
        timestamp: current.timestamp || new Date().toISOString()
      };

      await overrideDecision({
        id: current.id,
        reason: `${overrideDecisionValue}: ${overrideNotes}`,
        weather: rawWeather,
        drone_model: droneModel || "DJI_T30",
        pesticide: pesticide || null,
        crop_stage: cropStage || null,
        hour: current.hour || null,
        plot_id: current.plot_id || null,
        mission_id: current.mission_id || null,
        location: locationId
      });
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
    // Slots duoc tinh lai moi moi lan load -> khoi phuc AI = reset UI + reload
    setSubmittingOverride(true);
    try {
      const aiDecision = current.decision_engine?.champion_score > 0.80 ? "FLY" : "DELAY";
      await overrideDecision(current.id, {
        override_decision: aiDecision,
        user_notes: "",
        was_human_overridden: false
      });
      setIsOverriding(false);
      setOverrideNotes("");
      setOverrideDecisionValue("");
      await loadDashboard(false, true);
      notify("Đã khôi phục quyết định đề xuất từ AI.");
    } catch (err) {
      notify(`Khôi phục thất bại: ${err.message}`);
    } finally {
      setSubmittingOverride(false);
    }
  };

  // === Drone handlers ===
  const launchDrone = () => {
    if (!operationTile.schedule_eligible) {
      notify(`Không thể cất cánh lúc ${operationTile.time}: ${actionConfig[operationTile.decision_action]?.title}.`);
      return;
    }
    setSprayLocked(false);
    setDroneState("FLYING");
    notify(`UAV-01 đã cất cánh theo dự báo lúc ${operationTile.time}.`);
  };

  const returnToStation = () => {
    setSprayLocked(true);
    setDroneState("RETURNING");
    notify("UAV-01 đang quay về trạm Dock 01.");
  };

  const value = {
    // Data
    locations, locationId, setLocationId, droneList, setDroneList, dashboard, slots, current, action, activeRisk,
    selectedSlot, setSelectedSlot, activeNav, setActiveNav, timelineTiles, analytics,
    operationTimestamp, setOperationTimestamp, operationTile, nextSafeSlot,
    canSchedule, decisionConfig, activeDecisionConfig, ruleForm, ruleSourceLabel,
    pipelineRun, aiTraining, aiTrainingRun, notificationItems,
    // Drone
    droneState, setDroneState, droneOpen, setDroneOpen, sprayLocked, setSprayLocked,
    isAirborne, weatherUnsafe, isSpraying, countdown, sceneWeather,
    launchDrone, returnToStation,
    // UI
    sidebarOpen, setSidebarOpen, notificationOpen, setNotificationOpen,
    missionOpen, setMissionOpen, mapModalOpen, setMapModalOpen,
    toast, error, syncing, savingRules, lastSyncedAt,
    slotViewMode, setSlotViewMode, farmSize, setFarmSize, distanceKm, setDistanceKm,
    droneModel, setDroneModel, pesticide, setPesticide, cropStage, setCropStage,
    // Chat
    chatOpen, setChatOpen, chatHistory, chatInput, setChatInput, isChatLoading, handleSendChatMessage,
    // Override
    isOverriding, setIsOverriding, overrideDecisionValue, setOverrideDecisionValue,
    overrideNotes, setOverrideNotes, submittingOverride, handleOverrideDecision, handleRevertToAi,
    // AI Training
    aiTrainingBusyStep, aiTrainingRefreshing,
    // Actions
    notify, loadDashboard, executePipelineRefresh, loadAiTraining,
    updateRuleField, saveDecisionRules, resetDecisionRules,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

export default AppContext;
