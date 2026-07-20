import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  MARK_CATEGORIES, categoryLabel, categoryColor,
  categoriesPresent, buildChartData, computeTrends,
} from '@/lib/progressAnalysis';

const TrendIcon = ({ dir }) => {
  if (dir === 'up') return <TrendingUp size={14} className="text-green-600" />;
  if (dir === 'down') return <TrendingDown size={14} className="text-red-600" />;
  return <Minus size={14} className="text-slate-400" />;
};

/**
 * ProgressChart — colour-coded 1-5 marks over time.
 * Props:
 *   marks         normalised student marks (from normalizeMarks)
 *   classAverages { [category]: number } — optional class average per category
 */
const ProgressChart = ({ marks = [], classAverages = {} }) => {
  const [active, setActive] = useState('all'); // 'all' or a category key
  const cats = useMemo(() => categoriesPresent(marks), [marks]);
  const chartData = useMemo(() => buildChartData(marks), [marks]);
  const trends = useMemo(() => computeTrends(marks), [marks]);

  if (!marks.length) {
    return <p className="text-sm text-slate-500 py-8 text-center">No marks recorded yet to chart.</p>;
  }

  const visibleCats = active === 'all' ? cats : [active];

  return (
    <div className="space-y-4">
      {/* Filter chips (colour-coded per kind of mark) */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActive('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
            active === 'all' ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All marks
        </button>
        {cats.map((c) => {
          const color = categoryColor(c);
          const on = active === c;
          const t = trends[c];
          return (
            <button
              key={c}
              onClick={() => setActive(on ? 'all' : c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition inline-flex items-center gap-1.5 ${
                on ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              style={on ? { backgroundColor: color } : {}}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: on ? '#fff' : color }} />
              {categoryLabel(c)}
              {t && <TrendIcon dir={t.direction} />}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, name) => [Number(value).toFixed(1), categoryLabel(name)]}
              labelStyle={{ fontSize: 12 }}
            />
            {visibleCats.map((c) => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                name={c}
                stroke={categoryColor(c)}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            {/* Class-average reference line when a single category is selected */}
            {active !== 'all' && classAverages[active] != null && (
              <ReferenceLine
                y={classAverages[active]}
                stroke={categoryColor(active)}
                strokeDasharray="6 4"
                label={{ value: `Class avg ${Number(classAverages[active]).toFixed(1)}`, position: 'right', fontSize: 10, fill: categoryColor(active) }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend summary badges */}
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => {
          const t = trends[c];
          if (!t) return null;
          const classAvg = classAverages[c];
          return (
            <div key={c} className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 bg-white">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(c) }} />
              <span className="text-xs font-medium text-slate-700">{categoryLabel(c)}</span>
              <span className="text-xs text-slate-500">{t.last?.toFixed?.(1) ?? t.last}</span>
              <TrendIcon dir={t.direction} />
              {classAvg != null && (
                <span className="text-[11px] text-slate-400">/ class {Number(classAvg).toFixed(1)}</span>
              )}
              {t.declines >= 2 && (
                <span className="text-[11px] font-semibold text-red-600">↓{t.declines}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressChart;
