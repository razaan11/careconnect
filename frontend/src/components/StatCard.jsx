export default function StatCard({ label, value, tone = 'primary' }) {
  const toneClass = {
    primary: 'text-primary',
    accent: 'text-accent',
    warning: 'text-warning',
    error: 'text-error',
  }[tone]

  return (
    <div className="rounded-xl border border-hairline bg-paper p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-text/40">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}
