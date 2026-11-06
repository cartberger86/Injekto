import { newId } from "./id";
const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const stamp = (t: number) =>
  new Date(t)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
function fold(s: string) {
  let lines: string[] = [];
  let part = "";
  let bytes = 0;
  for (const c of s) {
    const n = new TextEncoder().encode(c).length;
    if (bytes + n > 73) {
      lines.push(part);
      part = " ";
      bytes = 1;
    }
    part += c;
    bytes += n;
  }
  lines.push(part);
  return lines.join("\r\n");
}
export function calendarICS(at: number, details?: string) {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Injekto-log//DE",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${newId()}@injektionstagebuch.local`,
      `DTSTAMP:${stamp(Date.now())}`,
      `DTSTART:${stamp(at)}`,
      `DTEND:${stamp(at + 15 * 60000)}`,
      `SUMMARY:${esc("Persönlicher Protokolltermin")}`,
      `DESCRIPTION:${esc("Termin laut persönlich eingetragenem Zeitplan. Keine Dosierungsempfehlung." + (details ? " " + details : ""))}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}
export function downloadFile(name: string, body: string, type: string) {
  const a = document.createElement("a");
  const u = URL.createObjectURL(new Blob([body], { type }));
  a.href = u;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
