import { NextResponse } from 'next/server';
import { runRc1RuntimeSelfTest } from '@hnk/oraculum-engine/selftest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const report = runRc1RuntimeSelfTest();
  const response = NextResponse.json(
    {
      ok: report.passed,
      report,
      note: 'Runtime self-test is supplementary evidence and does not replace CI, production build, or physical-cube QA.',
    },
    { status: report.passed ? 200 : 503 },
  );
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-HOC-RC1-Self-Test', report.passed ? 'PASS' : 'FAIL');
  response.headers.set('X-HOC-RC1-Self-Test-Version', report.version);
  return response;
}
