import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";

type Row = Record<string, string | number>;

const palette = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  tickLine: false,
  axisLine: false,
  fontSize: 12,
} as const;

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    color: "var(--color-popover-foreground)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
} as const;

export function ChartCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AnalyticsChart({
  type,
  data,
  xKey,
  series,
  height = 260,
  unit,
}: {
  type: "line" | "area" | "bar" | "pie";
  data: Row[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number;
  unit?: string;
}) {
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={series[0]?.key ?? "value"}
            nameKey={xKey}
            innerRadius="55%"
            outerRadius="82%"
            paddingAngle={3}
            stroke="var(--color-card)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} {...(unit ? { unit } : {})} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={palette[i % palette.length]}
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette[i % palette.length]} stopOpacity={0.28} />
                <stop offset="100%" stopColor={palette[i % palette.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} {...(unit ? { unit } : {})} />
          <Tooltip {...tooltipStyle} />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={palette[i % palette.length]}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} {...(unit ? { unit } : {})} />
        <Tooltip {...tooltipStyle} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={palette[i % palette.length]}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: palette[i % palette.length] }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
