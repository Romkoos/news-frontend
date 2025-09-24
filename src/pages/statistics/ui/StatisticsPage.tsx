import HourlyStatsChart from '../../../widgets/statistics/ui/HourlyStatsChart';
import DailyStatsChart from '../../../widgets/statistics/ui/DailyStatsChart';

export default function StatisticsPage() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <HourlyStatsChart />
        <DailyStatsChart />
      </div>
    </div>
  );
}

