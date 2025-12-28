'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, CheckCircle2, Clock, Layers, BarChart3 } from 'lucide-react';
import type { DashboardMetrics } from '@/types';
import { cn, getStageLabel } from '@/lib/utils';

const STAGE_COLORS: Record<string, string> = {
  specify: '#a855f7',
  plan: '#3b82f6',
  tasks: '#eab308',
  implement: '#f97316',
  complete: '#22c55e',
};

interface StatBadgeProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

function StatBadge({ icon, value, label, color }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
      <span className={cn('flex-shrink-0', color)}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight">{value}</span>
        <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      </div>
    </div>
  );
}

interface DashboardMetricsProps {
  metrics: DashboardMetrics;
}

export function DashboardMetricsPanel({ metrics }: DashboardMetricsProps) {
  // Transform data for ComposedChart - correlate phases with cumulative progress
  const correlatedData = useMemo(() => {
    const phases = Object.entries(metrics.tasksByPhase);
    let cumulative = 0;

    return phases.map(([phase, count]) => {
      cumulative += count;
      const progressPercent = metrics.totalTasks > 0
        ? Math.round((cumulative / metrics.totalTasks) * 100)
        : 0;

      return {
        name: phase.length > 12 ? phase.slice(0, 12) + '...' : phase,
        fullName: phase,
        tasks: count,
        cumulative,
        progress: progressPercent,
      };
    });
  }, [metrics.tasksByPhase, metrics.totalTasks]);

  // Stage distribution for legend
  const stageData = useMemo(() => {
    return Object.entries(metrics.featuresByStage)
      .filter(([_, count]) => count > 0)
      .map(([stage, count]) => ({
        stage,
        label: getStageLabel(stage),
        count,
        color: STAGE_COLORS[stage],
      }));
  }, [metrics.featuresByStage]);

  const hasData = correlatedData.length > 0;

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
      {/* Header with title */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[var(--muted-foreground)]" />
        <h3 className="text-sm font-medium">Project Overview</h3>
      </div>

      {/* Compact stat badges row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <StatBadge
          icon={<Layers className="w-4 h-4" />}
          value={metrics.totalFeatures}
          label="Features"
          color="text-blue-400"
        />
        <StatBadge
          icon={<TrendingUp className="w-4 h-4" />}
          value={`${metrics.completionPercentage}%`}
          label="Complete"
          color="text-green-400"
        />
        <StatBadge
          icon={<CheckCircle2 className="w-4 h-4" />}
          value={metrics.completedTasks}
          label="Done"
          color="text-green-400"
        />
        <StatBadge
          icon={<Clock className="w-4 h-4" />}
          value={metrics.pendingTasks}
          label="Pending"
          color="text-yellow-400"
        />
      </div>

      {/* Stage distribution pills */}
      {stageData.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {stageData.map(({ stage, label, count, color }) => (
            <div
              key={stage}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: `${color}20` }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span style={{ color }}>{label}</span>
              <span className="text-[var(--muted-foreground)]">({count})</span>
            </div>
          ))}
        </div>
      )}

      {/* ComposedChart - Tasks by Phase with Progress Line */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart
            data={correlatedData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'progress') return [`${value}%`, 'Cumulative Progress'];
                if (name === 'tasks') return [value, 'Tasks in Phase'];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                return item?.fullName || label;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'tasks') return 'Tasks per Phase';
                if (value === 'progress') return 'Cumulative Progress';
                return value;
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="tasks"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="progress"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-[var(--muted-foreground)]">
          No data yet - add features and tasks to see metrics
        </div>
      )}
    </div>
  );
}
