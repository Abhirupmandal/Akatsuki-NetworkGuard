import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Activity, AlertTriangle, HelpCircle, TrendingUp, Zap, CheckSquare, LogOut, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: 'Live Feed', icon: Activity },
  { path: '/breakdown', label: 'Attack Breakdown', icon: Shield },
  { path: '/alerts', label: 'Alert Console', icon: AlertTriangle },
  { path: '/explainability', label: 'Explainability', icon: HelpCircle },
  { path: '/trends', label: 'Trends', icon: TrendingUp },
  { path: '/acceleration', label: 'Acceleration Proof', icon: Zap },
  { path: '/validation', label: 'Validation', icon: CheckSquare },
];

interface NavSidebarProps {
  onLogout: () => void;
}

export const NavSidebar: React.FC<NavSidebarProps> = ({ onLogout }) => {
  const username = localStorage.getItem('auth_user') || 'operator';
  const role = localStorage.getItem('auth_role') || 'Analyst';

  return (
    <div className="w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Shield className="w-6 h-6 text-critical" />
        <span className="font-bold text-lg tracking-tight text-textMain">NetworkGuard</span>
      </div>
      
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-surfaceHover text-textMain" 
                  : "text-textMuted hover:bg-surface hover:text-textMain"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="border-t border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-critical/10 border border-critical/30 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-4 h-4 text-critical" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-textMain truncate capitalize">{username}</p>
            <p className="text-[10px] font-mono text-textMuted uppercase tracking-wider">{role}</p>
          </div>
        </div>

        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-benign animate-pulse"></div>
          <span className="text-[10px] font-mono text-textMuted">SYSTEM ONLINE</span>
        </div>

        <div className="px-3 pb-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider text-textMuted bg-surface border border-border hover:bg-critical/10 hover:text-critical hover:border-critical/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
