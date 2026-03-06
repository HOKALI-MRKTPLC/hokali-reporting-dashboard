"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeeklyRecord, WeeklyMetric } from "@/lib/weeklyService";
import { getMetricValue, isPercentMetric } from "@/lib/weeklyService";

interface WeeklyTableProps {
  data: WeeklyRecord[];
  metric: WeeklyMetric;
  weekFrom: number;
  weekTo: number;
}

function MetricCell({ value, isPct }: { value: number; isPct: boolean }) {
  if (!isPct) return <span>{value === 0 ? <span className="text-muted-foreground/50">—</span> : value}</span>;
  if (value === 0) return <span className="text-muted-foreground/50">—</span>;
  if (value >= 80) return <Badge variant="default" className="text-xs">{value}%</Badge>;
  if (value >= 60) return <Badge variant="secondary" className="text-xs">{value}%</Badge>;
  return <Badge variant="destructive" className="text-xs">{value}%</Badge>;
}

type SortCol = "latest" | "maxCapacity" | "totalEnrolled" | "waitroom" | number;

export default function WeeklyTable({ data, metric, weekFrom, weekTo }: WeeklyTableProps) {
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Weekly Stats Table</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPct = isPercentMetric(metric);
  const allWeeks = data[0].weeks;
  const visibleWeeks = allWeeks.slice(weekFrom, weekTo + 1);

  const getLatest = (record: WeeklyRecord) => {
    const sliced = record.weeks.slice(weekFrom, weekTo + 1);
    const rev = [...sliced].reverse().find((w) => getMetricValue(w, metric) > 0);
    return rev ? getMetricValue(rev, metric) : 0;
  };

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sortArrow = (col: SortCol) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const sorted = [...data].sort((a, b) => {
    let av = 0;
    let bv = 0;
    if (sortCol === "latest") { av = getLatest(a); bv = getLatest(b); }
    else if (sortCol === "maxCapacity") { av = a.maxCapacity; bv = b.maxCapacity; }
    else if (sortCol === "totalEnrolled") { av = a.totalEnrolled; bv = b.totalEnrolled; }
    else if (sortCol === "waitroom") { av = a.waitroom; bv = b.waitroom; }
    else if (typeof sortCol === "number") {
      const wi = sortCol - weekFrom;
      av = getMetricValue(a.weeks[weekFrom + wi] ?? a.weeks[0], metric);
      bv = getMetricValue(b.weeks[weekFrom + wi] ?? b.weeks[0], metric);
    } else {
      return 0;
    }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const thBase = "px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap text-right select-none cursor-pointer hover:text-foreground transition-colors";
  const thSticky = "px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap sticky bg-accent z-10";
  const thFixed = `${thBase} bg-accent border-r`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Stats Table</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[520px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-accent">
                {/* Sticky identity columns */}
                <th className={`${thSticky} left-0 text-left border-r`} style={{ minWidth: 110 }}>District</th>
                <th className={`${thSticky} left-[110px] text-left border-r`} style={{ minWidth: 160 }}>School</th>
                <th className={`${thSticky} left-[270px] text-left border-r`} style={{ minWidth: 140 }}>Activity</th>
                {/* Fixed summary columns */}
                <th className={thFixed} style={{ minWidth: 90 }} onClick={() => handleSort("maxCapacity")}>
                  Max Cap{sortArrow("maxCapacity")}
                </th>
                <th className={thFixed} style={{ minWidth: 90 }} onClick={() => handleSort("totalEnrolled")}>
                  Enrolled{sortArrow("totalEnrolled")}
                </th>
                <th className={`${thFixed} border-r-2`} style={{ minWidth: 90 }} onClick={() => handleSort("waitroom")}>
                  Waitroom{sortArrow("waitroom")}
                </th>
                {/* Weekly metric columns */}
                {visibleWeeks.map((w, i) => (
                  <th
                    key={i}
                    className={thBase}
                    style={{ minWidth: 90 }}
                    onClick={() => handleSort(weekFrom + i)}
                  >
                    {w.weekLabel}{sortArrow(weekFrom + i)}
                  </th>
                ))}
                <th
                  className={`${thBase} border-l font-bold text-foreground`}
                  style={{ minWidth: 80 }}
                  onClick={() => handleSort("latest")}
                >
                  Latest{sortArrow("latest")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const latest = getLatest(row);
                const enrollPct = row.maxCapacity > 0
                  ? Math.round((row.totalEnrolled / row.maxCapacity) * 100)
                  : 0;
                return (
                  <tr key={i} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2 sticky left-0 bg-accent border-r text-muted-foreground text-xs" style={{ minWidth: 110 }}>
                      {row.district || "—"}
                    </td>
                    <td className="px-3 py-2 sticky left-[110px] bg-accent border-r font-medium" style={{ minWidth: 160 }}>
                      {row.schoolName}
                    </td>
                    <td className="px-3 py-2 sticky left-[270px] bg-accent border-r text-muted-foreground" style={{ minWidth: 140 }}>
                      {row.activity}
                    </td>
                    {/* Fixed summary cells */}
                    <td className="px-3 py-2 text-right border-r" style={{ minWidth: 90 }}>
                      {row.maxCapacity || <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right border-r" style={{ minWidth: 90 }}>
                      <span className={enrollPct >= 80 ? "text-[#53b078] font-medium" : enrollPct >= 60 ? "text-[#d97706] font-medium" : ""}>
                        {row.totalEnrolled || <span className="text-muted-foreground/50">—</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right border-r-2" style={{ minWidth: 90 }}>
                      <span className={row.waitroom > 0 ? "text-[#d97706] font-medium" : "text-muted-foreground/50"}>
                        {row.waitroom > 0 ? row.waitroom : "—"}
                      </span>
                    </td>
                    {/* Weekly metric cells */}
                    {row.weeks.slice(weekFrom, weekTo + 1).map((w, wi) => (
                      <td key={wi} className="px-3 py-2 text-right" style={{ minWidth: 90 }}>
                        <MetricCell value={getMetricValue(w, metric)} isPct={isPct} />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right border-l font-medium" style={{ minWidth: 80 }}>
                      <MetricCell value={latest} isPct={isPct} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
