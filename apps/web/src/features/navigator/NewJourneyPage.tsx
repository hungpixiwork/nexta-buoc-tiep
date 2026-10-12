import { useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Keyboard, Mic, MicOff, NotebookPen, ShieldCheck, Tags, X } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Button, Card, Chip, ErrorBanner, Field, PageHeader, TextArea, TextInput, cx } from '../../design/ui';
import { LoopRibbon } from '../../design/widgets';
import { useLoopMutation } from '../../lib/hooks';
import { useSpeechToText } from '../../lib/speech';
import type { LoopCase } from '../../lib/types';

type Mode = 'note' | 'keywords' | 'voice' | 'photo';

const KEYWORDS_VI = ['bán hàng rong', 'mất việc', 'cần việc làm', 'đau ốm', 'mất giấy tờ', 'không có chỗ ở', 'thiếu ăn', 'có con nhỏ', 'nợ tiền', 'bị hứa việc nhẹ lương cao', 'người cao tuổi', 'khuyết tật'];
const KEYWORDS_EN = ['street vendor', 'lost job', 'needs work', 'unwell', 'lost documents', 'no place to stay', 'not enough food', 'young children', 'in debt', 'offered easy high-paid job', 'older person', 'disability'];

export function NewJourneyPage() {
  const { s, tx, lang } = useApp();
  const navigate = useNavigate();
  const [alias, setAlias] = useState('');
  const [note, setNote] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [mode, setMode] = useState<Mode>('note');
  const [used, setUsed] = useState<Set<Mode>>(new Set(['note']));
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const create = useLoopMutation<{ alias: string; observation: string; keywords: string[]; captureModes: Mode[] }, { case: LoopCase }>('/cases');

  const speech = useSpeechToText(lang, (text) => setNote((n) => (n ? `${n.trim()} ${text}` : text)));
  const pick = (m: Mode) => {
    setMode(m);
    setUsed((u) => new Set(u).add(m));
  };
  const toggleKeyword = (k: string) => setKeywords((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));

  const canSubmit = alias.trim().length > 0 && (note.trim().length > 0 || keywords.length > 0);

  const submit = async () => {
    const res = await create.mutateAsync({ alias: alias.trim(), observation: note.trim(), keywords, captureModes: [...used] });
    navigate(`/journeys/${res.case.id}`, { replace: true });
  };

  const modes: Array<{ m: Mode; label: string; icon: ReactNode }> = [
    { m: 'note', label: tx({ vi: 'Ghi chú', en: 'Note' }), icon: <NotebookPen className="size-4" /> },
    { m: 'photo', label: tx({ vi: 'Ảnh', en: 'Photo' }), icon: <Camera className="size-4" /> },
    { m: 'keywords', label: tx({ vi: 'Từ khóa', en: 'Keywords' }), icon: <Tags className="size-4" /> },
    { m: 'voice', label: tx({ vi: 'Giọng nói', en: 'Voice' }), icon: <Mic className="size-4" /> },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <LoopRibbon stage="CONSENT" />
      </div>
      <PageHeader
        eyebrow={`1 · ${s.loop.observe}`}
        title={tx({ vi: 'Bạn đã thấy và nghe được gì?', en: 'What did you see and hear?' })}
        description={tx({
          vi: 'Ghi lại bằng lời của chính người đó khi có thể. Chưa cần đầy đủ — bước sau sẽ hỏi xin đồng ý trước khi hỏi thêm.',
          en: "Use the person's own words where you can. It doesn't need to be complete — consent comes next, before anything more.",
        })}
      />

      <Card className="p-5 sm:p-6">
        <div className="space-y-6">
          <Field label={tx({ vi: 'Gọi người này là gì?', en: 'What should we call this person?' })} hint={tx({ vi: 'Tên gọi hoặc bí danh, ví dụ "Cô L." — không nhập họ tên đầy đủ.', en: 'A first name or alias, e.g. "Ms L." — never a full name.' })} htmlFor="alias">
            <TextInput id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={60} placeholder={tx({ vi: 'Cô L.', en: 'Ms L.' })} autoComplete="off" />
          </Field>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[15px] font-semibold text-ink">{tx({ vi: 'Cách ghi nhận', en: 'How to capture' })}</p>
              <Badge tone="brand">{tx({ vi: 'Khảo sát Navigator: ảnh + ghi chú ngắn được chọn nhiều nhất', en: 'Navigator survey: photo + short note preferred' })}</Badge>
            </div>
            <div role="tablist" className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-sunken p-1">
              {modes.map(({ m, label, icon }) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => pick(m)}
                  className={cx('flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-sm font-semibold', mode === m ? 'bg-surface text-brand-strong shadow-[var(--shadow-card)]' : 'text-muted hover:text-ink')}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              {mode === 'photo' && (
                <div className="mb-4 rounded-xl border border-line bg-sunken p-4">
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhoto(URL.createObjectURL(f));
                  }} />
                  {photo ? (
                    <div className="flex items-start gap-3">
                      <img src={photo} alt={tx({ vi: 'Ảnh vừa chụp (chỉ trên máy này)', en: 'Photo just taken (this device only)' })} className="h-28 w-28 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1 text-sm text-muted">
                        <p className="font-semibold text-ink">{tx({ vi: 'Ảnh chỉ nằm trên máy của bạn', en: 'The photo stays on your device' })}</p>
                        <p>{tx({ vi: 'NEXTA không tải ảnh lên. Hãy mô tả điều bạn thấy bên dưới.', en: 'NEXTA does not upload photos. Describe what you see below.' })}</p>
                        <Button size="sm" variant="ghost" icon={<X className="size-4" />} onClick={() => setPhoto(null)}>
                          {tx({ vi: 'Bỏ ảnh', en: 'Discard' })}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="secondary" icon={<Camera className="size-5" />} onClick={() => fileRef.current?.click()}>
                      {tx({ vi: 'Chụp hoặc chọn ảnh', en: 'Take or choose a photo' })}
                    </Button>
                  )}
                </div>
              )}

              {mode === 'keywords' && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {(lang === 'vi' ? KEYWORDS_VI : KEYWORDS_EN).concat(keywords.filter((k) => !(lang === 'vi' ? KEYWORDS_VI : KEYWORDS_EN).includes(k))).map((k) => (
                      <Chip key={k} selected={keywords.includes(k)} onClick={() => toggleKeyword(k)}>
                        {k}
                      </Chip>
                    ))}
                  </div>
                  <form className="mt-3 flex gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    if (custom.trim()) toggleKeyword(custom.trim());
                    setCustom('');
                  }}>
                    <TextInput value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={tx({ vi: 'Thêm từ khóa khác…', en: 'Add another keyword…' })} maxLength={40} aria-label={tx({ vi: 'Từ khóa khác', en: 'Other keyword' })} />
                    <Button type="submit" variant="secondary">+</Button>
                  </form>
                </div>
              )}

              {mode === 'voice' && (
                <div className="mb-4 rounded-xl border border-line bg-sunken p-4">
                  {speech.supported ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant={speech.listening ? 'danger' : 'primary'} icon={speech.listening ? <MicOff className="size-5" /> : <Mic className="size-5" />} onClick={speech.listening ? speech.stop : speech.start}>
                        {speech.listening ? tx({ vi: 'Dừng ghi', en: 'Stop' }) : tx({ vi: 'Bắt đầu nói', en: 'Start speaking' })}
                      </Button>
                      <p className="text-sm text-muted">
                        {speech.listening ? speech.interim || tx({ vi: 'Đang nghe…', en: 'Listening…' }) : tx({ vi: 'Chỉ lưu văn bản, không lưu âm thanh.', en: 'Only text is kept, never audio.' })}
                      </p>
                    </div>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <Keyboard className="size-4" aria-hidden />
                      {tx({ vi: 'Trình duyệt này chưa hỗ trợ chuyển giọng nói thành chữ — hãy dùng ghi chú.', en: 'This browser has no speech-to-text — please use a note.' })}
                    </p>
                  )}
                </div>
              )}

              <Field label={tx({ vi: 'Ghi chú ngắn', en: 'Short note' })} htmlFor="note" hint={tx({ vi: 'Ví dụ: "Cô bán hàng rong ở Bà Điểm, muốn việc ổn định ban ngày, biết nấu ăn."', en: 'e.g. "Street vendor in Ba Diem, wants steady daytime work, can cook."' })}>
                <TextArea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} rows={5} />
              </Field>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-step-soft p-3 text-sm text-step">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            {tx({ vi: 'Tối thiểu dữ liệu: không số điện thoại, không số giấy tờ, không ảnh được lưu ở bước này.', en: 'Minimum data: no phone number, no ID number, no photo is stored at this step.' })}
          </p>

          {create.error && <ErrorBanner title={s.common.errorTitle} message={errorText(create.error, lang)} />}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              {s.common.cancel}
            </Button>
            <Button size="lg" disabled={!canSubmit} loading={create.isPending} onClick={submit}>
              {tx({ vi: 'Tiếp: xin đồng ý', en: 'Next: ask for consent' })}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
