"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, X, CheckCircle2, Loader2 } from "lucide-react";
import type { AttendanceRecord } from "@/lib/dataService";
import type { WeeklyRecord } from "@/lib/weeklyService";
import type { DailyRecord } from "@/lib/dailyService";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FileUploadProps {
  onAttendanceLoaded: (data: AttendanceRecord[]) => void;
  onWeeklyLoaded: (records: WeeklyRecord[]) => void;
  onDailyLoaded: (records: DailyRecord[]) => void;
}

interface ZoneState {
  fileName: string | null;
  error: string | null;
  dragging: boolean;
  loading: boolean;
}

export default function FileUpload({ onAttendanceLoaded, onWeeklyLoaded, onDailyLoaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [attendanceState, setAttendanceState] = useState<ZoneState>({ fileName: null, error: null, dragging: false, loading: false });
  const [weeklyState, setWeeklyState] = useState<ZoneState>({ fileName: null, error: null, dragging: false, loading: false });
  const [dailyState, setDailyState] = useState<ZoneState>({ fileName: null, error: null, dragging: false, loading: false });
  const [draggingOver, setDraggingOver] = useState(false);

  const processAttendance = async (file: File) => {
    setAttendanceState((s) => ({ ...s, loading: true, error: null }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/upload/attendance`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { records } = await res.json();
      if (records.length === 0) {
        setAttendanceState((s) => ({ ...s, loading: false, error: "No valid rows found. Check column headers." }));
        return;
      }
      setAttendanceState({ fileName: file.name, error: null, dragging: false, loading: false });
      onAttendanceLoaded(records);
    } catch {
      setAttendanceState((s) => ({ ...s, loading: false, error: "Failed to upload file." }));
    }
  };

  const processWeekly = async (file: File) => {
    setWeeklyState((s) => ({ ...s, loading: true, error: null }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/upload/weekly`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { records } = await res.json();
      if (records.length === 0) {
        setWeeklyState((s) => ({ ...s, loading: false, error: "No valid rows found. Check the weekly_stats format." }));
        return;
      }
      setWeeklyState({ fileName: file.name, error: null, dragging: false, loading: false });
      onWeeklyLoaded(records);
    } catch {
      setWeeklyState((s) => ({ ...s, loading: false, error: "Failed to upload file." }));
    }
  };

  const processDaily = async (file: File) => {
    setDailyState((s) => ({ ...s, loading: true, error: null }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/upload/daily`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { records } = await res.json();
      if (records.length === 0) {
        setDailyState((s) => ({ ...s, loading: false, error: "No valid student rows found. Check the daily_attendance format." }));
        return;
      }
      setDailyState({ fileName: file.name, error: null, dragging: false, loading: false });
      onDailyLoaded(records);
    } catch {
      setDailyState((s) => ({ ...s, loading: false, error: "Failed to upload file." }));
    }
  };

  const autoRoute = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return;
    const name = file.name.toLowerCase();
    if (name.includes("daily")) processDaily(file);
    else if (name.includes("weekly")) processWeekly(file);
    else processAttendance(file);
  };

  const handleFiles = (files: File[]) => files.forEach((f) => autoRoute(f));

  const clearAttendance = () => {
    setAttendanceState({ fileName: null, error: null, dragging: false, loading: false });
    onAttendanceLoaded([]);
  };
  const clearWeekly = () => {
    setWeeklyState({ fileName: null, error: null, dragging: false, loading: false });
    onWeeklyLoaded([]);
  };
  const clearDaily = () => {
    setDailyState({ fileName: null, error: null, dragging: false, loading: false });
    onDailyLoaded([]);
  };

  const loadedCount = [attendanceState, weeklyState, dailyState].filter((s) => s.fileName).length;
  const allLoaded = loadedCount === 3;

  const fileRows: {
    label: string;
    hint: string;
    state: ZoneState;
    onClear: () => void;
  }[] = [
    { label: "School Records", hint: "school_records.xlsx", state: attendanceState, onClear: clearAttendance },
    { label: "Weekly Stats", hint: "weekly_stats.xlsx", state: weeklyState, onClear: clearWeekly },
    { label: "Daily Attendance", hint: "daily_attendance.xlsx", state: dailyState, onClear: clearDaily },
  ];

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Combined drop zone */}
        <div
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer
            ${draggingOver ? "border-primary bg-primary/5" : allLoaded ? "border-primary/40 bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDraggingOver(false);
            handleFiles(Array.from(e.dataTransfer.files));
          }}
        >
          {allLoaded ? (
            <CheckCircle2 className="h-7 w-7 text-primary" />
          ) : (
            <Upload className="h-7 w-7 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-semibold">
              {allLoaded ? "All files loaded" : "Drop all files here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Select up to 3 files at once &mdash; school_records &middot; weekly_stats &middot; daily_attendance
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) handleFiles(files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Per-file status rows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {fileRows.map(({ label, hint, state, onClear }) => (
            <div
              key={label}
              className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors
                ${state.fileName ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}
            >
              {state.loading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
              ) : state.fileName ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate leading-tight ${state.fileName ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {state.loading ? "Uploading..." : state.fileName ?? hint}
                </p>
                {state.error && (
                  <p className="text-xs text-destructive leading-tight">{state.error}</p>
                )}
              </div>
              {state.fileName && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(); }}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
