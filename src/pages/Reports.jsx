import React, { useState, useEffect } from 'react';
import { MdBarChart, MdPictureAsPdf, MdTableChart, MdWhatsapp, MdEmail, MdSms, MdShare } from 'react-icons/md';
import { fetchTransactions } from '../api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const load = async () => {
      try { const res = await fetchTransactions(); setTransactions(res.data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const yearData = transactions.filter(t => new Date(t.date).getFullYear() === year);
  const totalCredit = yearData.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = yearData.filter(t => t.type === 'Debit' || t.type === 'EMI').reduce((s, t) => s + Number(t.amount), 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCredit = months.map((_, i) => yearData.filter(t => t.type === 'Credit' && new Date(t.date).getMonth() === i).reduce((s, t) => s + Number(t.amount), 0));
  const monthlyDebit = months.map((_, i) => yearData.filter(t => (t.type === 'Debit' || t.type === 'EMI') && new Date(t.date).getMonth() === i).reduce((s, t) => s + Number(t.amount), 0));

  const categories = [...new Set(yearData.map(t => t.category || 'General'))];

  const catAmounts = categories.map(c => yearData.filter(t => (t.category || 'General') === c).reduce((s, t) => s + Number(t.amount), 0));
  const catColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#fee140'];

  const barData = {
    labels: months,
    datasets: [
      { label: 'Credit', data: monthlyCredit, backgroundColor: 'rgba(40, 167, 69, 0.7)', borderRadius: 6 },
      { label: 'Debit', data: monthlyDebit, backgroundColor: 'rgba(220, 53, 69, 0.7)', borderRadius: 6 }
    ]
  };

  const doughnutData = {
    labels: categories,
    datasets: [{ data: catAmounts, backgroundColor: catColors.slice(0, categories.length), borderWidth: 0 }]
  };

  // Build text for sharing
  const buildSummary = () => {
    let text = `📊 *Financial Report ${year}*\n\nTotal Credit: ₹${totalCredit.toLocaleString('en-IN')}\nTotal Debit: ₹${totalDebit.toLocaleString('en-IN')}\nNet Balance: ₹${(totalCredit - totalDebit).toLocaleString('en-IN')}\n\n*Monthly Breakdown:*\n`;
    months.forEach((m, i) => {
      if (monthlyCredit[i] || monthlyDebit[i]) {
        text += `${m}: Credit ₹${monthlyCredit[i].toLocaleString('en-IN')} | Debit ₹${monthlyDebit[i].toLocaleString('en-IN')} | Net ₹${(monthlyCredit[i] - monthlyDebit[i]).toLocaleString('en-IN')}\n`;
      }
    });
    return text;
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Financial Report - ${year}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Credit: ₹${totalCredit.toLocaleString('en-IN')} | Debit: ₹${totalDebit.toLocaleString('en-IN')} | Net: ₹${(totalCredit - totalDebit).toLocaleString('en-IN')}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['Month', 'Credit (₹)', 'Debit (₹)', 'Net (₹)']],
      body: months.map((m, i) => [m, monthlyCredit[i].toLocaleString('en-IN'), monthlyDebit[i].toLocaleString('en-IN'), (monthlyCredit[i] - monthlyDebit[i]).toLocaleString('en-IN')]),
      foot: [['Total', totalCredit.toLocaleString('en-IN'), totalDebit.toLocaleString('en-IN'), (totalCredit - totalDebit).toLocaleString('en-IN')]]
    });
    doc.save(`report-${year}.pdf`);
  };

  // Export Excel
  const exportExcel = () => {
    const data = months.map((m, i) => ({ Month: m, Credit: monthlyCredit[i], Debit: monthlyDebit[i], Net: monthlyCredit[i] - monthlyDebit[i] }));
    data.push({ Month: 'TOTAL', Credit: totalCredit, Debit: totalDebit, Net: totalCredit - totalDebit });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Report ${year}`);
    XLSX.writeFile(wb, `report-${year}.xlsx`);
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(buildSummary())}`, '_blank');
  const shareEmail = () => window.open(`mailto:?subject=Financial Report ${year}&body=${encodeURIComponent(buildSummary())}`, '_blank');
  const shareSMS = () => window.open(`sms:?body=${encodeURIComponent(buildSummary())}`, '_blank');

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0"><MdBarChart className="me-2" />Reports</h3>
          <p className="text-muted small mb-0">Financial summary & analytics</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <select className="form-select form-select-sm w-auto" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="position-relative">
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3" onClick={() => setShowShare(!showShare)}>
              <MdShare /> Share / Export
            </button>
            {showShare && (
              <div className="position-absolute end-0 mt-2 card shadow-lg border-0 rounded-4 p-3" style={{ zIndex: 100, minWidth: 220 }}>
                <h6 className="fw-bold mb-3 text-muted small">EXPORT</h6>
                <button className="btn btn-outline-danger btn-sm w-100 mb-2 d-flex align-items-center gap-2" onClick={exportPDF}><MdPictureAsPdf /> Download PDF</button>
                <button className="btn btn-outline-success btn-sm w-100 mb-3 d-flex align-items-center gap-2" onClick={exportExcel}><MdTableChart /> Download Excel</button>
                <h6 className="fw-bold mb-3 text-muted small">SHARE VIA</h6>
                <button className="btn btn-sm w-100 mb-2 d-flex align-items-center gap-2" style={{background:'#25D366',color:'#fff'}} onClick={shareWhatsApp}><MdWhatsapp /> WhatsApp</button>
                <button className="btn btn-outline-primary btn-sm w-100 mb-2 d-flex align-items-center gap-2" onClick={shareEmail}><MdEmail /> Email</button>
                <button className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center gap-2" onClick={shareSMS}><MdSms /> SMS</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-4"><div className="card modern-card p-3 p-md-4 text-center"><small className="text-muted fw-semibold">Total Credit</small><h4 className="fw-bold text-success mb-0">₹{totalCredit.toLocaleString('en-IN')}</h4></div></div>
        <div className="col-4"><div className="card modern-card p-3 p-md-4 text-center"><small className="text-muted fw-semibold">Total Debit</small><h4 className="fw-bold text-danger mb-0">₹{totalDebit.toLocaleString('en-IN')}</h4></div></div>
        <div className="col-4"><div className="card modern-card p-3 p-md-4 text-center"><small className="text-muted fw-semibold">Net Balance</small><h4 className="fw-bold text-primary mb-0">₹{(totalCredit - totalDebit).toLocaleString('en-IN')}</h4></div></div>
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card modern-card p-4 h-100">
            <h5 className="fw-bold mb-3">Monthly Credit vs Debit ({year})</h5>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card modern-card p-4 h-100">
            <h5 className="fw-bold mb-3">By Category</h5>
            {categories.length > 0 ? <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} /> : <p className="text-muted text-center py-4">No data</p>}
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="card modern-card p-4">
        <h5 className="fw-bold mb-3">Monthly Breakdown ({year})</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light"><tr className="small text-muted"><th>Month</th><th className="text-end text-success">Credit</th><th className="text-end text-danger">Debit</th><th className="text-end">Net</th></tr></thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={i}><td className="fw-semibold">{m}</td><td className="text-end text-success">₹{monthlyCredit[i].toLocaleString('en-IN')}</td><td className="text-end text-danger">₹{monthlyDebit[i].toLocaleString('en-IN')}</td><td className={`text-end fw-bold ${monthlyCredit[i]-monthlyDebit[i]>=0?'text-success':'text-danger'}`}>₹{(monthlyCredit[i]-monthlyDebit[i]).toLocaleString('en-IN')}</td></tr>
              ))}
            </tbody>
            <tfoot className="border-top"><tr className="fw-bold"><td>Total</td><td className="text-end text-success">₹{totalCredit.toLocaleString('en-IN')}</td><td className="text-end text-danger">₹{totalDebit.toLocaleString('en-IN')}</td><td className={`text-end ${totalCredit-totalDebit>=0?'text-success':'text-danger'}`}>₹{(totalCredit-totalDebit).toLocaleString('en-IN')}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
