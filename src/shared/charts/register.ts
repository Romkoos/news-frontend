import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components once in a shared module
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, ChartTitle, Tooltip, Legend);

export {};