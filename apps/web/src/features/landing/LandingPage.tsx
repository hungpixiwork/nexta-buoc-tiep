/**
 * Public landing page (mockup 1), rewritten around BƯỚC TIẾP's core message:
 * "Không phải mọi người trên đường phố đều cần cùng một sự giúp đỡ."
 * Why this structure: visitors (NGO staff, partners, judges) must understand in one scroll that
 * the product routes each person into the RIGHT pathway — protection for children, welfare for
 * older people, livelihood for adults — and never turns hardship into content.
 */
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Check,
  ClipboardList,
  Clock,
  Eye,
  FileCheck2,
  HandHeart,
  HeartPulse,
  Lock,
  LogIn,
  MapPin,
  PlayCircle,
  Search,
  ShieldCheck,
  Sprout,
  UserCheck,
  Users,
  Briefcase,
  GraduationCap,
  Megaphone,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { LangToggle, Wordmark, roleHome } from '../../app/AppShell';
import { SupportCallMenu } from '../../app/SupportCallMenu';
import { cx } from '../../design/ui';
import { STEP_META } from '../../design/dashboard';
import { useMetrics } from '../../lib/hooks';
import type { DemoRole } from '../../lib/api';

const STEP_ICON = [Eye, Users, FileCheck2, MapPin, HandHeart, CalendarCheck];
const STEP_TEXT = [
  { vi: 'Nhận biết nhu cầu trên đường phố, không chụp ảnh.', en: 'Spot needs on the street, no photos.' },
  { vi: 'Lắng nghe bằng lời nói, xin đồng ý trước khi ghi.', en: 'Listen by voice, ask consent before recording.' },
  { vi: 'Kiểm tra rủi ro: trẻ em, bóc lột, lừa đảo.', en: 'Check risks: children, exploitation, scams.' },
  { vi: 'Cùng người đó chọn một bước tiếp an toàn.', en: 'Choose one safe next step together.' },
  { vi: 'Chuyển đúng dịch vụ đã xác minh, còn suất.', en: 'Refer to a verified service with places.' },
  { vi: 'Hỏi thăm 30–60 ngày đến khi ổn định.', en: 'Follow up 30–60 days until stable.' },
];

