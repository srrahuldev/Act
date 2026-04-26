import React, { useState, useEffect, useRef } from 'react';
import { MdMenu, MdSearch, MdCloudDone, MdDownload } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import { fetchTransactions } from '../api';
import { useAuth } from '../context/AuthContext';


const TopNavbar = ({ toggleSidebar }) => {
  const { currentUser, userData, logout } = useAuth();
  const user = userData || {};
  const navigate = useNavigate();

  // Smart Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    // Fetch all transactions once for smart search
    const getTxns = async () => {
      try {
        const res = await fetchTransactions();
        setTransactions(res.data || []);
      } catch (err) { console.error('Search fetch error:', err); }
    };
    getTxns();
  }, []);

  useEffect(() => {
    // Click outside to close search dropdown
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const results = transactions.filter(t => 
        (t.name && t.name.toLowerCase().includes(lowerQuery)) ||
        (t.lastName && t.lastName.toLowerCase().includes(lowerQuery)) ||
        (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
        (t.amount && t.amount.toString().includes(lowerQuery))
      ).slice(0, 6); // Keep top 6 results
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/statements?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleResultClick = (item) => {
    setShowDropdown(false);
    navigate(`/statements?search=${encodeURIComponent(item.name)}`);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav 
      className="navbar navbar-expand bg-card sticky-top px-4 align-items-center justify-content-between"
      style={{ height: 'var(--navbar-height)', borderBottom: '1px solid var(--border-color)', zIndex: 1030 }}
    >
      <div className="d-flex align-items-center">
        <button className="btn btn-link text-main p-0 me-3" onClick={toggleSidebar} style={{ color: 'var(--text-main)' }}>
          <MdMenu size={28} />
        </button>
        <div className="d-none d-md-flex align-items-center gap-2">
          {localStorage.getItem('appLogo') && (
            <img src={localStorage.getItem('appLogo')} alt="App Logo" className="rounded-2" style={{height: 32, width: 32, objectFit: 'contain'}} />
          )}
          <h4 className="mb-0 fw-bold text-primary">
            Account <span className="text-secondary">Manager</span>
          </h4>
        </div>
      </div>

      <div className="d-flex flex-grow-1 justify-content-center px-4">
        <div className="input-group position-relative shadow-sm" style={{ maxWidth: '400px', borderRadius: '24px', background: 'var(--bg-light)' }} ref={searchRef}>
          <span className="input-group-text bg-transparent border-0 pe-2" style={{ borderRadius: '24px 0 0 24px' }}>
            <MdSearch size={22} className="text-primary" />
          </span>
          <input 
            type="text" 
            className="form-control bg-transparent border-0 ps-1 box-shadow-none" 
            placeholder="Search by name, ₹ amount..." 
            style={{ boxShadow: 'none', fontSize: '0.9rem', fontWeight: 500 }}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            onFocus={() => { if(searchQuery.trim().length > 0) setShowDropdown(true); }}
          />
          {/* Quick Clear Button */}
          {searchQuery && (
            <button 
              className="btn btn-link text-muted pe-3 text-decoration-none border-0 box-shadow-none"
              onClick={() => { setSearchQuery(''); setShowDropdown(false); document.querySelector('input[placeholder="Search by name, ₹ amount..."]').focus(); }}
            >
              ×
            </button>
          )}

          {/* Premium Smart Search Dropdown */}
          {showDropdown && (
            <div 
              className="position-absolute w-100 shadow" 
              style={{ 
                top: 'calc(100% + 8px)', left: 0, zIndex: 1050, 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.05)',
                overflow: 'hidden',
                animation: 'fadeInDownSearch 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              {searchResults.length > 0 ? (
                <div className="list-group list-group-flush pt-2 pb-1">
                  {searchResults.map((t) => (
                    <button 
                      key={t._id} 
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3 border-0 bg-transparent"
                      onClick={() => handleResultClick(t)}
                      style={{ transition: 'all 0.15s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(13, 110, 253, 0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div className="d-flex align-items-center gap-2" style={{ overflow: 'hidden' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: t.type === 'Credit' ? '#10b981' : t.type === 'EMI' || t.type === 'Loan' ? '#f59e0b' : '#ef4444'
                        }}></div>
                        <div className="d-flex flex-column text-start text-truncate">
                          <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                            {t.name} {t.lastName || ''}
                          </span>
                          <span className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>
                            {t.description || t.type} • {new Date(t.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}
                          </span>
                        </div>
                      </div>
                      <span 
                        className={`badge rounded-pill flex-shrink-0 bg-${t.type === 'Credit' ? 'success' : t.type === 'EMI' || t.type === 'Loan' ? 'warning' : 'danger'} bg-opacity-10 text-${t.type === 'Credit' ? 'success' : t.type === 'EMI' || t.type === 'Loan' ? 'warning' : 'danger'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {t.type === 'Credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                  <div 
                    className="p-2 text-center mt-1" 
                    style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }}
                    onClick={() => handleSearchSubmit({key: 'Enter'})}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    View all results \u2192
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted d-flex flex-column align-items-center gap-2">
                  <MdSearch size={32} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>No results for "{searchQuery}"</span>
                </div>
              )}
            </div>
          )}
        </div>
        <style>{`
          @keyframes fadeInDownSearch {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .form-control:focus { background-color: transparent !important; }
        `}</style>
      </div>

      <div className="d-flex align-items-center gap-3 gap-md-4">
        <NotificationBell transactions={transactions} />
        <div className="dropdown">
          <button 
            className="btn btn-link p-0 dropdown-toggle text-decoration-none d-flex align-items-center" 
            type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false"
            style={{ color: 'var(--text-main)' }}
          >
            <img 
              src={user.profilePic || `https://ui-avatars.com/api/?name=${user.firstName ? encodeURIComponent(user.firstName + ' ' + (user.lastName || '')) : 'User'}&background=0d6efd&color=fff`} 
              alt="Profile" className="rounded-circle border border-2 border-primary" width="35" height="35" style={{objectFit: 'cover'}}
            />
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="profileDropdown">
            <li><button className="dropdown-item">Profile</button></li>
            <li><button className="dropdown-item">Settings</button></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
