import Link from 'next/link'

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Disclaimer</h1>
        <p className="text-white/80">
          SoulFace content, predictions, and generated personas are probabilistic outputs and may be inaccurate or incomplete.
        </p>
        <p className="text-white/80">
          Any token, reward, or DeFi-related content is not investment advice. Always evaluate risk independently before making
          financial decisions.
        </p>
        <p className="text-white/80">
          By using SoulFace, you acknowledge that outcomes may vary and agree to use the service at your own discretion.
        </p>
        <Link href="/" className="inline-block text-white/90 hover:text-white underline underline-offset-4">
          Back to Home
        </Link>
      </div>
    </main>
  )
}

