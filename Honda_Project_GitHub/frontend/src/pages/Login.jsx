import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      showSuccess(`Welcome, ${(res.user.name || '').replace(/\s*\(.*\)/, '')}`);
      navigate(from, { replace: true });
    } else {
      setErrorMsg(res.message);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-600 text-white font-bold text-sm px-2.5 py-1 rounded-md tracking-wide">HONDA</div>
          <span className="text-base font-semibold text-slate-900">Showroom Management</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">Use the login given by your showroom admin.</p>

          {errorMsg && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${inputClass} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">Forgot your password? Ask your showroom admin.</p>
      </div>
    </div>
  );
};
