"use client";

import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";

interface ReputationChartProps {
  data: {
    date: string;
    score: number;
  }[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-card border-3 border-primary p-4 shadow-[6px_6px_0px_0px_rgba(0,229,229,0.4)]">
        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
          {new Date(label).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-primary">
            {payload[0].value?.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-foreground uppercase">
            Score
          </span>
        </div>
      </div>
    );
  }
  return null;
};

interface CursorProps {
  points?: Array<{ x: number; y: number }>;
  height?: number;
}

const CustomCursor = (props: CursorProps) => {
  const { points, height } = props;
  if (!points || points.length === 0) return null;
  const { x } = points[0];

  return (
    <line
      x1={x}
      y1={0}
      x2={x}
      y2={height}
      stroke="hsl(var(--primary))"
      strokeWidth={3}
      opacity={0.5}
    />
  );
};

export function ReputationChart({ data }: ReputationChartProps) {
  const sortedData = [...data].reverse();

  return (
    <div className="h-full w-full min-h-[350px] relative">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={sortedData}
          margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
        >
          <defs>
            {/* Bold Gradient for Area */}
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.6}
              />
              <stop
                offset="50%"
                stopColor="hsl(var(--secondary))"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--accent))"
                stopOpacity={0.1}
              />
            </linearGradient>

            {/* Line Gradient */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>

          {/* Bold Grid Lines */}
          <CartesianGrid
            strokeDasharray="0"
            stroke="hsl(var(--border))"
            strokeWidth={2}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            stroke="hsl(var(--foreground))"
            strokeWidth={3}
            tick={{
              fill: "hsl(var(--foreground))",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
            tickLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 2 }}
            axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 3 }}
            tickMargin={12}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
          />

          <YAxis
            domain={[60, 100]}
            stroke="hsl(var(--foreground))"
            strokeWidth={3}
            tick={{
              fill: "hsl(var(--foreground))",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
            tickLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 2 }}
            axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 3 }}
            tickMargin={12}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={<CustomCursor />}
            animationDuration={150}
          />

          {/* Area Fill */}
          <Area
            type="monotone"
            dataKey="score"
            stroke="none"
            fillOpacity={1}
            fill="url(#colorScore)"
            animationDuration={1000}
          />

          {/* Bold Line on Top */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="url(#lineGradient)"
            strokeWidth={4}
            dot={{
              r: 0,
              fill: "hsl(var(--primary))",
              strokeWidth: 0,
            }}
            activeDot={{
              r: 8,
              fill: "hsl(var(--accent))",
              stroke: "hsl(var(--foreground))",
              strokeWidth: 3,
            }}
            animationDuration={1000}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-primary" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-secondary" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-accent" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-primary" />
    </div>
  );
}
