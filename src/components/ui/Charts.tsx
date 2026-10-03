interface ChartPoint {
  label: string;
  value: number;
}

interface EquityPoint {
  index: number;
  date: string;
  balance: number;
  pnl: number;
}

export function LineChart({
  data,
  height = 220,
  color = '#3b82f6',
  showAxis = true,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showAxis?: boolean;
}) {
  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  const width = 800;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const zeroY = padding.top + chartH - ((0 - minVal) / range) * chartH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showAxis && (
        <>
          <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padding.left - 8} y={padding.top + 8} fill="#71717a" fontSize="10" textAnchor="end">
            {formatAxis(maxVal)}
          </text>
          <text x={padding.left - 8} y={zeroY + 4} fill="#71717a" fontSize="10" textAnchor="end">
            0
          </text>
          <text x={padding.left - 8} y={padding.top + chartH + 4} fill="#71717a" fontSize="10" textAnchor="end">
            {formatAxis(minVal)}
          </text>
        </>
      )}
      <path d={areaD} fill={`url(#grad-${color.slice(1)})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.length <= 30 &&
        points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} className="opacity-0 hover:opacity-100 transition-opacity" />
        ))}
    </svg>
  );
}

export function EquityCurveChart({ data, height = 240 }: { data: EquityPoint[]; height?: number }) {
  const chartData = data.map((d) => ({ label: d.date, value: d.balance }));
  return <LineChart data={chartData} height={height} color="#10b981" />;
}

export function BarChart({
  data,
  height = 220,
  showAxis = true,
}: {
  data: ChartPoint[];
  height?: number;
  showAxis?: boolean;
}) {
  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  const width = 800;
  const padding = { top: 20, right: 20, bottom: 35, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  const range = maxVal - minVal || 1;

  const barWidth = chartW / data.length;
  const barPadding = barWidth * 0.2;
  const actualBarWidth = barWidth - barPadding;

  const zeroY = padding.top + chartH - ((0 - minVal) / range) * chartH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {showAxis && (
        <>
          <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="#27272a" strokeWidth="1" />
          <text x={padding.left - 8} y={padding.top + 8} fill="#71717a" fontSize="10" textAnchor="end">
            {formatAxis(maxVal)}
          </text>
          <text x={padding.left - 8} y={zeroY + 4} fill="#71717a" fontSize="10" textAnchor="end">
            0
          </text>
          <text x={padding.left - 8} y={padding.top + chartH + 4} fill="#71717a" fontSize="10" textAnchor="end">
            {formatAxis(minVal)}
          </text>
        </>
      )}
      {data.map((d, i) => {
        const x = padding.left + i * barWidth + barPadding / 2;
        const barHeight = Math.abs((d.value / range) * chartH);
        const y = d.value >= 0 ? zeroY - barHeight : zeroY;
        const color = d.value >= 0 ? '#10b981' : '#ef4444';
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={actualBarWidth}
              height={barHeight}
              fill={color}
              rx="3"
              className="transition-opacity hover:opacity-80"
            />
            <text x={x + actualBarWidth / 2} y={height - padding.bottom + 18} fill="#71717a" fontSize="9" textAnchor="middle">
              {d.label.length > 8 ? d.label.slice(0, 8) : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  data,
  size = 180,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <p className="text-sm text-zinc-600">No data</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 24;

  let cumulative = 0;
  const segments = data.map((d) => {
    const fraction = d.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const largeArc = fraction > 0.5 ? 1 : 0;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    return {
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: d.color,
      label: d.label,
      value: d.value,
      pct: (fraction * 100).toFixed(1),
    };
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#27272a" strokeWidth={strokeWidth} />
        {segments.map((s, i) => (
          <path
            key={i}
            d={s.path}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#e4e4e7" fontSize="20" fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill="#71717a" fontSize="11">
          Total
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-zinc-300">{s.label}</span>
            <span className="text-zinc-500 ml-auto tabular-nums">{s.value} ({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBarChart({
  data,
  height,
}: {
  data: { label: string; value: number; color?: string; secondary?: string }[];
  height?: number;
}) {
  if (data.length === 0) {
    return <EmptyChart height={height ?? 200} />;
  }

  const maxVal = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const autoHeight = data.length * 36 + 8;

  return (
    <div className="space-y-2.5" style={{ minHeight: height }}>
      {data.map((d, i) => {
        const widthPct = (Math.abs(d.value) / maxVal) * 100;
        const isPositive = d.value >= 0;
        const color = d.color ?? (isPositive ? '#10b981' : '#ef4444');
        return (
          <div key={i} className="flex items-center gap-3 group">
            <div className="w-28 text-xs text-zinc-400 truncate flex-shrink-0">{d.label}</div>
            <div className="flex-1 relative h-7 bg-zinc-800/50 rounded-md overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-md transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{ width: `${widthPct}%`, backgroundColor: `${color}33`, borderColor: color, borderWidth: 0, borderLeft: `3px solid ${color}` }}
              >
                <span className="text-xs font-medium tabular-nums" style={{ color }}>
                  {d.secondary ?? d.value.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-zinc-600 text-sm" style={{ height }}>
      No data available
    </div>
  );
}

function formatAxis(val: number): string {
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toFixed(0);
}
