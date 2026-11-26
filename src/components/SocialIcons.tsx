const paths: Record<string, string> = {
  facebook: 'M14 8.5V6.8c0-.8.5-1 1-1h2V2.2h-2.8C11.1 2.2 10.4 4.5 10.4 6v2.5H8.3V12h2.1v9.8H14V12h2.8l.4-3.5H14z',
  whatsapp: 'M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-3-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.4z',
  youtube: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z',
  tiktok: 'M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.6V9a7.3 7.3 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.3-1.5z',
  instagram: 'M12 7.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm6-7.9a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 18 7.1zM21.9 8.2a5.4 5.4 0 0 0-1.5-3.8 5.4 5.4 0 0 0-3.8-1.5C15.1 2.8 8.9 2.8 7.4 2.9a5.4 5.4 0 0 0-3.8 1.5 5.4 5.4 0 0 0-1.5 3.8c-.1 1.5-.1 7.7 0 9.2a5.4 5.4 0 0 0 1.5 3.8 5.4 5.4 0 0 0 3.8 1.5c1.5.1 7.7.1 9.2 0a5.4 5.4 0 0 0 3.8-1.5 5.4 5.4 0 0 0 1.5-3.8c.1-1.5.1-7.7 0-9.2zm-2 10.8a3.1 3.1 0 0 1-1.7 1.7c-1.2.5-4 .4-5.2.4s-4 .1-5.2-.4a3.1 3.1 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.2s-.1-4 .4-5.2A3.1 3.1 0 0 1 6 4.9c1.2-.5 4-.4 5.2-.4s4-.1 5.2.4a3.1 3.1 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.2s.1 4-.4 5.2z',
};
const labels: Record<string, string> = { facebook: 'Facebook', whatsapp: 'WhatsApp', youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram' };

export function SocialIcons({ social, phone }: { social: Record<string, string>; phone?: string }) {
  const entries = Object.keys(paths).map((k) => {
    let href = social[k] || '';
    if (k === 'whatsapp' && !href && phone) href = `https://wa.me/${phone.replace(/\D/g, '')}`;
    if (k === 'whatsapp' && href && !href.startsWith('http')) href = `https://wa.me/${href.replace(/\D/g, '')}`;
    return { k, href };
  }).filter((e) => e.href);
  if (!entries.length) return null;
  return (
    <div className="socials">
      {entries.map(({ k, href }) => (
        <a key={k} href={href} target="_blank" rel="noopener noreferrer" aria-label={labels[k]}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={paths[k]} /></svg>
        </a>
      ))}
    </div>
  );
}
