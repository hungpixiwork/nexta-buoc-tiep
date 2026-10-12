/**
 * Nguồn lực & năng lực tiếp nhận (mockup 6).
 * Why: matching is only as good as the capacity data behind it. If a partner is full or closed on
 * weekends and the system doesn't know, people get sent to a closed door. This screen makes keeping
 * places, hours and area current a 30-second job — and pausing instantly stops new referrals.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Info, MapPin, Plus, Save, Users, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, Chip, Dialog, EmptyState, ErrorBanner, Field, Select, SkeletonCard, TextInput, cx } from '../../design/ui';
import { KpiCard, KpiRow, PageHero, Panel, Pill } from '../../design/dashboard';
import { FreshnessBadge, NeedIcon } from '../../design/widgets';
import { errorMessage, useLoopMutation } from '../../lib/hooks';
import type { DirectoryResource, NeedCategory } from '../../lib/types';
import { isAccepting, slotsTotalOf, usePartnerScope } from './usePartnerScope';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Day = (typeof DAYS)[number];
const DAY_LABEL: Record<Day, { vi: string; en: string }> = {
  mon: { vi: 'T2', en: 'Mon' },
  tue: { vi: 'T3', en: 'Tue' },
  wed: { vi: 'T4', en: 'Wed' },
  thu: { vi: 'T5', en: 'Thu' },
  fri: { vi: 'T6', en: 'Fri' },
  sat: { vi: 'T7', en: 'Sat' },
  sun: { vi: 'CN', en: 'Sun' },
};
/** Pilot districts (HCMC north-west Living Lab) offered as service-area choices. */
const DISTRICTS = ['Quận 12', 'Hóc Môn', 'Gò Vấp', 'Bình Thạnh', 'Quận 1', 'Quận 3', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'Củ Chi', 'Thủ Đức', 'Toàn thành phố'];
const HOURS = Array.from({ length: 29 }, (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

interface CapacityForm {
  accepting: boolean;
  slotsAvailable: number;
  slotsTotal: number;
  from: string;
  to: string;
  days: Day[];
  modes: Array<'in_person' | 'online'>;
  serviceArea: string[];
}

function formOf(d: DirectoryResource): CapacityForm {
  const [from = '08:00', to = '17:00'] = (d.availability?.hours ?? '').split('-').map((x) => x.trim()).filter((x) => /^\d{2}:\d{2}$/.test(x));
  return {
    accepting: isAccepting(d),
    slotsAvailable: d.slotsAvailable ?? 0,
    slotsTotal: Math.max(slotsTotalOf(d), d.slotsAvailable ?? 0),
    from,
    to,
    days: ((d.availability?.days ?? ['mon', 'tue', 'wed', 'thu', 'fri']).filter((x) => (DAYS as readonly string[]).includes(x)) as Day[]),
    modes: d.availability?.modes?.length ? d.availability.modes : ['in_person'],
    serviceArea: d.serviceArea?.length ? d.serviceArea : [d.district],
  };
}

export function PartnerResourcesPage() {
  const { tx, s } = useApp();
  const { resources, referrals, isLoading, error, directory } = usePartnerScope();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const current = resources.find((r) => r.id === selectedId) ?? resources[0];

  const openCount = resources.filter(isAccepting).length;
  const slotsLeft = resources.reduce((n, d) => n + (d.slotsAvailable ?? 0), 0);
  const slotsTotal = resources.reduce((n, d) => n + slotsTotalOf(d), 0);
  const activeCases = referrals.filter((r) => r.stage === 'ACCEPTED' || r.stage === 'ACTION_TAKEN').length;
  const areas = new Set(resources.flatMap((d) => (d.serviceArea?.length ? d.serviceArea : [d.district])));

  return (
    <div>
      <PageHero
        eyebrow={tx({ vi: 'Đối tác', en: 'Partner' })}
        title={tx({ vi: 'Nguồn lực & năng lực tiếp nhận', en: 'Resources & intake capacity' })}
        description={tx({
          vi: 'Cập nhật dịch vụ, số suất và giờ tiếp nhận để hệ thống chỉ gửi đến bạn những người bạn thực sự tiếp nhận được.',
          en: 'Keep services, places and hours current so the system only sends people you can actually take.',
        })}
      />

      <KpiRow>
        <KpiCard icon={<Box className="size-5" />} tone="brand" filled label={tx({ vi: 'Dịch vụ đang mở', en: 'Services open' })} value={openCount} unit={tx({ vi: `/ ${resources.length} dịch vụ`, en: `/ ${resources.length} services` })} />
        <KpiCard icon={<Users className="size-5" />} tone="step" filled label={tx({ vi: 'Suất còn lại tuần này', en: 'Places left this week' })} value={slotsLeft} unit={slotsTotal ? `/ ${slotsTotal} ${tx({ vi: 'suất', en: 'places' })}` : undefined} />
        <KpiCard icon={<CalendarDays className="size-5" />} tone="ai" filled label={tx({ vi: 'Ca đang hỗ trợ', en: 'Cases in support' })} value={activeCases} unit={tx({ vi: 'ca', en: 'cases' })} to="/partner/schedule" />
        <KpiCard icon={<MapPin className="size-5" />} tone="warn" filled label={tx({ vi: 'Khu vực phục vụ', en: 'Service area' })} value={areas.size} unit={tx({ vi: 'quận / huyện', en: 'districts' })} />
      </KpiRow>

      {error && (
        <div className="mb-4">
          <ErrorBanner title={s.common.errorTitle} message={errorMessage(error, s.common.offline)} onRetry={() => directory.refetch()} retryLabel={s.common.retry} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-w-0 gap-4">
          <Panel
            title={tx({ vi: 'Các dịch vụ bạn đang cung cấp', en: 'Services you provide' })}
            action={
              <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
                {tx({ vi: 'Thêm dịch vụ', en: 'Add service' })}
              </Button>
            }
          >
            {isLoading ? (
              <SkeletonCard rows={4} />
            ) : resources.length === 0 ? (
              <EmptyState icon={<Box className="size-6" />} title={tx({ vi: 'Chưa có dịch vụ nào gắn với tổ chức của bạn', en: 'No services linked to your organisation yet' })}>
                {tx({ vi: 'Thêm dịch vụ đầu tiên — điều phối viên sẽ gọi xác minh trước khi hệ thống bắt đầu chuyển gửi.', en: 'Add your first service — a coordinator verifies it before referrals start.' })}
              </EmptyState>
            ) : (
              <ul className="grid gap-2.5">
                {resources.map((d) => (
                  <li key={d.id}>
                    <ServiceRow d={d} selected={current?.id === d.id} onSelect={() => setSelectedId(d.id)} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <WeekSchedule />
        </div>

        <div className="grid h-fit gap-4">
          {current && <CapacityFormPanel key={current.id} resources={resources} current={current} onPick={setSelectedId} />}
          {current && <PublicProfile resources={resources} />}
        </div>
      </div>

      {adding && <AddServiceDialog onClose={() => setAdding(false)} orgName={resources[0]?.organisationName ?? ''} />}
    </div>
  );
}

function ServiceRow({ d, selected, onSelect }: { d: DirectoryResource; selected: boolean; onSelect: () => void }) {
  const { tx } = useApp();
  const accepting = isAccepting(d);
  const toggle = useLoopMutation<{ _id: string } & Omit<CapacityForm, 'from' | 'to'> & { hours: { from: string; to: string } }>((b) => `/directory/${b._id}/capacity`, 'PUT');
  const f = formOf(d);
  const flip = () =>
    toggle.mutate({ _id: d.id, accepting: !accepting, slotsAvailable: f.slotsAvailable, slotsTotal: f.slotsTotal, hours: { from: f.from, to: f.to }, days: f.days, modes: f.modes, serviceArea: f.serviceArea });
  return (
    <div className={cx('rounded-2xl border p-4', selected ? 'border-brand-line bg-brand-soft' : 'border-line')}>
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-step-soft text-step">
          <NeedIcon need={d.category as NeedCategory} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{d.serviceName}</p>
          <p className="line-clamp-2 text-[13.5px] text-muted">{d.description ?? d.organisationName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <button type="button" role="switch" aria-checked={accepting} onClick={flip} disabled={toggle.isPending} aria-label={tx({ vi: 'Bật/tắt tiếp nhận', en: 'Toggle intake' })} className="flex items-center gap-1.5 text-[12.5px] font-semibold">
              <span className={cx('relative h-5 w-9 rounded-full transition-colors', accepting ? 'bg-step' : 'bg-line-strong')}>
                <span className={cx('absolute top-0.5 size-4 rounded-full bg-white transition-all', accepting ? 'left-[18px]' : 'left-0.5')} />
              </span>
              <span className={accepting ? 'text-step' : 'text-muted'}>{accepting ? tx({ vi: 'Đang mở', en: 'Open' }) : tx({ vi: 'Tạm dừng', en: 'Paused' })}</span>
            </button>
            <FreshnessBadge freshness={d.freshness} date={d.verifiedAt} />
          </div>
        </div>
        <button type="button" onClick={onSelect} aria-label={tx({ vi: 'Cập nhật dịch vụ này', en: 'Update this service' })} className="grid size-10 shrink-0 place-items-center rounded-lg text-brand hover:bg-surface">
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
      <dl className="mt-3 grid gap-3 border-t border-line pt-3 text-[13px] sm:grid-cols-[1fr_1.4fr_auto]">
        <div>
          <dt className="mb-1 text-muted">{tx({ vi: 'Phù hợp với', en: 'Suits' })}</dt>
          <dd>
            <Pill tone="brand">{targetGroupLabel(d.targetGroup, tx)}</Pill>
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-muted">{tx({ vi: 'Khu vực phục vụ', en: 'Service area' })}</dt>
          <dd className="flex items-start gap-1.5 text-ink-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            {(d.serviceArea?.length ? d.serviceArea : [d.district]).join(', ')}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-muted">{tx({ vi: 'Suất còn lại', en: 'Places left' })}</dt>
          <dd className="tabular text-[20px] font-extrabold leading-none text-step">
            {d.slotsAvailable ?? 0}
            <span className="text-sm font-semibold text-muted"> / {slotsTotalOf(d)}</span>
          </dd>
        </div>
      </dl>
      {toggle.isError && <p className="mt-2 text-sm text-danger">{toggle.error.message}</p>}
    </div>
  );
}

const TARGET_GROUPS: Record<string, { vi: string; en: string }> = {
  any: { vi: 'Mọi nhóm', en: 'Everyone' },
  youth: { vi: 'Thanh thiếu niên', en: 'Young people' },
  children: { vi: 'Trẻ em', en: 'Children' },
  child: { vi: 'Trẻ em', en: 'Children' },
  elderly: { vi: 'Người cao tuổi', en: 'Older people' },
  women: { vi: 'Phụ nữ', en: 'Women' },
  workers: { vi: 'Người lao động', en: 'Workers' },
  adult: { vi: 'Người trưởng thành', en: 'Adults' },
};

function targetGroupLabel(g: string | null | undefined, tx: (c: { vi: string; en: string }) => string) {
  if (!g) return tx(TARGET_GROUPS.any);
  return g
    .split(/[,;]\s*/)
    .map((x) => (TARGET_GROUPS[x.trim().toLowerCase()] ? tx(TARGET_GROUPS[x.trim().toLowerCase()]) : x.trim()))
    .join(', ');
}

function CapacityFormPanel({ resources, current, onPick }: { resources: DirectoryResource[]; current: DirectoryResource; onPick: (id: string) => void }) {
  const { tx, s } = useApp();
  const [f, setF] = useState<CapacityForm>(() => formOf(current));
  const [saved, setSaved] = useState(false);
  const m = useLoopMutation<{ _id: string; accepting: boolean; slotsAvailable: number; slotsTotal: number; hours: { from: string; to: string }; days: Day[]; modes: CapacityForm['modes']; serviceArea: string[] }>((b) => `/directory/${b._id}/capacity`, 'PUT');
  useEffect(() => setSaved(false), [f]);
  const problems = [
    f.slotsAvailable > f.slotsTotal && tx({ vi: 'Số suất còn lại không được lớn hơn tổng suất tuần', en: 'Places left cannot exceed weekly places' }),
    f.from >= f.to && tx({ vi: 'Giờ mở cửa phải trước giờ đóng cửa', en: 'Opening must be before closing' }),
    f.days.length === 0 && tx({ vi: 'Chọn ít nhất một ngày', en: 'Pick at least one day' }),
    f.modes.length === 0 && tx({ vi: 'Chọn ít nhất một hình thức', en: 'Pick at least one mode' }),
    f.serviceArea.length === 0 && tx({ vi: 'Chọn ít nhất một khu vực', en: 'Pick at least one area' }),
  ].filter(Boolean) as string[];
  const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <Panel title={tx({ vi: 'Cập nhật khả năng tiếp nhận', en: 'Update intake capacity' })}>
      <p className="-mt-1 mb-3 flex items-start gap-1.5 text-[13px] text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        {tx({ vi: 'Áp dụng ngay cho các lần ghép ca tiếp theo. Tạm dừng = không nhận chuyển gửi mới.', en: 'Applies to the next matches immediately. Paused = no new referrals.' })}
      </p>
      <div className="grid gap-4">
        <Field label={tx({ vi: 'Dịch vụ cần cập nhật', en: 'Service' })} htmlFor="cap-svc">
          <Select id="cap-svc" value={current.id} onChange={(e) => onPick(e.target.value)}>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.serviceName}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-1.5">
          <span className="text-[15px] font-semibold text-ink">{tx({ vi: 'Trạng thái tiếp nhận', en: 'Intake status' })}</span>
          <button type="button" role="switch" aria-checked={f.accepting} onClick={() => setF({ ...f, accepting: !f.accepting })} className="flex items-center gap-2 text-sm font-semibold">
            <span className={cx('relative h-6 w-11 rounded-full transition-colors', f.accepting ? 'bg-step' : 'bg-line-strong')}>
              <span className={cx('absolute top-0.5 size-5 rounded-full bg-white transition-all', f.accepting ? 'left-[22px]' : 'left-0.5')} />
            </span>
            {f.accepting ? tx({ vi: 'Đang mở (nhận yêu cầu mới)', en: 'Open for new referrals' }) : tx({ vi: 'Tạm dừng', en: 'Paused' })}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={tx({ vi: 'Suất còn lại tuần này', en: 'Places left this week' })} htmlFor="cap-left">
            <TextInput id="cap-left" type="number" min={0} max={500} value={f.slotsAvailable} onChange={(e) => setF({ ...f, slotsAvailable: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
          <Field label={tx({ vi: 'Tổng suất mỗi tuần', en: 'Weekly places' })} htmlFor="cap-total">
            <TextInput id="cap-total" type="number" min={0} max={500} value={f.slotsTotal} onChange={(e) => setF({ ...f, slotsTotal: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[15px] font-semibold text-ink">{tx({ vi: 'Giờ tiếp nhận', en: 'Intake hours' })}</legend>
          <div className="flex items-center gap-2">
            <Select aria-label={tx({ vi: 'Từ', en: 'From' })} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })}>
              {HOURS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Select>
            <span className="text-muted">–</span>
            <Select aria-label={tx({ vi: 'Đến', en: 'To' })} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}>
              {HOURS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Select>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DAYS.map((d) => (
              <Chip key={d} selected={f.days.includes(d)} onClick={() => setF({ ...f, days: toggleIn(f.days, d) })}>
                {tx(DAY_LABEL[d])}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-[15px] font-semibold text-ink">{tx({ vi: 'Hình thức hỗ trợ', en: 'Support mode' })}</legend>
          {(['in_person', 'online'] as const).map((mode) => (
            <label key={mode} className="flex min-h-[36px] items-center gap-2.5 text-[14px] text-ink-2">
              <input type="checkbox" className="size-[18px] accent-[#075985]" checked={f.modes.includes(mode)} onChange={() => setF({ ...f, modes: toggleIn(f.modes, mode) })} />
              {mode === 'in_person' ? tx({ vi: 'Trực tiếp tại cơ sở', en: 'In person at our site' }) : tx({ vi: 'Trực tuyến / điện thoại', en: 'Online / phone' })}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-[15px] font-semibold text-ink">{tx({ vi: 'Khu vực phục vụ', en: 'Service area' })}</legend>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-line-strong p-2">
            {f.serviceArea.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[13px] font-semibold text-brand-strong">
                {a}
                <button type="button" aria-label={tx({ vi: `Bỏ ${a}`, en: `Remove ${a}` })} onClick={() => setF({ ...f, serviceArea: f.serviceArea.filter((x) => x !== a) })} className="rounded-full hover:bg-surface">
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            ))}
            <select
              aria-label={tx({ vi: 'Thêm khu vực', en: 'Add area' })}
              value=""
              onChange={(e) => e.target.value && setF({ ...f, serviceArea: [...f.serviceArea, e.target.value] })}
              className="min-h-[32px] flex-1 rounded-lg bg-transparent text-[13px] text-muted"
            >
              <option value="">{tx({ vi: '+ Thêm quận/huyện', en: '+ Add district' })}</option>
              {DISTRICTS.filter((d) => !f.serviceArea.includes(d)).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </fieldset>

        {problems.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-danger">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {m.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(m.error, s.common.offline)} />}
        <Button
          block
          size="lg"
          icon={saved ? <CheckCircle2 className="size-5" /> : <Save className="size-5" />}
          loading={m.isPending}
          disabled={problems.length > 0}
          onClick={() =>
            m.mutate(
              { _id: current.id, accepting: f.accepting, slotsAvailable: f.slotsAvailable, slotsTotal: f.slotsTotal, hours: { from: f.from, to: f.to }, days: f.days, modes: f.modes, serviceArea: f.serviceArea },
              { onSuccess: () => setSaved(true) },
            )
          }
        >
          {saved ? tx({ vi: 'Đã lưu', en: 'Saved' }) : tx({ vi: 'Lưu cập nhật', en: 'Save' })}
        </Button>
      </div>
    </Panel>
  );
}

/** Real appointments this week (accepted referrals with an agreed time), bucketed morning / afternoon. */
function WeekSchedule() {
  const { tx, lang } = useApp();
  const { referrals } = usePartnerScope();
  const [offset, setOffset] = useState(0);
  const monday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
    return d;
  }, [offset]);
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86_400_000));
  const count = (day: Date, pm: boolean) =>
    referrals.filter((r) => {
      if (!r.dueAt || !['ACCEPTED', 'ACTION_TAKEN', 'RECEIVED', 'CREATED'].includes(r.stage)) return false;
      const d = new Date(r.dueAt);
      return d.toDateString() === day.toDateString() && (d.getHours() >= 12) === pm;
    }).length;
  const fmt = (d: Date) => d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' });
  const today = new Date().toDateString();

  return (
    <Panel
      title={tx({ vi: 'Lịch tiếp nhận trong tuần', en: 'This week’s appointments' })}
      icon={<CalendarDays className="size-5" />}
      action={
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label={tx({ vi: 'Tuần trước', en: 'Previous week' })} onClick={() => setOffset(offset - 1)} className="grid size-9 place-items-center rounded-lg border border-line hover:bg-sunken">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="tabular text-sm font-semibold text-ink-2">
            {fmt(days[0])} – {fmt(days[6])}
          </span>
          <button type="button" aria-label={tx({ vi: 'Tuần sau', en: 'Next week' })} onClick={() => setOffset(offset + 1)} className="grid size-9 place-items-center rounded-lg border border-line hover:bg-sunken">
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <Link to="/partner/schedule" className="ml-2 text-sm font-semibold text-brand hover:underline">
            {tx({ vi: 'Xem lịch chi tiết', en: 'Full schedule' })}
          </Link>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-1 text-center text-[13px]">
          <thead>
            <tr>
              <th className="w-[90px]" />
              {days.map((d, i) => (
                <th key={i} className={cx('rounded-lg py-1.5 font-semibold', d.toDateString() === today ? 'bg-brand-soft text-brand-strong' : 'text-ink-2')}>
                  {tx(DAY_LABEL[DAYS[i]])}
                  <span className="block text-xs font-normal text-muted">{fmt(d)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[false, true].map((pm) => (
              <tr key={String(pm)}>
                <th scope="row" className="text-left font-semibold text-ink-2">
                  {pm ? tx({ vi: 'Chiều', en: 'Afternoon' }) : tx({ vi: 'Sáng', en: 'Morning' })}
                </th>
                {days.map((d, i) => {
                  const n = count(d, pm);
                  return (
                    <td key={i} className={cx('rounded-lg py-3 font-semibold', n ? 'bg-step-soft text-step' : 'bg-sunken text-muted')}>
                      {n ? tx({ vi: `${n} ca`, en: `${n}` }) : '–'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PublicProfile({ resources }: { resources: DirectoryResource[] }) {
  const { tx } = useApp();
  const org = resources[0];
  const areas = new Set(resources.flatMap((d) => (d.serviceArea?.length ? d.serviceArea : [d.district])));
  return (
    <Panel title={tx({ vi: 'Hồ sơ hiển thị trong hệ thống kết nối', en: 'How navigators see you' })} action={<Link to="/directory" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"><ExternalLink className="size-4" aria-hidden />{tx({ vi: 'Danh bạ', en: 'Directory' })}</Link>}>
      <p className="font-bold text-ink">{org.organisationName}</p>
      <p className="text-sm text-muted">{org.district}</p>
      <p className="mt-2 text-[14px] text-ink-2">{resources.map((r) => r.serviceName).join(' · ')}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
        <Pill tone="step">{tx({ vi: `${resources.filter(isAccepting).length} dịch vụ đang mở`, en: `${resources.filter(isAccepting).length} open` })}</Pill>
        <Pill tone="brand">{tx({ vi: `${resources.reduce((n, d) => n + (d.slotsAvailable ?? 0), 0)} suất còn lại`, en: `${resources.reduce((n, d) => n + (d.slotsAvailable ?? 0), 0)} places` })}</Pill>
        <Pill tone="warn">{tx({ vi: `${areas.size} khu vực`, en: `${areas.size} areas` })}</Pill>
      </div>
    </Panel>
  );
}

const CATEGORIES: NeedCategory[] = ['employment', 'training', 'health', 'legal', 'documents', 'shelter', 'food', 'social_assistance'];

function AddServiceDialog({ onClose, orgName }: { onClose: () => void; orgName: string }) {
  const { tx, s } = useApp();
  const [f, setF] = useState({ organisationName: orgName, serviceName: '', category: 'social_assistance' as NeedCategory, district: 'Quận 12', description: '', phone: '' });
  const m = useLoopMutation<typeof f & { serviceArea: string[] }>('/directory');
  const valid = f.organisationName.trim().length >= 2 && f.serviceName.trim().length >= 2;
  return (
    <Dialog
      open
      onClose={onClose}
      title={tx({ vi: 'Thêm dịch vụ', en: 'Add a service' })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {s.common.cancel}
          </Button>
          <Button disabled={!valid} loading={m.isPending} onClick={() => m.mutate({ ...f, serviceArea: [f.district] }, { onSuccess: onClose })}>
            {tx({ vi: 'Gửi để xác minh', en: 'Submit for verification' })}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <p className="rounded-xl bg-brand-soft px-3 py-2.5 text-[14px] text-ink-2">
          {tx({ vi: 'Dịch vụ mới ở trạng thái “chưa xác minh”. Điều phối viên sẽ gọi xác nhận trước khi hệ thống gợi ý dịch vụ này cho người cần hỗ trợ.', en: 'New services start unverified. A coordinator calls to confirm before the system suggests it to anyone.' })}
        </p>
        <Field label={tx({ vi: 'Tên tổ chức', en: 'Organisation' })} htmlFor="as-org">
          <TextInput id="as-org" value={f.organisationName} onChange={(e) => setF({ ...f, organisationName: e.target.value })} />
        </Field>
        <Field label={tx({ vi: 'Tên dịch vụ', en: 'Service name' })} htmlFor="as-name">
          <TextInput id="as-name" value={f.serviceName} onChange={(e) => setF({ ...f, serviceName: e.target.value })} placeholder={tx({ vi: 'VD: Tư vấn tâm lý', en: 'e.g. Counselling' })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tx({ vi: 'Loại hỗ trợ', en: 'Type' })} htmlFor="as-cat">
            <Select id="as-cat" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as NeedCategory })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {s.need[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tx({ vi: 'Quận/huyện', en: 'District' })} htmlFor="as-dist">
            <Select id="as-dist" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })}>
              {DISTRICTS.filter((d) => d !== 'Toàn thành phố').map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={tx({ vi: 'Mô tả ngắn', en: 'Short description' })} htmlFor="as-desc" optionalLabel={s.common.optional}>
          <TextInput id="as-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        {m.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(m.error, s.common.offline)} />}
      </div>
    </Dialog>
  );
}
