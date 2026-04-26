import React, { useState, useEffect, useCallback } from 'react';
import { 
    MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown, 
    MdReceipt, MdArrowForward, MdSave, MdDownload, MdPayment 
} from 'react-icons/md';
import { fetchTransactions, updateTransaction, fetchCustomers } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { IncomeVsExpenseChart, WeeklyExpenseChart, MonthlyExpenseChart } from '../components/charts/DashboardCharts';
import { downloadBackup } from '../utils/autoSave';
import { getLocalDateString } from '../utils/dateUtils';
import { getAppDetails } from '../utils/paymentApps';
import { useAuth } from '../context/AuthContext';

const getColor = (name) => getAppDetails(name).color;

const StatCard = ({ title, value, prefix, suffix, icon, colorClass, description }) => (
  <div className="card modern-card p-3 p-lg-4 h-100 border-0">
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <p className="text-muted small mb-1 fw-semibold">{title}</p>
        <h3 className="fw-bold mb-0">{prefix}{value}{suffix}</h3>
        <small className="text-muted">{description}</small>
      </div>
      <div className={`bg-${colorClass} bg-opacity-10 text-${colorClass} p-2 p-lg-3 rounded-3`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const user = userData || {};
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ totalBalance: 0, totalCredit: 0, totalDebit: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [lastSave, setLastSave] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [viewMode, setViewMode] = useState('Lifetime'); // 'Month' or 'Lifetime'

  const playRingAlert = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) { console.error(e); }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [transRes, custRes] = await Promise.all([fetchTransactions(), fetchCustomers()]);
      const data = transRes.data;
      setTransactions(data);
      setCustomers(custRes.data);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const filtered = viewMode === 'Month' 
        ? data.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
        : data;

      const totalCredit = filtered.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
      const totalDebit = filtered.filter(t => t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan').reduce((s, t) => s + Number(t.amount || t.debit || 0), 0);
      setStats({ totalBalance: totalCredit - totalDebit, totalCredit, totalDebit, count: filtered.length });


      const saveInfo = localStorage.getItem(`lastAutoSave_${(await import('../firebase')).auth.currentUser?.uid}`);
      if (saveInfo) setLastSave(JSON.parse(saveInfo));

      // Check for EMI alerts (2 days before due date)
      const today = new Date();
      const thresholdDate = new Date(today);
      thresholdDate.setDate(today.getDate() + 2);
      const thresholdStr = getLocalDateString(thresholdDate);

      const pendingEMIs = data.filter(t => t.type === 'EMI' && t.status === 'Pending' && (!t.dueDate || t.dueDate <= thresholdStr));
      if (pendingEMIs.length > 0) {
        setAlerts(pendingEMIs);
        if (!sessionStorage.getItem('emi_ring_played')) {
          playRingAlert();
          sessionStorage.setItem('emi_ring_played', 'true');
        }
      } else {
        setAlerts([]);
        sessionStorage.removeItem('emi_ring_played');
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload on every navigation to this page or when viewMode changes
  useEffect(() => { loadData(); }, [location.key, viewMode, loadData]);

  // Live auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => { loadData(); }, 3000);
    return () => clearInterval(interval);
  }, [loadData]);


  // Also reload when window regains focus
  useEffect(() => {
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  const handleMarkPaid = async (id) => {
    try {
      await updateTransaction(id, { status: 'Success' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // ===== Payment Analytics =====
  const paymentMethodStats = React.useMemo(() => {
    const cashCount = transactions.filter(t => !t.paymentMethod || t.paymentMethod === 'Cash').length;
    const cashAmount = transactions.filter(t => !t.paymentMethod || t.paymentMethod === 'Cash').reduce((s, t) => s + Number(t.amount), 0);
    const onlineCount = transactions.filter(t => t.paymentMethod === 'Online').length;
    const onlineAmount = transactions.filter(t => t.paymentMethod === 'Online').reduce((s, t) => s + Number(t.amount), 0);
    return { cashCount, cashAmount, onlineCount, onlineAmount };
  }, [transactions]);

  // Payment app breakdown (for online transactions)
  const appBreakdown = React.useMemo(() => {
    const appMap = {};
    transactions.forEach(t => {
      if (t.paymentMethod === 'Online' && t.paymentApp) {
        if (!appMap[t.paymentApp]) appMap[t.paymentApp] = { count: 0, amount: 0 };
        appMap[t.paymentApp].count++;
        appMap[t.paymentApp].amount += Number(t.amount);
      }
    });
    return Object.entries(appMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Top payers by payment method
  const topPayers = React.useMemo(() => {
    const payerMap = {};
    transactions.forEach(t => {
      const key = `${t.name} ${t.lastName || ''}`.trim();
      if (!payerMap[key]) payerMap[key] = { name: key, total: 0, method: t.paymentMethod || 'Cash', app: t.paymentApp || '' };
      payerMap[key].total += Number(t.amount);
      // Keep last payment method
      payerMap[key].method = t.paymentMethod || 'Cash';
      payerMap[key].app = t.paymentApp || '';
    });
    return Object.values(payerMap).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [transactions]);

  const maxPayerAmount = topPayers.length > 0 ? topPayers[0].total : 1;
  const totalTxns = transactions.length || 1;

  const recent = transactions.slice(0, 8);

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Premium EMI Alerts SMS Notification */}
      {alerts.length > 0 && (
        <div style={{ 
          position: 'fixed', top: 24, right: 24, zIndex: 1050, 
          display: 'flex', flexDirection: 'column', gap: 12,
          maxWidth: '400px', width: 'calc(100% - 48px)'
        }}>
          {alerts.map((alert) => (
            <div 
              key={alert._id} 
              className="alert-card shadow-lg mb-0" 
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderLeft: '4px solid #ff3b30',
                borderRadius: '12px',
                padding: '16px',
                animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div className="d-flex align-items-start gap-3">
                <div style={{ 
                  width: 40, height: 40, borderRadius: '50%', 
                  background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  🔔
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="mb-0 fw-bold text-dark" style={{fontSize: '0.95rem'}}>Payment Reminder</h6>
                    <small className="text-muted" style={{fontSize: '0.7rem'}}>Just now</small>
                  </div>
                  <p className="mb-0 text-secondary" style={{fontSize: '0.85rem'}}>
                    EMI of <strong className="text-danger">₹{Number(alert.amount).toLocaleString('en-IN')}</strong> for <strong>{alert.name} {alert.lastName || ''}</strong> is due on <span style={{color: '#ff3b30'}}>{new Date(alert.dueDate || alert.date).toLocaleDateString('en-IN')}</span>.
                  </p>
                  <div className="mt-2">
                    <button 
                      className="btn btn-sm btn-success rounded-pill px-3 py-1 shadow-sm" 
                      style={{fontSize: '0.75rem', fontWeight: 'bold'}}
                      onClick={() => {
                        handleMarkPaid(alert._id);
                        setAlerts(alerts.filter(a => a._id !== alert._id));
                      }}
                    >
                      ✓ Mark Success
                    </button>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  style={{fontSize: '0.7rem', filter: 'brightness(0)'}}
                  onClick={() => setAlerts(alerts.filter(a => a._id !== alert._id))} 
                  title="Dismiss"
                ></button>
              </div>
            </div>
          ))}
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-0">Welcome, {user.firstName || 'User'} 👋</h3>
          <div className="d-flex bg-light p-1 rounded-pill mt-1" style={{ width: 'fit-content' }}>
            <button className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === 'Lifetime' ? 'btn-primary text-white shadow-sm' : 'text-muted'}`} onClick={() => setViewMode('Lifetime')}>Lifetime</button>
            <button className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === 'Month' ? 'btn-primary text-white shadow-sm' : 'text-muted'}`} onClick={() => setViewMode('Month')}>This Month</button>
          </div>
        </div>
        <button className="btn btn-primary px-4 py-2 fw-bold shadow-sm" onClick={() => navigate('/new-entry')}>
          + New Entry
        </button>
      </div>

      {/* Auto-Save Status Bar */}
      <div className="d-flex align-items-center justify-content-between bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 px-3 py-2 mb-4">
        <div className="d-flex align-items-center gap-2">
          <MdSave className="text-success" />
          <span className="small text-success fw-semibold">
            Auto-Save: {lastSave ? `Last saved ${new Date(lastSave.time).toLocaleTimeString('en-IN')} (${lastSave.entries} entries)` : 'Data auto-saves to Excel on every change'}
          </span>
          <span className="badge bg-primary bg-opacity-25 text-primary ms-2" style={{ fontSize: '0.65rem' }}>● LIVE</span>
        </div>
        <button className="btn btn-success btn-sm d-flex align-items-center gap-1 px-3" onClick={() => downloadBackup(transactions, customers)}>
          <MdDownload /> Download Backup
        </button>
      </div>

      {/* Monthly Budget Progress (Only in Month View) */}
      {viewMode === 'Month' && stats.totalCredit > 0 && (
        <div className="card modern-card p-3 mb-4 border-0 shadow-sm animate-fadeIn">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold text-muted text-uppercase" style={{letterSpacing: 1}}>Monthly Budget Usage</span>
            <span className="badge bg-primary rounded-pill">{Math.round((stats.totalDebit / stats.totalCredit) * 100)}%</span>
          </div>
          <div className="progress" style={{ height: 10, borderRadius: 5 }}>
            <div 
              className={`progress-bar progress-bar-striped progress-bar-animated bg-${(stats.totalDebit / stats.totalCredit) > 0.8 ? 'danger' : 'success'}`} 
              role="progressbar" 
              style={{ width: `${Math.min((stats.totalDebit / stats.totalCredit) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="d-flex justify-content-between mt-2">
            <small className="text-muted">Spent: ₹{stats.totalDebit.toLocaleString('en-IN')}</small>
            <small className="text-muted">Available: ₹{Math.max(stats.totalCredit - stats.totalDebit, 0).toLocaleString('en-IN')}</small>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard title="Total Balance" value={stats.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} prefix="₹" icon={<MdAccountBalanceWallet size={24} />} colorClass="primary" description={loading ? "Loading..." : "Net balance"} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard title="Total Credit" value={stats.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} prefix="₹" icon={<MdTrendingUp size={24} />} colorClass="success" description={loading ? "Loading..." : "All income"} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard title="Total Debit" value={stats.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} prefix="₹" icon={<MdTrendingDown size={24} />} colorClass="danger" description={loading ? "Loading..." : "All expenses"} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard title="Transactions" value={stats.count.toString()} icon={<MdReceipt size={24} />} colorClass="warning" description={loading ? "Loading..." : "Total entries"} />
        </div>
      </div>

      {/* ===== Payment Method Analytics ===== */}
      <div className="row g-4 mb-4">
        {/* Cash vs Online breakdown */}
        <div className="col-12 col-lg-4">
          <div className="card modern-card p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <MdPayment size={20} className="text-primary" />
              <h6 className="fw-bold mb-0">Payment Methods</h6>
            </div>

            {/* Cash */}
            <div className="payment-stat-card mb-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>₹</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold small">Cash</span>
                  <span className="fw-bold small text-success">₹{paymentMethodStats.cashAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="payment-stat-bar">
                  <div className="payment-stat-fill" style={{ width: `${(paymentMethodStats.cashCount / totalTxns) * 100}%`, background: '#2e7d32' }}></div>
                </div>
                <small className="text-muted">{paymentMethodStats.cashCount} transactions</small>
              </div>
            </div>

            {/* Online */}
            <div className="payment-stat-card">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold small">Online</span>
                  <span className="fw-bold small" style={{ color: '#1565c0' }}>₹{paymentMethodStats.onlineAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="payment-stat-bar">
                  <div className="payment-stat-fill" style={{ width: `${(paymentMethodStats.onlineCount / totalTxns) * 100}%`, background: '#1565c0' }}></div>
                </div>
                <small className="text-muted">{paymentMethodStats.onlineCount} transactions</small>
              </div>
            </div>

            {/* App-wise breakdown */}
            {appBreakdown.length > 0 && (
              <div className="mt-3 pt-3 border-top">
                <p className="text-muted small fw-semibold mb-2">Online Apps Breakdown</p>
                {appBreakdown.map((app) => (
                  <div key={app.name} className="d-flex align-items-center gap-2 mb-2">
                    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>{getAppDetails(app.name).logo}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="d-flex justify-content-between">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{app.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getColor(app.name) }}>₹{app.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="payment-stat-bar" style={{ height: 4 }}>
                        <div className="payment-stat-fill" style={{ width: `${(app.count / totalTxns) * 100}%`, background: getColor(app.name) }}></div>
                      </div>
                    </div>
                    <span className="badge bg-light text-muted" style={{ fontSize: '0.65rem' }}>{app.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Payers */}
        <div className="col-12 col-lg-4">
          <div className="card modern-card p-4 h-100">
            <h6 className="fw-bold mb-3">💰 Top Payers</h6>
            {topPayers.length === 0 ? (
              <p className="text-muted small text-center py-3">No transactions yet</p>
            ) : (
              topPayers.map((p, i) => (
                <div key={p.name} className="d-flex align-items-center gap-3 mb-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getColor(p.app || p.method)}, ${getColor(p.app || p.method)}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 'bold', fontSize: 14
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold small">{p.name}</span>
                      <span className="fw-bold small">₹{p.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="payment-stat-bar" style={{ height: 5 }}>
                      <div className="payment-stat-fill" style={{
                        width: `${(p.total / maxPayerAmount) * 100}%`,
                        background: `linear-gradient(90deg, ${getColor(p.app || p.method)}, ${getColor(p.app || p.method)}88)`
                      }}></div>
                    </div>
                    <div className="d-flex align-items-center gap-1 mt-1">
                      <span className="badge rounded-pill" style={{ fontSize: '0.6rem', background: getColor(p.app || p.method) + '20', color: getColor(p.app || p.method) }}>
                        {p.app || p.method}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Income vs Expense Chart */}
        <div className="col-12 col-lg-4">
          <div className="card modern-card p-4 h-100">
            <h5 className="fw-bold mb-3">Monthly Expenses</h5>
            <WeeklyExpenseChart transactions={transactions} />
            <div className="mt-3 pt-3 border-top">
              <h6 className="text-muted mb-0 small">Total Debit</h6>
              <h4 className="fw-bold mb-0">₹{stats.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card modern-card p-4 h-100">
            <h5 className="fw-bold mb-3">Income & Expenses Overview</h5>
            <IncomeVsExpenseChart transactions={transactions} />
          </div>
        </div>
      </div>

      {/* Recent Transactions with Payment Method */}
      <div className="card modern-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Recent Transactions</h5>
          <button className="btn btn-sm btn-link text-primary fw-bold text-decoration-none" onClick={() => navigate('/statements')}>
            View All <MdArrowForward />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted text-center py-4">No transactions yet. Add your first entry!</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Name</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Type</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => {
                  const isEmiPaid = t.type === 'EMI' && (t.status === 'Paid' || t.status === 'Success');
                  const isEmiPending = t.type === 'EMI' && t.status === 'Pending';
                  return (
                  <tr key={t._id} className={isEmiPaid ? 'table-success' : ''}>
                    <td className="fw-semibold">{t.name} {t.lastName || ''}</td>
                    <td className="text-muted small">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <div style={{ transform: 'scale(0.6)', transformOrigin: 'left center', width: 20 }}>
                          {getAppDetails(t.paymentApp || t.paymentMethod || 'Cash').logo}
                        </div>
                        <span className="small fw-semibold" style={{ color: getColor(t.paymentApp || t.paymentMethod || 'Cash') }}>
                          {t.paymentApp || t.paymentMethod || 'Cash'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge bg-${t.type === 'Credit' ? 'success' : t.type === 'Debit' ? 'danger' : 'warning'} bg-opacity-10 text-${t.type === 'Credit' ? 'success' : t.type === 'Debit' ? 'danger' : 'warning'} px-3 py-2 rounded-pill`}>
                        {t.type} {t.type === 'EMI' && `- ${t.status || 'Pending'}`}
                      </span>
                    </td>
                    <td className={`text-end fw-bold text-${t.type === 'Credit' ? 'success' : t.type === 'Debit' ? 'danger' : 'warning'}`}>
                      {t.type === 'Debit' ? '-' : '+'}₹{Number(t.amount).toLocaleString('en-IN')}
                      {isEmiPending && (
                        <div className="mt-1">
                          <button className="btn btn-sm btn-success py-0 px-2" onClick={() => handleMarkPaid(t._id)} style={{fontSize:'0.7rem'}}>Mark Success</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Trend */}
      <div className="row g-4 mt-2">
        <div className="col-12">
          <div className="card modern-card p-4">
            <h5 className="fw-bold mb-3">Revenue Trend</h5>
            <MonthlyExpenseChart transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
