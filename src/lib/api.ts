export async function logMealsText(text: string) {
  const res = await fetch("http://localhost:3000/api/log-text", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: text
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDashboardAnalytics() {
  const response = await fetch("http://localhost:3000/api/dashboard/analytics");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function getGoals() {
  const response = await fetch("http://localhost:3000/api/goals");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function addGoal(goal_type: string, goal_value: number, goal_notes: string) {
  const response = await fetch("http://localhost:3000/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal_type, goal_value, goal_notes }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