export function LandingPage() {
  const { tx, session, role, setRole, isDemo } = useApp();
  const navigate = useNavigate();
  const metrics = useMetrics();
  const m = metrics.data?.metrics;

  const tryRole = (r: DemoRole) => {
    if (isDemo) setRole(r);
    navigate(isDemo ? roleHome(r) : roleHome(role));
  };
  const start = session ? roleHome(role) : '/navigator';

  const nav = [
    ['#giai-phap', tx({ vi: 'Giải pháp', en: 'Solution' })],
    ['#cach-hoat-dong', tx({ vi: 'Cách hoạt động', en: 'How it works' })],
    ['#vai-tro', tx({ vi: 'Vai trò', en: 'Roles' })],
    ['#nguon-luc', tx({ vi: 'Nguồn lực', en: 'Resources' })],
    ['#an-toan', tx({ vi: 'An toàn dữ liệu', en: 'Data safety' })],
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3 sm:px-6">
          <Wordmark to="/" />
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label={tx({ vi: 'Giới thiệu', en: 'About' })}>
            {nav.map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3 py-2 text-[15px] font-semibold text-ink-2 hover:bg-sunken">
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <LangToggle />
            </div>
            {!session && (
              <Link to="/login" className="press hidden min-h-[44px] items-center gap-1.5 rounded-full border border-brand-line px-4 font-semibold text-brand-strong hover:bg-brand-soft sm:inline-flex">
                <LogIn className="size-4" aria-hidden />
                {tx({ vi: 'Đăng nhập', en: 'Sign in' })}
              </Link>
            )}
            <Link to={start} className="press inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-brand px-4 font-bold text-white hover:bg-brand-strong">
              {tx({ vi: 'Bắt đầu', en: 'Start' })}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section id="giai-phap" className="border-b border-line bg-[#EDF3FB]">
          <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:py-14">
            <div>
              <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-ink md:text-[48px]">
                {tx({ vi: 'Một bước tiếp an toàn,', en: 'A safe next step,' })}
                <br />
                <span className="text-brand">{tx({ vi: 'đúng người, đúng lúc.', en: 'right person, right time.' })}</span>
              </h1>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2">
                {tx({
                  vi: 'BƯỚC TIẾP giúp phát hiện nhu cầu, xác minh thông tin, kết nối đúng dịch vụ và theo dõi đến khi ổn định — cho người bán vé số, bán hàng rong, lao động tự do, người cao tuổi lang thang và trẻ em cơ nhỡ.',
                  en: 'BƯỚC TIẾP spots needs, verifies information, connects people to the right service and follows up until life is steadier — for lottery sellers, street vendors, informal workers, older people on the street and children at risk.',
                })}
              </p>
              <p className="mt-3 max-w-xl text-[15px] font-semibold text-ink">
                {tx({ vi: '“Không phải mọi người trên đường phố đều cần cùng một sự giúp đỡ.”', en: '“Not everyone on the street needs the same kind of help.”' })}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={start} className="press inline-flex min-h-[52px] items-center gap-2 rounded-full bg-brand px-6 text-[16px] font-bold text-white hover:bg-brand-strong">
                  <ArrowRight className="size-5" aria-hidden />
                  {tx({ vi: 'Bắt đầu hành trình', en: 'Start a journey' })}
                </Link>
                <a href="#cach-hoat-dong" className="press inline-flex min-h-[52px] items-center gap-2 rounded-full border-2 border-brand-line bg-surface px-6 text-[16px] font-bold text-brand-strong hover:bg-brand-soft">
                  <PlayCircle className="size-5" aria-hidden />
                  {tx({ vi: 'Xem cách hoạt động', en: 'See how it works' })}
                </a>
              </div>
            </div>

            {/* Live preview card instead of a phone illustration */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-[28px] border border-line bg-surface p-5 shadow-[var(--shadow-raised)]">
                <p className="text-[13px] font-bold uppercase tracking-wider text-muted">{tx({ vi: 'Youth Navigator', en: 'Youth Navigator' })}</p>
                <p className="mt-1 text-[20px] font-extrabold text-ink">{tx({ vi: 'Việc cần làm hôm nay', en: 'Today’s work' })}</p>
                <ul className="mt-4 grid gap-2.5">
                  <PreviewRow icon={<Clock className="size-4" />} tone="bg-danger-soft text-danger" label={tx({ vi: 'Hỏi thăm đến hạn', en: 'Check-ins due' })} value={m?.followUpsDue} />
                  <PreviewRow icon={<ShieldCheck className="size-4" />} tone="bg-ai-soft text-ai" label={tx({ vi: 'Ca đã chuyển xem xét an toàn', en: 'Cases sent for safety review' })} value={m?.safeguardingEscalations} />
                  <PreviewRow icon={<HandHeart className="size-4" />} tone="bg-step-soft text-step" label={tx({ vi: 'Bước tiếp đã được đồng ý', en: 'Next steps agreed' })} value={m?.safeNextStepsConfirmed} />
                </ul>
                <p className="mt-4 text-xs text-muted">{m ? tx({ vi: 'Số liệu trực tiếp từ hệ thống pilot', en: 'Live numbers from the pilot system' }) : tx({ vi: 'Đăng nhập để xem số liệu trực tiếp', en: 'Sign in to see live numbers' })}</p>
              </div>
              <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-raised)] sm:flex">
                <span className="grid size-8 place-items-center rounded-full bg-brand text-white">
                  <Check className="size-4" aria-hidden />
                </span>
                <span className="text-[13px] font-semibold text-ink-2">{tx({ vi: 'Người quyết định là chính họ', en: 'They make the decision' })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6 steps */}
        <section id="cach-hoat-dong" className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
          <div className="rounded-3xl border border-line bg-surface p-6">
            <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
              <h2 className="text-[22px] font-extrabold leading-tight text-ink">
                {tx({ vi: 'Hành trình 6 bước', en: 'A 6-step journey' })}
                <span className="block text-brand">{tx({ vi: 'từ nhu cầu đến kết quả', en: 'from need to outcome' })}</span>
              </h2>
              <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {STEP_META.map((st, i) => {
                  const Icon = STEP_ICON[i];
                  return (
                    <li key={st.n} className="text-center">
                      <span className={cx('mx-auto grid size-14 place-items-center rounded-full border', st.cls)}>
                        <Icon className="size-6" aria-hidden />
                      </span>
                      <p className="mt-2 font-bold text-ink">
                        <span className="tabular mr-1 text-muted">{st.n}.</span>
                        {tx(st)}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted">{tx(STEP_TEXT[i])}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* 3 pathways */}
        <section className="mx-auto max-w-[1240px] px-4 pb-10 sm:px-6">
          <h2 className="text-[26px] font-extrabold text-ink">{tx({ vi: 'Ba lộ trình — không một giải pháp chung cho tất cả', en: 'Three pathways — no one-size-fits-all' })}</h2>
          <p className="mt-1 text-[15px] text-muted">{tx({ vi: 'Sau khi được tiếp cận và đánh giá an toàn, mỗi người được phân vào lộ trình phù hợp.', en: 'After a safe first contact and risk check, each person goes into the pathway that fits.' })}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <PathwayCard
              tone="border-danger-line bg-danger-soft"
              icon={<ShieldCheck className="size-6 text-danger" />}
              title={tx({ vi: 'Trẻ em · Bảo vệ trước tiên', en: 'Children · Protection first' })}
              items={[
                tx({ vi: 'Không hồ sơ tuyển dụng, không kết nối việc làm', en: 'No job profiles, no employment referrals' }),
                tx({ vi: 'Kết nối gia đình, nhà trường, công tác xã hội', en: 'Family, school and social work' }),
                tx({ vi: 'Chỉ dùng bí danh, không công khai hình ảnh, vị trí', en: 'Alias only; no photos or locations shared' }),
                tx({ vi: 'Tổng đài 111 khi có dấu hiệu bóc lột, bạo lực', en: 'Hotline 111 for exploitation or violence' }),
              ]}
            />
            <PathwayCard
              tone="border-ai-line bg-ai-soft"
              icon={<HeartPulse className="size-6 text-ai" />}
              title={tx({ vi: 'Người cao tuổi · An sinh & phẩm giá', en: 'Older people · Welfare & dignity' })}
              items={[
                tx({ vi: 'Đánh giá nhu cầu trước khi đề xuất giải pháp', en: 'Needs assessment before any suggestion' }),
                tx({ vi: 'Y tế, giấy tờ tùy thân, nơi ở, trợ giúp xã hội', en: 'Health, ID papers, shelter, welfare' }),
                tx({ vi: 'Sinh kế nhẹ chỉ khi còn sức và có mong muốn', en: 'Light livelihood only if able and wanted' }),
                tx({ vi: 'Không ép tiếp tục làm việc', en: 'Never pushed to keep working' }),
              ]}
            />
            <PathwayCard
              tone="border-step-line bg-step-soft"
              icon={<Briefcase className="size-6 text-step" />}
              title={tx({ vi: 'Người trưởng thành · Hộ chiếu Sinh kế', en: 'Adults · Livelihood Passport' })}
              items={[
                tx({ vi: 'Kể bằng giọng nói — không cần CV, email', en: 'Tell it by voice — no CV or email needed' }),
                tx({ vi: 'Ghi nhận kỹ năng thực tế: bán hàng, quản lý tiền, giao nhận', en: 'Real skills: selling, cash handling, delivery' }),
                tx({ vi: 'Khóa học ngắn, ca thử việc có trả lương', en: 'Short courses, paid trial shifts' }),
                tx({ vi: 'Kỹ năng thông tin: nhận biết tin tuyển dụng giả', en: 'Information skills: spot fake job ads' }),
              ]}
            />
          </div>
        </section>

        {/* Roles */}
        <section id="vai-tro" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
            <h2 className="text-[26px] font-extrabold text-ink">{tx({ vi: 'Ba vai trò, một hành trình phối hợp', en: 'Three roles, one coordinated journey' })}</h2>
            <p className="mt-1 text-[15px] text-muted">{tx({ vi: 'AI chỉ hỗ trợ ghi chép và cảnh báo — quyết định luôn thuộc về con người.', en: 'AI only helps take notes and flag risks — people always decide.' })}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <RoleCard
                color="text-brand"
                bg="bg-brand-soft border-brand-line"
                title="Youth Navigator"
                desc={tx({ vi: 'Tình nguyện viên được đào tạo: tiếp cận, lắng nghe, đồng hành.', en: 'Trained volunteers: reach out, listen, walk alongside.' })}
                items={[tx({ vi: 'Ghi nhận nhu cầu bằng giọng nói', en: 'Record needs by voice' }), tx({ vi: 'Cùng chọn bước tiếp an toàn', en: 'Agree a safe next step' }), tx({ vi: 'Hỏi thăm đúng hẹn 30–60 ngày', en: 'Check in for 30–60 days' })]}
                cta={tx({ vi: 'Dùng thử vai trò này', en: 'Try this role' })}
                onTry={() => tryRole('navigator')}
              />
              <RoleCard
                color="text-step"
                bg="bg-step-soft border-step-line"
                title={tx({ vi: 'Đối tác', en: 'Partner' })}
                desc={tx({ vi: 'Tổ chức xã hội, trung tâm dịch vụ, cơ sở đào tạo, doanh nghiệp.', en: 'NGOs, service centres, training providers, employers.' })}
                items={[tx({ vi: 'Nhận chuyển gửi với dữ liệu tối thiểu', en: 'Receive referrals with minimum data' }), tx({ vi: 'Cập nhật suất và giờ tiếp nhận', en: 'Keep places and hours current' }), tx({ vi: 'Ghi nhận kết quả hỗ trợ', en: 'Record outcomes' })]}
                cta={tx({ vi: 'Dùng thử vai trò này', en: 'Try this role' })}
                onTry={() => tryRole('partner')}
              />
              <RoleCard
                color="text-warn"
                bg="bg-warn-soft border-warn-line"
                title={tx({ vi: 'Điều phối viên', en: 'Coordinator' })}
                desc={tx({ vi: 'Nhân viên xã hội: người quyết định ở những điểm nhạy cảm.', en: 'Social workers: the human decision at sensitive points.' })}
                items={[tx({ vi: 'Ghép ca với đối tác phù hợp', en: 'Match cases with partners' }), tx({ vi: 'Xem xét cảnh báo an toàn', en: 'Review safety alerts' }), tx({ vi: 'Theo dõi chất lượng và kết quả', en: 'Track quality and outcomes' })]}
                cta={tx({ vi: 'Dùng thử vai trò này', en: 'Try this role' })}
                onTry={() => tryRole('coordinator')}
              />
            </div>
          </div>
        </section>

        {/* What users need */}
        <section id="nguon-luc" className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
          <h2 className="text-[26px] font-extrabold text-ink">{tx({ vi: 'Điều người dùng thật sự cần', en: 'What users actually need' })}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NeedCard icon={<ClipboardList className="size-6" />} title={tx({ vi: 'Ít nhập liệu hơn', en: 'Less typing' })} body={tx({ vi: 'Ghi chú ngắn hoặc giọng nói; chỉ hỏi thông tin thật sự cần.', en: 'Short notes or voice; only what is truly needed.' })} />
            <NeedCard icon={<Clock className="size-6" />} title={tx({ vi: 'Biết việc cần làm hôm nay', en: 'Know today’s work' })} body={tx({ vi: 'Danh sách rõ ràng, ưu tiên theo mức rủi ro và thời hạn.', en: 'A clear list ranked by risk and deadline.' })} />
            <NeedCard icon={<Search className="size-6" />} title={tx({ vi: 'Đúng người, đúng dịch vụ', en: 'Right person, right service' })} body={tx({ vi: 'Chỉ gợi ý dịch vụ đã xác minh, còn suất, phục vụ đúng khu vực.', en: 'Only verified services with places in the right area.' })} />
            <NeedCard icon={<BarChart3 className="size-6" />} title={tx({ vi: 'Theo dõi được kết quả', en: 'See outcomes' })} body={tx({ vi: 'Biết mỗi người đang ở bước nào, ai đang chờ ai.', en: 'Know where each person is and who is waiting on whom.' })} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <NeedCard icon={<Megaphone className="size-6" />} title={tx({ vi: 'Kỹ năng thông tin (MIL) trong từng bước', en: 'Media & information literacy at every step' })} body={tx({ vi: 'Nhận biết tin tuyển dụng giả, phí môi giới, bảo vệ CCCD, hiểu hợp đồng và biết nguồn trợ giúp đáng tin cậy.', en: 'Spot fake job ads and broker fees, protect ID cards, understand contracts, know trustworthy help.' })} />
            <NeedCard icon={<GraduationCap className="size-6" />} title={tx({ vi: 'Giáo dục cộng đồng', en: 'Community education' })} body={tx({ vi: 'Không quay phim, đăng hình hay kể lại hoàn cảnh người yếu thế khi chưa được đồng ý — hãy báo cho người có chuyên môn.', en: 'Do not film, post or retell someone’s hardship without consent — tell a trained person instead.' })} />
          </div>
        </section>

        {/* Data safety */}
        <section id="an-toan" className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
            <div>
              <h2 className="text-[24px] font-extrabold text-ink">{tx({ vi: 'An toàn dữ liệu từ thiết kế', en: 'Data safety by design' })}</h2>
              <p className="mt-1 text-[15px] text-muted">{tx({ vi: 'Bảo vệ người được hỗ trợ, xây dựng niềm tin với cộng đồng.', en: 'Protect people, build community trust.' })}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <NeedCard icon={<Lock className="size-6" />} title={tx({ vi: 'Chỉ chia sẻ dữ liệu tối thiểu', en: 'Minimum data only' })} body={tx({ vi: 'Đối tác chỉ thấy bí danh, nhóm tuổi, quận, nhu cầu và bước tiếp.', en: 'Partners see alias, age band, district, need and next step only.' })} />
              <NeedCard icon={<UserCheck className="size-6" />} title={tx({ vi: 'Có sự đồng ý rõ ràng', en: 'Clear consent' })} body={tx({ vi: 'Xin đồng ý bằng lời trước khi ghi và trước khi chuyển cho đối tác.', en: 'Verbal consent before recording and before any referral.' })} />
              <NeedCard icon={<FileCheck2 className="size-6" />} title={tx({ vi: 'Lưu vết và minh bạch', en: 'Audit trail' })} body={tx({ vi: 'Mọi thay đổi đều ghi lại ai làm, lúc nào và nguồn thông tin.', en: 'Every change records who, when and the source.' })} />
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
          <div className="grid gap-6 rounded-3xl border border-step-line bg-step-soft p-6 md:grid-cols-[1.2fr_repeat(4,1fr)] md:items-center">
            <div>
              <h2 className="text-[20px] font-extrabold text-ink">{tx({ vi: 'Những con số từ pilot', en: 'Pilot numbers' })}</h2>
              <p className="text-sm text-muted">{tx({ vi: 'Pilot 30 trường hợp tại khu vực có nhiều lao động đường phố.', en: 'A 30-case pilot where many street workers live and work.' })}</p>
            </div>
            <Num icon={<Users className="size-6" />} value={m?.journeys} label={tx({ vi: 'hành trình đã mở', en: 'journeys opened' })} />
            <Num icon={<BookOpen className="size-6" />} value={m?.resourcesVerified} label={tx({ vi: 'dịch vụ đã xác minh', en: 'services verified' })} />
            <Num icon={<HandHeart className="size-6" />} value={m?.safeNextStepsConfirmed} label={tx({ vi: 'bước tiếp đã đồng ý', en: 'next steps agreed' })} />
            <Num icon={<Sprout className="size-6" />} value={6} label={tx({ vi: 'bước rõ ràng', en: 'clear steps' })} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-6 text-sm text-muted sm:px-6">
          <Wordmark compact to="/" />
          <span>UNESCO Youth Hackathon 2026 · Community Impact · MIL Education · Youth Engagement</span>
          <nav className="flex flex-wrap gap-4" aria-label={tx({ vi: 'Liên kết', en: 'Links' })}>
            <Link to="/privacy" className="hover:underline">{tx({ vi: 'Quyền dữ liệu', en: 'Data rights' })}</Link>
            <Link to="/legal/SAFEGUARDING_POLICY" className="hover:underline">Safeguarding</Link>
            <Link to="/transparency" className="hover:underline">{tx({ vi: 'Minh bạch', en: 'Transparency' })}</Link>
            <Link to="/join" className="hover:underline">{tx({ vi: 'Tham gia', en: 'Join' })}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
            <SupportCallMenu />
          </div>
        </div>
      </footer>
    </div>
  );
}

function PreviewRow({ icon, tone, label, value }: { icon: React.ReactNode; tone: string; label: string; value: number | undefined }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
      <span className={cx('grid size-8 place-items-center rounded-full', tone)}>{icon}</span>
      <span className="flex-1 text-[14px] font-semibold text-ink-2">{label}</span>
      <span className="tabular min-w-[28px] rounded-full bg-sunken px-2 text-center text-[14px] font-bold text-ink">{value ?? '—'}</span>
    </li>
  );
}

function PathwayCard({ tone, icon, title, items }: { tone: string; icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <article className={cx('rounded-2xl border p-5', tone)}>
      <span className="grid size-11 place-items-center rounded-xl bg-surface">{icon}</span>
      <h3 className="mt-3 text-[17px] font-bold text-ink">{title}</h3>
      <ul className="mt-2 grid gap-1.5 text-[14px] text-ink-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-step" aria-hidden />
            {it}
          </li>
        ))}
      </ul>
    </article>
  );
}

function RoleCard({ title, desc, items, color, bg, cta, onTry }: { title: string; desc: string; items: string[]; color: string; bg: string; cta: string; onTry: () => void }) {
  return (
    <article className={cx('flex flex-col rounded-2xl border p-5', bg)}>
      <h3 className={cx('text-[19px] font-extrabold', color)}>{title}</h3>
      <p className="mt-1 text-[14px] text-ink-2">{desc}</p>
      <ul className="mt-3 grid gap-1.5 text-[14px] text-ink-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-step" aria-hidden />
            {it}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onTry} className="press mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-full border border-line-strong bg-surface px-4 text-[14px] font-semibold text-brand-strong hover:bg-sunken">
        {cta}
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </article>
  );
}

function NeedCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">{icon}</span>
      <div className="min-w-0">
        <h3 className="font-bold text-ink">{title}</h3>
        <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{body}</p>
      </div>
    </article>
  );
}

function Num({ icon, value, label }: { icon: React.ReactNode; value: number | undefined; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-step">{icon}</span>
      <div>
        <p className="tabular text-[28px] font-extrabold leading-none text-ink">{value ?? '—'}</p>
        <p className="text-[13px] text-muted">{label}</p>
      </div>
    </div>
  );
}
