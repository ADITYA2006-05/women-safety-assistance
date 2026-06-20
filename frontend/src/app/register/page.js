'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, User, Mail, Lock, Phone, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('User'); // 'User' | 'Volunteer'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Save token and user details
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect depending on user role
      if (role === 'Volunteer') {
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
    <div className="flex-1 flex items-center justify-center min-h-[80vh] px-4 relative">
      
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-gray-800 shadow-2xl relative">
        
        {/* Title and Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-tr from-red-500 to-rose-600 p-3.5 rounded-2xl shadow-xl shadow-red-500/20 mb-3.5">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold font-outfit text-white text-center tracking-tight">
            Create Safeguard Account
          </h2>
          <p className="text-xs text-gray-400 mt-1">Register to start tracking and securing safety</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-2.5 mb-5 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="font-medium leading-normal">{error}</p>
          </div>
        )}

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-950/60 p-1.5 rounded-xl border border-gray-900">
          <button
            type="button"
            onClick={() => setRole('User')}
            className={`py-2 px-3 rounded-lg font-outfit text-xs font-bold transition-all ${
              role === 'User'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            I am a Woman (User)
          </button>
          <button
            type="button"
            onClick={() => setRole('Volunteer')}
            className={`py-2 px-3 rounded-lg font-outfit text-xs font-bold transition-all ${
              role === 'Volunteer'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            I am a Volunteer
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full pl-11 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all font-outfit"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-11 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all font-outfit"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
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
            className={`w-full font-outfit font-extrabold text-sm py-3.5 px-4 rounded-xl text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-t border-white/20 ${
              role === 'Volunteer'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-600/10 hover:shadow-cyan-500/20'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/10 hover:shadow-rose-500/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Creating Account...
              </>
            ) : (
              `Register as ${role}`
            )}
          </button>
        </form>

        {/* Footer Toggle links */}
        <div className="mt-6 text-center text-xs">
          <p className="text-gray-500 font-medium">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-red-400 hover:text-red-300 font-bold hover:underline transition-all"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
