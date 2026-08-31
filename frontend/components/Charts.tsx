// Inline data visualizations for chat answers. The backend attaches
// chart-ready series (see ChartSeries in lib/types) computed straight from
// the same analytics the text answer is built from, so a chart can never
// show a different number than the prose next to it.

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChartSeries } from '@/lib/types';

const PALETTE = ['#38bdf8', '#22d3ee', '#a78bfa', '#fb923c', '#f472b6', '#34d399'];

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 text-xs shadow-glow-sm">
      {label && <p className="text-sand-200 font-medium mb-0.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-accent-300">
          {p.name ?? p.dataKey}:{' '}
          <span className="text-white font-semibold">{Number(p.value).toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  );
}

export default function Charts({ charts }: { charts?: ChartSeries[] }) {
  if (!charts || charts.length === 0) return null;

  return (
    <div className={`grid gap-3 ${charts.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
      {charts.map((chart, idx) => (
        <div key={idx} className="bg-ink-900/60 border border-ink-700 rounded-xl p-3">
          <p className="text-xs font-semibold text-sand-200 mb-2">{chart.title}</p>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chart.data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={38}
                    outerRadius={68}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {chart.data.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={chart.data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c3546" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#b6aca4', fontSize: 10 }}
                    axisLine={{ stroke: '#1c3546' }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    tick={{ fill: '#b6aca4', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompact}
                    width={38}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56,189,248,0.08)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {chart.data.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          {chart.type === 'pie' && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {chart.data.map((d, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[10px] text-sand-100/70">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
