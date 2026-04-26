import React, { useState, useEffect } from 'react';
import { MdPerson, MdLock, MdDeleteForever, MdSecurity, MdNotifications, MdLogout, MdCloud, MdCheckCircle } from 'react-icons/md';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { currentUser, userData, updateUserData, updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePic: ''
  });
  const [appLogo, setAppLogo] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Password state
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  // Status messages
  const [profileStatus, setProfileStatus] = useState({ loading: false, message: '', error: '' });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, message: '', error: '' });

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setUserForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        profilePic: userData.profilePic || currentUser?.photoURL || ''
      });
      setAppLogo(localStorage.getItem(`appLogo_${currentUser?.uid}`) || '');
    }
  }, [userData, currentUser]);

  const handleUserChange = (e) => setUserForm({ ...userForm, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const saveProfile = async () => {
    setProfileStatus({ loading: true, message: '', error: '' });
    try {
      await updateUserData({
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        phone: userForm.phone,
        profilePic: userForm.profilePic
      });
      localStorage.setItem(`appLogo_${currentUser?.uid}`, appLogo);
      setProfileStatus({ loading: false, message: 'Profile updated successfully!', error: '' });
      setTimeout(() => setProfileStatus({ loading: false, message: '', error: '' }), 3000);
    } catch (err) {
      setProfileStatus({ loading: false, message: '', error: 'Failed to update profile.' });
    }
  };



  const handleUpdatePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordStatus({ loading: false, message: '', error: 'Passwords do not match.' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordStatus({ loading: false, message: '', error: 'Password must be at least 6 characters.' });
      return;
    }

    setPasswordStatus({ loading: true, message: '', error: '' });
    try {
      await updatePassword(passwords.newPassword);
      setPasswordStatus({ loading: false, message: 'Password updated successfully!', error: '' });
      setPasswords({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus({ loading: false, message: '', error: '' }), 3000);
    } catch (err) {
      setPasswordStatus({ loading: false, message: '', error: err.message || 'Failed to update password. You may need to log in again.' });
    }
  };

  const handleImageUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      // 20MB Limit (20 * 1024 * 1024 bytes)
      const maxSizeBytes = 20 * 1024 * 1024;
      
      if (file.size > maxSizeBytes) { 
        alert(`❌ File is too large! Maximum size allowed is 20MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`); 
        return; 
      }

      if (!file.type.startsWith('image/')) {
        alert('❌ Please upload a valid image file (JPG, PNG, etc.)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Increase resolution slightly for better quality while staying efficient
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          if (target === 'profile') setUserForm({...userForm, profilePic: compressedDataUrl});
          if (target === 'app') setAppLogo(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete your account? This will wipe all your transactions, customers, and personal data. This cannot be undone.")) {
      setProfileStatus({ loading: true, message: '', error: '' });
      try {
        const uid = currentUser.uid;

        // 1. Delete all transactions
        const transSnap = await getDocs(collection(db, "transactions"));
        const userTrans = transSnap.docs.filter(d => d.data().userId === uid);
        for (const t of userTrans) {
          await deleteDoc(doc(db, "transactions", t.id));
        }

        // 2. Delete all customers
        const custSnap = await getDocs(collection(db, "customers"));
        const userCust = custSnap.docs.filter(d => d.data().userId === uid);
        for (const c of userCust) {
          await deleteDoc(doc(db, "customers", c.id));
        }

        // 3. Delete user profile doc
        await deleteDoc(doc(db, "users", uid));

        alert("Account and all data deleted successfully. We're sorry to see you go!");
        
        // 4. Logout and redirect
        await logout();
        navigate('/login');
      } catch (err) {
        setProfileStatus({ loading: false, message: '', error: 'Failed to delete account data: ' + err.message });
      }
    }
  };

  const menuItems = [
    { id: 'profile', name: 'Profile', icon: <MdPerson /> },
    { id: 'security', name: 'Security', icon: <MdLock /> },
    { id: 'management', name: 'Account', icon: <MdSecurity /> },
    { id: 'notifications', name: 'Notifications', icon: <MdNotifications /> },
    { id: 'sync', name: 'Data & Sync', icon: <MdCloud /> },
  ];

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      <h3 className="fw-800 mb-4" style={{ color: '#1e293b' }}>Settings & Profile</h3>
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-2 p-lg-3 h-100" style={{ background: '#fff' }}>
            <div className="nav nav-pills flex-row flex-lg-column gap-2 overflow-auto text-nowrap pb-2 pb-lg-0 hide-scrollbar">
              {menuItems.map(item => (
                <button 
                  key={item.id} 
                  className={`nav-link d-flex align-items-center gap-2 gap-lg-3 py-2 py-lg-3 px-3 px-lg-4 rounded-3 text-start border-0 fw-600 transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-muted hover-bg-light'}`} 
                  onClick={() => setActiveTab(item.id)}
                >
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <span className="d-none d-sm-inline">{item.name}</span>
                </button>
              ))}
            </div>
            <hr className="my-3 opacity-10 d-none d-lg-block" />
            <button 
              className="nav-link d-flex align-items-center gap-3 py-3 px-4 rounded-3 text-danger border-0 bg-transparent fw-700 hover-bg-danger-light transition-all w-100 text-start mt-2 mt-lg-0" 
              onClick={handleSignOut}
            >
              <MdLogout size={20} /><span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-12 col-lg-9">
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-5 h-100" style={{ background: '#fff' }}>
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="fade-in">
                <div className="mb-5">
                  <h4 className="fw-800 mb-1" style={{ color: '#0f172a' }}>Profile & Branding</h4>
                  <p className="text-muted small">Manage your personal information and app appearance.</p>
                </div>
                
                {profileStatus.message && (
                  <div className="alert alert-success bg-success bg-opacity-10 text-success border-0 rounded-3 d-flex align-items-center gap-2 mb-4">
                    <MdCheckCircle size={20} /> {profileStatus.message}
                  </div>
                )}
                {profileStatus.error && (
                  <div className="alert alert-danger bg-danger bg-opacity-10 text-danger border-0 rounded-3 mb-4">
                    {profileStatus.error}
                  </div>
                )}

                <div className="row g-5 mb-5">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>Profile Picture</label>
                    <div className="d-flex align-items-center gap-4 p-4 rounded-4" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                      <div className="position-relative">
                        {userForm.profilePic ? (
                          <img src={userForm.profilePic} alt="Profile" className="rounded-circle shadow-sm" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid white' }} />
                        ) : (
                          <div className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center shadow-sm fw-bold" style={{ width: 80, height: 80, fontSize: '2rem', border: '3px solid white' }}>
                            {userForm.firstName ? userForm.firstName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <label className="btn btn-sm btn-outline-primary fw-600 rounded-pill px-4 mb-1 cursor-pointer">
                          Upload Photo
                          <input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
                        </label>
                        <p className="text-muted mb-2" style={{ fontSize: '0.65rem' }}>Max size 20MB. JPG/PNG.</p>
                        {userForm.profilePic && (
                          <div className="mt-1">
                            <button className="btn btn-sm btn-link text-danger text-decoration-none small fw-600 p-0" onClick={() => setUserForm({...userForm, profilePic: ''})}>Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>Main App Logo</label>
                    <div className="d-flex align-items-center gap-4 p-4 rounded-4" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                      <div className="position-relative">
                        {appLogo ? (
                          <img src={appLogo} alt="App Logo" className="rounded-4 shadow-sm bg-white" style={{ width: 80, height: 80, objectFit: 'contain', padding: '5px' }} />
                        ) : (
                          <div className="rounded-4 bg-white text-primary d-flex justify-content-center align-items-center shadow-sm fw-800" style={{ width: 80, height: 80, fontSize: '2rem' }}>
                            A.
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <label className="btn btn-sm btn-outline-primary fw-600 rounded-pill px-4 mb-1 cursor-pointer">
                          Upload Logo
                          <input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e, 'app')} />
                        </label>
                        <p className="text-muted mb-2" style={{ fontSize: '0.65rem' }}>Max size 20MB. JPG/PNG.</p>
                        {appLogo && (
                          <div className="mt-1">
                            <button className="btn btn-sm btn-link text-danger text-decoration-none small fw-600 p-0" onClick={() => setAppLogo('')}>Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">First Name</label>
                    <input type="text" className="form-control form-control-lg bg-light border-0 rounded-3 fs-6" name="firstName" value={userForm.firstName} onChange={handleUserChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">Last Name</label>
                    <input type="text" className="form-control form-control-lg bg-light border-0 rounded-3 fs-6" name="lastName" value={userForm.lastName} onChange={handleUserChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">Email Address</label>
                    <input type="email" className="form-control form-control-lg bg-light border-0 rounded-3 fs-6 text-muted" value={currentUser?.email || ''} disabled readOnly />
                    <div className="form-text small">Email cannot be changed here.</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted text-uppercase mb-2">Phone Number</label>
                    <input type="text" className="form-control form-control-lg bg-light border-0 rounded-3 fs-6" name="phone" value={userForm.phone} onChange={handleUserChange} />
                  </div>
                </div>
                
                <div className="mt-5 pt-3 border-top d-flex align-items-center justify-content-between">
                  <button className="btn btn-primary px-5 py-3 fw-700 rounded-pill shadow-sm" onClick={saveProfile} disabled={profileStatus.loading}>
                    {profileStatus.loading ? 'Saving...' : 'Save Changes'}
                  </button>

                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="fade-in">
                <div className="mb-5">
                  <h4 className="fw-800 mb-1" style={{ color: '#0f172a' }}>Security Settings</h4>
                  <p className="text-muted small">Update your password and secure your account.</p>
                </div>

                {passwordStatus.message && (
                  <div className="alert alert-success bg-success bg-opacity-10 text-success border-0 rounded-3 d-flex align-items-center gap-2 mb-4">
                    <MdCheckCircle size={20} /> {passwordStatus.message}
                  </div>
                )}
                {passwordStatus.error && (
                  <div className="alert alert-danger bg-danger bg-opacity-10 text-danger border-0 rounded-3 mb-4">
                    {passwordStatus.error}
                  </div>
                )}

                <div className="card bg-light border-0 rounded-4 p-4 p-md-5">
                  <h5 className="fw-700 mb-4">Change Password</h5>
                  <div className="row g-4">
                    {/* Note: In Firebase Auth, if a user logged in recently, they can change password without old password. Otherwise they might need re-auth. We are keeping it simple. */}
                    <div className="col-md-6">
                      <label className="form-label small fw-700 text-muted text-uppercase mb-2">New Password</label>
                      <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} className="form-control form-control-lg bg-white border-0 rounded-3 fs-6 shadow-sm" placeholder="••••••••" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-700 text-muted text-uppercase mb-2">Confirm Password</label>
                      <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} className="form-control form-control-lg bg-white border-0 rounded-3 fs-6 shadow-sm" placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="mt-4 pt-2">
                    <button className="btn btn-dark px-4 py-2 fw-700 rounded-pill" onClick={handleUpdatePassword} disabled={passwordStatus.loading}>
                      {passwordStatus.loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Account Management Tab */}
            {activeTab === 'management' && (
              <div className="fade-in">
                <div className="mb-5">
                  <h4 className="fw-800 mb-1" style={{ color: '#0f172a' }}>Account Management</h4>
                  <p className="text-muted small">Control your data and account status.</p>
                </div>

                <div className="card shadow-none border border-danger-subtle bg-danger bg-opacity-10 p-4 rounded-4 position-relative overflow-hidden">
                  <div className="position-absolute top-0 end-0 p-3 opacity-25">
                    <MdDeleteForever size={120} className="text-danger" style={{ transform: 'rotate(15deg) translate(20px, -20px)' }} />
                  </div>
                  <div className="d-flex align-items-start gap-4 position-relative z-1">
                    <div className="bg-white p-3 rounded-circle shadow-sm">
                      <MdDeleteForever size={32} className="text-danger" />
                    </div>
                    <div>
                      <h5 className="fw-800 text-danger mb-2">Danger Zone</h5>
                      <p className="text-danger opacity-75 small mb-4 fw-500" style={{ maxWidth: '400px' }}>
                        Deleting your account is irreversible. All your transactions, customers, and personal data will be wiped from our servers immediately.
                      </p>
                      <button className="btn btn-danger px-4 py-2 fw-700 rounded-pill shadow-sm" onClick={handleDeleteAccount}>
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder Tabs */}
            {activeTab === 'notifications' && (
              <div className="fade-in text-center py-5 my-5">
                <div className="d-inline-flex justify-content-center align-items-center bg-light rounded-circle mb-4" style={{ width: 100, height: 100 }}>
                  <MdNotifications size={48} className="text-primary opacity-50" />
                </div>
                <h4 className="fw-800" style={{ color: '#1e293b' }}>Notifications</h4>
                <p className="text-muted">Push notification settings are coming soon in a future update.</p>
              </div>
            )}
            
            {activeTab === 'sync' && (
              <div className="fade-in text-center py-5 my-5">
                <div className="d-inline-flex justify-content-center align-items-center bg-light rounded-circle mb-4" style={{ width: 100, height: 100 }}>
                  <MdCloud size={48} className="text-primary opacity-50" />
                </div>
                <h4 className="fw-800" style={{ color: '#1e293b' }}>Cloud Sync</h4>
                <p className="text-muted mb-0">Your data is automatically synced to the cloud in real-time.</p>
                <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 mt-3 px-3 py-2 rounded-pill fw-600">
                  <MdCheckCircle className="me-1" /> All data is up to date
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        .fw-500 { font-weight: 500; }
        
        .transition-all {
          transition: all 0.3s ease;
        }
        
        .hover-bg-light:hover {
          background-color: #f8fafc !important;
          color: #0f172a !important;
        }
        
        .hover-bg-danger-light:hover {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        
        .fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .form-control:focus {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important;
          border-color: #6366f1 !important;
          background-color: #fff !important;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Settings;
