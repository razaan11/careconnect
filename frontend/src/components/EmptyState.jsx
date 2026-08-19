export default function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-paper/60 px-6 py-12 text-center">
      <p className="font-display text-lg font-medium text-text">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-sm text-sm text-text/60">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
