import React, { useState, useEffect, useCallback } from 'react';
import { MdPayment, MdCheckCircle, MdSchedule, MdWarning } from 'react-icons/md';
import { fetchTransactions, updateTransaction } from '../api';
import { useNavigate } from 'react-router-dom';
import { getLocalDateString } from '../utils/dateUtils';
import { getAppDetails } from '../utils/paymentApps';
import AnimatedNumber from '../components/AnimatedNumber';

const StatCard = ({ title, value, prefix = '', suffix = '', icon, colorClass, description, isCurrency = false, decimals = 0 }) => (
  <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm">
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <p className="text-muted small mb-1 fw-semibold">{title}</p>
        <h3 className="fw-bold mb-0">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} isCurrency={isCurrency} decimals={decimals} />
        </h3>
        <small className="text-muted">{description}</small>
      </div>
      <div className={`bg-${colorClass} bg-opacity-10 text-${colorClass} p-2 p-lg-3 rounded-3`}>
        {icon}
      </div>
    </div>
  </div>
);

const EmiDashboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingCount: 0, successCount: 0, pendingAmount: 0, successAmount: 0 });
  const [alerts, setAlerts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');

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
      const res = await fetchTransactions();
      const data = res.data;
      const financialEntries = data.filter(t => t.type === 'EMI' || t.type === 'Loan');
      
      // Sort: Next Due first, then Taken Date
      const sortedEntries = [...financialEntries].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date);
      });

      setEntries(sortedEntries);

      // Global Stats
      let pCount = 0, sCount = 0, pAmt = 0, sAmt = 0;
      financialEntries.forEach(t => {
        if (['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(t.status)) {
          sCount++;
          sAmt += Number(t.amount);
        } else {
          pCount++;
          pAmt += Number(t.amount);
        }
      });
      setStats({ pendingCount: pCount, successCount: sCount, pendingAmount: pAmt, successAmount: sAmt });

      // Alerts
      const today = new Date();
      const thresholdDate = new Date(today);
      thresholdDate.setDate(today.getDate() + 2);
      const thresholdStr = getLocalDateString(thresholdDate);
      const pendingAlerts = financialEntries.filter(t => t.status === 'Pending' && (!t.dueDate || t.dueDate <= thresholdStr));
      
      if (pendingAlerts.length > 0) {
        setAlerts(pendingAlerts);
        if (!sessionStorage.getItem('emi_ring_played_emidash')) {
          playRingAlert();
          sessionStorage.setItem('emi_ring_played_emidash', 'true');
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [playRingAlert]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleQuickPay = async (id, amount, name, itemType) => {
    if (!window.confirm(`Mark payment of ₹${amount} for ${name} as Paid?`)) return;

    try {
      const newStatus = itemType === 'Loan' ? 'Advance Paid' : 'EMI Paid';
      await updateTransaction(id, { status: newStatus, emiPaidDate: getLocalDateString() });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (entry) => {
    setEditId(entry._id);
    setEditData({ ...entry });
  };

  const handleSave = async () => {
    try {
      // Ensure amount is stored as a number
      const finalData = { ...editData, amount: Number(editData.amount) };
      await updateTransaction(editId, finalData);
      setEditId(null);
      loadData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Alerts */}
      {alerts.length > 0 && (
         <div className="alert alert-danger border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center justify-content-between p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-danger bg-opacity-10 p-2 rounded-circle text-danger"><MdWarning size={24} /></div>
              <div>
                <h6 className="fw-bold mb-0">Upcoming Payments Alert</h6>
                <p className="small mb-0 text-muted">{alerts.length} payments due within 48 hours.</p>
              </div>
            </div>
            <button className="btn btn-danger btn-sm rounded-pill px-3" onClick={() => navigate('/statements?search=Pending')}>Fix Now</button>
         </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0 text-primary">Finance & Loan Registry</h3>
          <p className="text-muted mb-0 small">Consolidated borrower profiles and due tracking</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary px-4 py-2 fw-bold shadow-sm rounded-pill" onClick={() => navigate('/new-entry')}>+ New Entry</button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard title="Total Entries" value={entries.length} icon={<MdSchedule size={24} />} colorClass="primary" description="EMI & Loan records" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard title="Total Recovery" value={stats.pendingAmount} isCurrency={true} prefix="₹" icon={<MdWarning size={24} />} colorClass="danger" description="To be collected" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard title="Successful Collection" value={stats.successAmount} isCurrency={true} prefix="₹" icon={<MdCheckCircle size={24} />} colorClass="success" description="Payment received" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard title="Paid Count" value={stats.successCount} icon={<MdPayment size={24} />} colorClass="info" description="Cleared entries" />
        </div>
      </div>

      {/* EMI & Loan Statement Table */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <MdPayment className="text-primary" /> Detailed EMI Statements
        </h5>
        
        {/* One-Click Filters */}
        <div className="d-flex gap-2 overflow-auto pb-1" style={{ maxWidth: '100%', scrollbarWidth: 'none' }}>
          {['All', 'Pending', 'EMI Paid', 'Advance Paid', 'Success', 'Paid'].map(s => {
            // Count occurrences for each status
            const cnt = entries.filter(t => {
              if (s === 'All') return true;
              if (s === 'Pending') return !t.status || t.status === 'Pending';
              return t.status === s;
            }).length;
            
            // Only show button if count > 0 or it's 'All'
            if (s !== 'All' && cnt === 0) return null;
            
            return (
              <button 
                key={s} 
                onClick={() => setFilterStatus(s)} 
                className={`btn btn-sm rounded-pill px-3 fw-semibold shadow-sm text-nowrap ${filterStatus === s ? 'btn-primary' : 'btn-light border text-muted'}`}
                style={{ fontSize: '0.8rem' }}
              >
                {s} <span className="badge bg-secondary bg-opacity-25 text-dark ms-1">{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-5 card modern-card text-muted">No records found.</div>
      ) : (
        <div className="card modern-card border-0 shadow-sm overflow-hidden animate-fadeIn">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="text-muted small text-uppercase fw-bold">
                  <th className="px-4 py-3">Borrower Name</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Taken Date</th>
                  <th className="py-3">Due Date</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.filter(t => {
                  if (filterStatus === 'All') return true;
                  if (filterStatus === 'Pending') return !t.status || t.status === 'Pending';
                  return t.status === filterStatus;
                }).length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-4 text-muted">No entries match the selected filter.</td></tr>
                ) : entries.filter(t => {
                  if (filterStatus === 'All') return true;
                  if (filterStatus === 'Pending') return !t.status || t.status === 'Pending';
                  return t.status === filterStatus;
                }).map((t) => {
                  const isPaid = ['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(t.status);
                  const isEditing = editId === t._id;
                  
                  return (
                    <tr key={t._id} className={`${(isPaid && !isEditing) ? 'table-success opacity-75' : ''} ${isEditing ? 'table-info shadow-sm' : ''}`}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex gap-1">
                              <input type="text" className="form-control form-control-sm" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="First Name" />
                              <input type="text" className="form-control form-control-sm" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} placeholder="Last Name" />
                            </div>
                            <input type="text" className="form-control form-control-sm" value={editData.category || ''} onChange={e => setEditData({...editData, category: e.target.value})} placeholder="Category (e.g. Car EMI)" />
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <div className={`rounded-circle bg-${t.type === 'Loan' ? 'info' : 'warning'} bg-opacity-10 text-${t.type === 'Loan' ? 'info' : 'warning'} d-flex align-items-center justify-content-center fw-bold`} style={{width: 32, height: 32, fontSize: '0.8rem'}}>
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="fw-bold d-block">{t.name} {t.lastName}</span>
                              <small className="text-muted" style={{fontSize: '0.7rem'}}>{t.category || 'Finance'}</small>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select className="form-select form-select-sm" value={editData.type} onChange={e => setEditData({...editData, type: e.target.value})}>
                            <option>EMI</option>
                            <option>Loan</option>
                          </select>
                        ) : (
                          <span className={`badge bg-${t.type === 'Loan' ? 'info' : 'warning'} bg-opacity-10 text-${t.type === 'Loan' ? 'info' : 'warning'} small px-2`}>
                            {t.type}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="date" className="form-control form-control-sm" value={editData.date ? editData.date.split('T')[0] : ''} onChange={e => setEditData({...editData, date: e.target.value})} />
                        ) : (
                          <span className="text-muted small">{new Date(t.date).toLocaleDateString('en-IN')}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="date" className="form-control form-control-sm" value={editData.dueDate ? editData.dueDate.split('T')[0] : ''} onChange={e => setEditData({...editData, dueDate: e.target.value})} />
                        ) : (
                          <span className="fw-semibold small">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" className="form-control form-control-sm" value={editData.amount} onChange={e => setEditData({...editData, amount: e.target.value})} />
                        ) : (
                          <span className="fw-bold text-danger">₹{Number(t.amount).toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="d-flex flex-column gap-1">
                            <select className="form-select form-select-sm" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                              <option>Pending</option>
                              <option>Success</option>
                              <option>Paid</option>
                              <option>Advance Paid</option>
                              <option>EMI Paid</option>
                            </select>
                            {['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(editData.status) && (
                              <input type="date" className="form-control form-control-sm" value={editData.emiPaidDate ? editData.emiPaidDate.split('T')[0] : ''} onChange={e => setEditData({...editData, emiPaidDate: e.target.value})} title="Paid Date" />
                            )}
                          </div>
                        ) : (
                          <span className={`badge bg-${isPaid ? 'success' : 'danger'} bg-opacity-10 text-${isPaid ? 'success' : 'danger'} rounded-pill px-3 py-1`}>
                            {t.status || 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {isEditing ? (
                          <div className="d-flex gap-1 justify-content-center">
                            <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={handleSave}>Save</button>
                            <button className="btn btn-light btn-sm rounded-pill px-3" onClick={() => setEditId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div className="d-flex gap-2 justify-content-center">
                            {!isPaid && (
                              <button className="btn btn-success btn-sm rounded-pill px-3 py-1 fw-bold" style={{fontSize: '0.75rem'}} onClick={() => handleQuickPay(t._id, t.amount, t.name, t.type)}>Quick Pay</button>
                            )}
                            <button className="btn btn-outline-primary btn-sm rounded-circle p-1" style={{width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => handleEdit(t)} title="Edit Row">✎</button>
                            {isPaid && (
                              <div className="d-flex flex-column align-items-center">
                                <span className="text-success small fw-bold text-uppercase" style={{letterSpacing: '0.5px', fontSize: '0.65rem'}}>✓ Paid</span>
                                {t.emiPaidDate && (
                                  <small className="text-muted fw-semibold" style={{fontSize: '0.55rem'}}>on {new Date(t.emiPaidDate).toLocaleDateString('en-IN')}</small>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmiDashboard;

