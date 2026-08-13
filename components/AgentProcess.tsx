
import React from 'react';
import { AgentStep, AgentStatus } from '../types';

interface AgentProcessProps {
  steps: AgentStep[];
}

const AgentProcess: React.FC<AgentProcessProps> = ({ steps }) => {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.COMPLETED: return 'bg-emerald-500';
      case AgentStatus.RUNNING: return 'bg-blue-500 animate-pulse ring-4 ring-blue-500/20';
      case AgentStatus.ERROR: return 'bg-red-500';
      default: return 'bg-slate-700';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'planner': return 'text-blue-400';
      case 'selector': return 'text-amber-400';
      case 'reporter': return 'text-emerald-400';
      case 'reviewer': return 'text-rose-400';
      case 'final': return 'text-indigo-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">Agent Handover Protocol</span>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.role} className="flex gap-3 relative">
            {i !== steps.length - 1 && (
              <div className="absolute left-[7px] top-4 w-[2px] h-full bg-slate-800" />
            )}
            <div className={`z-10 w-4 h-4 rounded-full mt-1 shrink-0 ${getStatusColor(step.status)} transition-colors duration-500`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${getRoleColor(step.role)}`}>
                  {step.name}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {step.status === AgentStatus.COMPLETED ? 'DONE' : step.status === AgentStatus.RUNNING ? 'ACTIVE' : 'WAIT'}
                </span>
              </div>
              {step.status === AgentStatus.COMPLETED && step.output && (
                <div className="mt-1 text-[11px] text-slate-400 italic line-clamp-1 border-l border-slate-800 pl-2">
                  {step.output}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentProcess;
