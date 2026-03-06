"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DailyRecord } from "@/lib/dailyService";
import { getAttendanceForDate } from "@/lib/dailyService";

interface DailyTableProps {
  data: DailyRecord[];
  allDates: string[]; // sorted unique dates across filtered records
  dateFromIdx: number;
  dateToIdx: number;
}

function AttendanceCell({ value }: { value: "Yes" | "No" | "" }) {
  if (value === "Yes")
    return (
      <span
        className="inline-block w-3 h-3 rounded-sm bg-[#53b078]"
        title="Attended"
      />
    );
  if (value === "No")
    return (
      <span
        className="inline-block w-3 h-3 rounded-sm bg-destructive"
        title="Absent"
      />
    );
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm bg-accent-foreground/20"
      title="Not enrolled yet"
    />
  );
}

function RateCell({ yes, possible }: { yes: number; possible: number }) {
  if (possible === 0) return <span className="text-muted-foreground/50">—</span>;
  const rate = Math.round((yes / possible) * 100);
  if (rate >= 80) return <Badge variant="default" className="text-xs">{rate}%</Badge>;
  if (rate >= 60) return <Badge variant="secondary" className="text-xs">{rate}%</Badge>;
  return <Badge variant="destructive" className="text-xs">{rate}%</Badge>;
}

export default function DailyTable({
  data,
  allDates,
  dateFromIdx,
  dateToIdx,
}: DailyTableProps) {
  const visibleDates = allDates.slice(dateFromIdx, dateToIdx + 1);

  // Precompute attendance map per record for fast lookup
  const attendanceMaps = useMemo(() => {
    return data.map((r) => {
      const map = new Map<string, "Yes" | "No" | "">();
      r.dates.forEach((d, i) => map.set(d, r.attendance[i]));
      return map;
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  // Per-student summary stats across ALL dates (not just visible range)
  const studentStats = data.map((r) => {
    const yes = r.attendance.filter((a) => a === "Yes").length;
    const possible = r.attendance.filter((a) => a !== "").length;
    return { yes, possible };
  });

  // Per-student stats within visible range
  const studentRangeStats = data.map((r, ri) => {
    const map = attendanceMaps[ri];
    let yes = 0;
    let possible = 0;
    for (const d of visibleDates) {
      const val = map.get(d) ?? "";
      if (val === "Yes") { yes++; possible++; }
      else if (val === "No") possible++;
    }
    return { yes, possible };
  });

  const thSticky =
    "px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap sticky bg-accent z-10 text-left";
  const thFixed =
    "px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap text-right bg-accent border-r";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Attendance Table</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#53b078]" /> Attended
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-destructive" /> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-accent-foreground/20" /> Not enrolled
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-accent">
                {/* Sticky identity columns */}
                <th className={`${thSticky} left-0 border-r`} style={{ minWidth: 140 }}>
                  Student
                </th>
                <th className={`${thSticky} left-[140px] border-r`} style={{ minWidth: 140 }}>
                  School
                </th>
                <th className={`${thSticky} left-[280px] border-r`} style={{ minWidth: 120 }}>
                  Activity
                </th>
                {/* Summary stat columns */}
                <th className={`${thFixed}`} style={{ minWidth: 72 }}>
                  Overall
                </th>
                <th className={`${thFixed} border-r-2`} style={{ minWidth: 72 }}>
                  In Range
                </th>
                {/* Date columns */}
                {visibleDates.map((d, i) => (
                  <th
                    key={i}
                    className="px-1 py-2 text-xs font-semibold text-muted-foreground bg-accent text-center"
                    style={{ minWidth: 44, maxWidth: 44 }}
                    title={d}
                  >
                    <span className="block truncate text-[10px] leading-tight">
                      {d.replace(/ \/ \w+$/, "")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => {
                const map = attendanceMaps[ri];
                const overall = studentStats[ri];
                const inRange = studentRangeStats[ri];
                return (
                  <tr
                    key={ri}
                    className="border-b hover:bg-accent/30 transition-colors"
                  >
                    <td
                      className="px-3 py-1.5 sticky left-0 bg-accent border-r font-medium"
                      style={{ minWidth: 140 }}
                    >
                      {row.studentName}
                    </td>
                    <td
                      className="px-3 py-1.5 sticky left-[140px] bg-accent border-r text-muted-foreground text-xs"
                      style={{ minWidth: 140 }}
                    >
                      {row.schoolName}
                    </td>
                    <td
                      className="px-3 py-1.5 sticky left-[280px] bg-accent border-r text-muted-foreground text-xs"
                      style={{ minWidth: 120 }}
                    >
                      {row.activity}
                    </td>
                    {/* Overall rate */}
                    <td className="px-2 py-1.5 text-right border-r" style={{ minWidth: 72 }}>
                      <RateCell yes={overall.yes} possible={overall.possible} />
                    </td>
                    {/* In-range rate */}
                    <td className="px-2 py-1.5 text-right border-r-2" style={{ minWidth: 72 }}>
                      <RateCell yes={inRange.yes} possible={inRange.possible} />
                    </td>
                    {/* Daily attendance cells */}
                    {visibleDates.map((d, di) => {
                      const val = map.get(d) ?? getAttendanceForDate(row, d);
                      return (
                        <td
                          key={di}
                          className="py-1.5 text-center"
                          style={{ minWidth: 44, maxWidth: 44 }}
                        >
                          <AttendanceCell value={val} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.length >= 200 && (
          <p className="text-xs text-muted-foreground text-center py-2 border-t">
            Showing first 200 rows — use filters to narrow results
          </p>
        )}
      </CardContent>
    </Card>
  );
}
