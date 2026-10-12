import { useState } from 'react';
import { Camera, Handshake, Phone, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../../../app/AppContext';
import { errorText } from '../../../app/errors';
import { Button, Card, ErrorBanner, Field, TextInput, Toggle } from '../../../design/ui';
import { useLoopMutation } from '../../../lib/hooks';
import type { LoopCase } from '../../../lib/types';

export function ConsentPanel({ c }: { c: LoopCase }) {
  const { s, tx, lang } = useApp();
  const [allowPhoto, setAllowPhoto] = useState(false);
  const [allowPhone, setAllowPhone] = useState(false);
  const [allowSharing, setAllowSharing] = useState(true);
  const [preferredAddress, setPreferredAddress] = useState(c.alias);
  const [agreed, setAgreed] = useState(false);
  const save = useLoopMutation(`/cases/${c.id}/consent`, 'PUT');

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-xl font-bold text-ink">{tx({ vi: 'Đồng ý & ranh giới', en: 'Consent & boundaries' })}</h2>
      <p className="mt-1 text-[15px] text-muted">
        {tx({
          vi: 'Người dân quyết định điều gì được đưa vào hệ thống. Đọc to từng mục và bật chỉ khi họ đồng ý.',
          en: 'The person decides what enters the system. Read each item aloud and switch it on only if they agree.',
        })}
      </p>

      <div className="mt-5 space-y-3">
        <Field label={tx({ vi: 'Họ muốn được xưng hô thế nào?', en: 'How would they like to be addressed?' })} htmlFor="addr">
          <TextInput id="addr" value={preferredAddress} onChange={(e) => setPreferredAddress(e.target.value)} maxLength={40} />
        </Field>
        <Toggle
          checked={allowSharing}
          onChange={setAllowSharing}
          icon={<Handshake className="size-5" />}
          label={tx({ vi: 'Chia sẻ tối thiểu với đơn vị hỗ trợ', en: 'Share the minimum with the support partner' })}
          description={tx({ vi: 'Chỉ bí danh, nhu cầu và bước tiếp đã thống nhất.', en: 'Only alias, need and the agreed next step.' })}
        />
        <Toggle checked={allowPhone} onChange={setAllowPhone} icon={<Phone className="size-5" />} label={tx({ vi: 'Được gọi điện hỏi thăm', en: 'May be phoned for follow-up' })} description={tx({ vi: 'Số điện thoại không lưu trong NEXTA — Navigator giữ liên lạc.', en: 'The number is not stored in NEXTA — the Navigator keeps contact.' })} />
        <Toggle checked={allowPhoto} onChange={setAllowPhoto} icon={<Camera className="size-5" />} label={tx({ vi: 'Được chụp ảnh minh hoạ hoàn cảnh', en: 'May take a photo of the situation' })} description={tx({ vi: 'Ảnh không bao giờ được tải lên máy chủ.', en: 'Photos are never uploaded.' })} />
      </div>

      <label className="mt-5 flex min-h-[56px] items-start gap-3 rounded-xl border-2 border-step-line bg-step-soft p-4">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-5 accent-[var(--color-step)]" />
        <span className="text-[15px] text-ink">
          <strong className="block text-step">{tx({ vi: 'Người dân đã đồng ý bằng lời', en: 'The person gave verbal consent' })}</strong>
          {tx({
            vi: 'Họ hiểu NEXTA giúp tìm một bước tiếp, có thể dừng bất cứ lúc nào, và thông tin chỉ dùng cho việc hỗ trợ.',
            en: 'They understand NEXTA helps find a next step, they can stop at any time, and information is used only for support.',
          })}
        </span>
      </label>

      <p className="mt-4 flex items-start gap-2 text-sm text-muted">
        <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
        {tx({ vi: 'Nếu có trẻ em đi cùng: không hỏi, không ghi thông tin của trẻ. Hệ thống sẽ tự chuyển cho người điều phối.', en: 'If a child is present: do not ask about or record the child. The system routes it to a coordinator.' })}
      </p>

      {save.error && <div className="mt-4"><ErrorBanner title={s.common.errorTitle} message={errorText(save.error, lang)} /></div>}

      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          icon={<ShieldCheck className="size-5" />}
          disabled={!agreed}
          loading={save.isPending}
          onClick={() =>
            save.mutate({
              verbalConsent: true,
              allowPhoto,
              allowPhone,
              allowSharingWithPartner: allowSharing,
              preferredAddress: preferredAddress.trim() || null,
              minimumDataOnly: true,
            })
          }
        >
          {tx({ vi: 'Ghi nhận đồng ý', en: 'Record consent' })}
        </Button>
      </div>
    </Card>
  );
}
