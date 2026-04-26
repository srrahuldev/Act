import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdAdd, MdDelete, MdEdit, MdSave, MdPhone, MdEmail, MdPerson, MdAccountBalance, MdClose } from 'react-icons/md';
import { fetchCustomers, createCustomer, deleteCustomer, updateCustomer, fetchTransactions } from '../api';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, transRes] = await Promise.all([fetchCustomers(), fetchTransactions()]);
        setCustomers(custRes.data);
        setTransactions(transRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await createCustomer(formData);
      setCustomers(prev => [...prev, res.data]);
      setFormData({ name: '', email: '', phone: '' });
      setShowForm(false);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c._id !== id));
  };

  const saveEdit = async () => {
    try {
      await updateCustomer(editId, editData);
      setCustomers(prev => prev.map(c => c._id === editId ? { ...c, ...editData } : c));
      setEditId(null);
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Calculate customer stats from transactions
  const getCustomerStats = (customerName) => {
    const cName = customerName?.trim().toLowerCase() || '';
    const custTrans = transactions.filter(t => {
      const tFullName = `${t.name || ''} ${t.lastName || ''}`.trim().toLowerCase();
      const tFirstName = (t.name || '').trim().toLowerCase();
      return tFullName === cName || tFirstName === cName || tFullName.includes(cName) || cName.includes(tFirstName);
    });
    
    // Credit means incoming money
    const credit = custTrans.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
    // Debit means outgoing money. Include EMI and Loan as outgoing/debit.
    const debit = custTrans.filter(t => t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan').reduce((s, t) => s + Number(t.amount), 0);
    
    // Check for active finance
    const hasActiveEMI = custTrans.some(t => t.type === 'EMI' && t.status === 'Pending');
    const hasActiveLoan = custTrans.some(t => t.type === 'Loan' && t.status === 'Pending');

    const lastEntryDate = custTrans.length > 0 
      ? custTrans.reduce((prev, curr) => new Date(curr.date) > new Date(prev.date) ? curr : prev).date
      : null;
    
    return { credit, debit, balance: credit - debit, count: custTrans.length, lastEntryDate, hasActiveEMI, hasActiveLoan };
  };

  const colors = ['primary', 'success', 'danger', 'warning', 'info', 'secondary'];

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">Customers</h3>
          <p className="text-muted small mb-0">{customers.length} customers registered</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-3" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><MdClose /> Cancel</> : <><MdAdd /> Add Customer</>}
        </button>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <div className="card modern-card p-4 mb-4">
          <h5 className="fw-bold mb-3">New Customer</h5>
          <form onSubmit={handleAdd}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><MdPerson /></span>
                  <input type="text" className="form-control" placeholder="Customer name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><MdEmail /></span>
                  <input type="email" className="form-control" placeholder="email@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">Phone</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><MdPhone /></span>
                  <input type="text" className="form-control" placeholder="9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <button type="submit" className="btn btn-success w-100 py-2"><MdAdd /></button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Customer Cards */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-5 card modern-card">
          <MdPerson size={64} className="text-muted opacity-25 mx-auto mb-3" />
          <h5 className="text-muted">No customers yet</h5>
          <p className="text-muted small">Click "Add Customer" to get started</p>
        </div>
      ) : (
        <div className="row g-3">
          {customers.map((c, i) => {
            const stats = getCustomerStats(c.name);
            const color = colors[i % colors.length];
            return (
              <div key={c._id} className="col-12 col-md-6 col-xl-4">
                <div className="card modern-card p-4 h-100">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className={`rounded-circle bg-${color} bg-opacity-10 text-${color} d-flex align-items-center justify-content-center fw-bold`} style={{ width: 50, height: 50, fontSize: '1.2rem' }}>
                        {c.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-grow-1">
                        {editId === c._id ? (
                          <div className="d-flex flex-column gap-2" style={{minWidth: '150px'}}>
                            <input className="form-control form-control-sm" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Name" />
                            <input className="form-control form-control-sm" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="Phone" />
                            <input className="form-control form-control-sm" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} placeholder="Email" />
                          </div>
                        ) : (
                          <div>
                            <h6 className="fw-bold mb-0">{c.name}</h6>
                            <div className="d-flex gap-1 mt-1">
                              {stats.hasActiveEMI && <span className="badge bg-warning bg-opacity-10 text-warning px-1 py-0" style={{fontSize: '0.6rem'}}>EMI</span>}
                              {stats.hasActiveLoan && <span className="badge bg-info bg-opacity-10 text-info px-1 py-0" style={{fontSize: '0.6rem'}}>LOAN</span>}
                            </div>
                            {c.phone && <small className="text-muted"><MdPhone size={12} /> {c.phone}</small>}
                            {c.email && <><br /><small className="text-muted"><MdEmail size={12} /> {c.email}</small></>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="d-flex gap-1" style={{alignItems: 'flex-start'}}>
                      {editId === c._id ? (
                        <>
                          <button className="btn btn-success btn-sm px-2 shadow-sm" onClick={saveEdit} title="Save">
                            <MdSave size={16} />
                          </button>
                          <button className="btn btn-outline-secondary btn-sm px-2" onClick={() => setEditId(null)} title="Cancel">
                            <MdClose size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-outline-primary btn-sm px-2 shadow-sm" onClick={() => { setEditId(c._id); setEditData({ name: c.name, phone: c.phone || '', email: c.email || '' }); }} title="Edit">
                            <MdEdit size={16} />
                          </button>
                          <button className="btn btn-outline-danger btn-sm px-2 shadow-sm" onClick={() => handleDelete(c._id)} title="Delete">
                            <MdDelete size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-4 text-center">
                      <small className="text-muted d-block">Balance</small>
                      <strong className={stats.balance >= 0 ? 'text-success' : 'text-danger'}>₹{stats.balance.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted d-block">Credit</small>
                      <strong className="text-success">₹{stats.credit.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted d-block">Debit</small>
                      <strong className="text-danger">₹{stats.debit.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {stats.lastEntryDate && (
                    <div className="mb-3 text-center">
                      <small className="text-muted small">Last Entry: </small>
                      <small className="fw-bold text-primary small">{new Date(stats.lastEntryDate).toLocaleDateString('en-IN')}</small>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm flex-grow-1" onClick={() => navigate('/new-entry')}>
                      <MdAdd size={16} /> Add Entry
                    </button>
                    <button className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => navigate(`/statements?search=${encodeURIComponent(c.name)}`)}>
                      <MdAccountBalance size={16} /> View ({stats.count})
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Customers;
