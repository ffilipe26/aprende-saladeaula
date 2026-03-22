import { motion } from 'motion/react';

export default function Insights() {
  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
      {/* Placeholder de Desenvolvimento */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-12 rounded-3xl text-center max-w-md">
        <h2 className="text-3xl font-bold mb-4">Insights</h2>
        <p className="text-[var(--text-muted)] text-lg italic">"Em desenvolvimento"</p>
      </div>
    </div>
  );
}
