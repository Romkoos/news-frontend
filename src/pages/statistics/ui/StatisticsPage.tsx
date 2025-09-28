import HourlyStatsChart from '../../../widgets/statistics/ui/HourlyStatsChart';
import ActivityStatsChart from "../../../widgets/statistics/ui/ActivityStatsChart.tsx";

export type ActivityPeriod = '24h' | '3d' | '7d' | '1m' | '3m';

export default function StatisticsPage() {

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <HourlyStatsChart />
        <ActivityStatsChart period={'7d'} />
      </div>
    </div>
  );
}

