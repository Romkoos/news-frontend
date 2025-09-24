import '../../..//shared/charts/register';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import { getDaily, type DailyStat } from '../../../entities/statistics/api';
import { alignSeries, generateDailyLabels } from '../../../entities/statistics/lib/utils';

export default function DailyStatsChart() {
  const { t } = useI18n();

  const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 576 : false);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const days = 3;
  const labels = useMemo(() => generateDailyLabels(days), [days]);

  const [series, setSeries] = useState<DailyStat[] | null>(null);

  useEffect(() => {
    let aborted = false;
    getDaily(days)
      .then(arr => { if (!aborted) setSeries(arr); })
      .catch(() => { /* ignore */ });
    return () => { aborted = true; };
  }, [days]);

  const published = useMemo(() => alignSeries(series?.map(d => d.published), labels.length), [series, labels]);
  const rejected = useMemo(() => alignSeries(series?.map(d => d.rejected), labels.length), [series, labels]);
  const moderated = useMemo(() => alignSeries(series?.map(d => d.moderated), labels.length), [series, labels]);
  const filtered = useMemo(() => alignSeries(series?.map(d => d.filtered), labels.length), [series, labels]);

  const options = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: { radius: 0, hoverRadius: 3, hitRadius: 8 },
      line: { borderWidth: 2 },
    },
    plugins: {
      legend: {
          position: 'top' as const, // или 'bottom', 'left', 'right'
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
      title: { display: true, text: t('statistics.title.last3days') },
      tooltip: { mode: 'nearest' as const, intersect: true },
    },
    interaction: { intersect: true, mode: 'nearest' as const },
    layout: { padding: { left: 4, right: 8, top: 4, bottom: 4 } },
    animation: { duration: 250 },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: days, maxRotation: 0, autoSkip: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)', borderDash: [3, 3] }, ticks: { maxTicksLimit: isSmall ? 4 : 6 } },
    },
  }), [t, isSmall, days]);

  const data = useMemo<ChartData<'line'>>(() => ({
    labels,
    datasets: [
      { label: t('statistics.legend.published'), data: published, borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.2)', tension: 0.25 },
      { label: t('statistics.legend.rejected'), data: rejected, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', tension: 0.25 },
      { label: t('statistics.legend.moderated'), data: moderated, borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', tension: 0.25 },
      { label: t('statistics.legend.filtered'), data: filtered, borderColor: '#9b59b6', backgroundColor: 'rgba(155, 89, 182, 0.2)', tension: 0.25 },
    ],
  }), [labels, published, rejected, moderated, filtered, t]);

  return (
    <div style={{ height: isSmall ? 220 : 320 }}>
      <Line options={options} data={data} />
    </div>
  );
}
