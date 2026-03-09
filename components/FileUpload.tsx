"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Download,
} from "lucide-react";
import type { AttendanceRecord } from "@/lib/dataService";
import type { WeeklyRecord } from "@/lib/weeklyService";
import type { DailyRecord } from "@/lib/dailyService";

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

interface FileMeta {
  exists: boolean;
  uploadedAt?: string;
  filename?: string;
  recordCount?: number;
}

interface StoredStatus {
  attendance: FileMeta;
  weekly: FileMeta;
  daily: FileMeta;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function FileUpload({
  onAttendanceLoaded,
  onWeeklyLoaded,
  onDailyLoaded,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [attendanceState, setAttendanceState] = useState<ZoneState>({ fileName: null, error: null, dragging: false, loading: false });
  const [weeklyState, setWeeklyState] = useState<ZoneState>({ fileName: null, error: null, dragging: false, loading: false });
  const [dailyState, setDailyState] = useState<ZoneState>({ fileName: null, error: null, dragging: false, loading: false });
  const [draggingOver, setDraggingOver] = useState(false);

  const [storedStatus, setStoredStatus] = useState<StoredStatus | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState(false);

  // Check for stored files on mount
  useEffect(() => {
    fetch("/api/files/status")
      .then((r) => r.json())
      .then((status: StoredStatus) => {
        const anyExists = status.attendance.exists || status.weekly.exists || status.daily.exists;
        if (anyExists) setStoredStatus(status);
      })
      .catch(() => {}); // Silently fail — restore is optional
  }, []);

  const processAttendance = async (file: File) => {
    setAttendanceState((s) => ({ ...s, loading: true, error: null }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/upload/attendance`, { method: "POST", body: formData });
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
      const res = await fetch(`/api/upload/weekly`, { method: "POST", body: formData });
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
      const res = await fetch(`/api/upload/daily`, { method: "POST", body: formData });
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

  const clearAttendance = () => { setAttendanceState({ fileName: null, error: null, dragging: false, loading: false }); onAttendanceLoaded([]); };
  const clearWeekly = () => { setWeeklyState({ fileName: null, error: null, dragging: false, loading: false }); onWeeklyLoaded([]); };
  const clearDaily = () => { setDailyState({ fileName: null, error: null, dragging: false, loading: false }); onDailyLoaded([]); };

  const handleRestore = async () => {
    if (!storedStatus) return;
    setRestoring(true);
    try {
      const fetches: Promise<void>[] = [];

      if (storedStatus.attendance.exists) {
        fetches.push(
          fetch("/api/files/attendance/data").then((r) => r.json()).then(({ records }) => {
            if (records?.length) {
              setAttendanceState({ fileName: storedStatus.attendance.filename ?? "attendance.xlsx", error: null, dragging: false, loading: false });
              onAttendanceLoaded(records);
            }
          })
        );
      }
      if (storedStatus.weekly.exists) {
        fetches.push(
          fetch("/api/files/weekly/data").then((r) => r.json()).then(({ records }) => {
            if (records?.length) {
              setWeeklyState({ fileName: storedStatus.weekly.filename ?? "weekly.xlsx", error: null, dragging: false, loading: false });
              onWeeklyLoaded(records);
            }
          })
        );
      }
      if (storedStatus.daily.exists) {
        fetches.push(
          fetch("/api/files/daily/data").then((r) => r.json()).then(({ records }) => {
            if (records?.length) {
              setDailyState({ fileName: storedStatus.daily.filename ?? "daily.xlsx", error: null, dragging: false, loading: false });
              onDailyLoaded(records);
            }
          })
        );
      }

      await Promise.all(fetches);
      setRestored(true);
    } catch {
      // Silently fail — user can still upload manually
    } finally {
      setRestoring(false);
    }
  };

  const loadedCount = [attendanceState, weeklyState, dailyState].filter((s) => s.fileName).length;
  const allLoaded = loadedCount === 3;

  const fileRows: { label: string; hint: string; state: ZoneState; type: string; onClear: () => void }[] = [
    { label: "School Records", hint: "school_records.xlsx", state: attendanceState, type: "attendance", onClear: clearAttendance },
    { label: "Weekly Stats", hint: "weekly_stats.xlsx", state: weeklyState, type: "weekly", onClear: clearWeekly },
    { label: "Daily Attendance", hint: "daily_attendance.xlsx", state: dailyState, type: "daily", onClear: clearDaily },
  ];

  const storedRows = storedStatus
    ? [
        { label: "School Records", type: "attendance", meta: storedStatus.attendance },
        { label: "Weekly Stats", type: "weekly", meta: storedStatus.weekly },
        { label: "Daily Attendance", type: "daily", meta: storedStatus.daily },
      ].filter((r) => r.meta.exists)
    : [];

  return (
    <div className="space-y-3">
      {/* Restore last session banner */}
      {storedStatus && storedRows.length > 0 && !restored && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">Stored data available</p>
                <p className="text-xs text-muted-foreground">
                  Previously uploaded files are stored on the server. Restore to load them instantly.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  {storedRows.map(({ label, type, meta }) => (
                    <span key={type} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <FileSpreadsheet size={11} />
                      <span>{label}</span>
                      {meta.uploadedAt && (
                        <span className="text-muted-foreground/60">· {formatDate(meta.uploadedAt)}</span>
                      )}
                      {meta.recordCount !== undefined && (
                        <span className="text-muted-foreground/60">· {meta.recordCount} records</span>
                      )}
                      <a
                        href={`/api/files/${type}/download`}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="ml-1 text-primary hover:text-primary/70 transition-colors"
                        title={`Download ${label}`}
                      >
                        <Download size={11} />
                      </a>
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
              >
                {restoring ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                {restoring ? "Restoring..." : "Restore session"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* Combined drop zone */}
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer
              ${draggingOver ? "border-primary bg-primary/5" : allLoaded ? "border-primary/40 bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={(e) => { e.preventDefault(); setDraggingOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
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
                    {state.loading ? "Uploading..." : (state.fileName ?? hint)}
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
    </div>
  );
}
