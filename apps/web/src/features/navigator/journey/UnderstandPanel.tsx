import { useState } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { NEED_CATEGORIES } from '@buoc-tiep/shared';
import { useApp } from '../../../app/AppContext';
import { errorText } from '../../../app/errors';
import { Badge, Button, Card, Chip, ErrorBanner, Field, Select, TextArea, TextInput, Toggle } from '../../../design/ui';
import { NeedIcon, ProvenanceChip, RiskBanner } from '../../../design/widgets';
import { useLoopMutation } from '../../../lib/hooks';
import type { LoopCase, NeedCategory, NoteSuggestion, ProvenanceSource } from '../../../lib/types';

const DISTRICTS = ['Hóc Môn', 'Quận 12'];

export function UnderstandPanel({ c }: { c: LoopCase }) {
  const { s, tx, lang } = useApp();
  const [priority, setPriority] = useState(c.priorityStatement ?? '');
  const [need, setNeed] = useState<NeedCategory | ''>(c.need ?? '');
  const [district, setDistrict] = useState(c.district ?? '');
  const [ward, setWard] = useState(c.ward ?? '');
  const [age, setAge] = useState(c.age != null ? String(c.age) : '');
  const [strengths, setStrengths] = useState<string[]>(c.strengths);
  const [strengthInput, setStrengthInput] = useState('');
  const [daytimeOnly, setDaytimeOnly] = useState(Boolean(c.constraints.daytimeOnly));
  const [weekendOnly, setWeekendOnly] = useState(Boolean(c.constraints.weekendOnly));
  const [urgent, setUrgent] = useState(c.urgency === 'urgent');
  const [hasId, setHasId] = useState<'yes' | 'no' | 'unknown'>(c.hasIdentityDoc == null ? 'unknown' : c.hasIdentityDoc ? 'yes' : 'no');
  const [fromMachine, setFromMachine] = useState<Set<string>>(new Set());
  const [questions, setQuestions] = useState<string[]>([]);

  const assist = useLoopMutation<{ text: string }, { suggestion: NoteSuggestion }>('/assist/structure');
  const save = useLoopMutation(`/cases/${c.id}/understanding`, 'PUT');

  const applySuggestion = async () => {
    const text = [c.observation, ...c.keywords, priority].filter(Boolean).join('. ');
    const { suggestion: sg } = await assist.mutateAsync({ text });
    const marked = new Set(fromMachine);
    if (sg.need && !need) (setNeed(sg.need), marked.add('need'));
    if (sg.district && !district) (setDistrict(sg.district), marked.add('location'));
    if (sg.ward && !ward) setWard(sg.ward);
    if (sg.age != null && !age) (setAge(String(sg.age)), marked.add('age'));
    if (sg.strengths.length) (setStrengths((cur) => Array.from(new Set([...cur, ...sg.strengths]))), marked.add('strengths'));
    if (sg.constraints.daytimeOnly) (setDaytimeOnly(true), marked.add('constraints'));
    if (sg.urgency === 'urgent') setUrgent(true);
    setQuestions(sg.missingQuestions ?? []);
    setFromMachine(marked);
  };

  // A suggestion the Navigator saves has been checked by a human.
  const srcOf = (field: string): ProvenanceSource => (fromMachine.has(field) ? 'HUMAN_VERIFIED' : field === 'location' ? 'NAVIGATOR_OBSERVED' : 'BENEFICIARY_STATED');
  const untouch = (field: string) => setFromMachine((m) => {
    const n = new Set(m);
    n.delete(field);
    return n;
  });

  const valid = priority.trim().length >= 3 && need && district.trim().length >= 2;

  return (
    <Card className="p-5 sm:p-6">
      {c.risk?.decision === 'ASK_MORE' && (
        <div className="mb-5">
          <RiskBanner risk={c.risk} />
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">{tx({ vi: 'Điều gì sẽ giúp ngày mai dễ hơn?', en: 'What would make tomorrow easier?' })}</h2>
          <p className="mt-1 text-[15px] text-muted">{tx({ vi: 'Một ưu tiên, bằng lời của họ. Và những gì họ đã làm được — không chỉ những gì còn thiếu.', en: "One priority, in their words. And what they're already good at — not just what's missing." })}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Sparkles className="size-4 text-ai" />} loading={assist.isPending} onClick={applySuggestion}>
          {tx({ vi: 'Gợi ý từ ghi chú', en: 'Suggest from note' })}
        </Button>
      </div>

      {c.observation && (
        <blockquote className="mt-4 rounded-xl border-l-4 border-brand bg-sunken px-4 py-3 text-[15px] italic text-ink-2">
          “{c.observation}”
          {c.keywords.length > 0 && <span className="mt-2 flex flex-wrap gap-1 not-italic">{c.keywords.map((k) => <Badge key={k}>{k}</Badge>)}</span>}
        </blockquote>
      )}

      {fromMachine.size > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-ai-line bg-ai-soft p-3 text-sm text-ai">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          {tx({ vi: 'Các ô có nhãn "Máy gợi ý" là đề xuất. Hãy hỏi lại người dân và sửa nếu chưa đúng — khi bạn lưu, bạn là người xác nhận.', en: 'Fields tagged "Machine suggested" are proposals. Check with the person and correct them — when you save, you are the one confirming.' })}
        </p>
      )}
      {questions.length > 0 && (
        <div className="mt-3 rounded-xl border border-line bg-surface p-3">
          <p className="text-sm font-semibold text-ink">{tx({ vi: 'Có thể hỏi thêm:', en: 'You might still ask:' })}</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted">{questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
      )}

      <div className="mt-5 grid gap-5">
        <Field label={tx({ vi: 'Ưu tiên của họ lúc này', en: 'Their priority right now' })} htmlFor="priority">
          <TextArea id="priority" rows={2} value={priority} onChange={(e) => setPriority(e.target.value)} maxLength={500} placeholder={tx({ vi: '"Có việc làm ổn định ban ngày để đưa đón con"', en: '"Steady daytime work so I can pick up my kids"' })} className="min-h-[72px]" />
        </Field>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[15px] font-semibold text-ink">{tx({ vi: 'Loại hỗ trợ cần nhất', en: 'Kind of support needed most' })}</p>
            {fromMachine.has('need') && <ProvenanceChip source="AI_SUGGESTED" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {NEED_CATEGORIES.filter((n) => n !== 'emergency').map((n) => (
              <Chip key={n} selected={need === n} onClick={() => (setNeed(n), untouch('need'))} icon={<NeedIcon need={n} className="size-4" />}>
                {s.need[n]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={tx({ vi: 'Khu vực', en: 'Area' })} htmlFor="district">
            <Select id="district" value={district} onChange={(e) => (setDistrict(e.target.value), untouch('location'))}>
              <option value="">—</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label={tx({ vi: 'Xã / phường', en: 'Ward' })} htmlFor="ward" optionalLabel={s.common.optional}>
            <TextInput id="ward" value={ward} onChange={(e) => setWard(e.target.value)} maxLength={60} />
          </Field>
          <Field label={tx({ vi: 'Tuổi (ước lượng)', en: 'Age (approx.)' })} htmlFor="age" optionalLabel={s.common.optional}>
            <TextInput id="age" inputMode="numeric" value={age} onChange={(e) => (setAge(e.target.value.replace(/\D/g, '').slice(0, 3)), untouch('age'))} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[15px] font-semibold text-ink">{tx({ vi: 'Điểm mạnh, kinh nghiệm', en: 'Strengths & experience' })}</p>
            {fromMachine.has('strengths') && <ProvenanceChip source="AI_SUGGESTED" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {strengths.map((st) => (
              <span key={st} className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-step-line bg-step-soft pl-3.5 pr-1 font-medium text-step">
                {st}
                <button type="button" aria-label={`${s.common.cancel} ${st}`} onClick={() => setStrengths((x) => x.filter((y) => y !== st))} className="grid size-8 place-items-center rounded-full hover:bg-surface">
                  <X className="size-4" aria-hidden />
                </button>
              </span>
            ))}
            <form className="flex gap-1" onSubmit={(e) => {
              e.preventDefault();
              const v = strengthInput.trim();
              if (v && !strengths.includes(v)) setStrengths((x) => [...x, v]);
              setStrengthInput('');
            }}>
              <TextInput value={strengthInput} onChange={(e) => setStrengthInput(e.target.value)} placeholder={tx({ vi: 'nấu ăn, bán hàng…', en: 'cooking, selling…' })} className="w-44" aria-label={tx({ vi: 'Thêm điểm mạnh', en: 'Add strength' })} />
              <Button type="submit" variant="secondary" aria-label={tx({ vi: 'Thêm', en: 'Add' })} icon={<Plus className="size-4" />} />
            </form>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle checked={daytimeOnly} onChange={(v) => (setDaytimeOnly(v), untouch('constraints'))} label={tx({ vi: 'Chỉ đi được ban ngày', en: 'Daytime only' })} />
          <Toggle checked={weekendOnly} onChange={setWeekendOnly} label={tx({ vi: 'Chỉ rảnh cuối tuần', en: 'Weekends only' })} />
          <Toggle checked={urgent} onChange={setUrgent} label={tx({ vi: 'Cần gấp trong 24 giờ', en: 'Urgent — within 24h' })} />
          <Field label={tx({ vi: 'Có giấy tờ tùy thân?', en: 'Has ID documents?' })} htmlFor="hasid">
            <Select id="hasid" value={hasId} onChange={(e) => setHasId(e.target.value as typeof hasId)}>
              <option value="unknown">{tx({ vi: 'Chưa rõ', en: 'Unknown' })}</option>
              <option value="yes">{tx({ vi: 'Có', en: 'Yes' })}</option>
              <option value="no">{tx({ vi: 'Không', en: 'No' })}</option>
            </Select>
          </Field>
        </div>
      </div>

      {save.error && <div className="mt-4"><ErrorBanner title={s.common.errorTitle} message={errorText(save.error, lang)} /></div>}

      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          disabled={!valid}
          loading={save.isPending}
          onClick={() =>
            save.mutate({
              priorityStatement: priority.trim(),
              need,
              district,
              ward: ward.trim() || null,
              age: age ? Number(age) : null,
              hasIdentityDoc: hasId === 'unknown' ? null : hasId === 'yes',
              strengths,
              constraints: { daytimeOnly, weekendOnly },
              urgency: urgent ? 'urgent' : 'normal',
              sources: {
                priority_statement: 'BENEFICIARY_STATED',
                need: srcOf('need'),
                location: srcOf('location'),
                strengths: srcOf('strengths'),
                constraints: srcOf('constraints'),
                age: srcOf('age'),
              },
            })
          }
        >
          {tx({ vi: 'Tiếp: kiểm tra an toàn', en: 'Next: safety check' })}
        </Button>
      </div>
    </Card>
  );
}
