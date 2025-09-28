import '../../..//shared/charts/register';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import { getDaily, type DailyStat } from '../../../entities/statistics/api';
import { alignSeries, generateDailyLabels } from '../../../entities/statistics/lib/utils';
import type {ActivityPeriod} from "../../../pages/statistics/ui/StatisticsPage.tsx";

export default function ActivityStatsChart({ period }: { period: ActivityPeriod }) {
  const { t, lang } = useI18n();

  const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 576 : false);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

    function periodToDays(p: ActivityPeriod): number {
        switch (p) {
            case '24h': return 1;
            case '3d': return 3;
            case '7d': return 7;
            case '1m': return 30;
            case '3m': return 90;
        }
    }
    function titleByPeriod(lang: 'ru' | 'en', period: ActivityPeriod): string {
        if (period === '24h') return lang === 'ru' ? 'Публикации за 24 часа' : 'Published in the last 24 hours';
        if (period === '3d') return lang === 'ru' ? 'Публикации за 3 дня' : 'Published in the last 3 days';
        if (period === '7d') return lang === 'ru' ? 'Публикации за 7 дней' : 'Published in the last 7 days';
        if (period === '1m') return lang === 'ru' ? 'Публикации за 1 месяц' : 'Published in the last 1 month';
        return lang === 'ru' ? 'Публикации за 3 месяца' : 'Published in the last 3 months';
    }
  const days = useMemo(() => periodToDays(period), [period]);

  // Labels
  const labels = useMemo(() => generateDailyLabels(days), [days]);

  // Data
  const [dailySeries, setDailySeries] = useState<DailyStat[] | null>(null);

  useEffect(() => {
    let aborted = false;
    getDaily(days)
      .then(arr => { if (!aborted) setDailySeries(arr); })
      .catch(() => { /* ignore */ });
    return () => { aborted = true; };
  }, [days]);

  // Prepared datasets

  const published = useMemo(() => alignSeries(dailySeries?.map(d => d.published), labels.length), [dailySeries, labels]);
  const rejected = useMemo(() => alignSeries(dailySeries?.map(d => d.rejected), labels.length), [dailySeries, labels]);
  const moderated = useMemo(() => alignSeries(dailySeries?.map(d => d.moderated), labels.length), [dailySeries, labels]);
  const filtered = useMemo(() => alignSeries(dailySeries?.map(d => d.filtered), labels.length), [dailySeries, labels]);

  const commonOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: { radius: 0, hoverRadius: 3, hitRadius: 8 },
      line: { borderWidth: 2 },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 10,
          font: { size: 10 },
          usePointStyle: true,
        },
      },
      title: { display: true, text: titleByPeriod(lang, period) },
      tooltip: { mode: 'nearest', intersect: true },
    },
    interaction: { intersect: true, mode: 'nearest' },
    layout: { padding: { left: 4, right: 8, top: 4, bottom: 4 } },
    animation: { duration: 250 },
  }), [lang, period]);

  const options = useMemo<ChartOptions<'line'>>(() => ({
    ...commonOptions,
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: days, maxRotation: 0, autoSkip: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)', borderDash: [3, 3] }, ticks: { maxTicksLimit: isSmall ? 4 : 6 } },
    },
  }), [commonOptions, isSmall, days]);

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
