
import React from 'react';
import { AgentStep, AgentStatus } from '../types';

interface AgentCardProps {
  step: AgentStep;
  isActive: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ step, isActive }) => {
  const getStatusColor = () => {
    switch (step.status) {
      case AgentStatus.COMPLETED: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case AgentStatus.RUNNING: return 'bg-blue-500/20 text-blue-400 border-blue-500 animate-pulse';
      case AgentStatus.ERROR: return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-slate-800/50 text-slate-500 border-slate-700';
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case AgentStatus.COMPLETED:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case AgentStatus.RUNNING:
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return <div className="w-2 h-2 rounded-full bg-current" />;
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${getStatusColor()} ${isActive ? 'scale-105 shadow-lg shadow-blue-500/10' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm uppercase tracking-wider">{step.name}</h3>
        {getStatusIcon()}
      </div>
      <p className="text-xs opacity-70 mb-2">{step.description}</p>
      {step.status === AgentStatus.COMPLETED && (
        <div className="text-[10px] mono bg-slate-900/40 p-2 rounded border border-slate-700/50 overflow-hidden line-clamp-3">
          Output: {step.output}
        </div>
      )}
    </div>
  );
};

export default AgentCard;
