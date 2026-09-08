export function pickField(row: object, ...keys: string[]): string {
  const rec = row as Record<string, unknown>;
  for (const key of keys) {
    const value = rec[key];
    if (value != null && value !== "") return String(value);
  }
  return "—";
}
