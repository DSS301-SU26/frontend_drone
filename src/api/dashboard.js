const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", ...options });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = payload.detail?.message ?? payload.detail ?? "Không thể kết nối Agricultural Drone Scheduler API.";
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return response.json();
}

export function getLocations() {
  return request("/api/locations");
}

export function getDashboard(location) {
  const params = new URLSearchParams({
    location,
    refresh: Date.now().toString(),
  });
  return request(`/api/dashboard?${params.toString()}`);
}

export function getDecisionConfig() {
  return request("/api/decision-config");
}

export function updateDecisionConfig(config) {
  return request("/api/decision-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export function resetDecisionConfig() {
  return request("/api/decision-config/reset", { method: "POST" });
}

export function runPipeline({ days = 3, skipUpload = false } = {}) {
  const params = new URLSearchParams({
    days: days.toString(),
    skip_upload: skipUpload ? "true" : "false",
  });
  return request(`/api/pipeline/run?${params.toString()}`, { method: "POST" });
}
