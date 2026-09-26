import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleDot,
  CloudCog,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Wifi,
  X,
  Wrench,
} from 'lucide-react';
import { SYSTEM_CONFIG } from '../../generated/system-config';

type GateStatus = 'IDLE' | 'RUNNING' | 'NOMINAL' | 'FAILED';

type TelemetryEvent = {
  ts?: string;
  event: string;
  [key: string]: unknown;
};

const STATUS_META: Record<GateStatus, { label: string; note: string }> = {
  IDLE: { label: 'IDLE', note: 'Sandbox đang chờ lệnh' },
  RUNNING: { label: 'RUNNING', note: 'Đang kiểm tra cô lập' },
  NOMINAL: { label: 'NOMINAL', note: 'Các gate tự động đã vượt qua' },
  FAILED: { label: 'FAILED', note: 'Đã chặn đồng bộ' },
};

export const SystemControlPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<GateStatus>('IDLE');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Sandbox offline');
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [wsOverride, setWsOverride] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(() => {
    const saved = wsOverride.trim() || localStorage.getItem('systemSandboxWs') || '';
    if (saved) return saved;
    const { host, port, wsPath } = SYSTEM_CONFIG.runtime.sandbox;
    return `ws://${host}:${port}${wsPath}`;
  }, [wsOverride]);

  const enabledPlatforms = useMemo(
    () => Object.entries(SYSTEM_CONFIG.platforms).filter(([, item]) => item.enabled).map(([name]) => name),
    []
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    setBusy(true);

    ws.onopen = () => {
      if (cancelled) return;
      setConnected(true);
      setBusy(false);
      setMessage('Sandbox connected');
      ws.send(JSON.stringify({ command: 'status' }));
    };

    ws.onmessage = (event) => {
      try {
        const item = JSON.parse(event.data) as TelemetryEvent;
        if (item.gate && typeof item.gate === 'object') {
          const gate = item.gate as { status?: GateStatus; progress?: number; message?: string };
          setStatus(gate.status ?? 'IDLE');
          setProgress(Number(gate.progress ?? 0));
          setMessage(gate.message ?? '');
        }
        if (item.event === 'GATE_STARTED') setStatus('RUNNING');
        if (item.event === 'GATE_NOMINAL') {
          setStatus('NOMINAL');
          setProgress(100);
        }
        if (item.event === 'GATE_FAILED') {
          setStatus('FAILED');
          setProgress(100);
        }
        if (item.message) setMessage(String(item.message));
        if (item.event) setEvents(prev => [...prev.slice(-29), item]);
      } catch {
        setEvents(prev => [...prev.slice(-29), { event: 'RAW', ts: new Date().toISOString(), data: event.data }]);
      }
    };

    ws.onerror = () => {
      if (cancelled) return;
      setConnected(false);
      setBusy(false);
      setMessage('Sandbox unavailable');
    };

    ws.onclose = () => {
      if (cancelled) return;
      setConnected(false);
      setBusy(false);
    };

    return () => {
      cancelled = true;
      ws.close();
      socketRef.current = null;
    };
  }, [open, wsUrl]);

  const command = (name: 'dry-run' | 'auto-patch' | 'sync') => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setMessage('Hãy chạy System Sandbox trước');
      return;
    }
    setBusy(true);
    setStatus('RUNNING');
    setProgress(5);
    ws.send(JSON.stringify({ command: name }));
  };

  const saveOverride = () => {
    const value = wsOverride.trim();
    if (value) localStorage.setItem('systemSandboxWs', value);
    else localStorage.removeItem('systemSandboxWs');
    setMessage(value ? 'Custom endpoint saved' : 'Using Source-of-Truth endpoint');
  };

  const statusIcon =
    status === 'NOMINAL' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
    status === 'FAILED' ? <X className="w-4 h-4 text-rose-400" /> :
    status === 'RUNNING' ? <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" /> :
    <CircleDot className="w-4 h-4 text-slate-500" />;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="fixed right-4 bottom-4 z-[70] group flex items-center gap-2 rounded-full border border-slate-700/80 bg-[#09111c]/95 px-3 py-2 text-[11px] font-black text-slate-100 shadow-2xl shadow-black/30 backdrop-blur-xl hover:border-cyan-500/40 hover:bg-[#111a28] transition-all"
        title="System Activity Control"
      >
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">SYSTEM</span>
        <span className="hidden md:inline text-slate-500">·</span>
        <span className="hidden md:inline text-[10px] text-slate-500">{status}</span>
      </button>

      {open && (
        <aside className="fixed right-4 bottom-16 z-[71] w-[min(480px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-700/80 bg-[#080f1a]/98 shadow-2xl shadow-black/50 backdrop-blur-2xl text-slate-100">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/40 via-slate-950/25 to-purple-950/35">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center shrink-0">
                <CloudCog className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black tracking-tight flex items-center gap-2">
                  Advanced System Activity
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px]">CRM CONTROL</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Single Source of Truth · v{SYSTEM_CONFIG.app.version}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Release Gate</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold">{statusIcon}<span>{STATUS_META[status].label}</span></div>
                <div className="mt-1 text-[10px] text-slate-500">{message || STATUS_META[status].note}</div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-900 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500"><Wifi className="w-3.5 h-3.5 text-emerald-400" /> Sandbox</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold"><span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />{connected ? 'CONNECTED' : 'OFFLINE'}</div>
                <div className="mt-1 text-[10px] text-slate-500 truncate">{wsUrl}</div>
                <div className="mt-2 flex flex-wrap gap-1">{enabledPlatforms.map(p => <span key={p} className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">{p}</span>)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button disabled={busy || !connected} onClick={() => command('dry-run')} className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2 text-[10px] font-bold text-slate-300 hover:border-cyan-500/30 hover:text-cyan-200 disabled:opacity-40">DRY-RUN</button>
              <button disabled={busy || !connected} onClick={() => command('auto-patch')} className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2 text-[10px] font-bold text-slate-300 hover:border-amber-500/30 hover:text-amber-200 disabled:opacity-40">AUTO-PATCH</button>
              <button disabled={busy || !connected} onClick={() => command('sync')} className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2 py-2 text-[10px] font-black text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40"><Wrench className="inline w-3 h-3 mr-1" />SYNC ALL</button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-indigo-400" /> WebSocket Endpoint</div>
              <div className="flex gap-2">
                <input value={wsOverride} onChange={e => setWsOverride(e.target.value)} placeholder={wsUrl} className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-[10px] font-mono text-slate-300" />
                <button onClick={saveOverride} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-bold text-slate-200 hover:bg-slate-700">Save</button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Telemetry</span>
                <span className="text-[10px] text-slate-600">{events.length} events</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-900">
                {events.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[10px] text-slate-600">No telemetry yet.</div>
                ) : events.slice().reverse().map((item, idx) => (
                  <div key={`${item.ts ?? 'e'}-${idx}`} className="px-3 py-2 grid grid-cols-[auto_1fr] gap-2">
                    <span className="font-mono text-[9px] text-slate-600">{item.ts ? new Date(item.ts).toLocaleTimeString() : '--:--:--'}</span>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-300">{item.event}</div>
                      {item.message && <div className="text-[9px] text-slate-500 truncate">{String(item.message)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
