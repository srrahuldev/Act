import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MdPerson, 
  MdEmail, 
  MdPhone, 
  MdLock, 
  MdCheckCircle, 
  MdArrowForward,
  MdShield
} from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Google registration failed: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    setLoading(true);
    setError('');
    try {
      await register(
        formData.email, 
        formData.password, 
        formData.firstName, 
        formData.lastName, 
        formData.phone
      );
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5 px-3" style={{ backgroundColor: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Very subtle background glow */}
      <div className="position-absolute top-0 start-50 translate-middle-x w-100 overflow-hidden" style={{ height: '500px', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(13,110,253,0.03) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '540px' }}>
        
        {/* Logo/Brand */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-4 shadow-sm mb-3" style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #0d6efd, #0a58ca)' }}>
            <MdShield size={24} />
          </div>
          <h2 className="fw-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.5px', fontSize: '1.75rem' }}>Create an account</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Start your financial journey with Acountant.</p>
        </div>

        <div className="card border-0 shadow-none" style={{ background: 'transparent' }}>
          <div className="card-body p-0">
            
            {error && (
              <div className="alert border-0 d-flex align-items-center gap-3 py-3 mb-4" 
                   style={{ backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '12px' }}>
                <MdLock size={20} className="flex-shrink-0" />
                <div className="fw-medium small m-0">{error}</div>
              </div>
            )}

            {success && (
              <div className="alert border-0 d-flex align-items-center gap-3 py-3 mb-4" 
                   style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '12px' }}>
                <MdCheckCircle size={20} className="flex-shrink-0" />
                <div className="fw-medium small m-0">Account created successfully! Redirecting...</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-sm-6">
                <label className="form-label fw-semibold mb-1" style={{ color: '#334155', fontSize: '0.85rem' }}>First Name</label>
                <input type="text" className="form-control premium-input" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="col-sm-6">
                <label className="form-label fw-semibold mb-1" style={{ color: '#334155', fontSize: '0.85rem' }}>Last Name</label>
                <input type="text" className="form-control premium-input" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
              </div>

              <div className="col-12 mt-3">
                <label className="form-label fw-semibold mb-1" style={{ color: '#334155', fontSize: '0.85rem' }}>Email Address</label>
                <input type="email" className="form-control premium-input" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="col-12 mt-3">
                <label className="form-label fw-semibold mb-1" style={{ color: '#334155', fontSize: '0.85rem' }}>Phone Number</label>
                <input type="tel" className="form-control premium-input" name="phone" placeholder="+91 00000 00000" value={formData.phone} onChange={handleChange} required />
              </div>

              <div className="col-sm-6 mt-3">
                <label className="form-label fw-semibold mb-1" style={{ color: '#334155', fontSize: '0.85rem' }}>Password</label>
                <input type="password" className="form-control premium-input" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="col-sm-6 mt-3">
                <label className="form-label fw-semibold mb-1" style={{ color: '#334155', fontSize: '0.85rem' }}>Confirm Password</label>
                <input type="password" className="form-control premium-input" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
              </div>

              <div className="col-12 mt-4 pt-2">
                <button type="submit" className="btn btn-primary w-100 py-2 premium-btn d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <span className="fw-semibold" style={{ fontSize: '1rem' }}>Create Account</span>
                  )}
                </button>
              </div>

              <div className="col-12 text-center my-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="flex-grow-1" style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>OR</span>
                  <div className="flex-grow-1" style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>
                </div>
              </div>

              <div className="col-12">
                <button type="button" className="btn w-100 py-2 premium-btn-google d-flex align-items-center justify-content-center gap-2" onClick={handleGoogleLogin} disabled={loading}>
                  <FcGoogle size={20} /> <span className="fw-semibold" style={{ fontSize: '0.95rem', color: '#334155' }}>Continue with Google</span>
                </button>
              </div>

              <div className="col-12 text-center mt-4 pt-2">
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                  Already have an account? <Link to="/login" className="text-primary fw-semibold text-decoration-none premium-link">Sign in</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
        
        <div className="text-center mt-5">
          <p style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>© 2026 Acountant Inc. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        .premium-input {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 0.65rem 1rem;
          color: #0f172a;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        
        .premium-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        
        .premium-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.1);
          outline: none;
        }
        
        .premium-btn {
          background-color: #0d6efd;
          border: none;
          border-radius: 10px;
          padding: 0.75rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(13, 110, 253, 0.2), 0 2px 4px -1px rgba(13, 110, 253, 0.1);
        }
        
        .premium-btn:hover {
          background-color: #0b5ed7;
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(13, 110, 253, 0.25), 0 3px 6px -1px rgba(13, 110, 253, 0.15);
        }
        
        .premium-btn:active {
          transform: translateY(0);
        }
        
        .premium-btn-google {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        }
        
        .premium-btn-google:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
        }
        
        .premium-link {
          transition: color 0.2s ease;
        }
        
        .premium-link:hover {
          color: #0b5ed7 !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
};

export default Register;
