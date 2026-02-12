import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-white/80">
          LauraAI collects only the information required to provide core features, including wallet address, profile data,
          and usage data needed to operate AI, chat, and rewards functionality.
        </p>
        <p className="text-white/80">
          We do not sell personal data. Data may be processed by infrastructure and AI providers strictly to deliver service.
        </p>
        <p className="text-white/80">
          You can request account-related changes where technically and legally supported.
        </p>
        <Link href="/" className="inline-block text-white/90 hover:text-white underline underline-offset-4">
          Back to Home
        </Link>
      </div>
    </main>
  )
}

