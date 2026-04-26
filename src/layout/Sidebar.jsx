import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    MdDashboard, MdPeople, MdAddCircle, MdListAlt, MdBarChart, 
    MdEvent, MdSettings, MdLogout, MdPayment 
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ closeMobileSidebar }) => {
  const { currentUser, userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <MdDashboard size={22} /> },
    { name: 'Customers', path: '/customers', icon: <MdPeople size={22} /> },
    { name: 'EMI Dashboard', path: '/emi-dashboard', icon: <MdPayment size={22} /> },
    { name: 'New Entry', path: '/new-entry', icon: <MdAddCircle size={22} /> },
    { name: 'Statements', path: '/statements', icon: <MdListAlt size={22} /> },
    { name: 'Reports', path: '/reports', icon: <MdBarChart size={22} /> },
    { name: 'Calendar', path: '/calendar', icon: <MdEvent size={22} /> },
    { name: 'Settings', path: '/settings', icon: <MdSettings size={22} /> },
  ];

  return (
    <div className="d-flex flex-column h-100 text-white p-3">
      <div className="d-flex align-items-center justify-content-between mb-4 mt-2 px-2">
        <div className="d-lg-none">
          <h5 className="mb-0 text-primary fw-bold">Menu</h5>
        </div>
        <button className="btn btn-sm btn-outline-secondary d-lg-none border-0" onClick={closeMobileSidebar}>✖</button>
      </div>

      <div className="flex-grow-1 overflow-auto">
        <ul className="nav nav-pills flex-column mb-auto">
          {menuItems.map((item) => (
            <li className="nav-item" key={item.name}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileSidebar}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto px-2 pb-3 pt-4 border-top" style={{ borderColor: 'var(--border-color) !important' }}>
        <div className="d-flex align-items-center mb-3">
          {userData?.profilePic || currentUser?.photoURL ? (
             <img src={userData?.profilePic || currentUser?.photoURL} alt="Profile" className="rounded-circle border border-2 border-primary" style={{width: 40, height: 40, objectFit: 'cover', flexShrink: 0}} />
          ) : (
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{width: 40, height: 40, flexShrink: 0}}>
              {userData?.firstName ? userData.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="ms-3 flex-grow-1 overflow-hidden">
            <h6 className="mb-0 text-truncate" style={{color: 'var(--text-main)'}}>{userData?.firstName || 'User'} {userData?.lastName || ''}</h6>
            <small className="text-muted">{currentUser?.email || 'Accountant'}</small>
          </div>
        </div>
        <button className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 py-2" onClick={handleLogout}>
          <MdLogout size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
