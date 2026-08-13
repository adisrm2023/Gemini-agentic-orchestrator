
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple regex to parse bold **text** and replace with <strong>
  const parseLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-slate-300">
      {content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        
        // Handle Bullet points
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-indigo-400 mt-1">•</span>
              <span className="flex-1">{parseLine(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Handle Headers
        if (trimmed.startsWith('#')) {
          const level = trimmed.match(/^#+/)?.[0].length || 1;
          const text = trimmed.replace(/^#+\s*/, '');
          const classes = level === 1 ? 'text-xl font-bold text-white mb-2' : 'text-lg font-semibold text-slate-100 mb-1';
          return <div key={i} className={classes}>{parseLine(text)}</div>;
        }

        return <p key={i} className="leading-relaxed">{parseLine(line)}</p>;
      })}
    </div>
  );
};
