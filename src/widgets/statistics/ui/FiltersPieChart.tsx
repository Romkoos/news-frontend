import '../../..//shared/charts/register';
import {useEffect, useMemo, useState} from 'react';
import { Pie } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import { getFiltersDaily, type FiltersDaily } from '../../../entities/statistics/api';
import type {ActivityPeriod} from '../../../pages/statistics/ui/StatisticsPage';

function periodToDays(p: ActivityPeriod): number {
  switch (p) {
    case '24h': return 1;
    case '3d': return 3;
    case '7d': return 7;
    case '1m': return 30;
    case '3m': return 90;
  }
}

function palette(n: number): string[] {
  const base = [
    '#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba',
    '#FF6384', '#36A2EB', '#FFCE56', '#FF9F40', '#4BC0C0', '#9966FF', '#C9CBCF', '#8A2BE2', '#2E8B57'
  ];
  if (n <= base.length) return base.slice(0, n);
  // generate additional colors if needed
  const colors: string[] = base.slice();
  for (let i = base.length; i < n; i++) {
    const hue = Math.floor((360 / n) * i);
    colors.push(`hsl(${hue} 70% 55%)`);
  }
  return colors;
}

export default function FiltersPieChart({ period }: { period: ActivityPeriod }) {
  const { t } = useI18n();

  const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 576 : false);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const days = useMemo(() => periodToDays(period), [period]);

  const [dataDaily, setDataDaily] = useState<FiltersDaily | null>(null);

  useEffect(() => {
    let aborted = false;
    getFiltersDaily(days)
      .then(arr => { if (!aborted) setDataDaily(arr); })
      .catch(() => { /* ignore */ });
    return () => { aborted = true; };
  }, [days]);

  const latest = useMemo(() => {
    if (!dataDaily || dataDaily.length === 0) return null;
    // assume array is in chronological order; take last
    return dataDaily[dataDaily.length - 1];
  }, [dataDaily]);

  const labels = useMemo(() => latest?.items.map(i => i.note) ?? [], [latest]);
  const values = useMemo(() => latest?.items.map(i => i.count) ?? [], [latest]);
  const colors = useMemo(() => palette(labels.length), [labels.length]);

  const options = useMemo<ChartOptions<'pie'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, boxHeight: 12, padding: 10, font: { size: 10 }, usePointStyle: true },
      },
      title: { display: true, text: t('statistics.filtersPie.title') },
      tooltip: { mode: 'nearest', intersect: true },
    },
    layout: { padding: { left: 4, right: 8, top: 4, bottom: 4 } },
    animation: { duration: 250 },
  }), [t]);

  const chartData = useMemo<ChartData<'pie'>>(() => ({
    labels,
    datasets: [
      {
        label: t('statistics.filtersPie.legend'),
        data: values,
        backgroundColor: colors.map(c => `${c}CC`),
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  }), [labels, values, colors, t]);

  return (
    <div style={{ height: isSmall ? 260 : 340 }}>
      {labels.length > 0 ? (
        <Pie options={options} data={chartData} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', fontSize: 12 }}>
          {t('statistics.filtersPie.empty')}
        </div>
      )}
    </div>
  );
}
