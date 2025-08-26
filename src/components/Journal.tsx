import React, { useEffect, useMemo, useState } from 'react';
import { addTrade, clearTrades, computeMetrics, getTrades, Trade } from '../store/trades';
import Select from './ui/Select';

const Journal: React.FC = () => {
  const [forceTick, setForceTick] = useState(0); // to re-render after adding trades
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    strategy: '',
    instrument: '',
    status: 'all' as 'all' | 'win' | 'loss',
    search: '',
  });
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [showFormModal, setShowFormModal] = useState(false);
  const [draftDate, setDraftDate] = useState<string | undefined>(undefined);

  const tradesAll = useMemo(() => getTrades(), [forceTick]);

  // Lock body scroll when modal is open to hide background scrollbar
  useEffect(() => {
    if (showFormModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showFormModal]);

  const trades = useMemo(() => {
    return tradesAll.filter(t => {
      const d = new Date(t.date).getTime();
      if (filters.dateFrom) {
        const f = new Date(filters.dateFrom).getTime();
        if (d < f) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo).getTime();
        if (d > to) return false;
      }
      if (filters.strategy && (t.strategy || '') !== filters.strategy) return false;
      if (filters.instrument && !t.instrument.toLowerCase().includes(filters.instrument.toLowerCase())) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [t.instrument, t.strategy || '', t.notes || '', t.entryReason || '', t.exitReason || '']
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== 'all') {
        const pnl = (t.exitPrice - t.entryPrice) * (t.side === 'Buy' || t.side === 'Long' ? 1 : -1) * t.quantity;
        if (filters.status === 'win' && pnl < 0) return false;
        if (filters.status === 'loss' && pnl >= 0) return false;
      }
      return true;
    });
  }, [tradesAll, filters]);

  const m = computeMetrics(trades);

  // Table removed from Journal; list moved to Trade page

  // derived lists for dropdowns
  const symbols = useMemo(() => Array.from(new Set(tradesAll.map(t => t.instrument))).sort(), [tradesAll]);
  const strategies = useMemo(() => Array.from(new Set(tradesAll.map(t => t.strategy || ''))).filter(Boolean).sort(), [tradesAll]);

  // day aggregation for activity/calendar
  const dayAgg = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number }>();
    for (const t of tradesAll) {
      const d = new Date(t.date);
      const key = d.toISOString().slice(0,10);
      const dir = t.side === 'Buy' || t.side === 'Long' ? 1 : -1;
      const pnl = (t.exitPrice - t.entryPrice) * dir * t.quantity;
      const cur = map.get(key) || { pnl: 0, count: 0 };
      cur.pnl += pnl; cur.count += 1; map.set(key, cur);
    }
    return map;
  }, [tradesAll]);

  const onAddTradingDay = () => {
    setDraftDate(new Date().toISOString().slice(0,16));
    setShowFormModal(true);
  };

  const openFormForDate = (isoDate: string) => {
    // Expecting isoDate like YYYY-MM-DD
    const dtLocal = `${isoDate}T09:00`; // default morning time
    setDraftDate(dtLocal);
    setShowFormModal(true);
  };

  // Demo data seeding
  const loadDemoTrades = () => {
    const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'];
    const strategies = ['Breakout', 'Reversal', 'Trend-Follow', 'S/R Bounce'];
    const sides: Array<Trade['side']> = ['Buy', 'Sell', 'Long', 'Short'];
    const yr = year;
    const demo: Trade[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(yr, Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1, Math.floor(Math.random()*8)+9, 0, 0);
      const side = sides[Math.floor(Math.random()*sides.length)];
      const entry = Math.round((Math.random()*200 + 100) * 100) / 100;
      const move = (Math.random() - 0.4) * 40; // bias slightly positive
      const exit = Math.round((entry + (side==='Buy'||side==='Long'?1:-1) * move) * 100) / 100;
      const qty = [50, 100, 150, 200][Math.floor(Math.random()*4)];
      demo.push({
        id: Math.random().toString(36).slice(2,9),
        date: d.toISOString(),
        instrument: symbols[Math.floor(Math.random()*symbols.length)],
        side,
        entryPrice: entry,
        exitPrice: exit,
        quantity: qty,
        stopLoss: undefined,
        takeProfit: undefined,
        riskAmount: Math.round(Math.random()*500),
        riskPercent: Math.round(Math.random()*3*10)/10,
        strategy: strategies[Math.floor(Math.random()*strategies.length)],
        entryReason: 'Setup matched rules',
        exitReason: 'Target/Rule-based exit',
        screenshotName: undefined,
        tags: ['demo'],
        notes: 'Demo trade',
      });
    }
    demo.forEach(addTrade);
    setForceTick(v => v + 1);
  };

  return (
    <div className="journal-page space-y-8">
      <h2 className="heading">Trade Journal</h2>

      {/* Top controls */}
      <section className="surface-card p-4 space-y-3 hover:bg-slate-50 hover:shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input label="Search symbols, strategies, notes" value={filters.search} onChange={v => setFilters(s => ({...s, search: v}))} />
          </div>
          <div className="md:w-64">
            <Input label="Date from" type="date" value={filters.dateFrom} onChange={v => setFilters(s=>({...s, dateFrom: v}))} />
          </div>
          <div className="md:w-64">
            <Input label="Date to" type="date" value={filters.dateTo} onChange={v => setFilters(s=>({...s, dateTo: v}))} />
          </div>
          <div className="self-start -mt-1 md:-mt-2 flex items-center gap-2">
            <button onClick={loadDemoTrades} className="btn-primary">Load Demo Data</button>
            <button
              onClick={() => {
                if (confirm('Clear all journal trades? This cannot be undone.')) {
                  clearTrades();
                  setForceTick(v => v + 1);
                }
              }}
              className="btn-outline-danger"
            >
              Clear Data
            </button>
            <button onClick={onAddTradingDay} className="btn-secondary">+ Add Trading Day</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select label="All Results" value={filters.status} onChange={v => setFilters(s => ({...s, status: v as any}))}
            options={[{label:'All Results',value:'all'},{label:'Wins',value:'win'},{label:'Losses',value:'loss'}]} />
          <Select label="All Symbols" value={filters.instrument} onChange={v => setFilters(s => ({...s, instrument: v}))}
            options={[{label:'All Symbols', value:''}, ...symbols.map(s => ({label:s, value:s}))]} />
          <Select label="All Strategies" value={filters.strategy} onChange={v => setFilters(s => ({...s, strategy: v}))}
            options={[{label:'All Strategies', value:''}, ...strategies.map(s => ({label:s, value:s}))]} />
          <div className="flex items-end gap-2">
            <label className="text-sm w-full">
              <span className="block mb-1 text-slate-600">Year</span>
              <input type="number" value={year} onChange={e=>setYear(Number(e.target.value)||year)} className="input" />
            </label>
          </div>
        </div>
      </section>

      {/* Snapshot */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Trades" value={m.totalTrades} />
          <StatCard title="Win Rate" value={`${m.winRate.toFixed(1)}%`} />
          <StatCard title="Total P&L" value={m.totalPnL.toFixed(2)} />
          <StatCard title="Avg Hold (hrs)" value={m.avgHoldingHours == null ? '—' : m.avgHoldingHours.toFixed(1)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Avg Risk:Reward"><span className="text-2xl">{m.avgRR == null ? '—' : m.avgRR.toFixed(2)}</span></Card>
          <Card title="Best & Worst">
            <div className="flex gap-6">
              <div>
                <div className="text-slate-500 text-sm">Best</div>
                <div className="text-emerald-600 font-semibold">{m.best ? m.best.pnl.toFixed(2) : '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm">Worst</div>
                <div className="text-red-600 font-semibold">{m.worst ? m.worst.pnl.toFixed(2) : '—'}</div>
              </div>
            </div>
          </Card>
        </div>
        <Card title="Trading Activity" className="border border-slate-300 hover:border-primary-200"><ActivityHeatmap year={year} dayAgg={dayAgg} /></Card>
        <Card title="Equity Curve"><EquityChart points={m.equity} /></Card>
      </section>

      {/* Inline log form removed; using modal only */}

      {/* Trade Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen p-4 md:p-8 overscroll-none">
          <div className="absolute inset-0 h-full w-full bg-slate-950/60 backdrop-blur-2xl" onClick={() => setShowFormModal(false)} />
          <div className="relative w-full max-w-3xl mx-0 my-6 md:my-10">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-h-[92vh] overflow-auto no-scrollbar">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Add Trading Day</h3>
                <button onClick={() => setShowFormModal(false)} className="px-2 py-1 rounded-lg hover:bg-slate-100">✕</button>
              </div>
              <div className="p-4">
                <TradeForm
                  initialDate={draftDate}
                  onSaved={() => {
                    setForceTick(v => v + 1);
                    setShowFormModal(false);
                    // Navigate to Trade page
                    window.dispatchEvent(new CustomEvent('navigate', { detail: 'trade' }));
                  }}
                  onCancel={() => setShowFormModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All trades table moved to Trade page */}

      {/* Insights */}
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Win/Loss">
            <div className="text-sm text-slate-500">Wins / Losses</div>
            <div className="text-2xl font-semibold">{m.wins} / {m.losses}</div>
          </Card>
          <Card title="Strategy Success">
            <StrategySuccess trades={trades} />
          </Card>
          <Card title="Max Drawdown"><MaxDrawdown equity={m.equity} /></Card>
        </div>
      </section>

      {/* Monthly calendar + Weekday breakup */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title={`${monthName(month)} ${year}`}>
            <MonthCalendar year={year} month={month} setMonth={setMonth} dayAgg={dayAgg} onSelectDate={openFormForDate} />
          </Card>
          <Card title="Overall Week Day Breakup">
            <WeekdayBreakup dayAgg={dayAgg} year={year} month={month} />
          </Card>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Notes & Strategy Tracking</h3>
        <p className="text-slate-600 text-sm">Add notes per-trade in the form; they will appear in the table for review.</p>
      </section>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <div className="surface-card p-4 hover:bg-slate-50 hover:shadow-sm transition-colors">
    <div className="text-slate-500 text-sm">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`surface-card p-4 hover:bg-slate-50 hover:shadow-sm transition-colors ${className || ''}`}>
    <h4 className="font-semibold mb-3">{title}</h4>
    {children}
  </div>
);

const EquityChart: React.FC<{ points: { t: string; equity: number }[] }> = ({ points }) => {
  if (!points.length) return <div className="text-slate-500">No data yet. Add trades to see equity curve.</div>;

  const width = 600;
  const height = 200;
  const pad = 20;
  const xs = points.map((_, i) => i);
  const ys = points.map(p => p.equity);
  const xMin = 0, xMax = Math.max(1, xs[xs.length - 1]);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(0, ...ys);
  const xScale = (x: number) => pad + (x - xMin) * (width - 2 * pad) / (xMax - xMin || 1);
  const yScale = (y: number) => height - pad - (y - yMin) * (height - 2 * pad) / ((yMax - yMin) || 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.equity)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <line x1={pad} y1={yScale(0)} x2={width - pad} y2={yScale(0)} stroke="#cbd5e1" strokeDasharray="4 4" />
      <path d={d} fill="none" stroke="#6366f1" strokeWidth={2} />
    </svg>
  );
};

export default Journal;

// ---------- Subcomponents ----------

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }>
  = ({ label, value, onChange, type = 'text' }) => (
  <label className="text-sm">
    <span className="block mb-1 text-slate-600">{label}</span>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="input" />
  </label>
);

// Using custom Select from './ui/Select'

const TradeForm: React.FC<{ onSaved: () => void; initialDate?: string; onCancel?: () => void }> = ({ onSaved, initialDate, onCancel }) => {
  const [form, setForm] = useState<Partial<Trade>>({
    date: (initialDate ?? new Date().toISOString().slice(0,16)),
    instrument: '', side: 'Buy', entryPrice: 0, exitPrice: 0, quantity: 1,
    stopLoss: undefined, takeProfit: undefined, riskAmount: undefined, riskPercent: undefined,
    strategy: '', entryReason: '', exitReason: '', notes: '', tags: [],
  });
  const [fileName, setFileName] = useState<string>('');

  const set = (k: keyof Trade, v: any) => setForm(s => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.instrument) return;
    const id = Math.random().toString(36).slice(2,9);
    const trade: Trade = {
      id,
      date: form.date!,
      exitDate: form.exitDate,
      instrument: form.instrument!,
      side: (form.side as any) ?? 'Buy',
      entryPrice: Number(form.entryPrice) || 0,
      exitPrice: Number(form.exitPrice) || 0,
      quantity: Number(form.quantity) || 1,
      stopLoss: form.stopLoss != null && form.stopLoss !== undefined ? Number(form.stopLoss) : undefined,
      takeProfit: form.takeProfit != null && form.takeProfit !== undefined ? Number(form.takeProfit) : undefined,
      riskAmount: form.riskAmount != null && form.riskAmount !== undefined ? Number(form.riskAmount) : undefined,
      riskPercent: form.riskPercent != null && form.riskPercent !== undefined ? Number(form.riskPercent) : undefined,
      strategy: form.strategy || '',
      entryReason: form.entryReason || '',
      exitReason: form.exitReason || '',
      screenshotName: fileName || undefined,
      tags: form.tags || [],
      notes: form.notes || '',
    };
    addTrade(trade);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3 surface-card p-4 hover:bg-slate-50 hover:shadow-sm transition-colors">
      <Input label="Date & Time" type="datetime-local" value={form.date || ''} onChange={v => set('date', v)} />
      <Input label="Exit Date" type="datetime-local" value={form.exitDate || ''} onChange={v => set('exitDate', v)} />
      <Input label="Instrument" value={form.instrument || ''} onChange={v => set('instrument', v)} />
      <Select label="Side" value={String(form.side || 'Buy')} onChange={v => set('side', v)} options={[{label:'Buy',value:'Buy'},{label:'Sell',value:'Sell'},{label:'Long',value:'Long'},{label:'Short',value:'Short'}]} />

      <Input label="Entry Price" type="number" value={String(form.entryPrice ?? '')} onChange={v => set('entryPrice', v)} />
      <Input label="Exit Price" type="number" value={String(form.exitPrice ?? '')} onChange={v => set('exitPrice', v)} />
      <Input label="Quantity" type="number" value={String(form.quantity ?? '')} onChange={v => set('quantity', v)} />
      <Input label="Stop-Loss" type="number" value={String(form.stopLoss ?? '')} onChange={v => set('stopLoss', v)} />

      <Input label="Take-Profit" type="number" value={String(form.takeProfit ?? '')} onChange={v => set('takeProfit', v)} />
      <Input label="Risk ($)" type="number" value={String(form.riskAmount ?? '')} onChange={v => set('riskAmount', v)} />
      <Input label="Risk (%)" type="number" value={String(form.riskPercent ?? '')} onChange={v => set('riskPercent', v)} />
      <Input label="Strategy" value={form.strategy || ''} onChange={v => set('strategy', v)} />

      <label className="md:col-span-2 text-sm">
        <span className="block mb-1 text-slate-600">Reason for Entry</span>
        <textarea value={form.entryReason || ''} onChange={e => set('entryReason', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
      </label>
      <label className="md:col-span-2 text-sm">
        <span className="block mb-1 text-slate-600">Reason for Exit</span>
        <textarea value={form.exitReason || ''} onChange={e => set('exitReason', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
      </label>

      <label className="text-sm">
        <span className="block mb-1 text-slate-600">Tags (comma separated)</span>
        <input value={(form.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </label>
      <label className="md:col-span-3 text-sm">
        <span className="block mb-1 text-slate-600">Notes</span>
        <input value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </label>

      <label className="text-sm">
        <span className="block mb-1 text-slate-600">Screenshot (name only)</span>
        <input type="file" onChange={e => setFileName(e.target.files?.[0]?.name || '')} className="w-full" />
        {fileName && <div className="text-xs text-slate-500 mt-1">Selected: {fileName}</div>}
      </label>

      <div className="md:col-span-4 flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">Cancel</button>
        )}
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save Trade</button>
      </div>
    </form>
  );
};

// Trades table moved to Trade page

const StrategySuccess: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const map = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    const k = t.strategy || '—';
    const dir = t.side === 'Buy' || t.side === 'Long' ? 1 : -1;
    const pnl = (t.exitPrice - t.entryPrice) * dir * t.quantity;
    const rec = map.get(k) || { wins: 0, total: 0 };
    rec.total += 1;
    if (pnl >= 0) rec.wins += 1;
    map.set(k, rec);
  }
  const rows = Array.from(map.entries());
  if (!rows.length) return <div className="text-slate-500">No data.</div>;
  return (
    <div className="space-y-1">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm">
          <span>{k}</span>
          <span className="font-medium">{((v.wins / v.total) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

const MaxDrawdown: React.FC<{ equity: { t: string; equity: number }[] }> = ({ equity }) => {
  if (!equity.length) return <div className="text-slate-500">No data.</div>;
  let peak = equity[0].equity;
  let maxDD = 0;
  for (const p of equity) {
    peak = Math.max(peak, p.equity);
    maxDD = Math.min(maxDD, p.equity - peak);
  }
  return <div className="text-2xl font-semibold">{maxDD.toFixed(2)}</div>;
};

// ---------- Activity Heatmap (year) ----------
const ActivityHeatmap: React.FC<{ year: number; dayAgg: Map<string, { pnl: number; count: number }> }>
  = ({ year, dayAgg }) => {
  const months = Array.from({ length: 12 }, (_, m) => m);
  const color = (pnl: number) =>
    pnl === 0
      ? 'bg-slate-400/80 border-slate-500'
      : pnl > 0
        ? 'bg-emerald-500 border-emerald-600'
        : 'bg-red-500 border-red-600';
  const fallback = 'bg-slate-300/70 border-slate-400';
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {months.map(m => (
        <div key={m} className="space-y-2 rounded-xl border border-slate-300 bg-white p-3 hover:bg-primary-50 hover:border-primary-200 hover:shadow-sm transition-colors">
          <div className="text-sm text-slate-500">{monthName(m)}</div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: daysInMonth(year, m) }, (_, i) => i + 1).map(d => {
              const key = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const rec = dayAgg.get(key);
              return (
                <div
                  key={d}
                  className={`h-4 w-4 rounded-sm border ${rec ? color(rec.pnl) : fallback}`}
                  title={`${key} ${rec ? rec.pnl.toFixed(2) : ''}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------- Month Calendar with daily P&L ----------
const MonthCalendar: React.FC<{ year: number; month: number; setMonth: (m:number)=>void; dayAgg: Map<string,{pnl:number;count:number}>; onSelectDate?: (isoDate: string)=>void }>
  = ({ year, month, setMonth, dayAgg, onSelectDate }) => {
  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0 Sun
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ label: string; pnl?: number; date?: string }> = [];
  for (let i = 0; i < startDow; i++) cells.push({ label: '' });
  for (let d = 1; d <= days; d++) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const rec = dayAgg.get(key);
    cells.push({ label: String(d), pnl: rec?.pnl, date: key });
  }
  const prev = () => setMonth((month + 11) % 12);
  const next = () => setMonth((month + 1) % 12);
  const fmt = (n?: number) => n == null ? '' : (n >= 0 ? `₹${n.toFixed(0)}` : `-₹${Math.abs(n).toFixed(0)}`);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button onClick={prev} className="px-2 py-1 rounded border border-slate-300">‹</button>
          <button onClick={next} className="px-2 py-1 rounded border border-slate-300">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs text-slate-500 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => c.date && onSelectDate && onSelectDate(c.date)}
            className={`text-left h-16 rounded border border-slate-200 p-1 overflow-hidden ${c.pnl!=null ? (c.pnl>0?'bg-emerald-50/60':'bg-red-50/60') : ''} hover:bg-white hover:shadow-sm transition-colors`}
          >
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className={`text-xs ${c.pnl!=null?(c.pnl>0?'text-emerald-600':'text-red-600'):''}`}>{fmt(c.pnl)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------- Weekday Breakup bar chart (Overall, modern) ----------
const WeekdayBreakup: React.FC<{ dayAgg: Map<string,{pnl:number;count:number}>; year:number; month:number }>
  = ({ dayAgg }) => {
  // Overall sums across entire dataset
  const sums = [0,0,0,0,0,0,0];
  for (const [key, rec] of dayAgg.entries()) {
    const dow = new Date(key).getDay();
    sums[dow] += rec.pnl;
  }
  const max = Math.max(1, ...sums.map(v => Math.abs(v)));
  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div
      className="relative h-56 px-2 py-3 rounded-xl"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to top, rgba(148,163,184,0.15) 0 1px, transparent 1px 24px)'
      }}
    >
      <div className="relative mx-auto w-full max-w-[560px] h-full">
        <div className="absolute left-0 right-0 bottom-12 h-px bg-slate-300/40" />
        <div className="flex items-end justify-between h-full gap-3">
          {sums.map((v, i) => {
            const pct = Math.max(6, Math.abs(v) / max * 100);
            const positive = v >= 0;
            const barClass = positive
              ? 'from-emerald-500 to-emerald-400 border-emerald-600'
              : 'from-red-500 to-red-400 border-red-600';
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 select-none">
                <div className="w-full h-40 flex items-end">
                  <div
                    className={`w-full rounded-md border bg-gradient-to-t ${barClass} transition-transform duration-200 hover:scale-[1.02]`}
                    style={{ height: `${pct}%` }}
                    title={`${labels[i]}: ${v.toFixed(2)}`}
                  />
                </div>
                <div className="text-[11px] text-slate-500">{labels[i]}</div>
                <div className={`text-[11px] font-medium ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {v === 0 ? '—' : v.toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function monthName(m: number) {
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][m] || '';
}
