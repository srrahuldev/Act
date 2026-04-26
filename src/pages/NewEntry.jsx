import React, { useState, useEffect } from 'react';
import { MdPerson, MdDateRange, MdAttachMoney, MdDescription, MdSave, MdPayment, MdAdd, MdClose } from 'react-icons/md';
import { createTransaction, fetchTransactions } from '../api';
import { useNavigate } from 'react-router-dom';
import { getLocalDateString } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_APPS, CUSTOM_COLORS } from '../utils/paymentApps';

const DEFAULT_CATEGORIES = ['General', 'Sales', 'Services', 'Rent', 'Utilities', 'Salary', 'Other'];

const NewEntry = () => {
  const navigate = useNavigate();
  const { updateUserData, customCategories, customPaymentApps } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    amount: '',
    type: 'Credit',
    category: 'General',
    description: '',
    date: getLocalDateString(),
    loanDate: getLocalDateString(),
    dueDate: getLocalDateString(new Date().setMonth(new Date().getMonth() + 1)),
    interestRate: '',
    loanDuration: '',
    paymentMethod: 'Cash',
    paymentApp: ''
  });
  const [loading, setLoading] = useState(false);
  const [showAddMode, setShowAddMode] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchTransactions();
        setTransactions(res.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!formData.name.trim()) {
      setLastEntry(null);
      return;
    }
    const name = formData.name.trim().toLowerCase();
    const lastName = formData.lastName.trim().toLowerCase();
    
    const matches = transactions.filter(t => {
      const tName = (t.name || '').trim().toLowerCase();
      const tLastName = (t.lastName || '').trim().toLowerCase();
      if (lastName) {
        return tName === name && tLastName === lastName;
      }
      return tName === name;
    });

    if (matches.length > 0) {
      // Find most recent by date
      const latest = matches.reduce((prev, curr) => {
        return new Date(curr.date) > new Date(prev.date) ? curr : prev;
      });
      setLastEntry(latest);
    } else {
      setLastEntry(null);
    }
  }, [formData.name, formData.lastName, transactions]);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const allApps = [
    ...DEFAULT_APPS,
    ...customApps.map((app, i) => ({
      id: app.name,
      label: app.name,
      color: app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length],
      logo: (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <rect width="40" height="40" rx="10" fill={app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length]}/>
          <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="Arial">
            {app.name.charAt(0).toUpperCase()}
          </text>
        </svg>
      )
    }))
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddCustomMode = async () => {
    const trimmed = newModeName.trim();
    if (!trimmed) return;
    if (allApps.some(a => a.id.toLowerCase() === trimmed.toLowerCase())) {
      alert('This payment mode already exists!');
      return;
    }
    const color = CUSTOM_COLORS[customPaymentApps.length % CUSTOM_COLORS.length];
    const updated = [...customPaymentApps, { name: trimmed, color }];
    
    try {
      await updateUserData({ customPaymentApps: updated });
      setFormData({ ...formData, paymentApp: trimmed });
      setNewModeName('');
      setShowAddMode(false);
    } catch (err) {
      alert('Failed to save payment mode');
    }
  };

  const handleRemoveCustomMode = async (name) => {
    const updated = customPaymentApps.filter(a => a.name !== name);
    try {
      await updateUserData({ customPaymentApps: updated });
      if (formData.paymentApp === name) {
        setFormData({ ...formData, paymentApp: '' });
      }
    } catch (err) {
      alert('Failed to remove payment mode');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData };
      if (submitData.paymentMethod === 'Cash') {
        submitData.paymentApp = '';
      }
      if (submitData.type === 'EMI' || submitData.type === 'Loan' || submitData.type === 'Advance Payment') {
        submitData.status = 'Pending';
      } else {
        delete submitData.loanDate;
        delete submitData.dueDate;
        delete submitData.status;
        delete submitData.interestRate;
        delete submitData.loanDuration;
      }

      await createTransaction(submitData);
      navigate('/', { state: { msg: 'Entry saved!' } });
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('This category already exists!');
      return;
    }
    const updated = [...customCategories, trimmed];
    try {
      await updateUserData({ customCategories: updated });
      setFormData({ ...formData, category: trimmed });
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      alert('Failed to save category');
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">New Entry</h2>
        <p className="text-muted mb-0">Add a new daily transaction record</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-xl-8">
          <div className="card modern-card p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <div className="row g-4 mb-4">

                {/* Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small d-flex align-items-center"><MdPerson className="me-2" /> First Name</label>
                  <input type="text" className="form-control form-control-custom py-2 px-3" name="name" value={formData.name} onChange={handleChange} placeholder="Enter first name" required />
                  {lastEntry && (
                    <div className="mt-1 animate-fadeIn">
                      <small className="text-primary d-flex align-items-center fw-semibold" style={{fontSize: '0.75rem'}}>
                        <MdDateRange className="me-1" /> Last Entry: {new Date(lastEntry.date).toLocaleDateString('en-IN')} (₹{Number(lastEntry.amount).toLocaleString('en-IN')})
                      </small>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small">Last Name</label>
                  <input type="text" className="form-control form-control-custom py-2 px-3" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" />
                </div>

                {/* Date */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small d-flex align-items-center"><MdDateRange className="me-2" /> Date</label>
                  <input type="date" className="form-control form-control-custom py-2 px-3" name="date" value={formData.date} onChange={handleChange} required />
                </div>

                {/* Amount */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small d-flex align-items-center"><MdAttachMoney className="me-2" /> Amount</label>
                  <div className="input-group">
                    <span className="input-group-text bg-card text-muted" style={{ borderColor: 'var(--border-color)' }}>₹</span>
                    <input type="number" className="form-control form-control-custom py-2 border-start-0 ps-0" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" style={{ boxShadow: 'none' }} required />
                  </div>
                </div>

                {/* Type */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small text-center d-block">Transaction Type</label>
                  <div className="d-flex bg-card border rounded p-1" style={{ borderColor: 'var(--border-color) !important' }}>
                    <button type="button" className={`btn flex-fill py-2 ${formData.type === 'Credit' ? 'btn-success text-white fw-bold' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Credit'})}>Credit</button>
                    <button type="button" className={`btn flex-fill py-2 ${formData.type === 'Debit' ? 'btn-danger text-white fw-bold' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Debit'})}>Debit</button>
                    <button type="button" className={`btn flex-fill py-2 ${formData.type === 'EMI' ? 'btn-warning text-dark fw-bold' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'EMI'})}>EMI</button>
                    <button type="button" className={`btn flex-fill py-2 ${formData.type === 'Loan' ? 'btn-primary text-white fw-bold' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Loan'})}>Loan</button>
                    <button type="button" className={`btn flex-fill py-2 ${formData.type === 'Advance Payment' ? 'btn-info text-white fw-bold' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Advance Payment'})}>Advance</button>
                  </div>

                </div>

                {/* EMI, Loan & Advance Specific Fields */}
                {(formData.type === 'EMI' || formData.type === 'Loan' || formData.type === 'Advance Payment') && (
                  <>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small d-flex align-items-center"><MdDateRange className="me-2" /> {formData.type === 'Loan' ? 'Loan Start Date' : formData.type === 'Advance Payment' ? 'Advance Date' : 'Loan Taken Date'}</label>
                      <input type="date" className="form-control form-control-custom py-2 px-3" name="loanDate" value={formData.loanDate} onChange={handleChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small d-flex align-items-center"><MdDateRange className="me-2" /> {formData.type === 'Loan' ? 'First Interest Due' : 'Payment Due Date'}</label>
                      <input type="date" className="form-control form-control-custom py-2 px-3" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
                    </div>
                    {formData.type === 'Loan' && (
                      <>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-muted fw-semibold small">Interest Rate (%)</label>
                          <input type="number" step="0.1" className="form-control form-control-custom py-2 px-3" name="interestRate" value={formData.interestRate} onChange={handleChange} placeholder="e.g. 2.5" required />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-muted fw-semibold small">Duration (Months)</label>
                          <input type="number" className="form-control form-control-custom py-2 px-3" name="loanDuration" value={formData.loanDuration} onChange={handleChange} placeholder="e.g. 12" required />
                        </div>
                      </>
                    )}
                  </>
                )}


                {/* Category */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small">Category</label>
                  {!showAddCategory ? (
                    <select
                      className="form-select form-control-custom py-2 px-3"
                      name="category"
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setShowAddCategory(true);
                        } else {
                          handleChange(e);
                        }
                      }}
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__ADD_NEW__">➕ Add New Category...</option>
                    </select>
                  ) : (
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control form-control-custom py-2 px-3"
                        placeholder="New category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                        autoFocus
                      />
                      <button type="button" className="btn btn-primary btn-sm px-3" onClick={handleAddCategory}>
                        <MdAdd size={18} />
                      </button>
                      <button type="button" className="btn btn-light btn-sm px-2" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
                        <MdClose size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="col-12">
                  <label className="form-label text-muted fw-semibold small d-flex align-items-center">
                    <MdPayment className="me-2" /> Payment Method
                  </label>
                  <div className="d-flex gap-3 mb-3">
                    {/* Cash Option */}
                    <div
                      className={`payment-method-card ${formData.paymentMethod === 'Cash' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: 'Cash', paymentApp: '' })}
                      style={{ '--pm-color': '#2e7d32' }}
                    >
                      <div className="payment-method-icon">
                        <svg viewBox="0 0 40 40" width="32" height="32">
                          <rect width="40" height="40" rx="10" fill="#2e7d32"/>
                          <rect x="8" y="12" width="24" height="16" rx="3" fill="#fff"/>
                          <circle cx="20" cy="20" r="5" fill="#2e7d32" opacity="0.3"/>
                          <text x="20" y="23" textAnchor="middle" fill="#2e7d32" fontSize="8" fontWeight="bold" fontFamily="Arial">₹</text>
                        </svg>
                      </div>
                      <span className="payment-method-label">Cash</span>
                    </div>

                    {/* Online Option */}
                    <div
                      className={`payment-method-card ${formData.paymentMethod === 'Online' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: 'Online', paymentApp: formData.paymentApp || '' })}
                      style={{ '--pm-color': '#1565c0' }}
                    >
                      <div className="payment-method-icon">
                        <svg viewBox="0 0 40 40" width="32" height="32">
                          <rect width="40" height="40" rx="10" fill="#1565c0"/>
                          <circle cx="20" cy="17" r="5" fill="none" stroke="#fff" strokeWidth="2"/>
                          <path d="M14 26c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#fff" strokeWidth="2"/>
                          <circle cx="28" cy="14" r="2.5" fill="#4fc3f7"/>
                          <path d="M27 14h2M28 13v2" stroke="#fff" strokeWidth="0.8"/>
                        </svg>
                      </div>
                      <span className="payment-method-label">Online</span>
                    </div>
                  </div>

                  {/* Online Payment Apps */}
                  {formData.paymentMethod === 'Online' && (
                    <div className="payment-apps-container">
                      <p className="text-muted small mb-2 fw-semibold">Select Payment App</p>
                      <div className="payment-apps-grid">
                        {allApps.map((app) => (
                          <div
                            key={app.id}
                            className={`payment-app-card ${formData.paymentApp === app.id ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, paymentApp: app.id })}
                            style={{ '--app-color': app.color, position: 'relative' }}
                          >
                            {/* Remove button for custom apps */}
                            {customPaymentApps.some(c => c.name === app.id) && (
                              <span
                                onClick={(e) => { e.stopPropagation(); handleRemoveCustomMode(app.id); }}
                                style={{
                                  position: 'absolute', top: 2, right: 2,
                                  width: 16, height: 16, borderRadius: '50%',
                                  background: '#e53935', color: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, cursor: 'pointer', lineHeight: 1
                                }}
                              >×</span>
                            )}
                            <div className="payment-app-logo">{app.logo}</div>
                            <span className="payment-app-name">{app.label}</span>
                          </div>
                        ))}

                        {/* Add New Mode Button */}
                        {!showAddMode ? (
                          <div className="add-mode-btn" onClick={() => setShowAddMode(true)}>
                            <div className="add-mode-plus">+</div>
                            <span>Add New</span>
                          </div>
                        ) : (
                          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              type="text"
                              className="form-control form-control-custom py-1 px-2"
                              placeholder="Mode name..."
                              value={newModeName}
                              onChange={(e) => setNewModeName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomMode())}
                              autoFocus
                              style={{ fontSize: '0.85rem' }}
                            />
                            <button type="button" className="btn btn-primary btn-sm px-2 py-1" onClick={handleAddCustomMode}>
                              <MdAdd />
                            </button>
                            <button type="button" className="btn btn-light btn-sm px-2 py-1" onClick={() => { setShowAddMode(false); setNewModeName(''); }}>
                              <MdClose />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label text-muted fw-semibold small d-flex align-items-center"><MdDescription className="me-2" /> Description (Optional)</label>
                  <textarea className="form-control form-control-custom py-3 px-3" rows="3" name="description" value={formData.description} onChange={handleChange} placeholder="Add notes about this entry..."></textarea>
                </div>

              </div>

              <div className="d-flex justify-content-end gap-3 pt-4 border-top" style={{ borderColor: 'var(--border-color) !important' }}>
                <button type="button" className="btn btn-light px-4 py-2 text-muted fw-semibold" onClick={() => navigate('/')}>Cancel</button>
                <button type="submit" className="btn btn-primary px-5 py-2 fw-semibold shadow-sm" disabled={loading}>
                  <MdSave className="me-2" />{loading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEntry;
