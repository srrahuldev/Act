import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MdEmail, 
  MdArrowBack, 
  MdCheckCircle,
  MdLockReset
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword(email);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      setError('Failed to send reset email. Please check if the email is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page min-vh-100 d-flex align-items-center justify-content-center py-5 px-3"
         style={{ 
           background: '#0a0a0f',
           backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
           position: 'relative'
         }}>
      
      {/* Abstract Background Shapes */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '300px', height: '300px', background: '#6366f1', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }}></div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5 col-xl-4">
            <div className="card border-0 overflow-hidden shadow-2xl" 
                 style={{ 
                   background: 'rgba(23, 23, 33, 0.75)', 
                   backdropFilter: 'blur(40px)',
                   borderRadius: '32px',
                   border: '1px solid rgba(255, 255, 255, 0.08)'
                 }}>
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-5">
                  <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle mb-4 shadow-lg" 
                       style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                    <MdLockReset size={36} color="white" />
                  </div>
                  <h3 className="fw-800 text-white mb-2">Reset Password</h3>
                  <p className="text-muted small">Enter your email and we'll send you instructions to reset your password.</p>
                </div>

                {error && (
                  <div className="alert border-0 rounded-4 d-flex align-items-center gap-3 py-3 mb-4" 
                       style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                    <div className="fw-500 small">{error}</div>
                  </div>
                )}

                {message && (
                  <div className="alert border-0 rounded-4 d-flex align-items-center gap-3 py-3 mb-4" 
                       style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}>
                    <MdCheckCircle size={24} />
                    <div className="fw-500 small">{message}</div>
                  </div>
                )}

                {!message ? (
                  <form onSubmit={handleSubmit} className="row g-4">
                    <div className="col-12">
                      <label className="form-label small fw-700 text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Email Address</label>
                      <div className="input-group-modern">
                        <MdEmail className="icon" />
                        <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                    </div>

                    <div className="col-12 mt-5">
                      <button type="submit" className="btn-modern-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Send Reset Link'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center mt-2">
                    <Link to="/login" className="btn-modern-secondary w-100 py-3 d-flex align-items-center justify-content-center gap-2 text-decoration-none">
                      Return to Login
                    </Link>
                  </div>
                )}

                <div className="text-center mt-5">
                  <Link to="/login" className="text-muted fw-600 text-decoration-none small d-flex align-items-center justify-content-center gap-2 hover-white">
                    <MdArrowBack /> Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        
        .input-group-modern {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .input-group-modern .icon {
          position: absolute;
          left: 18px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 20px;
        }
        
        .input-group-modern input {
          width: 100%;
          padding: 16px 20px 16px 52px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .input-group-modern input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: #6366f1;
        }
        
        .btn-modern-primary {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        
        .btn-modern-primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
        }
        
        .btn-modern-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          font-weight: 600;
        }

        .hover-white:hover {
          color: white !important;
        }
        
        .shadow-2xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
