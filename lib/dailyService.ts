// Daily Attendance Service
// Parses daily_attendance.xlsx: one tab per school, multiple sections per tab (one per activity)

export interface DailyRecord {
  externalId: string;
  studentName: string;
  district: string;
  schoolName: string;
  county: string;
  activity: string;
  bookingId: string;
  grade: string;
  category: string;
  type: string;
  dates: string[];
  sessionIds: string[];
  attendance: ("Yes" | "No" | "")[];
}

export interface DailyChartPoint {
  weekLabel: string;
  [activity: string]: string | number;
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

function isBlankRow(row: unknown[]): boolean {
  return row.every((cell) => !String(cell ?? "").trim());
}

// A section header row has pipe-separated content in col 0, all other cells empty
// (XLSX reads merged cells: only the first cell has the value)
function isSectionHeader(row: unknown[]): boolean {
  const first = String(row[0] ?? "").trim();
  return (
    first.split("|").length >= 3 &&
    row.slice(1).every((c) => !String(c ?? "").trim())
  );
}

function parseDailySheet(rows: unknown[][], sheetName: string): DailyRecord[] {
  const records: DailyRecord[] = [];
  let i = 0;

  while (i < rows.length) {
    const row = rows[i] as unknown[];

    if (!isSectionHeader(row)) {
      i++;
      continue;
    }

    // Parse section header: "Activity | Category | Type | Schedule | BookingID | Grade(s): ..."
    const parts = String(row[0]).split("|").map((s) => s.trim());
    const activity = parts[0] ?? "";
    const category = parts[1] ?? "";
    const type = parts[2] ?? "";
    const bookingId = parts[4] ?? "";
    const gradeRaw = parts[5] ?? "";
    const grade = gradeRaw.replace(/^Grade\(s\):\s*/i, "").trim();

    i++;

    // Skip blank rows to reach the column header row
    while (i < rows.length && isBlankRow(rows[i])) i++;
    if (i >= rows.length) break;

    // Column header row — find key column indices
    const colRow = (rows[i] as unknown[]).map((c) => String(c ?? "").trim());
    const extIdIdx = colRow.findIndex((c) => c === "External ID");
    const nameIdx = colRow.findIndex((c) => c === "Student Name");
    const districtIdx = colRow.findIndex((c) => c === "District");
    const countyIdx = colRow.findIndex((c) => c === "County");
    const typeIdx = colRow.findIndex((c) => c === "Type");

    if (extIdIdx === -1 || typeIdx === -1) {
      i++;
      continue;
    }

    // Everything after "Type" column is a date column
    const dateStart = typeIdx + 1;
    // Row 1 (dark blue): date + weekday headers, e.g. "Sep 03 / Wed"
    const rawDateCols = colRow.slice(dateStart);
    i++; // advance to session ID row (row 2)
    if (i >= rows.length) break;
    // Row 2 (lighter blue): session IDs only, e.g. "SS-000756"
    const sessionIdRow = (rows[i] as unknown[]).map((c) => String(c ?? "").trim());
    i++; // advance past session ID row to student data

    const dates: string[] = [];
    const sessionIds: string[] = [];
    for (let j = 0; j < rawDateCols.length; j++) {
      const dateVal = String(rawDateCols[j] ?? "").trim();
      if (!dateVal) continue;
      dates.push(dateVal);
      sessionIds.push(sessionIdRow[dateStart + j] ?? "");
    }

    // Parse student rows until 2 consecutive blank rows or a new section header
    while (i < rows.length) {
      const sRow = rows[i] as unknown[];

      if (isSectionHeader(sRow)) break;

      if (isBlankRow(sRow)) {
        const nextIsBlankOrEnd =
          i + 1 >= rows.length || isBlankRow(rows[i + 1]);
        if (nextIsBlankOrEnd) {
          i += 2;
          break;
        }
        i++;
        continue;
      }

      const externalId = String(sRow[extIdIdx] ?? "").trim();
      if (!externalId) {
        i++;
        continue;
      }

      const attendance: ("Yes" | "No" | "")[] = sRow
        .slice(dateStart)
        .map((v) => {
          const s = String(v ?? "").trim();
          if (s === "Yes") return "Yes";
          if (s === "No") return "No";
          return "";
        });

      records.push({
        externalId,
        studentName: String(sRow[nameIdx] ?? ""),
        district: String(sRow[districtIdx] ?? "").trim(),
        schoolName: sheetName,
        county: String(sRow[countyIdx] ?? "").trim(),
        activity,
        bookingId,
        grade,
        category,
        type,
        dates,
        sessionIds,
        attendance,
      });

      i++;
    }
  }

  return records;
}

export function parseDailyAttendance(
  sheets: { name: string; rows: unknown[][] }[]
): DailyRecord[] {
  return sheets.flatMap(({ name, rows }) => parseDailySheet(rows, name));
}

// ── Filter & option helpers ───────────────────────────────────────────────────

export function getDailyOptions(records: DailyRecord[]) {
  const schools = Array.from(new Set(records.map((r) => r.schoolName))).sort();
  const activities = Array.from(
    new Set(records.map((r) => r.activity).filter(Boolean))
  ).sort();
  const districts = Array.from(
    new Set(records.filter((r) => r.district).map((r) => r.district))
  ).sort();
  const categories = Array.from(
    new Set(records.map((r) => r.category).filter(Boolean))
  ).sort();
  const grades = Array.from(
    new Set(records.map((r) => r.grade).filter(Boolean))
  ).sort();
  const bookingIds = Array.from(
    new Set(records.map((r) => r.bookingId).filter(Boolean))
  ).sort();
  return { schools, activities, districts, categories, grades, bookingIds };
}

export function filterDaily(
  records: DailyRecord[],
  schools: string[],
  activity: string,
  districts: string[],
  category: string,
  grades: string[] = [],
  bookingIds: string[] = []
): DailyRecord[] {
  return records.filter((r) => {
    if (schools.length > 0 && !schools.includes(r.schoolName)) return false;
    if (activity !== "all" && r.activity !== activity) return false;
    if (districts.length > 0 && !districts.includes(r.district)) return false;
    if (category !== "all" && r.category !== category) return false;
    if (grades.length > 0 && !grades.includes(r.grade)) return false;
    if (bookingIds.length > 0 && !bookingIds.includes(r.bookingId)) return false;
    return true;
  });
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export function getDailyMetrics(records: DailyRecord[]) {
  const totalStudents = records.length;
  let totalYes = 0;
  let totalPossible = 0;

  for (const r of records) {
    for (const a of r.attendance) {
      if (a === "Yes") { totalYes++; totalPossible++; }
      else if (a === "No") totalPossible++;
    }
  }

  const overallRate =
    totalPossible > 0 ? Math.round((totalYes / totalPossible) * 100) : 0;

  const atRisk = records.filter((r) => {
    const yes = r.attendance.filter((a) => a === "Yes").length;
    const possible = r.attendance.filter((a) => a !== "").length;
    return possible > 0 && (yes / possible) * 100 < 60;
  }).length;

  return { totalStudents, overallRate, atRisk, totalPresent: totalYes };
}

// ── Date utilities ────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function parseDateLabel(label: string): Date | null {
  const match = label.match(/([A-Za-z]+)\s+(\d+)/);
  if (!match) return null;
  const month = MONTH_MAP[match[1]];
  if (month === undefined) return null;
  const day = parseInt(match[2]);
  // Sep–Dec → 2025, Jan+ → 2026
  const year = month >= 8 ? 2025 : 2026;
  return new Date(year, month, day);
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow)); // Monday
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(weekKey: string): string {
  const [y, m, d] = weekKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Normalize a date label by stripping any trailing session ID.
// Handles both formats:
//   slash-separated: "Sep 03 / Wed / SS-000756" → "Sep 03 / Wed"
//   space-separated: "Feb 13 Fri SS-000135"     → "Feb 13 Fri"
function normalizeDateLabel(d: string): string {
  if (d.includes("/")) {
    return d.split("/").map((s) => s.trim()).slice(0, 2).join(" / ");
  }
  return d.replace(/\s+SS-\d+$/i, "").trim();
}

// Sorted unique dates across all filtered records
export function getUniqueDates(records: DailyRecord[]): string[] {
  const set = new Set<string>();
  records.forEach((r) => r.dates.forEach((d) => set.add(normalizeDateLabel(d))));
  return Array.from(set).sort((a, b) => {
    const da = parseDateLabel(a);
    const db = parseDateLabel(b);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });
}

// Get attendance value for a specific (record, date) pair
export function getAttendanceForDate(
  record: DailyRecord,
  date: string
): "Yes" | "No" | "" {
  const normalized = normalizeDateLabel(date);
  const idx = record.dates.findIndex((d) => normalizeDateLabel(d) === normalized);
  if (idx === -1) return "";
  return record.attendance[idx];
}

// ── Day of week analysis ──────────────────────────────────────────────────────

export const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type DayKey = (typeof DAY_ORDER)[number];

function getDayLabel(dateLabel: string): DayKey | null {
  // "Sep 01 / Mon" → "Mon"
  const match = dateLabel.match(/\/\s*([A-Za-z]{3})$/);
  if (match) {
    const d = match[1] as DayKey;
    return (DAY_ORDER as readonly string[]).includes(d) ? d : null;
  }
  // Fallback: parse full date
  const date = parseDateLabel(dateLabel);
  if (!date) return null;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = days[date.getDay()] as DayKey;
  return (DAY_ORDER as readonly string[]).includes(d) ? d : null;
}

export interface DayStats {
  attended: number;
  possible: number;
  rate: number; // 0-100
}

export interface DayOfWeekRow {
  school: string;
  days: Record<DayKey, DayStats>;
  bestDay: DayKey | "";
  worstDay: DayKey | "";
}

export function getDayOfWeekStats(records: DailyRecord[]): DayOfWeekRow[] {
  const schoolMap = new Map<string, Record<string, { attended: number; possible: number }>>();

  for (const r of records) {
    if (!schoolMap.has(r.schoolName)) schoolMap.set(r.schoolName, {});
    const sd = schoolMap.get(r.schoolName)!;

    for (let i = 0; i < r.dates.length; i++) {
      const day = getDayLabel(r.dates[i]);
      if (!day) continue;
      if (!sd[day]) sd[day] = { attended: 0, possible: 0 };
      const val = r.attendance[i];
      if (val === "Yes") { sd[day].attended++; sd[day].possible++; }
      else if (val === "No") sd[day].possible++;
    }
  }

  return Array.from(schoolMap.entries())
    .map(([school, dayData]) => {
      let bestDay: DayKey | "" = "";
      let bestRate = -1;
      let worstDay: DayKey | "" = "";
      let worstRate = 101;
      const days = {} as Record<DayKey, DayStats>;

      for (const day of DAY_ORDER) {
        const d = dayData[day] ?? { attended: 0, possible: 0 };
        const rate = d.possible > 0 ? Math.round((d.attended / d.possible) * 100) : 0;
        days[day] = { ...d, rate };
        if (d.possible > 0 && rate > bestRate) { bestRate = rate; bestDay = day; }
        if (d.possible > 0 && rate < worstRate) { worstRate = rate; worstDay = day; }
      }

      return { school, days, bestDay, worstDay };
    })
    .sort((a, b) => a.school.localeCompare(b.school));
}

// Aggregated (across all filtered records) for the overview bar/line chart
export interface AggregatedDayStats {
  day: DayKey;
  attended: number;
  possible: number;
  rate: number;
}

export function getAggregatedDayStats(records: DailyRecord[]): AggregatedDayStats[] {
  const dayData: Record<string, { attended: number; possible: number }> = {};

  for (const r of records) {
    for (let i = 0; i < r.dates.length; i++) {
      const day = getDayLabel(r.dates[i]);
      if (!day) continue;
      if (!dayData[day]) dayData[day] = { attended: 0, possible: 0 };
      const val = r.attendance[i];
      if (val === "Yes") { dayData[day].attended++; dayData[day].possible++; }
      else if (val === "No") dayData[day].possible++;
    }
  }

  return DAY_ORDER.map((day) => {
    const d = dayData[day] ?? { attended: 0, possible: 0 };
    return { day, ...d, rate: d.possible > 0 ? Math.round((d.attended / d.possible) * 100) : 0 };
  });
}

// ── Chart data ────────────────────────────────────────────────────────────────

// Build weekly % attendance per activity for the chart
export function buildDailyChartData(
  records: DailyRecord[],
  visibleDates: string[] // already sliced to the selected date range
): DailyChartPoint[] {
  if (records.length === 0 || visibleDates.length === 0) return [];

  const activities = Array.from(new Set(records.map((r) => r.activity)));

  // Group visible dates by ISO week (Monday key)
  const weekMap = new Map<string, string[]>();
  for (const d of visibleDates) {
    const date = parseDateLabel(d);
    if (!date) continue;
    const key = getWeekKey(date);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(d);
  }

  const result: DailyChartPoint[] = [];

  for (const [weekKey, weekDates] of weekMap) {
    const point: DailyChartPoint = { weekLabel: formatWeekLabel(weekKey) };

    for (const act of activities) {
      const actRecords = records.filter((r) => r.activity === act);
      let yes = 0;
      let possible = 0;

      for (const r of actRecords) {
        for (const date of weekDates) {
          const val = getAttendanceForDate(r, date);
          if (val === "Yes") { yes++; possible++; }
          else if (val === "No") possible++;
        }
      }

      point[act] = possible > 0 ? Math.round((yes / possible) * 100) : 0;
    }

    result.push(point);
  }

  return result;
}
