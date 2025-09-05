export async function logMealsText(text: string) {
  const res = await fetch("http://localhost:3001/api/log-text", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: text
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
