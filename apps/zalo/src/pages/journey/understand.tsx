import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { NEED_CATEGORIES } from '@buoc-tiep/shared';
import { PATHWAY_BLOCKED_NEEDS, pathwayOf } from '@web/lib/pathway';
import type { LoopCase, NeedCategory } from '@web/lib/types';
import { useLoopMutation } from '../../lib/hooks';
import { useLang } from '../../lib/i18n';
import { NEED, errorText } from '../../lib/labels';
import { Button, Card, CheckRow, Chip, Alert, Field, Select, TextArea, TextInput } from '../../components/ui';

const DISTRICTS = ['Hóc Môn', 'Quận 12'];

/** Chỉ hiện khi tạo hành trình xong mà chưa ghi được sự đồng ý (VD: mất mạng giữa chừng). */
export function ConsentPanel({ c }: { c: LoopCase }) {
  const { tx, lang } = useLang();
  const child = c.alias.startsWith('CHILD-');
  const [agreed, setAgreed] = useState(false);
  const [share, setShare] = useState(true);
  const [phoneOk, setPhoneOk] = useState(false);
  const save = useLoopMutation(`/cases/${c.id}/consent`, { method: 'PUT' });
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-medium text-fg">{tx({ vi: 'Ghi sự đồng ý', en: 'Record consent' })}</h2>
      <p className="text-body text-fg-2">{tx({ vi: 'Đọc to cho họ nghe. Chỉ đánh dấu khi họ đồng ý.', en: 'Read aloud. Tick only if they agree.' })}</p>
      <CheckRow checked={agreed} onChange={setAgreed} label={tx({ vi: 'Người này đồng ý cho ghi lại', en: 'This person agrees to be recorded' })} />
      <CheckRow checked={share} onChange={setShare} label={tx({ vi: 'Chia sẻ tối thiểu với đơn vị hỗ trợ', en: 'Share the minimum with the support service' })} />
      {!child && <CheckRow checked={phoneOk} onChange={setPhoneOk} label={tx({ vi: 'Được gọi điện hỏi thăm', en: 'May be phoned to check in' })} />}
      {save.error && <Alert tone="danger">{errorText(save.error, lang)}</Alert>}
      <Button
        full
        size="lg"
        variant="primary"
        icon={<ShieldCheck className="size-5" />}
        disabled={!agreed}
        loading={save.isPending}
        onClick={() =>
          save.mutate({ verbalConsent: true, allowPhoto: false, allowPhone: phoneOk, allowSharingWithPartner: share, preferredAddress: child ? null : c.alias, minimumDataOnly: true })
        }
      >
        {tx({ vi: 'Ghi nhận sự đồng ý', en: 'Record consent' })}
      </Button>
    </Card>
  );
}

