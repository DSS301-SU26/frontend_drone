const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? "Không thể kết nối Agricultural Drone Scheduler API.");
  }
  return response.json();
}

export function getLocations() {
  return request("/api/locations");
}

export function getDashboard(location) {
  return request(`/api/dashboard?location=${encodeURIComponent(location)}`);
}
