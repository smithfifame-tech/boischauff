import { img } from '@/lib/img';

export function AuthSplit({ image, title, text, children }: { image: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="split-auth" data-reveal="zoom">
      <div className="split-auth-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(image, 900, 1000)} alt="" />
        <div className="caption"><strong>{title}</strong>{text}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}
