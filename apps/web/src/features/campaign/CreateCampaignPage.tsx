/**
 * Create Campaign Page — Form for Partner/Coordinator to create a new campaign.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { apiFetch } from '../../lib/api';
import { Button, Card, ErrorBanner, Field, PageHeader, Select, TextArea, TextInput } from '../../design/ui';

const CATEGORIES = [
  { value: 'digital_help', vi: 'Hỗ trợ số', en: 'Digital Help' },
  { value: 'health_check', vi: 'Sức khỏe', en: 'Health Check' },
  { value: 'food_drive', vi: 'Lương thực', en: 'Food Drive' },
  { value: 'legal_aid', vi: 'Pháp lý', en: 'Legal Aid' },
  { value: 'education', vi: 'Giáo dục', en: 'Education' },
  { value: 'housing', vi: 'Nhà ở', en: 'Housing' },
  { value: 'employment', vi: 'Việc làm', en: 'Employment' },
  { value: 'mental_health', vi: 'Tâm lý', en: 'Mental Health' },
  { value: 'child_protection', vi: 'Bảo vệ trẻ em', en: 'Child Protection' },
  { value: 'general', vi: 'Cộng đồng', en: 'Community' },
];

const DISTRICTS = [
  'Hóc Môn', 'Quận 12', 'Bình Chánh', 'Củ Chi', 'Gò Vấp',
  'Bình Tân', 'Quận 1', 'Quận 5', 'Quận 8', 'Tân Bình', 'Thủ Đức',
];

export function CreateCampaignPage() {
  const { tx, lang, s } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [district, setDistrict] = useState('Hóc Môn');
  const [ward, setWard] = useState('');
  const [address, setAddress] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [totalSlots, setTotalSlots] = useState(10);

  const createMutation = useMutation({
    mutationFn: () => apiFetch<{ id: string }>('/api/v1/campaigns', {
      method: 'POST',
      body: {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        district,
        ward: ward.trim() || undefined,
        address: address.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes,
        totalSlots,
      },
    }),
    onSuccess: (result) => navigate(`/campaigns/${result.id}`, { replace: true }),
  });

  const canSubmit = title.trim().length >= 3 && startsAt.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/campaigns" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
        <ArrowLeft className="size-4" /> {tx({ vi: 'Chiến dịch', en: 'Campaigns' })}
      </Link>

      <PageHeader
        eyebrow={tx({ vi: 'Chiến dịch mới', en: 'New Campaign' })}
        title={tx({ vi: 'Tạo chiến dịch cộng đồng', en: 'Create a community campaign' })}
        description={tx({
          vi: 'Mô tả chiến dịch, chọn thời gian & địa điểm, mở đăng ký cho Navigator.',
          en: 'Describe your campaign, pick a time & location, open registration for Navigators.',
        })}
      />

      <Card className="p-5 sm:p-6">
        <div className="space-y-5">
          <Field label={tx({ vi: 'Tên chiến dịch', en: 'Campaign title' })} htmlFor="title">
            <TextInput
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder={tx({ vi: 'Ví dụ: Khám sức khỏe cộng đồng Hóc Môn', en: 'E.g.: Community health check in Hoc Mon' })}
            />
          </Field>

          <Field label={tx({ vi: 'Mô tả', en: 'Description' })} htmlFor="desc" optionalLabel={s.common.optional}>
            <TextArea
              id="desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={tx({ vi: 'Mục tiêu, đối tượng, cách thức...', en: 'Goals, target group, how it works...' })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx({ vi: 'Loại hình', en: 'Category' })} htmlFor="category">
              <Select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {CATEGORIES.map((categoryOption) => (
                  <option key={categoryOption.value} value={categoryOption.value}>{tx(categoryOption)}</option>
                ))}
              </Select>
            </Field>

            <Field label={tx({ vi: 'Quận/Huyện', en: 'District' })} htmlFor="district">
              <Select id="district" value={district} onChange={(event) => setDistrict(event.target.value)}>
                {DISTRICTS.map((districtOption) => (
                  <option key={districtOption} value={districtOption}>{districtOption}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx({ vi: 'Phường/Xã', en: 'Ward' })} htmlFor="ward" optionalLabel={s.common.optional}>
              <TextInput id="ward" value={ward} onChange={(event) => setWard(event.target.value)} maxLength={80} />
            </Field>
            <Field label={tx({ vi: 'Địa chỉ cụ thể', en: 'Address' })} htmlFor="address" optionalLabel={s.common.optional}>
              <TextInput id="address" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={200} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={tx({ vi: 'Thời gian bắt đầu', en: 'Start time' })} htmlFor="starts-at">
              <TextInput
                id="starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </Field>
            <Field label={tx({ vi: 'Thời lượng (phút)', en: 'Duration (min)' })} htmlFor="duration">
              <TextInput
                id="duration"
                type="number"
                min={15}
                max={480}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
              />
            </Field>
            <Field label={tx({ vi: 'Số chỗ', en: 'Capacity' })} htmlFor="slots">
              <TextInput
                id="slots"
                type="number"
                min={1}
                max={100}
                value={totalSlots}
                onChange={(event) => setTotalSlots(Number(event.target.value))}
              />
            </Field>
          </div>

          {createMutation.error && <ErrorBanner title={s.common.errorTitle} message={errorText(createMutation.error, lang)} />}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              {s.common.cancel}
            </Button>
            <Button
              size="lg"
              icon={<Target className="size-5" />}
              disabled={!canSubmit}
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {tx({ vi: 'Tạo chiến dịch (Nháp)', en: 'Create Campaign (Draft)' })}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
