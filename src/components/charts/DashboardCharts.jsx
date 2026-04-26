import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line as ChartLine, Bar as ChartBar, Doughnut as ChartDoughnut } from 'react-chartjs-2';
import { useInView } from '../../hooks/useInView';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
        }
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false,
            },
            ticks: {
                color: '#6c757d'
            }
        },
        y: {
            grid: {
                color: 'rgba(108, 117, 125, 0.1)',
                drawBorder: false,
            },
            ticks: {
                color: '#6c757d',
                callback: function(value) {
                    if (value >= 1000) {
                        return '₹' + value / 1000 + 'k';
                    }
                    return '₹' + value;
                }
            }
        }
    }
};

export const MonthlyExpenseChart = ({ transactions = [] }) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const labels = [];
  const expenseData = [];
  
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
      
      const monthTxns = transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
      });
      
      const expense = monthTxns.filter(t => t.type === 'Debit').reduce((s, t) => s + Number(t.amount), 0);
      expenseData.push(expense);
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#6f42c1',
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#6f42c1',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <div ref={ref} style={{ height: '300px' }}>
      {isInView && <ChartLine options={{...commonOptions, plugins: { legend: { display:false }}}} data={data} />}
    </div>
  );
};

export const IncomeVsExpenseChart = ({ transactions = [] }) => {
    const { ref, isInView } = useInView({ threshold: 0.1 });

    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayEnd);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
        
        const dayStart = new Date(d);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23,59,59,999);
        
        const dayTxns = transactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= dayStart && txDate <= dayEnd;
        });
        
        const income = dayTxns.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
        const expense = dayTxns.filter(t => t.type === 'Debit').reduce((s, t) => s + Number(t.amount), 0);
        
        incomeData.push(income);
        expenseData.push(expense);
    }

    const data = {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#20c997',
          borderRadius: 4,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: '#0d6efd',
          borderRadius: 4,
        },
      ],
    };

    const options = {
        ...commonOptions,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                }
            }
        }
    };
  
    return (
      <div ref={ref} style={{ height: '300px' }}>
        {isInView && <ChartBar options={options} data={data} />}
      </div>
    );
};

export const WeeklyExpenseChart = ({ transactions = [] }) => {
    const { ref, isInView } = useInView({ threshold: 0.1 });

    const categoryMap = {};
    transactions.filter(t => t.type === 'Debit').forEach(t => {
        const cat = t.category || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount);
    });
    
    let topCategories = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    if (topCategories.length === 0) {
        topCategories = [['No Expenses', 1]];
    }

    const data = {
        labels: topCategories.map(c => c[0]),
        datasets: [
            {
                data: topCategories.map(c => c[1]),
                backgroundColor: [
                    '#0d6efd',
                    '#6f42c1',
                    '#20c997',
                    '#ffc107',
                    '#dc3545'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    color: '#6c757d'
                }
            }
        }
    };

    return (
        <div ref={ref} style={{ height: '250px' }}>
            {isInView && <ChartDoughnut data={data} options={options} />}
        </div>
    );
}
