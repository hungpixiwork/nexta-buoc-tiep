import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HandCoins, Info, Landmark, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, PageHeader, SectionTitle, Select, Spinner, Stat, TextInput, cx } from '../../design/ui';
import { fmtDate } from '../../lib/format';
import { useApiMutation } from '../../lib/hooks';
import { fmtVnd, useLedger, usePrivacyRequests, useTransparency } from './data';

const CATEGORIES: Array<[string, { vi: string; en: string }, 'IN' | 'OUT']> = [
  ['NAVIGATOR_STIPEND', { vi: 'Hỗ trợ Navigator', en: 'Navigator stipends' }, 'OUT'],
  ['TRAVEL_COMMS', { vi: 'Đi lại & liên lạc', en: 'Travel & phone' }, 'OUT'],
  ['INSURANCE', { vi: 'Bảo hiểm tình nguyện viên', en: 'Volunteer insurance' }, 'OUT'],
  ['TRAINING', { vi: 'Đào tạo', en: 'Training' }, 'OUT'],
  ['COORDINATION', { vi: 'Điều phối', en: 'Coordination' }, 'OUT'],
  ['TECHNOLOGY', { vi: 'Công nghệ', en: 'Technology' }, 'OUT'],
  ['PRINTING', { vi: 'In ấn', en: 'Printing' }, 'OUT'],
  ['EMERGENCY_FUND', { vi: 'Quỹ khẩn cấp', en: 'Emergency fund' }, 'OUT'],
  ['GRANT', { vi: 'Tài trợ', en: 'Grant' }, 'IN'],
  ['IN_KIND', { vi: 'Hiện vật / pro bono (quy đổi)', en: 'In-kind (valued)' }, 'IN'],
  ['SERVICE_CONTRACT', { vi: 'Hợp đồng dịch vụ với đơn vị chủ trì', en: 'Host service contract' }, 'IN'],
  ['OTHER', { vi: 'Khác', en: 'Other' }, 'OUT'],
];
const catLabel = (c: string, lang: 'vi' | 'en') => CATEGORIES.find((x) => x[0] === c)?.[1][lang] ?? c;

