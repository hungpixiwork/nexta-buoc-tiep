import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, BadgeCheck, CalendarCheck, Eye, FileText, HandHeart, Landmark, Link2, MessageCircle, Mic, Search, ShieldAlert, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from '../../app/AppContext';
import { Button, Card, cx } from '../../design/ui';
import { useMetrics } from '../../lib/hooks';

export function LivingLabPage() {
  const { tx, s, lang } = useApp();
  const metrics = useMetrics();
  const m = metrics.data?.metrics;

  const loop: Array<{ icon: ReactNode; title: string; body: string; key?: boolean }> = [
    { icon: <Eye className="size-5" />, title: tx({ vi: 'Lắng nghe', en: 'Input' }), body: tx({ vi: 'Người dân nói điều quan trọng với họ.', en: 'The person tells us what matters.' }) },
    { icon: <HandHeart className="size-5" />, title: s.loop.understand, body: tx({ vi: 'Chỉ bối cảnh tối thiểu cần thiết, có đồng ý.', en: 'Minimum necessary context, with consent.' }) },
    { icon: <Search className="size-5" />, title: s.loop.verify, body: tx({ vi: 'Kiểm tra lời kể, rủi ro và nguồn lực thật.', en: 'Claims, risk and real resources.' }) },
    { icon: <ShieldCheck className="size-5" />, title: s.loop.step, body: tx({ vi: 'Một hành động. Một người chịu trách nhiệm. Một thời điểm. Một lối đi đã xác minh.', en: 'One action. One owner. One time. One verified pathway.' }), key: true },
    { icon: <Link2 className="size-5" />, title: s.loop.connect, body: tx({ vi: 'Đối tác thật nhận trách nhiệm.', en: 'A real partner accepts responsibility.' }) },
    { icon: <CalendarCheck className="size-5" />, title: s.loop.followUp, body: tx({ vi: 'Việc đó có thực sự xảy ra không?', en: 'Did it actually happen?' }) },
  ];

  const aiJobs = [
    { icon: <FileText className="size-4" />, t: tx({ vi: 'Sắp xếp ghi chú rời rạc', en: 'Structure fragmented field notes' }) },
    { icon: <Mic className="size-4" />, t: tx({ vi: 'Chuyển giọng nói thành chữ', en: 'Transcribe voice' }) },
    { icon: <Search className="size-4" />, t: tx({ vi: 'Phát hiện thông tin còn thiếu', en: 'Detect missing context' }) },
    { icon: <ShieldAlert className="size-4" />, t: tx({ vi: 'Đánh dấu dấu hiệu rủi ro đã biết', en: 'Flag known risk patterns' }) },
    { icon: <Sparkles className="size-4" />, t: tx({ vi: 'Gợi ý ứng viên từ danh bạ đã xác minh', en: 'Suggest candidates from the verified directory' }) },
  ];

  const provenance = [
    { icon: <MessageCircle className="size-4" />, t: s.provenance.BENEFICIARY_STATED },
    { icon: <Eye className="size-4" />, t: s.provenance.NAVIGATOR_OBSERVED },
    { icon: <Sparkles className="size-4" />, t: s.provenance.AI_SUGGESTED, ai: true },
    { icon: <BadgeCheck className="size-4" />, t: s.provenance.HUMAN_VERIFIED },
    { icon: <Landmark className="size-4" />, t: s.provenance.VERIFIED_EXTERNAL },
  ];

  const criteria: Array<[string, string]> = [
    [tx({ vi: 'Phù hợp nhu cầu cộng đồng', en: 'Community need' }), tx({ vi: 'Hai luồng nghiên cứu với Navigator và người thụ hưởng; ba vấn đề lặp lại: bắt đầu từ đâu, tin ai, làm gì tiếp.', en: 'Two research streams with Navigators and beneficiaries; three recurring problems: where to begin, whom to trust, what next.' })],
    [tx({ vi: 'Mức độ sẵn sàng', en: 'Solution readiness' }), tx({ vi: 'MVP chạy thật: web + API + cơ sở dữ liệu + quy trình chuyển gửi khép kín + kiểm thử tự động.', en: 'Live MVP: web + API + database + closed-loop referral workflow + automated tests.' })],
    [tx({ vi: 'Công nghệ & đổi mới', en: 'Technology & innovation' }), tx({ vi: 'Kiến trúc trách nhiệm người–máy: nguồn gốc dữ liệu, cổng an toàn trước AI, ghép nối đã xác minh, vòng khép kín.', en: 'Human–AI accountability architecture: provenance, rules-before-AI gate, verified matching, closed loop.' })],
    [tx({ vi: 'Tiềm năng tác động', en: 'Impact potential' }), tx({ vi: 'Đo Tỉ lệ Bước tiếp an toàn, không đo lượt tải.', en: 'Measure Safe Next Step Rate, not downloads.' })],
    [tx({ vi: 'Tính khả thi', en: 'Feasibility' }), tx({ vi: 'Thí điểm 12 tuần có giới hạn: 10–15 Navigator, 3–5 đối tác, 30–50 hành trình.', en: 'Bounded 12-week pilot: 10–15 Navigators, 3–5 partners, 30–50 journeys.' })],
    [tx({ vi: 'Năng lực đội ngũ', en: 'Team capability' }), tx({ vi: 'Phân vai rõ: Kỹ thuật · Nghiên cứu · Bảo vệ an toàn · Đối tác — kèm bằng chứng đã làm.', en: 'Clear ownership: Engineering · Research · Safeguarding · Partnerships — with evidence of work done.' })],
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <section className="py-4 md:py-8">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">RE:ACT · Living Lab · Hóc Môn + Quận 12</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          {tx({ vi: 'Từ “Tôi không biết bắt đầu từ đâu” đến một ', en: 'From “I don’t know where to begin” to a ' })}
          <span className="text-step">{tx({ vi: 'Bước tiếp an toàn', en: 'Safe Next Step' })}</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          {tx({
            vi: 'NEXTA là nền tảng điều hướng hỗ trợ cộng đồng cho Youth Navigator: một hành động cụ thể, đã được xác minh, có người chịu trách nhiệm và được theo dõi tới kết quả.',
            en: 'NEXTA is a community support-navigation platform for Youth Navigators: one concrete action — verified, owned, and followed up to an outcome.',
          })}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/journeys/new"><Button variant="step" size="lg">{tx({ vi: 'Xem một hành trình', en: 'Walk through a journey' })}</Button></Link>
          <Link to="/coordinator"><Button variant="secondary" size="lg">{tx({ vi: 'Số liệu trực tiếp', en: 'Live numbers' })}</Button></Link>
          <Link to="/join"><Button variant="secondary" size="lg">{tx({ vi: 'Tham gia Living Lab', en: 'Join the Living Lab' })}</Button></Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            tx({ vi: 'Bắt đầu từ đâu?', en: 'Where do I begin?' }),
            tx({ vi: 'Tin ai được?', en: 'Whom can I trust?' }),
            tx({ vi: 'Làm gì tiếp theo?', en: 'What do I do next?' }),
          ].map((q, i) => (
            <li key={q} className="card p-4">
              <span className="text-sm font-bold text-muted">0{i + 1}</span>
              <p className="mt-1 text-lg font-bold text-ink">{q}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-ink">{tx({ vi: 'Một vòng khép kín', en: 'One closed loop' })}</h2>
        <p className="mt-1 text-muted">{tx({ vi: '“Người này cần làm gì tiếp theo, với ai, ở đâu, và làm sao biết việc đó thực sự đã xảy ra?”', en: '“What does this person need to do next, with whom, where — and how do we know it actually happened?”' })}</p>
        <ol className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {loop.map((l, i) => (
            <li key={l.title} className={cx('relative rounded-2xl border p-4', l.key ? 'border-2 border-step bg-step-soft' : 'border-line bg-surface')}>
              <span className={cx('grid size-9 place-items-center rounded-full', l.key ? 'bg-step text-white' : 'bg-brand-soft text-brand-strong')}>{l.icon}</span>
              <p className={cx('mt-3 font-bold', l.key ? 'text-step' : 'text-ink')}>{i + 1}. {l.title}</p>
              <p className="mt-1 text-sm text-muted">{l.body}</p>
              {i < loop.length - 1 && <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-5 -translate-y-1/2 text-line-strong lg:block" aria-hidden />}
              {i < loop.length - 1 && <ArrowDown className="mx-auto mt-2 size-4 text-line-strong md:hidden" aria-hidden />}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">
          {tx({ vi: '→ Học hỏi: mỗi vòng cải thiện danh bạ nguồn lực, kỹ năng Navigator và hệ thống.', en: '→ Learn: every loop improves the resource directory, Navigator skills and the system.' })}
        </p>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-bold text-ink">{tx({ vi: 'NEXTA không phải là…', en: 'NEXTA is not…' })}</h2>
          <ul className="mt-3 space-y-2">
            {[
              tx({ vi: 'Chatbot hay “nhân viên xã hội AI”', en: 'A chatbot or an “AI social worker”' }),
              tx({ vi: 'Một thư mục NGO để “ném link rồi xong”', en: 'An NGO directory that “drops a link and leaves”' }),
              tx({ vi: 'Lời hứa giải quyết cả cuộc đời một người', en: 'A promise to solve someone’s whole life' }),
              tx({ vi: 'Thay thế các hệ thống hỗ trợ đang có', en: 'A replacement for existing support systems' }),
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[15px] text-ink-2"><X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />{t}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-sunken p-3 text-[15px] font-semibold text-ink">
            {tx({ vi: 'Cái thiếu là điều hướng + xác minh + liên tục. “Không chuyển gửi nào được biến mất trong im lặng.”', en: 'What’s missing is navigation + verification + continuity. “No referral disappears silently.”' })}
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-ink">{tx({ vi: 'AI đứng sau con người', en: 'AI stands behind people' })}</h2>
          <p className="mt-1 text-[15px] font-semibold text-ai">{tx({ vi: 'Hậu quả càng lớn, máy càng ít quyền.', en: 'The greater the consequence, the less authority the AI receives.' })}</p>
          <ul className="mt-3 space-y-2">
            {aiJobs.map((j) => (
              <li key={j.t} className="flex items-center gap-2 text-[15px] text-ink-2"><span className="grid size-7 place-items-center rounded-lg bg-ai-soft text-ai">{j.icon}</span>{j.t}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-muted">{tx({ vi: 'Mọi thông tin đều mang nguồn gốc:', en: 'Every fact carries its provenance:' })}</p>
          <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
            {provenance.map((p, i) => (
              <li key={p.t} className="flex items-center gap-1.5">
                <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5', p.ai ? 'border-ai-line bg-ai-soft text-ai' : 'border-line bg-surface text-ink-2')}>{p.icon}{p.t}</span>
                {i < provenance.length - 1 && <ArrowRight className="size-3.5 text-muted" aria-hidden />}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-ink">{tx({ vi: 'Thí điểm 12 tuần — nhỏ, có giới hạn, đo được', en: '12-week pilot — small, bounded, measurable' })}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Hóc Môn + Q.12', tx({ vi: 'Địa bàn', en: 'Area' })],
            ['10–15', 'Youth Navigators'],
            ['3–5', tx({ vi: 'Đối tác đã xác minh', en: 'Verified partners' })],
            ['30–50', tx({ vi: 'Hành trình khép kín', en: 'Closed-loop journeys' })],
          ].map(([v, l]) => (
            <div key={l} className="card p-4">
              <p className="tabular text-3xl font-extrabold text-brand-strong">{v}</p>
              <p className="text-sm font-semibold text-muted">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          {tx({ vi: 'Nhóm chính: lao động phi chính thức và người trưởng thành khó khăn kinh tế. Người cao tuổi là nhóm phụ. Trẻ em chỉ xuất hiện dưới dạng quy trình bảo vệ — không phải khách hàng.', en: 'Primary group: informal workers and economically vulnerable adults. Older adults are secondary. Children appear only as a safeguarding protocol — never a customer segment.' })}
        </p>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="border-2 border-step-line bg-step-soft p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-step">North Star</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{tx({ vi: 'Tỉ lệ Bước tiếp an toàn', en: 'Safe Next Step Rate' })}</h2>
          <p className="mt-2 text-[15px] text-ink-2">{tx({ vi: '% hành trình đạt một hành động cụ thể, đã xác minh và được hỏi thăm xác nhận.', en: '% of journeys reaching a concrete, verified action confirmed by follow-up.' })}</p>
          <p className="tabular mt-4 text-5xl font-extrabold text-step">{m ? `${m.safeNextStepRate}%` : '—'}</p>
          <p className="text-sm text-step">{m ? tx({ vi: `trực tiếp từ ${m.journeys} hành trình đã ghi`, en: `live from ${m.journeys} recorded journeys` }) : ''}</p>
          <ul className="mt-4 space-y-1 text-sm text-ink-2">
            <li>· {tx({ vi: 'Tỉ lệ đối tác chấp nhận chuyển gửi', en: 'Referral acceptance rate' })}</li>
            <li>· {tx({ vi: 'Thời gian trung vị tới bước tiếp', en: 'Median time to Safe Next Step' })}</li>
            <li>· {tx({ vi: 'Tỉ lệ theo dõi hoàn thành', en: 'Follow-up completion rate' })}</li>
            <li>· {tx({ vi: 'Độ tươi xác minh của đối tác', en: 'Partner verification freshness' })}</li>
            <li>· {tx({ vi: 'Độ chính xác chuyển cấp an toàn', en: 'Safeguarding escalation accuracy' })}</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-ink">{tx({ vi: '6 tiêu chí RE:ACT ↔ bằng chứng', en: '6 RE:ACT criteria ↔ evidence' })}</h2>
          <dl className="mt-3 divide-y divide-line">
            {criteria.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                <dt className="font-bold text-ink">{k}</dt>
                <dd className="text-[15px] text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <p className="mt-12 text-center text-sm text-muted">
        {lang === 'vi' ? '“Chúng em xây ít hơn, nhưng xác minh nhiều hơn.”' : '“We build less, but verify more.”'}
      </p>
    </div>
  );
}
