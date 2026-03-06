"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DayOfWeekRow } from "@/lib/dailyService";
import { DAY_ORDER } from "@/lib/dailyService";

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    setVisible(true);
  };

  return (
    <>
      <span ref={ref} onMouseEnter={show} onMouseLeave={() => setVisible(false)} className="cursor-default inline-flex items-center">
        <svg className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
      </span>
      {visible && (
        <div
          style={{ position: "fixed", left: coords.x, top: coords.y - 8, transform: "translate(-50%, -100%)", zIndex: 9999 }}
          className="w-56 rounded-md bg-popover border border-border shadow-md px-3 py-2 text-xs text-muted-foreground pointer-events-none font-normal text-left normal-case whitespace-normal break-words"
        >
          {text}
        </div>
      )}
    </>
  );
}

interface DayOfWeekTableProps {
  data: DayOfWeekRow[];
}

function RateCell({ rate, possible }: { rate: number; possible: number }) {
  if (possible === 0) return <span className="text-muted-foreground/40 text-xs">—</span>;
  if (rate >= 80) return <Badge variant="default" className="text-xs">{rate}%</Badge>;
  if (rate >= 60) return <Badge variant="secondary" className="text-xs">{rate}%</Badge>;
  return <Badge variant="destructive" className="text-xs">{rate}%</Badge>;
}

export default function DayOfWeekTable({ data }: DayOfWeekTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Day of Week Breakdown by School</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const thClass = "px-3 py-2 text-xs font-semibold text-muted-foreground text-right whitespace-nowrap";

  return (
    <div className="space-y-4">
      {/* Detailed breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle>Day of Week Breakdown by School</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-accent">
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-left sticky left-0 bg-accent z-10 whitespace-nowrap" style={{ minWidth: 180 }}>
                    School
                  </th>
                  {DAY_ORDER.map((day) => (
                    <th key={day} className={thClass} style={{ minWidth: 80 }}>
                      {day}
                    </th>
                  ))}
                  <th className={`${thClass} border-l`} style={{ minWidth: 80 }}>
                    Best Day
                  </th>
                  <th className={thClass} style={{ minWidth: 88 }}>
                    Worst Day
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2 font-medium sticky left-0 bg-accent border-r" style={{ minWidth: 180 }}>
                      {row.school}
                    </td>
                    {DAY_ORDER.map((day) => {
                      const stat = row.days[day];
                      const isBest = row.bestDay === day;
                      const isWorst = row.worstDay === day;
                      return (
                        <td
                          key={day}
                          className={`px-3 py-2 text-right ${isBest ? "bg-primary/5" : isWorst ? "bg-destructive/5" : ""}`}
                          style={{ minWidth: 80 }}
                        >
                          <RateCell rate={stat.rate} possible={stat.possible} />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right border-l" style={{ minWidth: 80 }}>
                      {row.bestDay ? (
                        <span className="text-xs font-semibold text-primary">{row.bestDay}</span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right" style={{ minWidth: 88 }}>
                      {row.worstDay ? (
                        <span className="text-xs font-semibold text-destructive">{row.worstDay}</span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary table: best vs worst day per school */}
      <Card>
        <CardHeader>
          <CardTitle>Best vs Worst Day Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-accent">
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-left sticky left-0 bg-accent z-10 whitespace-nowrap" style={{ minWidth: 180 }}>
                    School
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center whitespace-nowrap">Best Day</th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center whitespace-nowrap">Best Rate</th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center whitespace-nowrap">Worst Day</th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center whitespace-nowrap">Worst Rate</th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      Gap
                      <InfoTooltip text="Percentage point difference between the best and worst attendance day for that school. A high gap means attendance varies significantly by day of the week." />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const bestRate = row.bestDay ? row.days[row.bestDay].rate : null;
                  const worstRate = row.worstDay ? row.days[row.worstDay].rate : null;
                  const gap = bestRate !== null && worstRate !== null ? bestRate - worstRate : null;
                  return (
                    <tr key={i} className="border-b hover:bg-accent/30 transition-colors">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-accent border-r" style={{ minWidth: 180 }}>
                        {row.school}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.bestDay
                          ? <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{row.bestDay}</span>
                          : <span className="text-muted-foreground/40 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {bestRate !== null ? <RateCell rate={bestRate} possible={1} /> : <span className="text-muted-foreground/40 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.worstDay
                          ? <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">{row.worstDay}</span>
                          : <span className="text-muted-foreground/40 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {worstRate !== null ? <RateCell rate={worstRate} possible={1} /> : <span className="text-muted-foreground/40 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {gap !== null ? (
                          <span className={`text-xs font-semibold ${gap >= 20 ? "text-destructive" : gap >= 10 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {gap > 0 ? `+${gap}` : gap}pp
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
