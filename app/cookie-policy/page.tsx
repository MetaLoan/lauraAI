import Link from 'next/link'

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Cookie Policy</h1>
        <p className="text-white/80">
          SoulFace uses essential cookies and local storage to keep sessions stable, store language/UI preferences, and improve
          product reliability.
        </p>
        <p className="text-white/80">
          Analytics or performance tracking may be used to improve user experience and system quality.
        </p>
        <p className="text-white/80">
          You can control cookies and local storage in your browser settings, though some features may stop working.
        </p>
        <Link href="/" className="inline-block text-white/90 hover:text-white underline underline-offset-4">
          Back to Home
        </Link>
      </div>
    </main>
  )
}

