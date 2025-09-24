import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {getHiddenStats24h, getStats24h} from '../../../entities/statistics/api';

// Register Chart.js components once per module
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

function generateHourlyLabels(hours: number, locale?: string): string[] {
  const now = new Date();
  const currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0); // round to the full hour
  const labels: string[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(currentHour);
    d.setHours(currentHour.getHours() - i);

    const label = d.toLocaleTimeString(locale || undefined, { hour: '2-digit', minute: '2-digit' });
    labels.push(label);
  }
  return labels;
}

function alignSeries(values: number[] | null | undefined, n: number): number[] {
  const source = Array.isArray(values) ? values.slice() : [];
  if (source.length >= n) {
    return source.slice(source.length - n);
  }
  return Array(n - source.length).fill(0).concat(source);
}

export default function StatisticsPage() {
  const { t } = useI18n();

  // Responsive small screens
  const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 576 : false);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const labels = useMemo(() => generateHourlyLabels(24), []);

  const [series, setSeries] = useState<number[] | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<number[] | null>(null);

  useEffect(() => {
    let aborted = false;
    getStats24h()
      .then(arr => { if (!aborted) setSeries(arr); })
      .catch(() => { /* ignore */ });
    getHiddenStats24h()
        .then(arr => { if (!aborted) setHiddenSeries(arr); })
        .catch(() => { /* ignore */ });
    return () => { aborted = true; };

  }, []);

  const series24 = useMemo(() => alignSeries(series, labels.length), [series, labels]);
  const hiddenSeries24 = useMemo(() => alignSeries(hiddenSeries, labels.length), [hiddenSeries, labels]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 0,
        hoverRadius: 3,
        hitRadius: 8,
      },
      line: {
        borderWidth: 2,
      },
    },
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: t('statistics.title') },
      tooltip: { mode: 'nearest' as const, intersect: true },
    },
    interaction: { intersect: true, mode: 'nearest' as const },
    layout: { padding: { left: 4, right: 8, top: 4, bottom: 4 } },
    animation: { duration: 250 },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: isSmall ? 12 : 24, maxRotation: 0, autoSkip: true },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)', borderDash: [3, 3] },
        ticks: { maxTicksLimit: isSmall ? 4 : 6 },
      },
    },
  }), [t, isSmall]);

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: t('statistics.legend.published'),
        data: series24,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.3)',
        tension: 0.25,
      },
      {
        label: t('statistics.legend.filtered'),
        data: hiddenSeries24,
        borderColor: '#9b59b6',
        backgroundColor: 'rgba(155, 89, 182, 0.3)',
        tension: 0.25,
      }
    ],
  }), [labels, series24, hiddenSeries24, t]);

    console.log('hiddenSeries', hiddenSeries)

  return (
    <div style={{ padding: 16 }}>
        <div style={{ height: isSmall ? 220 : 320 }}>
          <Line options={options} data={data} />
        </div>
    </div>
  );
}

