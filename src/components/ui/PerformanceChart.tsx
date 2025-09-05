import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { fetchTradesFromSheet } from '../../lib/sheets';

type ChartPoint = { date: string; equity: number };

const PerformanceChart: React.FC = () => {
  const { theme } = useTheme();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    const load = async () => {
      // Cancel any in-flight request before starting a new one
      if (ctrlRef.current) ctrlRef.current.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      try {
        setLoading(true);
        const t = await fetchTradesFromSheet({ signal: ctrl.signal, timeoutMs: 10000 });
        if (!mounted || ctrl.signal.aborted) return;
        setTrades(t);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to load trades');
      } finally {
        if (mounted && !ctrl.signal.aborted) setLoading(false);
      }
    };

    load();
    timer = window.setInterval(load, 15000);
    return () => {
      mounted = false;
      if (timer) window.clearInterval(timer);
      if (ctrlRef.current) ctrlRef.current.abort();
    };
  }, []);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!trades.length) return [];
    const dayPnl = new Map<string, number>();
    for (const t of trades) {
      const d = new Date(t.date);
      if (!isFinite(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const dir = (t.side === 'Buy' || t.side === 'Long') ? 1 : -1;
      const pnl = (Number(t.exitPrice) - Number(t.entryPrice)) * dir * Number(t.quantity || 0);
      dayPnl.set(key, (dayPnl.get(key) || 0) + (isFinite(pnl) ? pnl : 0));
    }
    const dates = Array.from(dayPnl.keys()).sort();
    let running = 0;
    return dates.map(date => {
      running += dayPnl.get(date) || 0;
      return { date, equity: running };
    });
  }, [trades]);

  const textColor = theme === 'dark' ? '#cbd5e1' : '#334155';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e2e8f0';
  const lineColor = theme === 'dark' ? '#3b82f6' : '#2563eb';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Performance Trend</h2>
        {loading && <span className="text-xs text-slate-500">Refreshing…</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            stroke={textColor}
            tickFormatter={(val: string) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis
            stroke={textColor}
            tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
              borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
              color: textColor,
            }}
            itemStyle={{ color: textColor }}
            formatter={(value: number) => [`₹${Number(value).toFixed(2)}`, 'Equity']}
            labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
          />
          <Line type="monotone" dataKey="equity" stroke={lineColor} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
