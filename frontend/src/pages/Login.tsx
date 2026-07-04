import React, { useState } from 'react';
import { Shield, Lock, User, Terminal, UserPlus, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../config';

interface LoginProps {
  onLogin: () => void;
}

type AuthMode = 'signin' | 'signup';
type AuthStatus = 'idle' | 'decrypting' | 'verifying' | 'error' | 'success';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setStatus('idle');
    setErrorMsg('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      setStatus('error');
      setErrorMsg('All credential fields must be populated.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Security keys do not match. Re-enter confirmation.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setStatus('error');
      setErrorMsg('Security key must be at least 6 characters.');
      return;
    }

    setStatus('decrypting');
    await new Promise(resolve => setTimeout(resolve, 800));
    setStatus('verifying');

    try {
      const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.detail || 'Authentication failed.');
        return;
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', data.username);
      localStorage.setItem('auth_role', data.role);
      setStatus('success');
      await new Promise(resolve => setTimeout(resolve, 400));
      onLogin();
    } catch {
      setStatus('error');
      setErrorMsg('Connection to API server failed. Ensure the server is running on port 8000.');
    }
  };

  const isProcessing = status === 'decrypting' || status === 'verifying';

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-critical/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-low/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-surface border border-border p-8 rounded-xl shadow-[0_8px_32px_0_rgba(11,14,20,0.4)] backdrop-blur-md relative z-10 mx-4"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-critical/10 border border-critical/30 rounded-lg flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-critical" />
          </div>
          <h1 className="text-xl font-bold text-textMain tracking-tight">NetworkGuard SOC</h1>
          <p className="text-xs text-textMuted mt-1 uppercase tracking-wider font-mono">
            {mode === 'signin' ? 'Dynamic Authorization System' : 'Operator Registration Portal'}
          </p>
        </div>

        <div className="flex mb-6 bg-background rounded-lg p-1 border border-border">
          <button
            onClick={() => switchMode('signin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-mono uppercase transition-all ${
              mode === 'signin'
                ? 'bg-surface text-textMain border border-border shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-mono uppercase transition-all ${
              mode === 'signup'
                ? 'bg-surface text-textMain border border-border shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-textMuted">Operator Handle</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                disabled={isProcessing}
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="e.g. admin"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-sm text-textMain focus:outline-none focus:border-textMuted transition-colors font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-textMuted">OIDC Security Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="password"
                disabled={isProcessing}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="••••••••••••••••"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-sm text-textMain focus:outline-none focus:border-textMuted transition-colors font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs font-mono uppercase text-textMuted">Confirm Security Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                  <input
                    type="password"
                    disabled={isProcessing}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="••••••••••••••••"
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-sm text-textMain focus:outline-none focus:border-textMuted transition-colors font-mono disabled:opacity-50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-background/80 border border-border rounded-lg p-3 font-mono text-[11px] text-low space-y-1 flex flex-col"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 animate-pulse" />
                  <span>
                    {status === 'decrypting'
                      ? '>>> DECRYPTING HANDSHAKE PARAMS...'
                      : mode === 'signup'
                      ? '>>> PROVISIONING OPERATOR CLEARANCE...'
                      : '>>> COMPARING TOKEN REPUTATION...'}
                  </span>
                </div>
                <div className="h-1 bg-surface rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-low rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: status === 'decrypting' ? '60%' : '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="bg-critical/10 border border-critical/30 rounded-lg p-3 font-mono text-xs text-critical"
              >
                {errorMsg}
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-benign/10 border border-benign/30 rounded-lg p-3 font-mono text-xs text-benign"
              >
                {mode === 'signup' ? '✅ OPERATOR REGISTERED — Redirecting to console...' : '✅ HANDSHAKE VERIFIED — Initiating session...'}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-critical hover:bg-critical/90 active:bg-critical/80 text-background font-bold font-mono py-2.5 rounded-lg text-sm transition-colors uppercase disabled:opacity-50 shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
          >
            {isProcessing
              ? 'Establishing Handshake...'
              : mode === 'signin'
              ? 'Authenticate'
              : 'Register Operator'}
          </button>
        </form>

        <div className="mt-5 border-t border-border/50 pt-4 text-center">
          <p className="text-[10px] font-mono text-textMuted uppercase">
            {mode === 'signin'
              ? 'Default: admin / networkguard2026'
              : 'New operators receive Tier-1 Analyst clearance'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
