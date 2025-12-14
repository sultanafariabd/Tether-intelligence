import Head from 'next/head'
import { ComputerAgentDashboard } from '../components/ComputerAgentDashboard'

export default function Home() {
  return (
    <>
      <Head>
        <title>Tether Intelligence - AI Computer Agent</title>
        <meta name="description" content="AI-powered computer control system with Gemini integration and VNC remote access" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ComputerAgentDashboard />
    </>
  )
}