import ChatPageClient from '@/components/chat/chat-page-client';

export function generateStaticParams() {
  // Required by output: 'export' builds (GitHub Pages).
  // Runtime environments keep normal dynamic routing behavior.
  if (process.env.NEXT_OUTPUT_EXPORT === 'true') {
    return [{ id: 'demo' }];
  }
  return [];
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatPageClient characterId={id} />;
}
