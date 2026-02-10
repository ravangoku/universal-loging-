import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, TimeScale, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, TimeScale, Tooltip, Legend);

export default function Charts({ logs = [] }) {
  const byLevel = logs.reduce((acc, l) => { acc[l.log_level] = (acc[l.log_level]||0)+1; return acc; }, {});
  const levels = ['ERROR','WARN','INFO','DEBUG'];
  const levelData = levels.map(l => byLevel[l]||0);

  const times = {};
  logs.forEach(l => {
    const k = new Date(l.timestamp).toISOString().slice(0,16);
    times[k] = (times[k]||0) + (l.log_level === 'ERROR' ? 1 : 0);
  });
  const timeKeys = Object.keys(times).sort();
  const errorSeries = timeKeys.map(k => times[k]);

  return (
    <section className="card charts">
      <div className="chart">
        <h3>Error Count Over Time</h3>
        <Line data={{ labels: timeKeys, datasets: [{ label: 'Errors', data: errorSeries, borderColor: '#ff4d4f' }] }} />
      </div>
      <div className="chart">
        <h3>Log Distribution by Severity</h3>
        <Bar data={{ labels: levels, datasets: [{ label: 'Count', data: levelData, backgroundColor: ['#ff4d4f','#ffa940','#2f54eb','#595959'] }] }} />
      </div>
    </section>
  );
}
