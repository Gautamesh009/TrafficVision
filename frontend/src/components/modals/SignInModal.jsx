import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function SignInModal({ open, onClose, onSwitchToSignUp }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = () => {
    setEmail('officer@trafficwatch.in');
    setPassword('TW@2026');
    setError('');
  };

  const handleSubmit = () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = signIn(email, password);
      if (result.success) {
        setEmail(''); setPassword('');
        onClose(true);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 900);
  };

  if (!open) return null;
  return (
    <div className="tw-modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tw-modal">
        <div className="tw-modal-head">
          <button className="tw-modal-close" onClick={onClose}>✕</button>
          <div className="eyebrow">OFFICER PORTAL</div>
          <h3>Sign In to<br /><em>TrafficWatch</em></h3>
        </div>
        <div className="tw-modal-body">
          <div className="tw-demo-hint" onClick={fillDemo}>
            <div>
              <div className="dh-tag">Demo Account</div>
              <div className="dh-creds">officer@trafficwatch.in · TW@2026</div>
            </div>
            <span className="dh-fill">Fill ↗</span>
          </div>

          <label className="tw-field-label">Email Address</label>
          <input className="tw-input" type="email" value={email} placeholder="officer@trafficwatch.in"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />

          <label className="tw-field-label tw-mt">Password</label>
          <div className="tw-input-wrap">
            <input className="tw-input" type={showPass ? 'text' : 'password'} value={password}
              placeholder="••••••••" style={{ paddingRight: '2.8rem' }}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            <button className="tw-eye-btn" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {error && <div className="tw-error">{error}</div>}

          <button className="tw-submit" disabled={loading} onClick={handleSubmit}>
            {loading ? <><span className="tw-spinner"></span> Verifying…</> : 'Sign In →'}
          </button>

          <div className="tw-switch-txt">
            No account?&nbsp;
            <button className="tw-switch-btn" onClick={() => { onClose(); onSwitchToSignUp(); }}>Create one →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
