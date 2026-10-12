/**
 * A5 Nơi hỗ trợ. Người dùng: người đồng hành. Việc chính: tìm nơi đã xác minh và gọi được ngay.
 * Chuyển gửi luôn đi qua hành trình (Tìm nơi phù hợp) để tới đúng hộp của đơn vị hỗ trợ.
 * An toàn trẻ em: mặc định ẩn nơi hỗ trợ việc làm — chỉ hiện khi đã rõ người được hỗ trợ ≥ 18 tuổi.
 */
import { useMemo, useState } from 'react';
import { BadgeCheck, Clock, HeartHandshake, MapPin, Phone, Search } from 'lucide-react';
import { NEED_CATEGORIES } from '@buoc-tiep/shared';
import type { NeedCategory } from '@web/lib/types';
import { useDirectory } from '../lib/hooks';
import { useLang } from '../lib/i18n';
import { NEED, errorText } from '../lib/labels';
import { callNumber } from '../lib/platform';
import { SupportCall } from '../components/SupportCall';
import hospital from '../static/services/hospital.svg';
import { Alert, Badge, Button, CheckRow, Chip, EmptyState, Loading, PageBody, PageHeader, SearchBar } from '../components/ui';

export function DirectoryPage() {
  const { tx, lang } = useLang();
  const directory = useDirectory();
  const [need, setNeed] = useState<NeedCategory | null>(null);
  const [adult, setAdult] = useState(false);
  const [q, setQ] = useState('');

  const needs = NEED_CATEGORIES.filter((n) => n !== 'emergency' && (adult || n !== 'employment'));
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    // Bỏ trùng theo tên + dịch vụ (danh bạ có thể có cùng một nơi nhập 2 lần).
    const seen = new Set<string>();
    return (directory.data ?? [])
      .filter((r) => adult || r.category !== 'employment')
      .filter((r) => !need || r.category === need)
      .filter((r) => !term || `${r.organisationName} ${r.serviceName} ${r.district} ${r.address ?? ''}`.toLowerCase().includes(term))
      .filter((r) => {
        const k = `${r.organisationName}|${r.serviceName}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => Number(b.freshness === 'VERIFIED') - Number(a.freshness === 'VERIFIED'));
  }, [directory.data, need, adult, q]);

  return (
    <>
      <PageHeader variant="logo" title={tx({ vi: 'Nơi hỗ trợ', en: 'Support places' })} subtitle={tx({ vi: 'Được con người xác minh, gọi được ngay', en: 'Verified by people, one tap to call' })} />
      <PageBody>
        <SearchBar value={q} onChange={setQ} placeholder={tx({ vi: 'Tìm theo tên, khu vực…', en: 'Search by name, area…' })} icon={<Search className="size-5" strokeWidth={1.75} aria-hidden />} />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip selected={need === null} onClick={() => setNeed(null)}>{tx({ vi: 'Tất cả', en: 'All' })}</Chip>
          {needs.map((n) => (
            <Chip key={n} selected={need === n} onClick={() => setNeed(n)}>{NEED[n][lang]}</Chip>
          ))}
        </div>
        <CheckRow
          checked={adult}
          onChange={(v) => (setAdult(v), !v && need === 'employment' && setNeed(null))}
          label={tx({ vi: 'Người được hỗ trợ đã rõ là từ 18 tuổi', en: 'The person is confirmed 18 or older' })}
          description={tx({ vi: 'Nơi hỗ trợ việc làm chỉ hiện khi đánh dấu mục này.', en: 'Employment places show only when this is ticked.' })}
        />

        {directory.isLoading ? (
          <Loading />
        ) : directory.error ? (
          <Alert tone="danger" title={tx({ vi: 'Chưa tải được danh bạ', en: "Couldn't load the directory" })} onRetry={() => directory.refetch()}>
            {errorText(directory.error, lang)}
          </Alert>
        ) : list.length === 0 ? (
          <EmptyState icon={<HeartHandshake className="size-7" strokeWidth={1.75} aria-hidden />} title={tx({ vi: 'Chưa thấy nơi phù hợp', en: 'No matching places yet' })}>
            {tx({ vi: 'Thử bỏ bớt bộ lọc, hoặc hỏi điều phối viên.', en: 'Try fewer filters, or ask your coordinator.' })}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r.id} className="rounded-xl bg-white p-4">
                <div className="flex items-start gap-3">
                  <img src={hospital} alt="" className="h-11 w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-fg">{r.organisationName}</p>
                    <p className="text-small text-fg-2">{r.serviceName}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.freshness === 'VERIFIED' ? (
                        <Badge tone="success" icon={<BadgeCheck className="size-3.5" strokeWidth={2} aria-hidden />}>{tx({ vi: 'Đã xác minh', en: 'Verified' })}</Badge>
                      ) : (
                        <Badge>{tx({ vi: 'Chưa xác minh lại', en: 'Needs re-check' })}</Badge>
                      )}
                      <Badge>{NEED[r.category as NeedCategory]?.[lang] ?? r.category}</Badge>
                      {r.capacityStatus === 'FULL' && <Badge>{tx({ vi: 'Tạm hết chỗ', en: 'Full for now' })}</Badge>}
                      {r.capacityStatus === 'LIMITED' && <Badge tone="accent">{tx({ vi: 'Còn ít chỗ', en: 'Few places' })}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 border-t border-black/10 pt-3 text-small text-fg-2">
                  {(r.address || r.district) && (
                    <p className="flex gap-1.5"><MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />{r.address ?? r.district}</p>
                  )}
                  {r.availability?.hours && <p className="flex gap-1.5"><Clock className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />{r.availability.hours}</p>}
                </div>
                {r.phone && (
                  <Button className="mt-3" size="sm" variant="secondary" icon={<Phone className="size-4" strokeWidth={1.75} />} onClick={() => callNumber(r.phone!)}>
                    {tx({ vi: 'Gọi', en: 'Call' })} {r.phone}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <SupportCall full />
      </PageBody>
    </>
  );
}
