const dateFmt = { month: "short", day: "numeric" } as const;
const timeFmt = { hour: "numeric", minute: "2-digit" } as const;

export function formatDeadline(dateStr: string): { day: string; time: string } {
  const d = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // Date rolls over month ends correctly
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const dateText = d.toLocaleDateString("en-US", dateFmt);
  return {
    day: isTomorrow ? `${dateText} · Tomorrow` : dateText,
    time: d.toLocaleTimeString("en-US", timeFmt),
  };
}

/** "project_milestone" -> "Project Milestone" */
export function formatType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
