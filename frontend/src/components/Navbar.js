'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LogOut, User, Activity, MapPin, BarChart3, Radio } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    router.push('/login');
  };

  const navLinks = {
    User: [
      { name: 'Dashboard', path: '/dashboard', icon: Radio },
      { name: 'Safe Zones', path: '/safe-zones', icon: MapPin }
    ],
    Volunteer: [
      { name: 'SOS Alerts Panel', path: '/volunteer', icon: Shield },
      { name: 'Safe Zones', path: '/safe-zones', icon: MapPin }
    ],
    Admin: [
      { name: 'KPIs & Control', path: '/admin', icon: BarChart3 },
      { name: 'Safe Zones', path: '/safe-zones', icon: MapPin }
    ]
  };

  const userRole = currentUser?.role || null;
  const currentLinks = userRole ? navLinks[userRole] : [];

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-800 px-4 py-3.5 shadow-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-red-500 to-rose-600 p-2.5 rounded-xl shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-outfit font-extrabold text-lg tracking-wide bg-gradient-to-r from-red-400 via-rose-500 to-indigo-400 bg-clip-text text-transparent">
              SAFEGUARD
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-gray-400 font-medium">
              Emergency Assistance
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-1.5 bg-gray-950/40 p-1.5 rounded-xl border border-gray-800/60">
            {currentLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-outfit text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/10'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* User profile / Login State */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* Role badge */}
              <span className={`hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-outfit ${
                userRole === 'Admin'
                  ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                  : userRole === 'Volunteer'
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                <Activity className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                {userRole}
              </span>

              {/* User Identity info */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-200 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-gray-400 mt-1">{currentUser.phone}</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-gray-900 border border-gray-800 hover:bg-red-950/20 hover:border-red-950 hover:text-red-400 p-2.5 rounded-xl transition-all duration-300 group"
                title="Logout"
              >
                <LogOut className="h-4.5 w-4.5 text-gray-400 group-hover:text-red-400" />
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className="px-4 py-2 border border-gray-800 rounded-xl font-outfit text-sm font-bold text-gray-300 hover:bg-gray-800/40 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-outfit text-sm font-bold shadow-lg shadow-red-600/20 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav indicator bar */}
      {currentUser && (
        <div className="flex md:hidden items-center justify-around mt-3 pt-3 border-t border-gray-800/80">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold tracking-wide uppercase transition-all ${
                  isActive ? 'text-red-400 font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
