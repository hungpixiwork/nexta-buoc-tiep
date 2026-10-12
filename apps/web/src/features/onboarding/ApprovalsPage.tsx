import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Button, Card, Chip, Dialog, EmptyState, ErrorBanner, Field, PageHeader, Spinner, TextArea, cx } from '../../design/ui';
import { fmtDate, fmtDateTime, isOverdue } from '../../lib/format';
import { useApiMutation } from '../../lib/hooks';
import { useAdminApplication, useAdminApplications, type Application, type ScreeningCheck } from './data';
import { statusTone, useStatusLabel } from './MemberPages';

const CHECK_LABEL: Record<string, { vi: string; en: string }> = {
  AGREEMENTS_SIGNED: { vi: 'Đã ký đủ cam kết bắt buộc', en: 'All required agreements signed' },
  IN_PILOT_AREA: { vi: 'Thuộc địa bàn pilot', en: 'Within the pilot area' },
  DUPLICATE_ORG: { vi: 'Không trùng tổ chức đã có', en: 'Not a duplicate organisation' },
  DUPLICATE_CONTACT: { vi: 'Không trùng email/SĐT đã có', en: 'Contact not already registered' },
  PUBLIC_SOURCE: { vi: 'Có trang công khai để đối chiếu', en: 'Public page to cross-check' },
  OFFICIAL_DOMAIN: { vi: 'Tên miền chính thức (.gov.vn/.edu.vn/.org…)', en: 'Official domain (.gov.vn/.edu.vn/.org…)' },
  EMAIL_MATCHES_WEBSITE: { vi: 'Email cùng tên miền website', en: 'Email matches website domain' },
  LEGAL_FORM: { vi: 'Loại hình pháp lý phù hợp', en: 'Suitable legal form' },
  NO_SCAM_LANGUAGE: { vi: 'Không có mẫu ngôn ngữ lừa đảo', en: 'No scam language' },
  FEE_FREE: { vi: 'Miễn phí cho người được giới thiệu', en: 'Free for referred people' },
  NO_CHILD_EMPLOYMENT: { vi: 'Không có việc làm nhắm trẻ em', en: 'No employment aimed at children' },
  ADULT: { vi: 'Từ 18 tuổi', en: 'Aged 18+' },
  REFERENCE_GIVEN: { vi: 'Có người tham chiếu', en: 'Reference provided' },
  SAFEGUARDING_DECLARATION: { vi: 'Không khai báo vấn đề an toàn', en: 'No safeguarding concern declared' },
  MOTIVATION: { vi: 'Động lực rõ ràng', en: 'Clear motivation' },
  AVAILABILITY: { vi: 'Đủ thời gian (≥3 giờ/tuần)', en: 'Enough time (≥3h/week)' },
  DATA_PROTECTION_LEAD: { vi: 'Có đầu mối bảo vệ dữ liệu', en: 'Data-protection lead named' },
  SAFEGUARDING_LEAD: { vi: 'Có cán bộ bảo vệ an toàn riêng', en: 'Separate safeguarding lead' },
  PURPOSE_STATED: { vi: 'Nêu rõ mục đích', en: 'Purpose stated' },
};

function RecBadge({ rec }: { rec: Application['recommendation'] }) {
  const { tx } = useApp();
  if (rec === 'HIGH_RISK') return <Badge tone="danger" icon={<AlertTriangle className="size-3.5" />}>{tx({ vi: 'Rủi ro cao', en: 'High risk' })}</Badge>;
  if (rec === 'REVIEW') return <Badge tone="warn">{tx({ vi: 'Cần xem kỹ', en: 'Review' })}</Badge>;
  return <Badge tone="step">{tx({ vi: 'Đủ điều kiện xét nhanh', en: 'Fast review' })}</Badge>;
}

