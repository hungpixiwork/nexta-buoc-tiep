import { useCallback, useMemo, useState } from 'react';
import { Building2, ExternalLink, MapPin, Phone, Plus, Search, ShieldCheck } from 'lucide-react';
import { NEED_CATEGORIES } from '@buoc-tiep/shared';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Button, Chip, Dialog, EmptyState, ErrorBanner, Field, PageHeader, Select, Spinner, TextArea, TextInput, cx } from '../../design/ui';
import { CapacityBadge, FreshnessBadge, NeedIcon } from '../../design/widgets';
import { fmtDate } from '../../lib/format';
import { useDirectory, useLoopMutation } from '../../lib/hooks';
import type { DirectoryResource, NeedCategory, VerificationFreshness } from '../../lib/types';
import { ResourceMap } from './ResourceMap';

export function DirectoryPage() {
  const { s, tx, lang } = useApp();
  const directory = useDirectory();
  const [fresh, setFresh] = useState<VerificationFreshness | 'ALL'>('ALL');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<DirectoryResource | null>(null);
  const [adding, setAdding] = useState(false);
  const onSelect = useCallback((id: string) => {
    setSelected(id);
    document.getElementById(`res-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (directory.data ?? []).filter(
      (r) =>
        (fresh === 'ALL' || r.freshness === fresh) &&
        (!needle || `${r.organisationName} ${r.serviceName} ${r.district} ${r.ward ?? ''}`.toLowerCase().includes(needle)),
    );
  }, [directory.data, fresh, q]);

  const count = (f: VerificationFreshness) => (directory.data ?? []).filter((r) => r.freshness === f).length;

  return (
    <>
      <PageHeader
        title={tx({ vi: 'Danh bạ nguồn lực đã xác minh', en: 'Verified resource directory' })}
        description={tx({
          vi: 'Ít nhưng thật. Mỗi nguồn lực ghi rõ ai xác minh, khi nào, bằng cách nào. Chỉ "Đã xác minh" và "Cần kiểm tra lại" (sau khi gọi xác nhận) mới được dùng làm bước tiếp.',
          en: 'Fewer, but real. Each resource records who verified it, when and how. Only "Verified" — or "Needs re-check" after a confirming call — can become a next step.',
        })}
        actions={<Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>{tx({ vi: 'Thêm nguồn lực', en: 'Add resource' })}</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx({ vi: 'Tìm tên, dịch vụ, khu vực…', en: 'Search name, service, area…' })} className="pl-9" aria-label={tx({ vi: 'Tìm nguồn lực', en: 'Search resources' })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip selected={fresh === 'ALL'} onClick={() => setFresh('ALL')}>{tx({ vi: 'Tất cả', en: 'All' })} {directory.data?.length ?? 0}</Chip>
          {(['VERIFIED', 'NEEDS_RECHECK', 'UNCONFIRMED'] as const).map((f) => (
            <Chip key={f} selected={fresh === f} onClick={() => setFresh(f)}>{s.freshness[f]} {count(f)}</Chip>
          ))}
        </div>
      </div>

      {directory.isLoading && <Spinner label={s.common.loading} />}
      {directory.error && <ErrorBanner title={s.common.errorTitle} message={errorText(directory.error, lang)} onRetry={() => directory.refetch()} retryLabel={s.common.retry} />}

      {directory.data && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="order-2 lg:order-1">
            {items.length === 0 ? (
              <EmptyState icon={<Building2 className="size-6" />} title={tx({ vi: 'Không có nguồn lực phù hợp bộ lọc', en: 'No resources match the filter' })} />
            ) : (
              <ul className="space-y-3">
                {items.map((r) => (
                  <li key={r.id} id={`res-${r.id}`} className={cx('card p-4 transition-colors', selected === r.id && 'border-2 border-brand')}>
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                        <NeedIcon need={(NEED_CATEGORIES as readonly string[]).includes(r.category) ? (r.category as NeedCategory) : 'social_assistance'} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => setSelected(r.id)} className="text-left font-bold text-ink hover:underline">
                          {r.organisationName}
                        </button>
                        <p className="text-sm text-muted">{r.serviceName}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <FreshnessBadge freshness={r.freshness} date={r.verifiedAt} />
                          <CapacityBadge status={r.capacityStatus} slots={r.slotsAvailable} />
                          {!r.acceptsReferral && <Badge>{tx({ vi: 'Kênh tự phục vụ', en: 'Self-service channel' })}</Badge>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                          {r.address && <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{r.address}</span>}
                          {r.phone && <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 font-semibold text-brand-strong"><Phone className="size-4" aria-hidden />{r.phone}</a>}
                          {r.availability?.hours && <span>{r.availability.hours}</span>}
                        </div>
                        <details className="mt-2 text-sm">
                          <summary className="cursor-pointer font-semibold text-brand-strong">{tx({ vi: 'Nguồn & lịch sử xác minh', en: 'Source & verification' })}</summary>
                          <div className="mt-2 space-y-1 rounded-xl bg-sunken p-3 text-ink-2">
                            {r.verifiedByName && <p>{tx({ vi: 'Xác minh bởi', en: 'Verified by' })}: <strong>{r.verifiedByName}</strong> · {fmtDate(r.verifiedAt, lang)} · {r.verificationMethod}</p>}
                            {r.verificationExpiresAt && <p>{tx({ vi: 'Hiệu lực đến', en: 'Valid until' })}: {fmtDate(r.verificationExpiresAt, lang)}</p>}
                            {r.verificationNotes && <p>{r.verificationNotes}</p>}
                            {r.verificationSourceUrl && (
                              <a href={r.verificationSourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-strong underline">
                                {s.common.source} <ExternalLink className="size-3.5" aria-hidden />
                              </a>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end border-t border-line pt-3">
                      <Button size="sm" variant={r.freshness === 'VERIFIED' ? 'secondary' : 'step'} icon={<ShieldCheck className="size-4" />} onClick={() => setVerifying(r)}>
                        {r.freshness === 'VERIFIED' ? tx({ vi: 'Xác minh lại', en: 'Re-verify' }) : tx({ vi: 'Xác minh', en: 'Verify' })}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <ResourceMap resources={items} selectedId={selected} onSelect={onSelect} label={tx({ vi: 'Bản đồ nguồn lực Hóc Môn – Quận 12', en: 'Resource map, Hóc Môn – District 12' })} />
              <p className="mt-2 text-xs text-muted">{tx({ vi: 'Toạ độ ước lượng từ địa chỉ, được xác nhận khi xác minh.', en: 'Coordinates are geocoded from addresses and confirmed during verification.' })}</p>
            </div>
          </div>
        </div>
      )}

      {verifying && <VerifyDialog r={verifying} onClose={() => setVerifying(null)} />}
      {adding && <AddDialog onClose={() => setAdding(false)} />}
    </>
  );
}

function VerifyDialog({ r, onClose }: { r: DirectoryResource; onClose: () => void }) {
  const { s, tx, lang } = useApp();
  const [status, setStatus] = useState<'VERIFIED' | 'NEEDS_RECHECK' | 'UNCONFIRMED' | 'INACTIVE'>('VERIFIED');
  const [method, setMethod] = useState<'PHONE_CALL' | 'SITE_VISIT' | 'OFFICIAL_DOCUMENT' | 'PARTNER_PORTAL'>('PHONE_CALL');
  const [capacity, setCapacity] = useState<DirectoryResource['capacityStatus']>(r.capacityStatus);
  const [slots, setSlots] = useState(r.slotsAvailable != null ? String(r.slotsAvailable) : '');
  const [phone, setPhone] = useState(r.phone ?? '');
  const [notes, setNotes] = useState('');
  const verify = useLoopMutation(`/directory/${r.id}/verify`);

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${tx({ vi: 'Xác minh', en: 'Verify' })}: ${r.organisationName}`}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{s.common.cancel}</Button>
          <Button variant="step" disabled={notes.trim().length < 3} loading={verify.isPending} onClick={async () => {
            await verify.mutateAsync({ status, method, notes: notes.trim(), capacityStatus: capacity, slotsAvailable: slots ? Number(slots) : null, phone: phone.trim() || null });
            onClose();
          }}>
            {s.common.save}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Kết quả', en: 'Result' })} htmlFor="vstatus">
            <Select id="vstatus" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="VERIFIED">{s.freshness.VERIFIED}</option>
              <option value="NEEDS_RECHECK">{s.freshness.NEEDS_RECHECK}</option>
              <option value="UNCONFIRMED">{s.freshness.UNCONFIRMED}</option>
              <option value="INACTIVE">{s.freshness.INACTIVE}</option>
            </Select>
          </Field>
          <Field label={tx({ vi: 'Cách xác minh', en: 'Method' })} htmlFor="vmethod">
            <Select id="vmethod" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="PHONE_CALL">{tx({ vi: 'Gọi điện', en: 'Phone call' })}</option>
              <option value="SITE_VISIT">{tx({ vi: 'Đến tận nơi', en: 'Site visit' })}</option>
              <option value="OFFICIAL_DOCUMENT">{tx({ vi: 'Văn bản chính thức', en: 'Official document' })}</option>
              <option value="PARTNER_PORTAL">{tx({ vi: 'Đối tác tự cập nhật', en: 'Partner self-report' })}</option>
            </Select>
          </Field>
          <Field label={tx({ vi: 'Sức chứa hiện tại', en: 'Current capacity' })} htmlFor="vcap">
            <Select id="vcap" value={capacity} onChange={(e) => setCapacity(e.target.value as typeof capacity)}>
              {(['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN'] as const).map((c) => <option key={c} value={c}>{s.capacity[c]}</option>)}
            </Select>
          </Field>
          <Field label={tx({ vi: 'Số chỗ còn nhận', en: 'Places left' })} htmlFor="vslots" optionalLabel={s.common.optional}>
            <TextInput id="vslots" inputMode="numeric" value={slots} onChange={(e) => setSlots(e.target.value.replace(/\D/g, '').slice(0, 5))} />
          </Field>
        </div>
        <Field label={tx({ vi: 'Số điện thoại đầu mối (công khai)', en: 'Public contact number' })} htmlFor="vphone" optionalLabel={s.common.optional}>
          <TextInput id="vphone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
        </Field>
        <Field label={tx({ vi: 'Đã xác nhận điều gì, với ai?', en: 'What was confirmed, with whom?' })} htmlFor="vnotes">
          <TextArea id="vnotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder={tx({ vi: 'VD: Gọi bộ phận tư vấn nghề, nhận giới thiệu thứ 2–6, 7:30–11:00.', en: 'e.g. Called the counselling desk, takes referrals Mon–Fri, 7:30–11:00.' })} />
        </Field>
        {verify.error && <ErrorBanner title={s.common.errorTitle} message={errorText(verify.error, lang)} />}
      </div>
    </Dialog>
  );
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const { s, tx, lang } = useApp();
  const [org, setOrg] = useState('');
  const [service, setService] = useState('');
  const [category, setCategory] = useState<NeedCategory>('employment');
  const [district, setDistrict] = useState('Hóc Môn');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const add = useLoopMutation('/directory');

  return (
    <Dialog
      open
      onClose={onClose}
      title={tx({ vi: 'Thêm nguồn lực', en: 'Add resource' })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{s.common.cancel}</Button>
          <Button disabled={org.trim().length < 2 || service.trim().length < 2} loading={add.isPending} onClick={async () => {
            await add.mutateAsync({ organisationName: org.trim(), serviceName: service.trim(), category, district, address: address.trim() || null, phone: phone.trim() || null, sourceUrl: source.trim() || null, serviceArea: [district] });
            onClose();
          }}>
            {s.common.save}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="rounded-xl bg-sunken p-3 text-sm text-muted">{tx({ vi: 'Nguồn lực mới luôn bắt đầu ở trạng thái "Chưa xác nhận" và chỉ được dùng sau khi có người xác minh.', en: 'New resources always start as "Unconfirmed" and can be used only after someone verifies them.' })}</p>
        <Field label={tx({ vi: 'Tổ chức', en: 'Organisation' })} htmlFor="aorg"><TextInput id="aorg" value={org} onChange={(e) => setOrg(e.target.value)} maxLength={160} /></Field>
        <Field label={tx({ vi: 'Dịch vụ', en: 'Service' })} htmlFor="asvc"><TextInput id="asvc" value={service} onChange={(e) => setService(e.target.value)} maxLength={200} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Loại hỗ trợ', en: 'Kind of support' })} htmlFor="acat">
            <Select id="acat" value={category} onChange={(e) => setCategory(e.target.value as NeedCategory)}>
              {NEED_CATEGORIES.map((n) => <option key={n} value={n}>{s.need[n]}</option>)}
            </Select>
          </Field>
          <Field label={tx({ vi: 'Khu vực', en: 'Area' })} htmlFor="adist">
            <Select id="adist" value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option>Hóc Môn</option>
              <option>Quận 12</option>
              <option value="Toàn TP.HCM">{tx({ vi: 'Toàn TP.HCM', en: 'Whole city' })}</option>
            </Select>
          </Field>
        </div>
        <Field label={tx({ vi: 'Địa chỉ', en: 'Address' })} htmlFor="aaddr" optionalLabel={s.common.optional}><TextInput id="aaddr" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} /></Field>
        <Field label={tx({ vi: 'Số điện thoại công khai', en: 'Public phone' })} htmlFor="aphone" optionalLabel={s.common.optional}><TextInput id="aphone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} /></Field>
        <Field label={tx({ vi: 'Đường dẫn nguồn (trang chính thức)', en: 'Source link (official page)' })} htmlFor="asrc" optionalLabel={s.common.optional}><TextInput id="asrc" type="url" value={source} onChange={(e) => setSource(e.target.value)} /></Field>
        {add.error && <ErrorBanner title={s.common.errorTitle} message={errorText(add.error, lang)} />}
      </div>
    </Dialog>
  );
}
