#!/usr/bin/env node
import Twilio from 'twilio';

// Read from env or CLI flags
function getArg(name, fallback = undefined) {
  const flag = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (flag) {
    const parts = flag.split('=');
    if (parts.length > 1) return parts.slice(1).join('=');
    const idx = process.argv.indexOf(flag);
    if (idx >= 0 && idx + 1 < process.argv.length && !process.argv[idx + 1].startsWith('--')) {
      return process.argv[idx + 1];
    }
    return true;
  }
  return fallback;
}

const SID = process.env.TWILIO_SID || getArg('sid');
const TOKEN = process.env.TWILIO_TOKEN || getArg('token');
const FROM = process.env.TWILIO_FROM || getArg('from');
const TO = process.env.TO || getArg('to');
const BODY = process.env.BODY || getArg('body') || 'Your OTP is 123456';

function fail(msg) {
  console.error(`[send-sms] ${msg}`);
  process.exit(1);
}

if (!SID) fail('Missing TWILIO_SID (or --sid)');
if (!TOKEN) fail('Missing TWILIO_TOKEN (or --token)');
if (!FROM) fail('Missing TWILIO_FROM (or --from)');
if (!TO) fail('Missing TO (or --to)');

console.log('[send-sms] Sending...');
const client = new Twilio(SID, TOKEN);
try {
  const res = await client.messages.create({ to: TO, from: FROM, body: BODY });
  console.log('[send-sms] Sent:', res.sid, res.status);
  process.exit(0);
} catch (err) {
  console.error('[send-sms] Failed:', err?.status, err?.code, err?.message || String(err));
  if (err?.moreInfo) console.error('[send-sms] More info:', err.moreInfo);
  process.exit(2);
}
