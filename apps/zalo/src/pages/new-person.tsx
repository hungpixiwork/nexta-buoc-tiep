/**
 * A3 Gặp người mới. Người dùng: người đồng hành ngoài đường. Việc chính: có sự đồng ý → ghi nhu cầu → gửi.
 * Một màn, 3 bước rõ ràng (tiến trình ở đầu). Không chụp ảnh, không lưu số điện thoại.
 * Trẻ em: biệt danh tự đổi sang mã CHILD-2026-XXXX; nút gọi hỗ trợ ưu tiên 111 (bảo vệ trẻ em).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CloudOff, Send } from 'lucide-react';
import { useLang } from '../lib/i18n';
import { errorText } from '../lib/labels';
import { saveDraft, submitNewPerson } from '../lib/offline';
import { useSession } from '../lib/session';
import { SupportCall } from '../components/SupportCall';
import { Alert, Button, Card, CheckRow, Chip, Field, MiniSteps, PageBody, PageHeader, TextArea, TextInput } from '../components/ui';

const KEYWORDS: Array<{ vi: string; en: string }> = [
  { vi: 'bán hàng rong', en: 'street vendor' },
  { vi: 'mất việc', en: 'lost job' },
  { vi: 'cần việc làm', en: 'needs work' },
  { vi: 'đau ốm', en: 'unwell' },
  { vi: 'mất giấy tờ', en: 'lost documents' },
  { vi: 'không có chỗ ở', en: 'no place to stay' },
  { vi: 'thiếu ăn', en: 'not enough food' },
  { vi: 'có con nhỏ', en: 'young children' },
  { vi: 'nợ tiền', en: 'in debt' },
  { vi: 'bị hứa việc nhẹ lương cao', en: 'offered easy high-paid job' },
  { vi: 'người cao tuổi', en: 'older person' },
  { vi: 'khuyết tật', en: 'disability' },
];

const childAlias = () => `CHILD-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

export function NewPersonPage() {
  const { tx, lang } = useLang();
  const { session } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [alias, setAlias] = useState('');
  const [isChild, setIsChild] = useState(false);
  const [consent, setConsent] = useState(false);
  const [share, setShare] = useState(true);
  const [phoneOk, setPhoneOk] = useState(false);
  const [note, setNote] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);

  const toggleChild = (v: boolean) => {
    setIsChild(v);
    setAlias(v ? childAlias() : '');
  };
  const toggleKeyword = (k: string) => setKeywords((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  const hasName = alias.trim().length > 0;
  const hasNote = note.trim().length > 0 || keywords.length > 0;
  const valid = hasName && consent && hasNote;
  const current = !hasName ? 1 : !consent ? 2 : 3;
  const stepLabel = [tx({ vi: 'Gọi họ là gì', en: 'What to call them' }), tx({ vi: 'Hỏi sự đồng ý', en: 'Ask consent' }), tx({ vi: 'Ghi điều bạn thấy', en: 'Note what you saw' })][current - 1];

  const submit = async () => {
    if (!session) return;
    const draft = {
      alias: alias.trim(),
      observation: note.trim(),
      keywords,
      consent: {
        verbalConsent: true as const,
        allowPhoto: false,
        allowPhone: phoneOk,
        allowSharingWithPartner: share,
        // Trẻ em chỉ được gọi bằng mã, không ghi cách xưng hô riêng.
        preferredAddress: isChild ? null : alias.trim(),
        minimumDataOnly: true,
      },
    };
    setBusy(true);
    setError(null);
    try {
      const created = await submitNewPerson(draft);
      await qc.invalidateQueries();
      navigate(`/journey/${created.id}`, { replace: true });
    } catch (e) {
      if (e instanceof TypeError) {
        // Mất mạng: giữ trên máy, gửi lại khi có mạng.
        saveDraft(session.account.id, draft);
        setSavedOffline(true);
      } else {
        setError(errorText(e, lang));
      }
    } finally {
      setBusy(false);
    }
  };

  if (savedOffline) {
    return (
      <>
        <PageHeader variant="logo" title={tx({ vi: 'Gặp người mới', en: 'New person' })} />
        <PageBody>
          <Alert tone="attention" title={tx({ vi: 'Đã lưu trên máy, sẽ gửi khi có mạng', en: 'Saved on this phone, will send when online' })}>
            <span className="inline-flex items-center gap-1.5"><CloudOff className="size-4" strokeWidth={1.75} aria-hidden />{tx({ vi: 'Chưa gửi lên hệ thống. Có mạng lại, app tự gửi.', en: 'Not sent yet. The app sends it once you are back online.' })}</span>
          </Alert>
          {isChild && <SupportCall full situation={{ pathway: 'child' }} />}
          <Button full size="lg" onClick={() => navigate('/', { replace: true })}>
            {tx({ vi: 'Về trang Hôm nay', en: 'Back to Today' })}
          </Button>
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader variant="logo" title={tx({ vi: 'Gặp người mới', en: 'Meet someone new' })} subtitle={tx({ vi: 'Hỏi sự đồng ý trước, ghi ít thôi.', en: 'Ask consent first, record little.' })} />
      <PageBody className="pb-28">
        <MiniSteps total={3} current={current} label={stepLabel} />

        <Card className="space-y-3">
          <h2 className="text-card font-semibold text-fg">1 · {tx({ vi: 'Gọi họ là gì?', en: 'What do we call them?' })}</h2>
          <CheckRow checked={isChild} onChange={toggleChild} label={tx({ vi: 'Người này có thể dưới 18 tuổi', en: 'This person may be under 18' })} description={tx({ vi: 'Chỉ dùng mã, không ghi tên. Không kết nối việc làm.', en: 'Code only, no name. Never connected to jobs.' })} />
          <Field label={tx({ vi: 'Biệt danh', en: 'Nickname' })} hint={isChild ? tx({ vi: 'Mã tự tạo để bảo vệ trẻ em.', en: 'Auto code to protect the child.' }) : tx({ vi: 'Tên gọi họ muốn, không cần tên thật.', en: 'What they like to be called, not a legal name.' })}>
            <TextInput value={alias} readOnly={isChild} onChange={(e) => setAlias(e.target.value)} maxLength={40} placeholder={tx({ vi: 'VD: Cô Tư bán vé số', en: 'e.g. Auntie Tu, lottery seller' })} />
          </Field>
          {isChild && <SupportCall full situation={{ pathway: 'child' }} />}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-card font-semibold text-fg">2 · {tx({ vi: 'Sự đồng ý', en: 'Consent' })}</h2>
          <p className="text-small text-fg-2">{tx({ vi: 'Đọc to cho họ nghe. Chỉ đánh dấu khi họ đồng ý.', en: 'Read aloud. Tick only if they agree.' })}</p>
          <CheckRow checked={consent} onChange={setConsent} label={tx({ vi: 'Người này đồng ý cho ghi lại', en: 'This person agrees to be recorded' })} description={tx({ vi: 'Họ hiểu NEXTA giúp tìm một bước tiếp, có thể dừng bất cứ lúc nào.', en: 'They understand NEXTA helps find a next step and they can stop anytime.' })} />
          <CheckRow checked={share} onChange={setShare} label={tx({ vi: 'Chia sẻ tối thiểu với đơn vị hỗ trợ', en: 'Share the minimum with the support service' })} description={tx({ vi: 'Chỉ biệt danh, nhu cầu và bước tiếp đã thống nhất.', en: 'Only nickname, need and the agreed step.' })} />
          {!isChild && <CheckRow checked={phoneOk} onChange={setPhoneOk} label={tx({ vi: 'Được gọi điện hỏi thăm', en: 'May be phoned to check in' })} description={tx({ vi: 'Số điện thoại không lưu trong app.', en: 'The number is not stored in the app.' })} />}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-card font-semibold text-fg">3 · {tx({ vi: 'Bạn thấy gì, nghe gì?', en: 'What did you see or hear?' })}</h2>
          <div className="flex flex-wrap gap-2">
            {KEYWORDS.map((k) => (
              <Chip key={k.vi} selected={keywords.includes(k[lang])} onClick={() => toggleKeyword(k[lang])}>
                {k[lang]}
              </Chip>
            ))}
          </div>
          <Field label={tx({ vi: 'Ghi chú ngắn', en: 'Short note' })}>
            <TextArea rows={3} maxLength={4000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx({ vi: 'Bằng lời của họ, ngắn gọn.', en: 'In their words, briefly.' })} />
          </Field>
        </Card>

        {error && <Alert tone="danger">{error}</Alert>}
      </PageBody>

      {/* Nút chính dính đáy, nằm ngay trên thanh điều hướng. */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-white px-4 pb-sb pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="mx-auto max-w-[640px]">
          {!valid && (
            <p className="mb-2 text-caption text-fg-2">
              {!hasName ? tx({ vi: 'Còn 3 bước: tên gọi, sự đồng ý, điều bạn thấy.', en: '3 steps left: name, consent, what you saw.' }) : !consent ? tx({ vi: 'Còn 2 bước: sự đồng ý và điều bạn thấy.', en: '2 steps left: consent and what you saw.' }) : tx({ vi: 'Còn 1 bước: ghi điều bạn thấy.', en: '1 step left: note what you saw.' })}
            </p>
          )}
          <Button full size="lg" icon={<Send className="size-5" strokeWidth={1.75} />} loading={busy} disabled={!valid} onClick={submit}>
            {tx({ vi: 'Gửi và mở hành trình', en: 'Send and open journey' })}
          </Button>
        </div>
      </div>
    </>
  );
}
