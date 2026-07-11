'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please verify credentials.');
      }

      // Save token and user details
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect depending on user role
      if (data.user.role === 'Admin') {
        router.push('/admin');
      } else if (data.user.role === 'Volunteer') {
        router.push('/volunteer');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4 relative">
      
      {/* Decorative Vibrant Blurred Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-gray-800 shadow-2xl relative">
        
        {/* Top Header Card */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-red-500 to-rose-600 p-3.5 rounded-2xl shadow-xl shadow-red-500/20 mb-3.5">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold font-outfit text-white text-center tracking-tight">
            Welcome back to Safeguard
          </h2>
          <p className="text-xs text-gray-400 mt-1">Sign in to your emergency safety console</p>
        </div>

        {/* Error Alert box */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-2.5 mb-6 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="font-medium leading-normal">{error}</p>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full pl-11 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all font-outfit"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all font-outfit"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-outfit font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-t border-white/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Access Security Console'
            )}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-8 text-center text-xs">
          <p className="text-gray-500 font-medium">
            New to Safeguard?{' '}
            <Link
              href="/register"
              className="text-red-400 hover:text-red-300 font-bold hover:underline transition-all"
            >
              Create Account
            </Link>
          </p>
          <div className="mt-5 pt-5 border-t border-gray-800/80 flex items-center justify-center gap-4 text-gray-400">
            <span className="bg-gray-900 border border-gray-800 px-2 py-1 rounded text-[10px] uppercase font-bold text-gray-500">
              Demo Admin: admin@safeguard.com / password123
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
