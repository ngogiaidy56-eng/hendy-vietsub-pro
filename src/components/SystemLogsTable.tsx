import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Volume2,
  Film,
  Subtitles,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { SystemLogEntry, SubsystemType } from '../types/logs';

interface SystemLogsTableProps {
  logs: SystemLogEntry[];
  onClearLogs?: () => void;
  onAddTestLog?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const SystemLogsTable: React.FC<SystemLogsTableProps> = ({
  logs,
  onClearLogs,
  onAddTestLog,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<'ALL' | SubsystemType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filtered log entries
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSubsystem =
        selectedSubsystem === 'ALL' || log.subsystem === selectedSubsystem;
      const matchQuery =
        !searchQuery ||
        log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subsystemLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.timestamp.includes(searchQuery);
      return matchSubsystem && matchQuery;
    });
  }, [logs, selectedSubsystem, searchQuery]);

  // Export logs as CSV
  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Subsystem', 'Event', 'Status', 'LatencyMs', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.subsystemLabel}"`,
      `"${l.event.replace(/"/g, '""')}"`,
      `"${l.statusLabel}"`,
      l.latencyMs !== undefined ? l.latencyMs : '',
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `system_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSubsystemIcon = (subsystem: SubsystemType) => {
    switch (subsystem) {
      case 'AI_ENGINE':
        return <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
      case 'AUDIO_BUS':
        return <Volume2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'TIMELINE':
        return <Film className="w-3.5 h-3.5 text-blue-400" />;
      case 'SUBTITLES':
        return <Subtitles className="w-3.5 h-3.5 text-amber-400" />;
      case 'PIPELINE':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: SystemLogEntry['status'], label: string) => {
    switch (status) {
      case 'nominal':
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{label}</span>
          </span>
        );
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{label}</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-cyan-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{label}</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 text-indigo-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>{label}</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{label}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>{label}</span>
          </span>
        );
    }
  };

  const tabs: { id: 'ALL' | SubsystemType; label: string }[] = [
    { id: 'ALL', label: 'All Operations' },
    { id: 'AI_ENGINE', label: 'AI Synthesis' },
    { id: 'AUDIO_BUS', label: 'Audio Matrix' },
    { id: 'TIMELINE', label: 'Timeline & Clips' },
    { id: 'SUBTITLES', label: 'Vietsub Engine' },
  ];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800/90 shadow-lg shadow-black/20 flex flex-col overflow-hidden text-xs">
      {/* Control Bar Header */}
      <div className="h-10 px-3 sm:px-4 bg-[#111c35] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Section Title & Health Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs tracking-tight">
                System Operations & Activity Stream
              </span>
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Synchronized
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-400">
                  {filteredLogs.length} events
                </span>
              </div>
            </div>
          </div>

          {/* Subsystem Filter Segmented Tabs */}
          <div className="hidden lg:flex items-center gap-0.5 p-0.5 bg-slate-900/80 rounded-lg border border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSubsystem(tab.id)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  selectedSubsystem === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search, Actions, View Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 lg:w-44 h-7 pl-8 pr-2.5 bg-slate-900/90 border border-slate-800 rounded-md text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            title="Export filtered logs to CSV"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span className="hidden xl:inline">Export CSV</span>
          </button>

          {/* Clear Logs Button */}
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="h-7 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              title="Clear log history"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          {/* Expand / Collapse Height Toggle */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="h-7 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 transition-colors"
              title={isExpanded ? 'Minimize Table' : 'Expand Table'}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xl:inline text-[11px]">Compact</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xl:inline text-[11px]">Expand</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* High-Readability Data Table Container */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto min-h-0 bg-[#0b1120]"
      >
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="sticky top-0 bg-[#0f172a] z-10 border-b border-slate-800/90 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            <tr>
              <th className="py-2 px-3 w-28">Timestamp</th>
              <th className="py-2 px-3 w-36">Subsystem</th>
              <th className="py-2 px-3 w-48">Event Action</th>
              <th className="py-2 px-3 w-32">Status</th>
              <th className="py-2 px-3 w-20 text-right">Latency</th>
              <th className="py-2 px-3">Telemetry / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60 font-sans text-xs">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-900/60 transition-colors group"
                >
                  {/* Timestamp */}
                  <td className="py-1.5 px-3 font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  {/* Subsystem */}
                  <td className="py-1.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      {getSubsystemIcon(log.subsystem)}
                      <span className="font-medium">{log.subsystemLabel}</span>
                    </div>
                  </td>

                  {/* Event Name */}
                  <td className="py-1.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-200 text-[11px]">
                      {log.event}
                    </span>
                  </td>

                  {/* Status Indicator */}
                  <td className="py-1.5 px-3 whitespace-nowrap text-[11px]">
                    {getStatusBadge(log.status, log.statusLabel)}
                  </td>

                  {/* Latency */}
                  <td className="py-1.5 px-3 font-mono tabular-nums text-right text-[11px] text-slate-400 whitespace-nowrap">
                    {log.latencyMs !== undefined ? `${log.latencyMs}ms` : '—'}
                  </td>

                  {/* Payload Details */}
                  <td className="py-1.5 px-3 text-[11px] text-slate-300">
                    <span className="line-clamp-1 group-hover:line-clamp-none transition-all">
                      {log.details}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-slate-500 text-xs italic"
                >
                  No matching log entries found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quiet Table Footer Bar */}
      <div className="h-6 px-3 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span>Active Pipeline: Gemini 2.5 Flash + Web Speech TTS + 4-Track Bus</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Auto-follow stream</span>
          </label>
        </div>
      </div>
    </div>
  );
};


