import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, Headset, Phone, ShieldAlert, Siren, Stethoscope } from 'lucide-react';
import { useApp } from './AppContext';
import { cx } from '../design/ui';
import { COORDINATOR_LINE, SUPPORT_CONTACTS, formatPhone, telHref, type SupportGroup } from '../lib/supportContacts';

const GROUP_ORDER: SupportGroup[] = ['emergency', 'child', 'specialist'];

/**
 * "Gọi hỗ trợ" — one button, the right number for the situation.
 * Order matters: our on-duty coordinator first (they know the case and the local partners),
 * then life-threatening emergencies, then the child hotline, then specialist lines.
 */
export function SupportCallMenu({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { tx } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groupTitle: Record<SupportGroup, string> = {
    ours: tx({ vi: 'BƯỚC TIẾP', en: 'BƯỚC TIẾP' }),
    emergency: tx({ vi: 'Nguy hiểm tính mạng', en: 'Life-threatening' }),
    child: tx({ vi: 'Trẻ em dưới 18 tuổi', en: 'Children under 18' }),
    specialist: tx({ vi: 'Hỗ trợ chuyên biệt', en: 'Specialist support' }),
  };
  const groupIcon: Record<SupportGroup, JSX.Element> = {
    ours: <Headset className="size-4" aria-hidden />,
    emergency: <Siren className="size-4" aria-hidden />,
    child: <ShieldAlert className="size-4" aria-hidden />,
    specialist: <Stethoscope className="size-4" aria-hidden />,
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="press inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full bg-[#B91C1C] px-3.5 py-1.5 text-sm font-bold text-white shadow-xs hover:bg-[#991B1B]"
      >
        <Phone className="size-4 shrink-0 fill-white" aria-hidden />
        <span>{tx({ vi: 'Gọi hỗ trợ', en: 'Get help' })}</span>
        <ChevronDown className={cx('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={tx({ vi: 'Chọn nơi cần gọi', en: 'Choose who to call' })}
          className={cx(
            'fixed inset-x-3 top-16 z-50 max-h-[75dvh] overflow-y-auto rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-raised)] sm:absolute sm:inset-x-auto sm:top-12 sm:w-[380px]',
            align === 'right' ? 'sm:right-0' : 'sm:left-0',
          )}
        >
          <p className="px-2 pb-2 text-[13px] leading-snug text-muted">
            {tx({
              vi: 'Gọi đúng nơi phụ trách tình huống. Nếu chưa chắc, hãy gọi điều phối viên trực trước.',
              en: 'Call whoever owns the situation. Unsure? Call the on-duty coordinator first.',
            })}
          </p>

          <Section title={groupTitle.ours} icon={groupIcon.ours}>
            {COORDINATOR_LINE ? (
              <ContactRow
                name={tx({ vi: 'Điều phối viên trực', en: 'On-duty coordinator' })}
                when={tx({ vi: 'Chưa rõ nên chuyển đi đâu, cần người quyết định cùng', en: 'Unsure where to refer, need a second decision-maker' })}
                number={COORDINATOR_LINE}
                badges={[tx({ vi: 'Người biết ca', en: 'Knows the case' })]}
                primary
              />
            ) : (
              <p className="rounded-xl bg-sunken px-3 py-2.5 text-[13px] leading-snug text-ink-2">
                {tx({
                  vi: 'Điểm triển khai này chưa khai báo số trực (VITE_COORDINATOR_LINE). Hãy dùng “Báo cáo để được hỗ trợ” trong hồ sơ ca để điều phối viên nhận ngay.',
                  en: 'This site has not set an on-duty number (VITE_COORDINATOR_LINE). Use “Report for support” on the case so a coordinator picks it up.',
                })}
              </p>
            )}
          </Section>

          {GROUP_ORDER.map((g) => (
            <Section key={g} title={groupTitle[g]} icon={groupIcon[g]}>
              {SUPPORT_CONTACTS.filter((c) => c.group === g).map((c) => (
                <ContactRow
                  key={c.id}
                  name={tx(c.name)}
                  when={tx(c.when)}
                  number={c.number}
                  source={c.source}
                  badges={[
                    c.free ? tx({ vi: 'Miễn phí', en: 'Free' }) : tx({ vi: 'Có thể tính cước', en: 'May be charged' }),
                    ...(c.allDay ? ['24/7'] : []),
                  ]}
                />
              ))}
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: JSX.Element; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-2 first-of-type:border-t-0">
      <h3 className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
        {icon}
        {title}
      </h3>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

function ContactRow({ name, when, number, badges, source, primary }: { name: string; when: string; number: string; badges: string[]; source?: string; primary?: boolean }) {
  const { tx } = useApp();
  return (
    <div className={cx('flex items-start gap-3 rounded-xl px-2 py-2', primary ? 'bg-brand-soft' : 'hover:bg-sunken')}>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{name}</p>
        <p className="text-[12.5px] leading-snug text-muted">{when}</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-ink-2">
          {badges.map((b) => (
            <span key={b} className="rounded bg-sunken px-1.5 py-0.5">
              {b}
            </span>
          ))}
          {source && (
            <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand hover:underline">
              {tx({ vi: 'Nguồn', en: 'Source' })}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </p>
      </div>
      <a
        href={telHref(number)}
        aria-label={`${tx({ vi: 'Gọi', en: 'Call' })} ${name} ${number}`}
        className="press inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-danger-line bg-danger-soft px-3 text-sm font-bold text-danger hover:bg-red-100"
      >
        <Phone className="size-3.5" aria-hidden />
        <span className="tabular">{formatPhone(number)}</span>
      </a>
    </div>
  );
}