function CheckRow({ c }: { c: ScreeningCheck }) {
  const { lang } = useApp();
  const icon = c.result === 'PASS' ? <CheckCircle2 className="size-5 text-step" /> : c.result === 'WARN' ? <AlertTriangle className="size-5 text-warn" /> : <XCircle className="size-5 text-danger" />;
  return (
    <li className="flex items-start gap-3 py-2">
      <span className="mt-0.5 shrink-0" aria-label={c.result}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-ink">{CHECK_LABEL[c.code]?.[lang] ?? c.code}</span>
        {c.evidence && <span className="block break-words text-sm text-muted">{c.evidence}</span>}
      </span>
    </li>
  );
}

function Kv({ k, v }: { k: string; v: ReactNode }) {
  if (v === null || v === undefined || v === '') return null;
  return (
    <div className="grid gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-muted">{k}</dt>
      <dd className="break-words text-[15px] text-ink">{v}</dd>
    </div>
  );
}

function PayloadView({ app }: { app: Application }) {
  const { tx, s } = useApp();
  const p = app.payload ?? {};
  if (app.kind === 'VOLUNTEER') {
    return (
      <dl className="space-y-2">
        <Kv k={tx({ vi: 'Họ tên', en: 'Name' })} v={p.fullName} />
        <Kv k={tx({ vi: 'Năm sinh', en: 'Born' })} v={p.birthYear} />
        <Kv k={tx({ vi: 'Khu vực', en: 'Area' })} v={[p.ward, p.district].filter(Boolean).join(', ')} />
        <Kv k={tx({ vi: 'Thời gian', en: 'Availability' })} v={`${p.availability?.hoursPerWeek}h/${tx({ vi: 'tuần', en: 'week' })} · ${[p.availability?.weekdays && tx({ vi: 'ngày thường', en: 'weekdays' }), p.availability?.weekends && tx({ vi: 'cuối tuần', en: 'weekends' })].filter(Boolean).join(', ')}`} />
        <Kv k={tx({ vi: 'Động lực', en: 'Motivation' })} v={p.motivation} />
        <Kv k={tx({ vi: 'Kinh nghiệm', en: 'Experience' })} v={p.experience} />
        <Kv k={tx({ vi: 'Tham chiếu', en: 'Reference' })} v={p.reference && `${p.reference.name} (${p.reference.relation}) · ${p.reference.contact}`} />
        <Kv k={tx({ vi: 'Khai báo an toàn', en: 'Safeguarding' })} v={p.safeguardingDeclaration?.priorConcern ? `⚠ ${p.safeguardingDeclaration.details ?? ''}` : '—'} />
      </dl>
    );
  }
  return (
    <dl className="space-y-2">
      <Kv k={tx({ vi: 'Tổ chức', en: 'Organisation' })} v={p.org?.legalName} />
      <Kv k={tx({ vi: 'Loại hình', en: 'Legal form' })} v={p.org?.legalForm} />
      <Kv k={tx({ vi: 'Số QĐ/ĐK', en: 'Registration' })} v={p.org?.registrationRef} />
      <Kv k={tx({ vi: 'Địa chỉ', en: 'Address' })} v={[p.org?.address, p.org?.district].filter(Boolean).join(', ')} />
      <Kv k="Website" v={p.org?.website && <a className="text-brand-strong underline" href={p.org.website} target="_blank" rel="noreferrer">{p.org.website}</a>} />
      <Kv k={tx({ vi: 'Trang đối chiếu', en: 'Source page' })} v={p.org?.publicSourceUrl && <a className="text-brand-strong underline" href={p.org.publicSourceUrl} target="_blank" rel="noreferrer">{p.org.publicSourceUrl}</a>} />
      <Kv k={tx({ vi: 'Liên hệ', en: 'Contact' })} v={(p.contact || p.representative) && `${(p.contact ?? p.representative).fullName} · ${(p.contact ?? p.representative).title} · ${p.contact?.phone ?? ''}`} />
      <Kv k={tx({ vi: 'Đầu mối dữ liệu', en: 'Data lead' })} v={p.dpoContact && `${p.dpoContact.fullName} · ${p.dpoContact.email}`} />
      <Kv k={tx({ vi: 'Đầu mối an toàn', en: 'Safeguarding lead' })} v={p.safeguardingContact && `${p.safeguardingContact.fullName} · ${p.safeguardingContact.phone}`} />
      <Kv k="Pilot" v={p.pilot && `${p.pilot.areas.join(', ')} · ${p.pilot.expectedNavigators} Navigator · ${p.pilot.startMonth}`} />
      <Kv k={tx({ vi: 'Mục đích', en: 'Purpose' })} v={p.purpose} />
      {Array.isArray(p.services) && (
        <div className="pt-2">
          <p className="mb-2 text-sm font-semibold text-muted">{tx({ vi: 'Dịch vụ đăng ký', en: 'Services' })}</p>
          <ul className="space-y-2">
            {p.services.map((sv: any, i: number) => (
              <li key={i} className="rounded-xl bg-sunken p-3 text-sm">
                <p className="font-semibold text-ink">{sv.serviceName} <Badge tone="brand" className="ml-1">{(s.need as Record<string, string>)[sv.category] ?? sv.category}</Badge></p>
                <p className="mt-1 text-ink-2">{sv.description}</p>
                <p className="mt-1 text-muted">{sv.serviceArea?.join(', ')} · {sv.hours ?? ''} · {sv.feeFree ? tx({ vi: 'miễn phí', en: 'free' }) : tx({ vi: 'có phí', en: 'fee' })} · {sv.capacityPerWeek ?? '?'} /{tx({ vi: 'tuần', en: 'wk' })}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </dl>
  );
}

function Detail({ id }: { id: string }) {
  const { tx, s, lang, role } = useApp();
  const d = useAdminApplication(id);
  const [dialog, setDialog] = useState<null | 'approve' | 'request_info' | 'reject' | 'suspend' | 'reinstate'>(null);
  const [note, setNote] = useState('');
  const decide = useApiMutation<{ decision: string; note?: string }>(`/api/v1/admin/applications/${id}/decision`);
  const label = useStatusLabel();
  if (d.isLoading) return <Spinner label={s.common.loading} />;
  if (d.error || !d.data) return <ErrorBanner title={s.common.errorTitle} message={errorText(d.error, lang)} />;
  const a = d.data.application;
  const sc = a.screening;
  const actions: Array<{ k: NonNullable<typeof dialog>; label: string; variant: 'step' | 'secondary' | 'danger' }> =
    a.status === 'SCREENED'
      ? [
          { k: 'approve', label: tx({ vi: 'Duyệt', en: 'Approve' }), variant: 'step' },
          { k: 'request_info', label: tx({ vi: 'Yêu cầu bổ sung', en: 'Request info' }), variant: 'secondary' },
          { k: 'reject', label: tx({ vi: 'Từ chối', en: 'Reject' }), variant: 'danger' },
        ]
      : a.status === 'APPROVED'
        ? [{ k: 'suspend', label: tx({ vi: 'Tạm ngưng', en: 'Suspend' }), variant: 'danger' }]
        : a.status === 'SUSPENDED'
          ? [{ k: 'reinstate', label: tx({ vi: 'Khôi phục', en: 'Reinstate' }), variant: 'secondary' }]
          : [];
  const needsNote = dialog && dialog !== 'approve' && dialog !== 'reinstate';

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="tabular text-sm font-bold text-muted">{a.code}</p>
          <Badge tone={statusTone(a.status)}>{label(a.status)}</Badge>
          {a.recommendation && <RecBadge rec={a.recommendation} />}
          {sc && <Badge>{sc.score}/100</Badge>}
        </div>
        <p className="mt-2 text-sm text-muted">{a.email} · {fmtDateTime(a.createdAt, lang)}</p>
        {actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            {actions.map((x) => (
              <Button key={x.k} variant={x.variant} onClick={() => (setNote(''), setDialog(x.k))}>
                {x.label}
              </Button>
            ))}
          </div>
        )}
        {role === 'host' && a.kind !== 'VOLUNTEER' && <p className="mt-2 text-sm text-muted">{tx({ vi: 'Chỉ Điều phối NEXTA duyệt loại hồ sơ này.', en: 'Only NEXTA coordinators decide this kind.' })}</p>}
      </Card>

      {sc && (
        <Card className="p-5">
          <h3 className="font-bold text-ink">{tx({ vi: 'Hệ thống đã tự kiểm tra', en: 'Automatic screening' })}</h3>
          <p className="text-sm text-muted">{tx({ vi: 'Máy chỉ xếp thứ tự và chỉ ra điểm cần xem — người duyệt quyết định.', en: 'The machine orders the queue and points out what to check — you decide.' })}</p>
          <ul className="mt-2 divide-y divide-line">{[...sc.checks].sort((x, y) => ['FAIL', 'WARN', 'PASS'].indexOf(x.result) - ['FAIL', 'WARN', 'PASS'].indexOf(y.result)).map((c) => <CheckRow key={c.code} c={c} />)}</ul>
          {sc.missingInfo.length > 0 && <p className="mt-2 text-sm text-warn">{tx({ vi: 'Nên hỏi thêm:', en: 'Worth asking for:' })} {sc.missingInfo.join(', ')}</p>}
        </Card>
      )}

      <Card className="p-5">
        <h3 className="mb-3 font-bold text-ink">{tx({ vi: 'Nội dung hồ sơ', en: 'Application' })}</h3>
        <PayloadView app={a} />
      </Card>

      <Card className="p-5">
        <h3 className="mb-2 font-bold text-ink">{tx({ vi: 'Cam kết đã ký điện tử', en: 'Signed agreements' })}</h3>
        <ul className="space-y-1 text-sm">
          {d.data.acceptances.map((x) => (
            <li key={x.code} className="flex flex-wrap gap-x-2 text-ink-2">
              <CheckCircle2 className="size-4 text-step" aria-hidden /> <strong>{x.code}</strong> v{x.version} · {x.signerName}{x.signerTitle ? ` (${x.signerTitle})` : ''} · {fmtDateTime(x.acceptedAt, lang)}
            </li>
          ))}
        </ul>
        <h3 className="mb-2 mt-5 font-bold text-ink">{tx({ vi: 'Nhật ký', en: 'History' })}</h3>
        <ol className="space-y-1 text-sm text-ink-2">
          {d.data.events.map((e, i) => (
            <li key={i}>{fmtDateTime(e.createdAt, lang)} · {e.fromStatus ?? '—'} → <strong>{e.toStatus}</strong> · {e.actorName}{e.note ? ` — ${e.note}` : ''}</li>
          ))}
        </ol>
      </Card>

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={actions.find((x) => x.k === dialog)?.label ?? ''}
        closeLabel={s.common.cancel}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>{s.common.cancel}</Button>
            <Button
              variant={dialog === 'approve' ? 'step' : dialog === 'reinstate' ? 'primary' : 'danger'}
              disabled={Boolean(needsNote) && note.trim().length < 3}
              loading={decide.isPending}
              onClick={async () => {
                await decide.mutateAsync({ decision: dialog!, note: note.trim() || undefined });
                setDialog(null);
              }}
            >
              {s.common.confirm}
            </Button>
          </>
        }
      >
        {dialog === 'approve' && (
          <p className="mb-3 text-[15px] text-muted">
            {a.kind === 'PARTNER'
              ? tx({ vi: 'Dịch vụ của đối tác sẽ vào danh bạ ở trạng thái "Chưa xác nhận" — vẫn cần một cuộc gọi xác minh trước khi được giới thiệu.', en: 'The partner’s services enter the directory as "Unconfirmed" — a verification call is still needed before referrals.' })
              : a.kind === 'VOLUNTEER'
                ? tx({ vi: 'Tình nguyện viên chuyển sang giai đoạn đào tạo; chỉ mở hành trình sau khi đạt 4 học phần.', en: 'The volunteer moves to training; journeys unlock after passing all four modules.' })
                : tx({ vi: 'Tài khoản sẽ được cấp quyền tương ứng.', en: 'The account gets the matching role.' })}
          </p>
        )}
        <Field label={needsNote ? tx({ vi: 'Lý do (người đăng ký sẽ thấy)', en: 'Reason (the applicant sees it)' }) : tx({ vi: 'Ghi chú', en: 'Note' })} htmlFor="decision-note" optionalLabel={needsNote ? undefined : s.common.optional}>
          <TextArea id="decision-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </Field>
        {decide.error && <div className="mt-3"><ErrorBanner title={s.common.errorTitle} message={errorText(decide.error, lang)} /></div>}
      </Dialog>
    </div>
  );
}

export function ApprovalsPage() {
  const { tx, s, lang, role } = useApp();
  const [kind, setKind] = useState<string | undefined>(role === 'host' ? 'VOLUNTEER' : undefined);
  const [selected, setSelected] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const list = useAdminApplications(kind);
  const label = useStatusLabel();
  const detailRef = useRef<HTMLDivElement>(null);
  const items = (list.data ?? []).filter((a) => showDone || ['SCREENED', 'NEEDS_INFO', 'SUBMITTED'].includes(a.status));
  useEffect(() => {
    if (!selected && items[0]) setSelected(items[0].id);
  }, [items, selected]);

  const kinds: Array<[string | undefined, string]> =
    role === 'host'
      ? [['VOLUNTEER', 'Youth Navigator']]
      : [
          [undefined, tx({ vi: 'Tất cả', en: 'All' })],
          ['PARTNER', s.roles.partner],
          ['VOLUNTEER', 'Youth Navigator'],
          ['HOST', s.roles.host],
          ['OBSERVER', s.roles.observer],
        ];

  return (
    <>
      <PageHeader
        eyebrow={role === 'host' ? s.roles.host : s.roles.coordinator}
        title={s.nav.approvals}
        description={tx({ vi: 'Hồ sơ rủi ro cao lên đầu, sau đó theo hạn phản hồi. Mọi quyết định được ghi tên và lý do.', en: 'High-risk first, then by due date. Every decision is recorded with a name and reason.' })}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {kinds.map(([k, l]) => (
          <Chip key={l} selected={kind === k} onClick={() => (setKind(k), setSelected(null))}>{l}</Chip>
        ))}
        <label className="ml-auto flex min-h-[40px] items-center gap-2 text-sm font-medium text-ink-2">
          <input type="checkbox" className="size-5" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          {tx({ vi: 'Hiện cả hồ sơ đã xử lý', en: 'Show decided' })}
        </label>
      </div>
      {list.isLoading && <Spinner label={s.common.loading} />}
      {list.error && <ErrorBanner title={s.common.errorTitle} message={errorText(list.error, lang)} onRetry={() => list.refetch()} retryLabel={s.common.retry} />}
      {list.data && items.length === 0 && !selected && <EmptyState icon={<ClipboardCheck className="size-6" />} title={tx({ vi: 'Không có hồ sơ chờ duyệt', en: 'Nothing waiting for review' })} />}
      {(items.length > 0 || selected) && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ul className="space-y-2">
            {items.length === 0 && <li className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">{tx({ vi: 'Hàng đợi đã trống.', en: 'The queue is empty.' })}</li>}
            {items.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(a.id);
                    if (window.innerWidth < 1024) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                  className={cx('card w-full p-4 text-left transition-colors', selected === a.id ? 'border-2 border-brand' : 'hover:border-line-strong')}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink">{a.displayName ?? a.email}</span>
                    {a.recommendation && <RecBadge rec={a.recommendation} />}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    <span>{{ PARTNER: s.roles.partner, VOLUNTEER: 'Navigator', HOST: s.roles.host, OBSERVER: s.roles.observer }[a.kind]}</span>
                    <span className="tabular">{a.code}</span>
                    <Badge tone={statusTone(a.status)}>{label(a.status)}</Badge>
                    <span className={cx('inline-flex items-center gap-1', isOverdue(a.slaDueAt) && ['SCREENED', 'NEEDS_INFO'].includes(a.status) && 'font-semibold text-danger')}>
                      <Clock className="size-3.5" aria-hidden />
                      {fmtDate(a.slaDueAt, lang)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div ref={detailRef} className="min-w-0">{selected && <Detail id={selected} />}</div>
        </div>
      )}
    </>
  );
}
