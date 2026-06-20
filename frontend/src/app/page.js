'use client';

import { Shield, Eye, MapPin, Users, HeartHandshake, PhoneCall } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 relative">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto px-4 mt-8 mb-16">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-outfit text-xs font-bold uppercase tracking-wider mb-6 animate-bounce">
          <PhoneCall className="h-3.5 w-3.5" />
          Always Connected. Always Guarded.
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold font-outfit text-white tracking-tight leading-none mb-6">
          Women Safety &{' '}
          <span className="bg-gradient-to-r from-red-400 via-rose-500 to-indigo-500 bg-clip-text text-transparent">
            Emergency Assistance
          </span>
        </h1>

        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
          A production-ready, ultra-responsive security hub offering one-click distress broadcasting, live route tracking, and proximity-based local volunteer dispatch.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-outfit font-extrabold rounded-2xl shadow-xl shadow-red-600/25 hover:shadow-red-500/35 transition-all text-base border-t border-white/20 active:scale-95"
          >
            Create Your Account
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-gray-900 border border-gray-800 hover:bg-gray-800/80 hover:text-white text-gray-300 font-outfit font-bold rounded-2xl transition-all text-base active:scale-95"
          >
            Login to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Core Columns Section */}
      <div className="grid md:grid-cols-3 gap-6 w-full px-4 mb-20">
        
        {/* User Card */}
        <div className="glass-panel p-8 rounded-2xl border border-gray-800/80 transition-all hover:translate-y-[-4px] hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/20 group">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold font-outfit text-white mb-2">SOS Safety Panel</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            One-touch panic button instantly triggers real-time location streaming and broadcasts immediate notifications to contact lists and close responders.
          </p>
          <span className="text-xs font-bold text-rose-400 group-hover:underline">Explore User Console &rarr;</span>
        </div>

        {/* Volunteer Card */}
        <div className="glass-panel p-8 rounded-2xl border border-gray-800/80 transition-all hover:translate-y-[-4px] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20 group">
          <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold font-outfit text-white mb-2">Verified Responders</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Join a local network of verified safety volunteers. Recieve emergency requests nearby and use active route directions to navigate and offer immediate assistance.
          </p>
          <span className="text-xs font-bold text-cyan-400 group-hover:underline">Join as a Volunteer &rarr;</span>
        </div>

        {/* Admin Card */}
        <div className="glass-panel p-8 rounded-2xl border border-gray-800/80 transition-all hover:translate-y-[-4px] hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-950/20 group">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Eye className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold font-outfit text-white mb-2">Analytics & Control</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Verify responder profiles, oversee safety resources/safe zones, keep track of alert metrics, and evaluate KPIs using centralized admin boards.
          </p>
          <span className="text-xs font-bold text-purple-400 group-hover:underline">Access Admin Panel &rarr;</span>
        </div>

      </div>

      {/* Info banner / Quick numbers */}
      <div className="w-full glass-panel border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div>
          <h4 className="font-outfit font-extrabold text-white text-lg">In immediate danger or require police dispatch?</h4>
          <p className="text-xs text-gray-400 mt-1">You can call national emergency services or use Safeguard SOS to alert nearby people.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="tel:1091"
            className="flex items-center gap-2 px-5 py-3 bg-red-600/10 border border-red-500/30 hover:bg-red-600/20 text-red-400 font-outfit font-bold rounded-xl text-sm transition-all"
          >
            <PhoneCall className="h-4.5 w-4.5" />
            Women Helpline (1091)
          </a>
          <a
            href="tel:112"
            className="flex items-center gap-2 px-5 py-3 bg-gray-950 border border-gray-800 hover:bg-gray-900 text-gray-300 font-outfit font-bold rounded-xl text-sm transition-all"
          >
            National Services (112)
          </a>
        </div>
      </div>

    </div>
  );
}
