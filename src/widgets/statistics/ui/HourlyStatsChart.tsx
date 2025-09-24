import '../../..//shared/charts/register';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import { getHiddenStats24h, getStats24h } from '../../../entities/statistics/api';
import { alignSeries, generateHourlyLabels } from '../../../entities/statistics/lib/utils';

export default function HourlyStatsChart() {
  const { t } = useI18n();

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

  const options = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: { radius: 0, hoverRadius: 3, hitRadius: 8 },
      line: { borderWidth: 2 },
    },
    plugins: {
        legend: {
            position: 'top', // или 'bottom', 'left', 'right'
            labels: {
                boxWidth: 12,      // размер квадратиков
                boxHeight: 12,
                padding: 10,       // отступ между элементами
                font: {
                    size: 10         // размер текста
                },
                usePointStyle: true // если хочешь вместо квадратиков кружочки
            }
        },
      title: { display: true, text: t('statistics.title') },
      tooltip: { mode: 'nearest' as const, intersect: true },
    },
    interaction: { intersect: true, mode: 'nearest' as const },
    layout: { padding: { left: 4, right: 8, top: 4, bottom: 4 } },
    animation: { duration: 250 },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: isSmall ? 12 : 24, maxRotation: 0, autoSkip: true } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)', borderDash: [3, 3] }, ticks: { maxTicksLimit: isSmall ? 4 : 6 } },
    },
  }), [t, isSmall]);

  const data = useMemo<ChartData<'line'>>(() => ({
    labels,
    datasets: [
      { label: t('statistics.legend.published'), data: series24, borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.3)', tension: 0.25 },
      { label: t('statistics.legend.filtered'), data: hiddenSeries24, borderColor: '#9b59b6', backgroundColor: 'rgba(155, 89, 182, 0.3)', tension: 0.25 },
    ],
  }), [labels, series24, hiddenSeries24, t]);

  return (
    <div style={{ height: isSmall ? 220 : 320 }}>
      <Line options={options} data={data} />
    </div>
  );
}
