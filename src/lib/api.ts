export const API_BASE = ((): string => {
  // Prefer explicit base, then hostname-based fallback (handles remote/dev containers)
  const explicit = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (explicit) return explicit.replace(/\/$/, "");
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = (import.meta as any).env?.VITE_API_PORT ?? "3000";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  return `${protocol}//${host}:${port}`;
})();

export async function logMealsText(text: string) {
  const res = await fetch(`${API_BASE}/api/log-text`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: text
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDashboardAnalytics() {
  const response = await fetch(`${API_BASE}/api/dashboard/analytics`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function getGoals() {
  const response = await fetch(`${API_BASE}/api/goals`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function addGoal(goal_type: string, goal_value: number, goal_notes: string) {
  const response = await fetch(`${API_BASE}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal_type, goal_value, goal_notes }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
