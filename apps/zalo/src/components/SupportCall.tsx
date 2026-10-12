import { useState, type ReactNode } from 'react';
import { Phone, PhoneCall } from 'lucide-react';
import { formatPhone } from '@web/lib/supportContacts';
import { useLang } from '../lib/i18n';
import { callNumber } from '../lib/platform';
import { contactsFor, isUrgent, type Situation } from '../lib/supportRouting';
import { Badge, Button, Sheet, cx } from './ui';

/**
 * Một nút "Gọi hỗ trợ" → bảng chọn số theo tình huống (số phù hợp nhất đứng đầu).
 * Không truyền `situation` = chưa có ngữ cảnh → hiện đủ danh bạ theo nhóm.
 * Chỉ mở màn hình gọi — không bao giờ báo "đã gọi".
 */
export function SupportCall({ situation, full, label, size = 'md', trigger }: { situation?: Situation | null; full?: boolean; label?: string; size?: 'sm' | 'md' | 'lg'; trigger?: (open: () => void) => ReactNode }) {
  const { tx, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const urgent = isUrgent(situation);
  const list = contactsFor(situation);

  const call = async (number: string) => {
    setFailed((await callNumber(number)) ? null : number);
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button variant={urgent ? 'danger' : 'secondary'} size={size} full={full} icon={<PhoneCall className="size-5" strokeWidth={1.75} />} onClick={() => setOpen(true)}>
          {label ?? tx({ vi: 'Gọi hỗ trợ', en: 'Get help' })}
        </Button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={tx({ vi: 'Gọi đúng nơi phụ trách', en: 'Call the right service' })}>
        <p className="pb-3 text-small text-fg-2">
          {situation
            ? tx({ vi: 'Xếp theo tình huống của người này. Số đầu tiên phù hợp nhất.', en: "Ordered for this person's situation. The first number fits best." })
            : tx({ vi: 'Chọn theo tình huống. Chưa chắc thì gọi điều phối viên trực trước.', en: 'Pick by situation. Unsure? Call the on-duty coordinator first.' })}
        </p>
        <ul className="space-y-2">
          {list.map(({ contact, recommended }) => (
            <li key={contact.id}>
              <button
                type="button"
                onClick={() => call(contact.number)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-[var(--radius-control)] border p-3 text-left transition-colors duration-200 active:bg-surface-soft',
                  recommended ? 'border-primary bg-surface-soft' : 'border-line bg-surface',
                )}
              >
                <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', recommended ? 'bg-primary-strong text-white' : 'bg-primary-soft text-primary-ink')}>
                  <Phone className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-card font-semibold text-fg">{contact.name[lang]}</span>
                    {recommended && <Badge tone="primary">{tx({ vi: 'Phù hợp nhất', en: 'Best fit' })}</Badge>}
                  </span>
                  <span className="mt-0.5 block text-small text-fg-2">{contact.when[lang]}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-body font-semibold tabular-nums text-primary-ink">{formatPhone(contact.number)}</span>
                    {contact.free && <Badge tone="success">{tx({ vi: 'Miễn phí', en: 'Free' })}</Badge>}
                    {contact.allDay && <Badge>24/7</Badge>}
                  </span>
                </span>
              </button>
              {failed === contact.number && (
                <p className="mt-1 text-small font-medium text-danger">
                  {tx({ vi: `Không mở được màn hình gọi. Hãy bấm số ${contact.number} trên bàn phím.`, en: `Could not open the dialler. Dial ${contact.number} manually.` })}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
