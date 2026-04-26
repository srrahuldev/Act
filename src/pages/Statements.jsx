import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { MdDelete, MdEdit, MdSearch, MdFilterList, MdSave, MdClose, MdShare, MdPictureAsPdf, MdTableChart, MdWhatsapp, MdEmail, MdSms } from 'react-icons/md';
import { fetchTransactions, deleteTransaction, updateTransaction } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getLocalDateString } from '../utils/dateUtils';
import { getAppDetails } from '../utils/paymentApps';
import AnimatedNumber from '../components/AnimatedNumber';

const Statements = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [selected, setSelected] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const s = searchParams.get('search');
    if (s) setSearch(s);
  }, [searchParams]);


  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchTransactions();
      setAllTransactions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let data = allTransactions;
    if (filterMonth && filterYear) {
      data = data.filter(t => { const d = new Date(t.date); return d.getMonth() + 1 === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear); });
    } else if (filterYear) {
      data = data.filter(t => new Date(t.date).getFullYear() === parseInt(filterYear));
    }
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(t => t.name?.toLowerCase().includes(s) || (t.lastName && t.lastName.toLowerCase().includes(s)) || (t.description && t.description.toLowerCase().includes(s)));
    }
    setTransactions(data);
  }, [allTransactions, search, filterMonth, filterYear]);

  const handleSearch = (e) => { e.preventDefault(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await deleteTransaction(id); setAllTransactions(p => p.filter(t => t._id !== id)); };
  const handleDeleteSelected = async () => { if (!window.confirm(`Delete ${selected.length} entries?`)) return; for (const id of selected) await deleteTransaction(id); setAllTransactions(p => p.filter(t => !selected.includes(t._id))); setSelected([]); };
  const startEdit = (t) => {
    setEditId(t._id);
    setEditData({
      name: t.name,
      lastName: t.lastName || '',
      amount: t.amount,
      type: t.type,
      description: t.description || '',
      date: t.date ? getLocalDateString(t.date) : '',
      dueDate: t.dueDate ? getLocalDateString(t.dueDate) : (t.date ? getLocalDateString(t.date) : '')
    });
  };
  const saveEdit = async () => { await updateTransaction(editId, editData); setAllTransactions(p => p.map(t => t._id === editId ? { ...t, ...editData } : t)); setEditId(null); };
  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === transactions.length ? [] : transactions.map(t => t._id));

  const totalCredit = transactions.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = transactions.filter(t => t.type === 'Debit' || t.type === 'EMI').reduce((s, t) => s + Number(t.amount), 0);


  // Build text summary for sharing
  const buildSummary = () => {
    let text = `📊 *Statement Report*\n\nTotal Entries: ${transactions.length}\nTotal Credit: ₹${totalCredit.toLocaleString('en-IN')}\nTotal Debit: ₹${totalDebit.toLocaleString('en-IN')}\nNet: ₹${(totalCredit - totalDebit).toLocaleString('en-IN')}\n\n`;
    transactions.forEach((t, i) => {
      text += `${i + 1}. ${t.name} ${t.lastName || ''} | ${t.type} | ₹${Number(t.amount).toLocaleString('en-IN')} | ${new Date(t.date).toLocaleDateString('en-IN')}\n`;
    });
    return text;
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Statement Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Credit: ₹${totalCredit.toLocaleString('en-IN')} | Debit: ₹${totalDebit.toLocaleString('en-IN')} | Net: ₹${(totalCredit - totalDebit).toLocaleString('en-IN')}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['#', 'Name', 'Date', 'Type', 'Amount', 'Description']],
      body: transactions.map((t, i) => [i + 1, `${t.name} ${t.lastName || ''}`, new Date(t.date).toLocaleDateString('en-IN'), t.type, `₹${Number(t.amount).toLocaleString('en-IN')}`, t.description || '-']),
    });
    doc.save('statement-report.pdf');
  };

  // Export Excel
  const exportExcel = () => {
    const data = transactions.map((t, i) => ({ 'S.No': i + 1, Name: `${t.name} ${t.lastName || ''}`, Date: new Date(t.date).toLocaleDateString('en-IN'), Type: t.type, Amount: Number(t.amount), Category: t.category || 'General', Description: t.description || '' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statements');
    XLSX.writeFile(wb, 'statement-report.xlsx');
  };

  // Share via WhatsApp
  const shareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(buildSummary())}`, '_blank'); };
  // Share via Email
  const shareEmail = () => { window.open(`mailto:?subject=Statement Report&body=${encodeURIComponent(buildSummary())}`, '_blank'); };
  // Share via SMS
  const shareSMS = () => { window.open(`sms:?body=${encodeURIComponent(buildSummary())}`, '_blank'); };

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Statements</h3>
        <div className="position-relative">
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3 shadow-sm"
            style={{ borderRadius: 20 }}
            onClick={() => setShowShare(!showShare)}
          >
            <MdShare /> Share / Export
          </button>

          {showShare && (
            <div
              className="position-absolute end-0 mt-2 shadow-lg"
              style={{
                zIndex: 9999, minWidth: 260,
                background: '#fff', borderRadius: 16,
                border: '1px solid #e5e7eb',
                padding: 16, animation: 'fadeInDown 0.2s ease',
              }}
            >
              {/* PDF Row */}
              <div style={{ marginBottom: 10 }}>
                <div className="text-muted fw-bold mb-2" style={{ fontSize: 10, letterSpacing: 1 }}>📄 PDF</div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 fw-bold"
                    style={{ background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 12 }}
                    onClick={exportPDF}
                  >
                    <MdPictureAsPdf size={16} /> Download
                  </button>
                  <button
                    className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 fw-bold"
                    style={{ background: '#25D366', color: '#fff', borderRadius: 10, fontSize: 12 }}
                    onClick={() => { exportPDF(); setTimeout(shareWhatsApp, 800); }}
                    title="PDF download karke WhatsApp open karega"
                  >
                    <MdWhatsapp size={16} /> WhatsApp
                  </button>
                </div>
              </div>

              {/* Excel Row */}
              <div style={{ marginBottom: 12 }}>
                <div className="text-muted fw-bold mb-2" style={{ fontSize: 10, letterSpacing: 1 }}>📊 EXCEL</div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 fw-bold"
                    style={{ background: '#10b981', color: '#fff', borderRadius: 10, fontSize: 12 }}
                    onClick={exportExcel}
                  >
                    <MdTableChart size={16} /> Download
                  </button>
                  <button
                    className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 fw-bold"
                    style={{ background: '#25D366', color: '#fff', borderRadius: 10, fontSize: 12 }}
                    onClick={() => { exportExcel(); setTimeout(shareWhatsApp, 800); }}
                    title="Excel download karke WhatsApp open karega"
                  >
                    <MdWhatsapp size={16} /> WhatsApp
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                <div className="text-muted fw-bold mb-2" style={{ fontSize: 10, letterSpacing: 1 }}>📤 TEXT SHARE</div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                    style={{ background: '#25D366', color: '#fff', borderRadius: 10, fontSize: 12 }}
                    onClick={shareWhatsApp}
                  >
                    <MdWhatsapp size={15} /> WhatsApp
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary flex-fill d-flex align-items-center justify-content-center gap-1"
                    style={{ borderRadius: 10, fontSize: 12 }}
                    onClick={shareEmail}
                  >
                    <MdEmail size={15} /> Email
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-1"
                    style={{ borderRadius: 10, fontSize: 12 }}
                    onClick={shareSMS}
                  >
                    <MdSms size={15} /> SMS
                  </button>
                </div>
              </div>

              <p className="text-muted mb-0 mt-2" style={{ fontSize: 9, lineHeight: 1.4 }}>
                💡 WhatsApp button: pehle file download hogi, phir WhatsApp mein summary open hogi. File manually attach karein.
              </p>

              <style>{`
                @keyframes fadeInDown {
                  from { opacity:0; transform:translateY(-8px); }
                  to   { opacity:1; transform:translateY(0); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-4"><div className="card modern-card p-3 text-center"><small className="text-muted">Entries</small><h5 className="fw-bold mb-0"><AnimatedNumber value={transactions.length} /></h5></div></div>
        <div className="col-4"><div className="card modern-card p-3 text-center"><small className="text-muted">Credit</small><h5 className="fw-bold text-success mb-0"><AnimatedNumber prefix="₹" value={totalCredit} isCurrency={true} /></h5></div></div>
        <div className="col-4"><div className="card modern-card p-3 text-center"><small className="text-muted">Debit</small><h5 className="fw-bold text-danger mb-0"><AnimatedNumber prefix="₹" value={totalDebit} isCurrency={true} /></h5></div></div>
      </div>

      {/* Filters */}
      <div className="card modern-card p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <form onSubmit={handleSearch} className="input-group">
              <span className="input-group-text bg-transparent"><MdSearch /></span>
              <input type="text" className="form-control" placeholder="Search name, description..." value={search} onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-primary" type="submit">Search</button>
            </form>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1"><MdFilterList /> Month</label>
            <select className="form-select form-select-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="">All</option>
              {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'short' })}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Year</label>
            <select className="form-select form-select-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="">All</option>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4 text-end">
            {selected.length > 0 && <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}><MdDelete /> Delete {selected.length}</button>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card modern-card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted py-5">No transactions found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="small text-muted">
                  <th><input type="checkbox" checked={selected.length === transactions.length && transactions.length > 0} onChange={toggleAll} /></th>
                  <th>Name</th><th>Date</th><th>Payment</th><th>Type</th><th className="text-end">Amount</th><th>Description</th><th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let lastMonth = null;
                  return transactions.map((t, idx) => {
                    const date = new Date(t.date);
                    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    const isNewMonth = monthYear !== lastMonth;
                    lastMonth = monthYear;
                    
                    const isEmiPaid = ['EMI', 'Loan', 'Advance Payment'].includes(t.type) && ['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(t.status);
                    
                    return (
                      <React.Fragment key={t._id}>
                        {isNewMonth && (
                          <tr className="bg-light bg-opacity-50">
                            <td colSpan="8" className="py-2 px-3">
                              <span className="badge bg-secondary bg-opacity-10 text-secondary fw-bold text-uppercase" style={{ letterSpacing: 1, fontSize: '0.65rem' }}>
                                📅 {monthYear}
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr className={`${selected.includes(t._id) ? 'table-active ' : ''}${isEmiPaid ? 'table-success' : ''}`}>
                          <td><input type="checkbox" checked={selected.includes(t._id)} onChange={() => toggleSelect(t._id)} /></td>
                          <td className="fw-semibold">
                            {editId === t._id ? (
                              <div className="d-flex gap-1">
                                <input className="form-control form-control-sm" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{width:80}} />
                                <input className="form-control form-control-sm" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} style={{width:80}} />
                              </div>
                            ) : `${t.name} ${t.lastName || ''}`}
                          </td>
                          <td className="small text-muted" style={{minWidth: 120}}>
                            {editId === t._id ? (
                              <div className="d-flex flex-column gap-1">
                                <input type="date" className="form-control form-control-sm" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} title="Entry Date" />
                                {editData.type === 'EMI' && (
                                  <input type="date" className="form-control form-control-sm mt-1 border-danger" value={editData.dueDate || ''} onChange={e => setEditData({...editData, dueDate: e.target.value})} title="Due Date" />
                                )}
                              </div>
                            ) : (
                              <div>
                                {new Date(t.date).toLocaleDateString('en-IN')}
                                {(t.type === 'EMI' || t.type === 'Loan') && t.dueDate && (
                                  <div className="text-danger mt-1 fw-bold" style={{fontSize: '0.7rem'}}>
                                    {t.type === 'Loan' ? 'Interest Due: ' : 'Due: '}
                                    {new Date(t.dueDate).toLocaleDateString('en-IN')}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <div style={{ transform: 'scale(0.6)', transformOrigin: 'left center', width: 20 }}>
                                {getAppDetails(t.paymentApp || t.paymentMethod || 'Cash').logo}
                              </div>
                              <span className="small fw-semibold" style={{ color: getAppDetails(t.paymentApp || t.paymentMethod || 'Cash').color }}>
                                {t.paymentApp || t.paymentMethod || 'Cash'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {editId === t._id ? (
                              <select className="form-select form-select-sm" value={editData.type} onChange={e => setEditData({...editData, type: e.target.value})} style={{width:90}}>
                                <option>Credit</option>
                                <option>Debit</option>
                                <option>EMI</option>
                                <option>Loan</option>
                                <option>Advance Payment</option>
                              </select>
                            ) : (
                              <span className={`badge bg-${
                                t.type === 'Credit' ? 'success' : 
                                t.type === 'Debit' ? 'danger' : 
                                t.type === 'EMI' ? 'warning' : 'info'
                              } bg-opacity-10 text-${
                                t.type === 'Credit' ? 'success' : 
                                t.type === 'Debit' ? 'danger' : 
                                t.type === 'EMI' ? 'warning' : 'info'
                              } px-2 py-1 rounded-pill`}>
                                {t.type} { (t.type === 'EMI' || t.type === 'Loan') && `- ${t.status || 'Pending'}`}
                              </span>
                            )}
                          </td>
                          <td className={`text-end fw-bold text-${
                            t.type === 'Credit' ? 'success' : 
                            (t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan') ? 'danger' : 'warning'
                          }`}>
                            {editId === t._id ? <input type="number" className="form-control form-control-sm text-end" value={editData.amount} onChange={e => setEditData({...editData, amount: e.target.value})} style={{width:100}} /> : `${(t.type==='Debit' || t.type === 'EMI' || t.type === 'Loan') ?'-':'+'}₹${Number(t.amount).toLocaleString('en-IN')}`}
                          </td>
                          <td className="small text-muted text-truncate" style={{maxWidth:150}}>
                            {editId === t._id ? <input className="form-control form-control-sm" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} /> : (t.description || '-')}
                          </td>
                          <td className="text-center">
                            {editId === t._id ? (
                              <div className="d-flex gap-1 justify-content-center"><button className="btn btn-success btn-sm" onClick={saveEdit}><MdSave /></button><button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}><MdClose /></button></div>
                            ) : (
                              <div className="d-flex gap-1 justify-content-center"><button className="btn btn-outline-primary btn-sm" onClick={() => startEdit(t)}><MdEdit /></button><button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(t._id)}><MdDelete /></button></div>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statements;
