import Link from 'next/link'

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Terms of Use</h1>
        <p className="text-white/80">
          By using LauraAI, you agree to use the service lawfully, protect your account access, and accept responsibility
          for actions performed through your connected wallet.
        </p>
        <p className="text-white/80">
          AI-generated content is provided as-is for informational and entertainment purposes, and should not be treated as
          legal, financial, medical, or other professional advice.
        </p>
        <p className="text-white/80">
          We may update these terms as the product evolves. Continued use after updates means you accept the revised terms.
        </p>
        <Link href="/" className="inline-block text-white/90 hover:text-white underline underline-offset-4">
          Back to Home
        </Link>
      </div>
    </main>
  )
}