export function FinancePage() {
  const { tx, s, lang } = useApp();
  const ledger = useLedger();
  const dsr = usePrivacyRequests();
  const add = useApiMutation<Record<string, unknown>>('/api/v1/admin/ledger');
  const resolve = useApiMutation<{ _id: string; resolution: string }>((b) => `/api/v1/admin/privacy/requests/${b._id}/resolve`);
  const [f, setF] = useState({ month: new Date().toISOString().slice(0, 7), direction: 'OUT', category: 'TRAVEL_COMMS', amount: '', counterparty: '', evidenceRef: '', note: '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <>
      <PageHeader
        eyebrow={s.roles.coordinator}
        title={tx({ vi: 'Sổ thu – chi & quyền dữ liệu', en: 'Ledger & data rights' })}
        description={tx({ vi: 'Mọi khoản thu – chi đi qua tài khoản của đơn vị chủ trì/bảo trợ; ở đây chỉ ghi sổ và chứng từ tham chiếu để công khai tổng hợp.', en: 'All money flows through the host/sponsor account; this records entries and evidence references for public aggregate reporting.' })}
        actions={<Link to="/transparency"><Button variant="secondary">{s.nav.transparency}</Button></Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="p-5">
          <SectionTitle>{tx({ vi: 'Ghi một khoản', en: 'Record an entry' })}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tx({ vi: 'Tháng', en: 'Month' })} htmlFor="l-month"><TextInput id="l-month" type="month" value={f.month} onChange={set('month')} /></Field>
            <Field label={tx({ vi: 'Loại', en: 'Direction' })} htmlFor="l-dir">
              <Select id="l-dir" value={f.direction} onChange={(e) => setF((x) => ({ ...x, direction: e.target.value, category: CATEGORIES.find((c) => c[2] === e.target.value)![0] }))}>
                <option value="OUT">{tx({ vi: 'Chi', en: 'Spend' })}</option>
                <option value="IN">{tx({ vi: 'Thu', en: 'Income' })}</option>
              </Select>
            </Field>
            <Field label={tx({ vi: 'Hạng mục', en: 'Category' })} htmlFor="l-cat">
              <Select id="l-cat" value={f.category} onChange={set('category')}>
                {CATEGORIES.filter((c) => c[2] === f.direction || c[0] === 'OTHER').map(([k, l]) => <option key={k} value={k}>{l[lang]}</option>)}
              </Select>
            </Field>
            <Field label={tx({ vi: 'Số tiền (₫)', en: 'Amount (₫)' })} htmlFor="l-amt"><TextInput id="l-amt" inputMode="numeric" value={f.amount} onChange={(e) => setF((x) => ({ ...x, amount: e.target.value.replace(/\D/g, '') }))} /></Field>
            <Field label={tx({ vi: 'Đối tác / người nhận', en: 'Counterparty' })} htmlFor="l-cp" optionalLabel={s.common.optional}><TextInput id="l-cp" value={f.counterparty} onChange={set('counterparty')} /></Field>
            <Field label={tx({ vi: 'Số chứng từ', en: 'Evidence ref.' })} htmlFor="l-ev" hint={tx({ vi: 'Phiếu chi, sao kê, hợp đồng…', en: 'Voucher, statement, contract…' })}><TextInput id="l-ev" value={f.evidenceRef} onChange={set('evidenceRef')} /></Field>
          </div>
          {add.error && <div className="mt-3"><ErrorBanner title={s.common.errorTitle} message={errorText(add.error, lang)} /></div>}
          <div className="mt-4 flex justify-end">
            <Button
              disabled={!f.amount || f.evidenceRef.trim().length < 2}
              loading={add.isPending}
              onClick={async () => {
                await add.mutateAsync({ month: f.month, direction: f.direction, category: f.category, amountVnd: Number(f.amount), counterparty: f.counterparty.trim() || null, evidenceRef: f.evidenceRef.trim(), note: f.note.trim() || null });
                setF((x) => ({ ...x, amount: '', counterparty: '', evidenceRef: '' }));
              }}
            >
              {s.common.save}
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle>{tx({ vi: 'Sổ gần đây', en: 'Recent entries' })}</SectionTitle>
          {ledger.isLoading && <Spinner label={s.common.loading} />}
          {ledger.data?.length === 0 && <EmptyState icon={<HandCoins className="size-6" />} title={tx({ vi: 'Chưa có khoản nào', en: 'No entries yet' })} />}
          <ul className="divide-y divide-line">
            {ledger.data?.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="tabular w-16 text-muted">{e.month}</span>
                <span className="min-w-0 flex-1 text-ink">{catLabel(e.category, lang)}{e.counterparty ? ` · ${e.counterparty}` : ''}</span>
                <span className={cx('tabular font-bold', e.direction === 'IN' ? 'text-step' : 'text-ink')}>{e.direction === 'IN' ? '+' : '−'}{fmtVnd(e.amountVnd, lang)}</span>
                <Badge className="text-xs">{e.evidenceRef}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <SectionTitle hint={tx({ vi: 'Hạn xử lý 10 ngày làm việc', en: 'Due within 10 working days' })}>{tx({ vi: 'Yêu cầu về dữ liệu cá nhân', en: 'Data-subject requests' })}</SectionTitle>
        {dsr.data?.length === 0 && <p className="text-sm text-muted">{s.common.none}</p>}
        <ul className="space-y-2">
          {dsr.data?.map((r) => (
            <li key={r.id} className="rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={r.status === 'OPEN' ? 'warn' : 'step'}>{r.kind}</Badge>
                <span className="text-sm text-muted">{r.caseAlias ?? r.email ?? '—'} · {tx({ vi: 'hạn', en: 'due' })} {fmtDate(r.dueAt, lang)}</span>
              </div>
              <p className="mt-1 text-[15px] text-ink">{r.details}</p>
              {r.status === 'OPEN' ? (
                <Button className="mt-2" size="sm" variant="secondary" loading={resolve.isPending} onClick={() => { const res = window.prompt(tx({ vi: 'Đã xử lý thế nào?', en: 'How was it resolved?' })); if (res && res.trim().length >= 5) resolve.mutate({ _id: r.id, resolution: res.trim() }); }}>
                  {tx({ vi: 'Đánh dấu đã xử lý', en: 'Mark resolved' })}
                </Button>
              ) : (
                <p className="mt-1 text-sm text-step">✓ {r.resolution}</p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

export function TransparencyPage() {
  const { tx, s, lang } = useApp();
  const t = useTransparency();
  if (t.isLoading) return <Spinner label={s.common.loading} />;
  if (t.error || !t.data) return <ErrorBanner title={s.common.errorTitle} message={errorText(t.error, lang)} />;
  const d = t.data;
  const months = Array.from(new Set(d.ledger.map((l) => l.month))).sort().reverse();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={s.nav.transparency}
        title={tx({ vi: 'Tiền đi đâu, tạo ra bao nhiêu bước tiếp?', en: 'Where does the money go, and what does it achieve?' })}
        description={tx({ vi: 'Số liệu tổng hợp, cập nhật trực tiếp. Không có dữ liệu cá nhân.', en: 'Live aggregate figures. No personal data.' })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={tx({ vi: 'Tổng thu', en: 'Total income' })} value={fmtVnd(d.totals.inVnd, lang)} />
        <Stat label={tx({ vi: 'Tổng chi', en: 'Total spend' })} value={fmtVnd(d.totals.outVnd, lang)} />
        <Stat label={tx({ vi: 'Hành trình khép vòng', en: 'Closed-loop journeys' })} value={d.journeysClosedLoop} hint={`Safe Next Step Rate ${d.safeNextStepRate}%`} />
        <Stat emphasis label={tx({ vi: 'Chi phí / Bước tiếp an toàn', en: 'Cost per Safe Next Step' })} value={d.costPerSafeNextStepVnd == null ? '—' : fmtVnd(d.costPerSafeNextStepVnd, lang)} hint={tx({ vi: 'Tổng chi ÷ hành trình khép vòng', en: 'Total spend ÷ closed loops' })} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat label={tx({ vi: 'Đối tác đang hoạt động', en: 'Active partners' })} value={d.activeOrgs.PARTNER ?? 0} />
        <Stat label={tx({ vi: 'Đơn vị chủ trì', en: 'Host organisations' })} value={d.activeOrgs.HOST ?? 0} />
        <Stat label="Youth Navigators" value={d.activeNavigators} />
      </div>

      <Card className="mt-6 p-5">
        <SectionTitle>{tx({ vi: 'Theo tháng', en: 'By month' })}</SectionTitle>
        {months.length === 0 ? (
          <p className="text-sm text-muted">{tx({ vi: 'Chưa có khoản thu – chi nào được ghi sổ.', en: 'No income or spending recorded yet.' })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr className="border-b border-line text-muted"><th className="py-2">{tx({ vi: 'Tháng', en: 'Month' })}</th><th>{tx({ vi: 'Hạng mục', en: 'Category' })}</th><th className="text-right">{tx({ vi: 'Số tiền', en: 'Amount' })}</th></tr></thead>
              <tbody>
                {months.flatMap((m) =>
                  d.ledger.filter((l) => l.month === m).map((l) => (
                    <tr key={`${m}-${l.direction}-${l.category}`} className="border-b border-line">
                      <td className="tabular py-2 text-muted">{m}</td>
                      <td className="text-ink">{catLabel(l.category, lang)}</td>
                      <td className={cx('tabular text-right font-semibold', l.direction === 'IN' ? 'text-step' : 'text-ink')}>{l.direction === 'IN' ? '+' : '−'}{fmtVnd(l.totalVnd, lang)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { icon: <Landmark className="size-5" />, t: tx({ vi: 'Không nhận tiền qua ứng dụng', en: 'No money through the app' }), d: tx({ vi: 'Tài trợ đi vào tài khoản của đơn vị chủ trì/bảo trợ có pháp nhân, tuân thủ quy định về vận động đóng góp và viện trợ.', en: 'Funding goes to the legally registered host/sponsor account, following rules on donations and foreign aid.' }) },
          { icon: <ShieldCheck className="size-5" />, t: tx({ vi: 'Người thụ hưởng không bao giờ trả phí', en: 'Beneficiaries never pay' }), d: tx({ vi: 'Đối tác cam kết không thu phí trái quy định với người được giới thiệu.', en: 'Partners commit to no unlawful fees for referred people.' }) },
          { icon: <Info className="size-5" />, t: tx({ vi: 'Đo bằng kết quả', en: 'Measured by outcomes' }), d: tx({ vi: 'Chỉ số chính là chi phí cho mỗi bước tiếp thực sự xảy ra và được hỏi thăm.', en: 'The key figure is cost per next step that actually happened and was followed up.' }) },
        ].map((x) => (
          <Card key={x.t} className="p-4">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand-strong">{x.icon}</span>
            <p className="mt-2 font-bold text-ink">{x.t}</p>
            <p className="mt-1 text-sm text-muted">{x.d}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