/** Bước tìm hiểu: một ưu tiên bằng lời của họ, nhu cầu chính, khu vực, tuổi. */
export function UnderstandPanel({ c }: { c: LoopCase }) {
  const { tx, lang } = useLang();
  const childByAlias = c.alias.startsWith('CHILD-');
  const [priority, setPriority] = useState(c.priorityStatement ?? '');
  const [need, setNeed] = useState<NeedCategory | ''>(c.need ?? '');
  const [district, setDistrict] = useState(c.district ?? '');
  const [ward, setWard] = useState(c.ward ?? '');
  const [age, setAge] = useState(c.age != null ? String(c.age) : '');
  const [urgent, setUrgent] = useState(c.urgency === 'urgent');
  const [hasId, setHasId] = useState<'yes' | 'no' | 'unknown'>(c.hasIdentityDoc == null ? 'unknown' : c.hasIdentityDoc ? 'yes' : 'no');
  const save = useLoopMutation(`/cases/${c.id}/understanding`, { method: 'PUT' });

  const ageNum = age ? Number(age) : null;
  const isMinor = childByAlias || c.isMinor || (ageNum != null && ageNum < 18);
  // An toàn trẻ em: trẻ em hoặc chưa rõ tuổi không được chọn nhu cầu việc làm.
  const blocked = isMinor || ageNum == null ? PATHWAY_BLOCKED_NEEDS.child : PATHWAY_BLOCKED_NEEDS[pathwayOf({ age: ageNum })];
  const needs = NEED_CATEGORIES.filter((n) => n !== 'emergency' && !blocked.includes(n));
  const valid = priority.trim().length >= 3 && need && !blocked.includes(need) && district.trim().length >= 2;

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-fg">{tx({ vi: 'Điều gì sẽ giúp ngày mai dễ hơn?', en: 'What would make tomorrow easier?' })}</h2>
        <p className="text-body text-fg-2">{tx({ vi: 'Một ưu tiên, bằng lời của họ.', en: 'One priority, in their words.' })}</p>
      </div>
      {c.observation && <blockquote className="rounded-[var(--radius-control)] border-l-4 border-primary bg-surface-soft px-3 py-2 text-body italic text-fg">“{c.observation}”</blockquote>}

      <Field label={tx({ vi: 'Ưu tiên của họ lúc này', en: 'Their priority right now' })}>
        <TextArea rows={2} maxLength={500} value={priority} onChange={(e) => setPriority(e.target.value)} placeholder={tx({ vi: '"Có việc ban ngày để đưa đón con"', en: '"Daytime work so I can pick up my kids"' })} />
      </Field>

      <div>
        <p className="mb-2 text-body font-semibold text-fg">{tx({ vi: 'Loại hỗ trợ cần nhất', en: 'Support needed most' })}</p>
        <div className="flex flex-wrap gap-2">
          {needs.map((n) => (
            <Chip key={n} selected={need === n} onClick={() => setNeed(n)}>{NEED[n][lang]}</Chip>
          ))}
        </div>
        {blocked.includes('employment') && (
          <p className="mt-2 text-small text-fg-2">{tx({ vi: 'Trẻ em hoặc chưa rõ tuổi: không kết nối việc làm.', en: 'Child or unknown age: no employment referrals.' })}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={tx({ vi: 'Khu vực', en: 'Area' })}>
          <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">—</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label={tx({ vi: 'Tuổi (ước lượng)', en: 'Age (approx.)' })}>
          <TextInput inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder={tx({ vi: 'Chưa rõ', en: 'Unknown' })} />
        </Field>
      </div>
      <Field label={tx({ vi: 'Xã / phường (không bắt buộc)', en: 'Ward (optional)' })}>
        <TextInput maxLength={60} value={ward} onChange={(e) => setWard(e.target.value)} />
      </Field>
      <Field label={tx({ vi: 'Có giấy tờ tùy thân?', en: 'Has ID documents?' })}>
        <Select value={hasId} onChange={(e) => setHasId(e.target.value as typeof hasId)}>
          <option value="unknown">{tx({ vi: 'Chưa rõ', en: 'Unknown' })}</option>
          <option value="yes">{tx({ vi: 'Có', en: 'Yes' })}</option>
          <option value="no">{tx({ vi: 'Không', en: 'No' })}</option>
        </Select>
      </Field>
      <CheckRow checked={urgent} onChange={setUrgent} label={tx({ vi: 'Cần gấp trong 24 giờ', en: 'Urgent — within 24 hours' })} />

      {save.error && <Alert tone="danger">{errorText(save.error, lang)}</Alert>}
      <Button
        full
        size="lg"
        disabled={!valid}
        loading={save.isPending}
        onClick={() =>
          save.mutate({
            priorityStatement: priority.trim(),
            need,
            district,
            ward: ward.trim() || null,
            age: ageNum,
            isMinor,
            hasIdentityDoc: hasId === 'unknown' ? null : hasId === 'yes',
            strengths: c.strengths,
            constraints: c.constraints,
            urgency: urgent ? 'urgent' : 'normal',
            sources: { priority_statement: 'BENEFICIARY_STATED', need: 'BENEFICIARY_STATED', location: 'NAVIGATOR_OBSERVED', age: 'BENEFICIARY_STATED' },
          })
        }
      >
        {tx({ vi: 'Tiếp: kiểm tra an toàn', en: 'Next: safety check' })}
      </Button>
    </Card>
  );
}
