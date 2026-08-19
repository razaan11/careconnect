import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-primary/60">Error 404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-text">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-text/60">
        This checkpoint doesn’t exist on CareConnect. Check the link, or head back to safety.
      </p>
      <Link
        to="/"
        className="focus-ring mt-6 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
      >
        Back to CareConnect
      </Link>
    </div>
  )
}
