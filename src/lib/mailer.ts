import 'server-only';
import { db } from './db';

export interface MailAttachment { filename: string; content: Buffer; contentType: string }
export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  orderId?: number | null;
  replyTo?: string;
  attachments?: MailAttachment[];
}

export function mailTransportName(): 'smtp' | 'resend' | 'none' {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'none';
}

function fromAddress() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'BoisChauff+ <no-reply@example.com>';
}

async function deliver(m: MailInput): Promise<string> {
  const transport = mailTransportName();
  if (transport === 'smtp') {
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(process.env.SMTP_PORT || 587);
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 15_000,
    });
    const info = await t.sendMail({
      from: fromAddress(), to: m.to, subject: m.subject, html: m.html, text: m.text, replyTo: m.replyTo,
      attachments: m.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });
    return String(info.messageId || '');
  }
  if (transport === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress(), to: [m.to], subject: m.subject, html: m.html, text: m.text,
        reply_to: m.replyTo,
        attachments: m.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message || 'erreur'}`);
    return String(body.id || '');
  }
  throw new Error('NOT_CONFIGURED');
}

/** Envoie un e-mail et journalise systématiquement le résultat (email_logs). */
export async function sendMail(m: MailInput): Promise<'sent' | 'failed' | 'skipped'> {
  let status: 'sent' | 'failed' | 'skipped' = 'sent';
  let error = '';
  let providerId = '';
  try {
    providerId = await deliver(m);
  } catch (e) {
    const msg = (e as Error).message || 'Erreur inconnue';
    if (msg === 'NOT_CONFIGURED') {
      status = 'skipped';
      error = 'Service e-mail non configuré (SMTP ou Resend).';
    } else {
      status = 'failed';
      // On ne journalise jamais d'identifiants : uniquement le message d'erreur tronqué
      error = msg.replace(/(pass|password|key)=\S+/gi, '$1=***').slice(0, 400);
    }
    console.error(`[email] ${m.template} → ${status}: ${error}`);
  }
  try {
    const existing = await db()<{ id: number; attempts: number }[]>`
      select id, attempts from email_logs
      where template = ${m.template} and recipient = ${m.to} and order_id is not distinct from ${m.orderId ?? null}
      order by created_at desc limit 1`;
    if (existing[0] && m.orderId) {
      await db()`update email_logs set status = ${status}, error = ${error}, provider_id = ${providerId}, subject = ${m.subject},
                 attempts = attempts + 1, updated_at = now() where id = ${existing[0].id}`;
    } else {
      await db()`insert into email_logs (order_id, template, recipient, subject, status, error, provider_id)
                 values (${m.orderId ?? null}, ${m.template}, ${m.to}, ${m.subject}, ${status}, ${error}, ${providerId})`;
    }
  } catch (e) {
    console.error('[email] journalisation impossible', (e as Error).message);
  }
  return status;
}
