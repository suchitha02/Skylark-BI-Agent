import Head from 'next/head';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <>
      <Head>
        <title>Skylark Drones - AI Business Intelligence Agent</title>
        <meta name="description" content="AI-powered business intelligence agent for Skylark Drones" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <ChatInterface />
      </main>
    </>
  );
}
