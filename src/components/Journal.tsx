import React, { useEffect, useMemo, useState } from 'react';
import { addTrade, clearTrades, computeMetrics, getTrades, Trade } from '../store/trades';
import Select from './ui/Select';
import FilterPanel from './FilterPanel';
import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaDownload } from 'react-icons/fa';

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
  const [month, setMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [showFormModal, setShowFormModal] = useState(false);
  const [draftDate, setDraftDate] = useState<string | undefined>(undefined);
  const [showPnlPopup, setShowPnlPopup] = useState<{date: string, pnl: number} | null>(null);
  const dummyData = useMemo(() => [
    { date: '2023-08-01', value: 500 },
    { date: '2023-08-02', value: 750 },
    { date: '2023-08-03', value: 950 },
    { date: '2023-08-04', value: 773 },
    { date: '2023-08-05', value: 228 },
    { date: '2023-08-06', value: -45 },
    { date: '2023-08-07', value: 150 },
  ], []);

  const tradesAll = useMemo(() => getTrades(), [forceTick]);

  // Auto-refresh when trades change in this or another tab
  useEffect(() => {
    const bump = () => setForceTick(v => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'trades_v1') bump();
    };
    window.addEventListener('trades_changed' as any, bump);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('trades_changed' as any, bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

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

  const showPnlCard = (isoDate: string, pnl?: number) => {
    if (pnl !== undefined) {
      setShowPnlPopup({ date: isoDate, pnl });
      // Auto-hide after 2 seconds
      setTimeout(() => setShowPnlPopup(null), 2000);
    }
  };

  // Demo data seeding
  const loadDemoTrades = () => {
    const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'];
    const strategies = ['Breakout', 'Reversal', 'Trend-Follow', 'S/R Bounce'];
    const sides: Array<Trade['side']> = ['Buy', 'Sell', 'Long', 'Short'];
    const yr = new Date().getFullYear();
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

  const handleSearch = (query: string) => {
    setFilters(s => ({ ...s, search: query }));
  };

  const handleDateChange = (from: string, to: string) => {
    setFilters(s => ({ ...s, dateFrom: from, dateTo: to }));
  };

  const handleFilterChange = (newFilters: {
    status: string;
    symbol: string;
    strategy: string;
    year: number;
  }) => {
    setFilters(s => ({
      ...s,
      status: newFilters.status as 'all' | 'win' | 'loss',
      instrument: newFilters.symbol,
      strategy: newFilters.strategy,
      year: String(newFilters.year)
    }));
  };

  const exportCSV = () => {
    const csvContent = trades.map(t => {
      return [
        t.date,
        t.instrument,
        t.side,
        t.entryPrice,
        t.exitPrice,
        t.quantity,
        (t.exitPrice - t.entryPrice) * (t.side === 'Buy' || t.side === 'Long' ? 1 : -1) * t.quantity,
        t.strategy,
        t.notes
      ].join(',');
    }).join('\n');
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'trades.csv');
    link.click();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setForceTick(v => v + 1); // Refresh data
    }, 5000); // Update every 5 seconds
  
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="journal-page space-y-8">
      <h2 className="heading">Trade Journal</h2>

      {/* Top controls */}
      <section className="surface-card p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm transition-colors">
        <FilterPanel
          symbols={symbols}
          strategies={strategies}
          onSearch={handleSearch}
          onDateChange={handleDateChange}
          onFilterChange={handleFilterChange}
          onLoadDemo={loadDemoTrades}
          onClearData={() => {
            if (confirm('Clear all journal trades?')) {
              clearTrades();
              setForceTick(v => v + 1);
            }
          }}
          onAddTrade={onAddTradingDay}
        />
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
        <Card title="Trading Activity" className="border border-slate-300 hover:border-slate-300 dark:hover:border-slate-700"><ActivityHeatmap year={new Date().getFullYear()} dayAgg={dayAgg} /></Card>
        <Card title="Equity Curve">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Performance Chart
                </h2>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-sm text-slate-300">Total: ₹{m.totalPnL.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span className="text-sm text-slate-300">Loss: ₹{Math.abs(m.totalPnL * 0.05).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <span className="mt-2 md:mt-0 px-3 py-1 rounded-full bg-slate-700 text-slate-200 text-sm">
                {trades.length} trades
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Win Rate</div>
                <div className="text-3xl font-bold text-emerald-400">{m.winRate.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 mt-1">{m.wins}W / {m.losses}L</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Max Drawdown</div>
                <div className="text-3xl font-bold text-red-400">₹{m.worst?.pnl.toFixed(2) || '0'}</div>
                <div className="text-xs text-slate-500 mt-1">Worst trade</div>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer>
                <BarChart 
                  data={dummyData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(value) => `₹${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`₹${value}`, 'Amount']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#colorBar)" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={false}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-8 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-600"></span>
                <span className="text-slate-300">Cumulative P&L</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                <span className="text-slate-300">Net After Brokerage</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Inline log form removed; using modal only */}

      {/* Trade Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen p-4 md:p-8 overscroll-none">
          <div className="absolute inset-0 h-full w-full bg-slate-950/60 backdrop-blur-2xl" onClick={() => setShowFormModal(false)} />
          <div className="relative w-full max-w-3xl mx-0 my-6 md:my-10">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-auto no-scrollbar">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-200 bg-white/90 dark:bg-slate-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Trade</h3>
                <button onClick={() => setShowFormModal(false)} className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
              </div>
              <div className="p-4">
                <TradeForm
                  initialDate={draftDate}
                  onSaved={() => {
                    setForceTick(v => v + 1);
                    setShowFormModal(false);
                  }}
                  onCancel={() => setShowFormModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* P&L Popup Card */}
      {showPnlPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">{new Date(showPnlPopup.date).toLocaleDateString()}</div>
              <div className={`text-lg font-semibold ${
                showPnlPopup.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {showPnlPopup.pnl >= 0 ? '+' : ''}{showPnlPopup.pnl.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All trades table */}
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Trade List</h3>
        <div className="bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Trade List</h3>
              <p className="text-slate-400 text-sm">{trades.length} trades</p>
            </div>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <FaDownload className="text-slate-300" /> 
              <span className="text-slate-200">Export CSV</span>
            </button>
          </div>
          
          <div className="overflow-auto no-scrollbar max-h-[70vh]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-800/80 backdrop-blur-sm">
                <tr className="text-left border-b border-slate-700">
                  {['Date','Instrument','Side','Entry','Exit','Qty','P&L','Strategy','Notes'].map((label) => (
                    <th key={label} className="py-3 px-4 text-slate-300 font-medium">
                      <span>{label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => {
                  const dir = t.side === 'Buy' || t.side === 'Long' ? 1 : -1;
                  const pnl = (t.exitPrice - t.entryPrice) * dir * t.quantity;
                  return (
                    <tr key={t.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-200">{new Date(t.date).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-200">{t.instrument}</td>
                      <td className={`py-3 px-4 ${t.side === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>{t.side}</td>
                      <td className="py-3 px-4 text-slate-200">{t.entryPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-200">{t.exitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-200">{t.quantity}</td>
                      <td className={`py-3 px-4 font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{t.strategy || '-'}</td>
                      <td className="py-3 px-4 text-slate-400">{t.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
          <Card title={`${monthName(month)} ${new Date().getFullYear()}`}>
            <MonthCalendar year={new Date().getFullYear()} month={month} setMonth={setMonth} dayAgg={dayAgg} onSelectDate={showPnlCard} />
          </Card>
          <Card title="Overall Week Day Breakup">
            <WeekdayBreakup dayAgg={dayAgg} />
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
  <div className="surface-card p-4 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm transition-colors">
    <div className="text-slate-500 text-sm">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`surface-card p-4 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm transition-colors ${className || ''}`}>
    <h4 className="font-semibold mb-3">{title}</h4>
    {children}
  </div>
);

const TradeForm: React.FC<{ onSaved: () => void; initialDate?: string; initialPnl?: number; onCancel?: () => void }> = ({ onSaved, initialDate, initialPnl, onCancel }) => {
  const [form, setForm] = useState<Partial<Trade>>({
    date: (initialDate ?? new Date().toISOString().slice(0,16)),
    instrument: '', side: 'Buy', entryPrice: 0, exitPrice: 0, quantity: 1,
    stopLoss: undefined, takeProfit: undefined, riskAmount: undefined, riskPercent: undefined,
    strategy: '', entryReason: '', exitReason: '', notes: '', tags: [],
  });
  const [fileName, setFileName] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Trade, v: any) => setForm(s => ({ ...s, [k]: v }));

  // Pre-fill form with P&L data if provided
  useEffect(() => {
    if (initialPnl !== undefined) {
      // If we have a P&L amount, set entry and exit prices to reflect it
      // For simplicity, assume entry price of 100 and calculate exit based on P&L
      const entryPrice = 100;
      const quantity = 1;
      const exitPrice = entryPrice + (initialPnl / quantity);
      setForm(prev => ({
        ...prev,
        entryPrice,
        exitPrice,
        quantity
      }));
    }
  }, [initialPnl]);

  const strategiesPreset = [
    'Breakout','Reversal','Scalping','Trend Following','Swing Trading','Momentum',
    'Mean Reversion','Gap Trading','News Based','Technical Analysis','Fundamental Analysis','Other'
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.instrument || saving) return;
    setSaving(true);
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

  // Keyboard shortcuts: Esc to cancel, Ctrl/Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel && onCancel();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's')) {
        e.preventDefault();
        const formEl = document.querySelector('#trade-form') as HTMLFormElement | null;
        formEl?.requestSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const pnl = useMemo(() => {
    const dir = (form.side === 'Buy' || form.side === 'Long') ? 1 : -1;
    const ep = Number(form.entryPrice) || 0;
    const xp = Number(form.exitPrice) || 0;
    const q = Number(form.quantity) || 0;
    return (xp - ep) * dir * q;
  }, [form.side, form.entryPrice, form.exitPrice, form.quantity]);

  const canSave = Boolean(form.date && form.instrument);

  return (
    <form id="trade-form" onSubmit={submit} className="grid grid-cols-1 gap-4 surface-card p-4 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input label="Date & Time" type="datetime-local" value={form.date || ''} onChange={v => set('date', v)} />
        <Input label="Exit Date" type="datetime-local" value={form.exitDate || ''} onChange={v => set('exitDate', v)} />
      </div>

      <div className="text-sm font-semibold text-slate-800 mt-1">Trade Snapshot (optional)</div>
      <div className="h-px bg-slate-200" />

      {/* Compact row: Instrument ▲ Side ▲ Entry ▲ Exit ▲ Qty ▲ P&L */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
        <label className="text-sm md:col-span-2">
          <span className="block mb-1 text-slate-600">Instrument</span>
          <input value={form.instrument || ''} onChange={e=>set('instrument', e.target.value)} className="input" />
        </label>
        <div className="md:col-span-1">
          <Select label="Side" value={String(form.side || 'Buy')} onChange={v => set('side', v)} options={[{label:'Buy',value:'Buy'},{label:'Sell',value:'Sell'},{label:'Long',value:'Long'},{label:'Short',value:'Short'}]} />
        </div>
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Entry</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 select-none">₹</span>
            <input type="number" step="0.01" value={String(form.entryPrice ?? '')} onChange={e=>set('entryPrice', e.target.value)} className="input pl-6" />
          </div>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Exit</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 select-none">₹</span>
            <input type="number" step="0.01" value={String(form.exitPrice ?? '')} onChange={e=>set('exitPrice', e.target.value)} className="input pl-6" />
          </div>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Qty</span>
          <input type="number" value={String(form.quantity ?? '')} onChange={e=>set('quantity', e.target.value)} className="input" />
        </label>
        <div className="text-sm md:col-span-1">
          <div className="block mb-1 text-slate-600">P&L</div>
          <div className={`px-3 py-2 rounded-xl border text-center font-medium ${pnl>=0 ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400'}`}>
            {pnl>=0 ? '+' : ''}{pnl.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Strategy ▲ Tags ▲ Notes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-sm md:col-span-2">
          <span className="block mb-1 text-slate-600">Strategy</span>
          <input value={form.strategy || ''} onChange={e=>set('strategy', e.target.value)} className="input" />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="block mb-1 text-slate-600">Tags</span>
          <input value={(form.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="input" placeholder="comma separated (press Enter to add)" onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const cur = (form.tags || []);
              const input = (e.target as HTMLInputElement).value.trim();
              if (input) set('tags', Array.from(new Set([...cur, ...input.split(',').map(s=>s.trim()).filter(Boolean)])));
            }
          }} />
          {(form.tags && form.tags.length>0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.tags.map((t, i) => (
                <span key={`${t}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {t}
                  <button type="button" onClick={() => set('tags', (form.tags||[]).filter(x => x!==t))} className="ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">×</button>
                </span>
              ))}
            </div>
          )}
        </label>
        {/* Notes moved to its own section below */}
      </div>

      {/* Quick pick strategy chips */}
      <div className="flex flex-wrap gap-2">
        {strategiesPreset.map(str => (
          <button
            type="button"
            key={str}
            onClick={() => set('strategy', str)}
            className={`px-3 py-1 rounded-full border text-sm ${form.strategy===str ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            {str}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          placeholder="Add custom strategy..."
          value={form.strategy || ''}
          onChange={e => set('strategy', e.target.value)}
          className="input flex-1"
        />
        <button type="button" onClick={() => set('strategy', (form.strategy||'').trim())} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">Add</button>
      </div>

      {/* Trading Result segmented */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-slate-800">Trading Result</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {["profit","loss","open","breakeven"].map(mode => {
            const active = (mode==="profit" && pnl>0) || (mode==="loss" && pnl<0);
            let cls = "";
            let label = "";
            if (mode==="profit") {
              cls = active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-600";
              label = "Profit";
            } else if (mode==="loss") {
              cls = active ? "bg-red-600 text-white border-red-600" : "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-red-600";
              label = "Loss";
            } else if (mode==="open") {
              cls = active ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600";
              label = "Open Trade";
            } else if (mode==="breakeven") {
              cls = active ? "bg-yellow-500 text-white border-yellow-500" : "bg-white dark:bg-slate-900 text-yellow-600 dark:text-yellow-400 border-yellow-600";
              label = "Breakeven";
            }
            const onClick = () => {
              if (mode==="profit" || mode==="loss") {
                const ep = Number(form.entryPrice) || 0;
                const isLong = form.side === "Buy" || form.side === "Long";
                if (mode==="profit") {
                  set("exitPrice", isLong ? ep + 1 : ep - 1);
                } else {
                  set("exitPrice", isLong ? ep - 1 : ep + 1);
                }
              }
              set('side', mode as Trade['side']);
            };
            return (
              <button
                type="button"
                key={mode}
                onClick={onClick}
                className={`px-4 py-2 rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${cls}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk management */}
      <div className="h-px bg-slate-200" />
      <div className="text-sm font-semibold text-slate-800">Risk Management</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Stop-Loss</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 select-none">₹</span>
            <input type="number" step="0.01" value={String(form.stopLoss ?? '')} onChange={e => set('stopLoss', e.target.value)} className="input pl-6" />
          </div>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Take-Profit</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 select-none">₹</span>
            <input type="number" step="0.01" value={String(form.takeProfit ?? '')} onChange={e => set('takeProfit', e.target.value)} className="input pl-6" />
          </div>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Risk (₹)</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 select-none">₹</span>
            <input type="number" step="0.01" value={String(form.riskAmount ?? '')} onChange={e => set('riskAmount', e.target.value)} className="input pl-6" />
          </div>
        </label>
        <Input label="Risk (%)" type="number" value={String(form.riskPercent ?? '')} onChange={v => set('riskPercent', v)} />
      </div>

      {/* RR metrics */}
      <RRMetrics entry={Number(form.entryPrice)||0} sl={form.stopLoss==null?undefined:Number(form.stopLoss)} tp={form.takeProfit==null?undefined:Number(form.takeProfit)} side={String(form.side||'Buy') as any} qty={Number(form.quantity)||0} />

      {/* Notes */}
      <div className="h-px bg-slate-200" />
      <div className="text-sm font-semibold text-slate-800">Notes</div>
      <div className="grid grid-cols-1 gap-3">
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Notes</span>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="input" rows={4} placeholder="Add any observations, emotions, mistakes, improvements, or learnings..." />
        </label>
      </div>

      {/* Attachments */}
      <div className="h-px bg-slate-200" />
      <div className="text-sm font-semibold text-slate-800">Attachments</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-sm md:col-span-2">
          <span className="block mb-1 text-slate-600">Screenshot (name only)</span>
          <input type="file" onChange={e => setFileName(e.target.files?.[0]?.name || '')} className="w-full" />
          {fileName && <div className="text-xs text-slate-500 mt-1">Selected: {fileName}</div>}
        </label>
        <div className="md:col-span-2 flex justify-end items-end gap-2 sticky bottom-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
          )}
          <button
            type="submit"
            disabled={!canSave || saving}
            className={`px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-sm hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {saving ? 'Saving…' : 'Save Trade'}
          </button>
        </div>
      </div>
    </form>
  );
};

// Risk/Reward metrics chips
const RRMetrics: React.FC<{ entry: number; sl?: number; tp?: number; side: Trade['side']; qty: number }>
  = ({ entry, sl, tp, side, qty }) => {
  const isLong = side === 'Buy' || side === 'Long';
  const dir = isLong ? 1 : -1;
  const riskPerUnit = (sl == null) ? undefined : Math.max(0, (isLong ? (entry - sl) : (sl - entry)));
  const rewardPerUnit = (tp == null) ? undefined : Math.max(0, (isLong ? (tp - entry) : (entry - tp)));
  const rr = (riskPerUnit && rewardPerUnit && riskPerUnit > 0) ? (rewardPerUnit / riskPerUnit) : null;
  const pnlAtSL = (sl == null) ? null : ((sl - entry) * dir * qty);
  const pnlAtTP = (tp == null) ? null : ((tp - entry) * dir * qty);

  const chip = (label: string, val: string | number, tone: 'neutral'|'pos'|'neg'='neutral') => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${
      tone==='pos' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : tone==='neg' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    }`}>
      {label}: {val}
    </span>
  );

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {rr != null && Number.isFinite(rr) && chip('R:R', rr.toFixed(2))}
      {pnlAtSL != null && chip('P&L @ SL', pnlAtSL.toFixed(2), 'neg')}
      {pnlAtTP != null && chip('P&L @ TP', pnlAtTP.toFixed(2), 'pos')}
      {rr == null && (sl == null || tp == null) && (
        <span className="text-xs text-slate-500">Add SL and TP to see R:R</span>
      )}
    </div>
  );
};

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
        <div key={m} className="space-y-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-colors">
          <div className="text-sm text-slate-500 dark:text-slate-400">{monthName(m)}</div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: daysInMonth(year, m) }, (_, i) => i + 1).map(d => {
              const key = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const rec = dayAgg.get(key);
              return (
                <div
                  key={d}
                  className={`h-4 w-4 rounded-sm border ${rec ? color(rec.pnl) : `${fallback} dark:bg-slate-700/60 dark:border-slate-600`}`}
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

// ---------- Weekday Breakup bar chart (Modern Enhanced) ----------
const WeekdayBreakup: React.FC<{ dayAgg: Map<string,{pnl:number;count:number}> }> = ({ dayAgg }) => {
  // Calculate metrics
  const sums = [0,0,0,0,0,0,0];
  const counts = [0,0,0,0,0,0,0];
  
  for (const [key, {pnl, count}] of dayAgg.entries()) {
    const dow = new Date(key).getDay();
    sums[dow] += pnl;
    counts[dow] += count;
  }
  
  const max = Math.max(1, ...sums.map(v => Math.abs(v)));
  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100">Weekday Performance</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Performance breakdown by day of week</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs">Profitable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Loss</span>
          </div>
        </div>
      </div>
      
      {/* Graph */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-4">
        {sums.map((v, i) => {
          const pct = Math.max(8, Math.abs(v) / max * 100);
          const positive = v >= 0;
          
          return (
            <div key={i} className="flex flex-col items-center">
              <div className="w-full flex flex-col items-center mb-1 sm:mb-2">
                <div className="relative w-full h-24 sm:h-40 flex flex-col justify-end">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ease-out ${positive ? 'bg-emerald-500' : 'bg-red-500'} group-hover:opacity-90`}
                    style={{ height: `${pct}%` }}
                  >
                    <div className="absolute -top-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="inline-block bg-slate-900 text-white text-xs px-2 py-1 rounded">
                        ₹{v.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{labels[i]}</div>
                <div className={`text-2xs sm:text-xs ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {v === 0 ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(0)}`}
                </div>
                {counts[i] > 0 && (
                  <div className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                    {counts[i]} trade{counts[i] !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Stats */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Best Day</div>
            <div className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100">
              {labels[sums.indexOf(Math.max(...sums))]}
            </div>
          </div>
          <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Worst Day</div>
            <div className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100">
              {labels[sums.indexOf(Math.min(...sums))]}
            </div>
          </div>
          <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total</div>
            <div className={`text-sm sm:text-base font-medium ${sums.reduce((a,b) => a+b, 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{sums.reduce((a,b) => a+b, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Month Calendar with daily P&L ----------
const MonthCalendar: React.FC<{ year: number; month: number; setMonth: (m:number)=>void; dayAgg: Map<string,{pnl:number;count:number}>; onSelectDate?: (isoDate: string, pnl?: number)=>void }>
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
          <button onClick={prev} className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">‹</button>
          <button onClick={next} className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => c.date && onSelectDate && onSelectDate(c.date, c.pnl)}
            className={`text-left h-16 rounded border border-slate-200 dark:border-slate-700 p-1 overflow-hidden ${c.pnl!=null ? (c.pnl>0?'bg-emerald-50/60 dark:bg-emerald-900/20':'bg-red-50/60 dark:bg-red-900/20') : ''} hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-colors`}
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{c.label}</div>
            <div className={`text-xs ${c.pnl!=null?(c.pnl>0?'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400'):''}`}>{fmt(c.pnl)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

function monthName(m: number) {
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][m] || '';
}

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }>
  = ({ label, value, onChange, type = 'text' }) => (
  <label className="text-sm">
    <span className="block mb-1 text-slate-600">{label}</span>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="input" />
  </label>
);

export default Journal;
