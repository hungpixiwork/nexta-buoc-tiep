import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { showAlert } from '../lib/dialog';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { apiService } from '../services/api';

export interface TeamMember {
  id: string;
  name: string;
  roleGroup: string;
  task: string;
  dueDate: string;
  status: string;
  avatarBg: string;
  avatarIconColor: string;
}

interface TeamScreenProps {
  beneficiaryName?: string;
  preferredName?: string;
  onStartJourney?: () => void;
  onCheckIn?: (personId?: string) => void;
  onAvatarPress?: () => void;
  onAssignTask?: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  beneficiaryName = 'Cô Lan',
  preferredName = 'cô Lan',
  onStartJourney,
  onCheckIn,
  onAvatarPress,
  onAssignTask,
}) => {
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState<boolean>(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingVolunteers(true);
    apiService.getVolunteers()
      .then((res) => {
        const rawList = (res && res.data && res.data.length > 0) ? res.data : [
          { id: 'vol-01', name: 'Nguyễn Văn Hưng', roleGroup: 'Tình nguyện viên Dẫn đường', task: 'Đồng hành thực địa & Khảo sát cô Lan', dueDate: 'Hôm nay', status: 'Đang thực hiện', avatarBg: '#CFE6B8', avatarIconColor: '#2F80ED' },
          { id: 'vol-02', name: 'Lê Thị Bình', roleGroup: 'Lắng nghe & Voice Intake', task: 'Tiếp nhận lời thoại phương ngữ', dueDate: '28/07', status: 'Sẵn sàng hỗ trợ', avatarBg: '#DCEEFB', avatarIconColor: '#10B981' },
          { id: 'vol-03', name: 'Trần Minh Tuấn', roleGroup: 'Cán bộ Safeguarding', task: 'Xác minh an toàn & Hotline 111', dueDate: '29/07', status: 'Sẵn sàng hỗ trợ', avatarBg: '#FEF3C7', avatarIconColor: '#D97706' },
          { id: 'vol-04', name: 'Phạm Thu Hà', roleGroup: 'Điều phối Chuyển tuyến', task: 'Theo dõi tiếp nhận Mẫu 07 trong 48h', dueDate: '30/07', status: 'Sẵn sàng hỗ trợ', avatarBg: '#F3E8FF', avatarIconColor: '#7C3AED' },
        ];
        if (isMounted) {
          const mapped: TeamMember[] = rawList.map((item: any, idx: number) => ({
            id: item.id || `v-${idx}`,
            name: item.name || item.fullName || t('team.member.default_name', { index: idx + 1 }),
            roleGroup: item.roleGroup || item.organization || t('team.member.default_role_group', 'Tình nguyện viên D1'),
            task: item.task || item.currentTask || t('team.member.default_task', 'Hỗ trợ đồng hành cộng đồng'),
            dueDate: item.dueDate || '28/07',
            status: item.status || t('team.member.default_status', 'Sẵn sàng hỗ trợ'),
            avatarBg: item.avatarBg || (idx % 2 === 0 ? '#CFE6B8' : '#DCEEFB'),
            avatarIconColor: item.avatarIconColor || (idx % 2 === 0 ? '#5B86AD' : '#2F80ED'),
          }));
          setTeamMembers(mapped);
          setSelectedMember(mapped[0]);
        }
      })
      .catch((err) => {
        console.warn('[TeamScreen] Fetch volunteers failed, using static fallback:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingVolunteers(false);
      });
    return () => { isMounted = false; };
  }, [t]);

  const handleRequestHelp = (memberName: string) => {
    showAlert(
      `🤝 ${t('team.alert.request_help_title', 'Nhờ đồng đội hỗ trợ')}`,
      t('team.alert.request_help_confirm', { name: memberName, defaultValue: `Bạn muốn gửi lời nhờ đồng hành đến ${memberName}?` }),
      [
        { text: t('common.cancel', 'Hủy'), style: 'cancel' },
        {
          text: t('common.confirm', 'Xác nhận gửi'),
          onPress: () =>
            showAlert(
              `✓ ${t('common.success', 'Thành công')}`,
              t('team.alert.request_help_success', { name: memberName, defaultValue: `Lời nhờ đồng hành đã được gửi đến ${memberName}.` })
            ),
        },
      ]
    );
  };

  const currentMember = selectedMember || teamMembers[0];
  // Vietnamese names put the given name last ("Nguyễn Văn Hưng" → "Hưng").
  const givenName = (fullName?: string) => fullName?.trim().split(/\s+/).pop() || '';
  const firstName = givenName(currentMember?.name);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Header onAvatarPress={onAvatarPress} />

      {/* Subheader Badge */}
      <View style={styles.badgeRow}>
        <Text style={styles.badgeText}>{t('team.header.badge_label', 'NGƯỜI ĐỒNG HÀNH')}</Text>
        <Text style={styles.badgeDot}>•</Text>
        <Text style={styles.badgeSub}>{t('team.header.badge_sub', 'Ai sẽ là người gìn giữ câu chuyện này?')}</Text>
      </View>

      {/* Main Title Screen 8 */}
      <Text style={styles.title}>
        {t('team.header.title', { name: beneficiaryName, defaultValue: `${beneficiaryName} sẽ không phải tự đi một mình.` })}{' '}
        <Svg width={34} height={30} viewBox="0 0 40 34" fill="none" stroke="#5BA3FF" strokeWidth={3}>
          <Path d="M20 30C10 24 4 18 4 11a6 6 0 0 1 11-3.5A6 6 0 0 1 26 5" strokeLinecap="round" />
          <Path d="M24 4l4 3-3 4" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Text>

      {/* Thẻ Tập kết & Thời gian khởi hành Hóc Môn 14:00 */}
      <View style={styles.meetingCard}>
        <View style={styles.meetingHeaderRow}>
          <View style={styles.meetingIconCircle}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={9} />
              <Path d="M12 7v5l3 2" />
            </Svg>
          </View>
          <View style={styles.meetingTitleBox}>
            <Text style={styles.meetingLabel}>{t('team.gathering.label', 'ĐIỂM TẬP KẾT & KHỞI HÀNH')}</Text>
            <Text style={styles.meetingTime}>{t('team.gathering.time_example', '14:00 · Chủ nhật 26/07')}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.meetingDetailRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="#2F80ED">
            <Path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7Z" />
          </Svg>
          <Text style={styles.meetingLocationText}>{t('team.gathering.location_example', 'Điểm hẹn: Nhà Văn hóa / UBND Thị trấn Hóc Môn')}</Text>
        </View>

        <View style={styles.meetingDetailRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="#3D9E63">
            <Circle cx={12} cy={12} r={9} />
            <Path d="M8 12l3 3 5-6" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.meetingNoteText}>{t('team.gathering.plan_example', 'Kế hoạch: Lắng nghe & hỏi thăm 8 hộ gia đình khó khăn.')}</Text>
        </View>

        {onStartJourney && (
          <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={onStartJourney}>
            <Text style={styles.startBtnText}>{t('team.btn.start_journey', 'Bắt đầu chuyến đi cùng Đội ngũ')}</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 12h15M13 6l6 6-6 6" />
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      {/* Selector Thành viên */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('team.list.section_title', { count: teamMembers.length, defaultValue: `Thành viên chuyến đi (${teamMembers.length})` })}</Text>
        {isLoadingVolunteers && <ActivityIndicator size="small" color="#2F80ED" style={{ marginLeft: 6 }} />}
        {onAssignTask ? (
          <TouchableOpacity onPress={onAssignTask} activeOpacity={0.7} style={styles.assignTaskBtnChip}>
            <Text style={styles.assignTaskBtnText}>{t('team.btn.assign_new_task', '+ Giao việc mới')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.sectionSub}>{t('team.list.select_hint', 'Chọn để xem')}</Text>
        )}
      </View>

      {isLoadingVolunteers ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2F80ED" />
          <Text style={{ marginTop: 10, color: '#8395A4' }}>{t('team.state.loading', 'Đang tải danh sách thành viên...')}</Text>
        </View>
      ) : teamMembers.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#8395A4', fontSize: 16 }}>{t('team.state.empty', 'Chưa có thành viên nào trong đội.')}</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalAvatarScroll} contentContainerStyle={styles.avatarListContent}>
            {teamMembers.map((item) => {
              const isSelected = currentMember?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.avatarChip, isSelected && styles.avatarChipSelected]}
                  onPress={() => setSelectedMember(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.avatarCircleSmall, { backgroundColor: item.avatarBg }]}>
                    <Svg width={28} height={28} viewBox="0 0 24 24">
                      <Path d="M5.5 10a6.5 6.5 0 0 1 13 0v3c0 1-1 1.5-2 1.5H7.5c-1 0-2-.5-2-1.5z" fill="#6B4E3D" />
                      <Circle cx={12} cy={10.5} r={4.2} fill="#E8C4A8" />
                      <Path d="M4.5 22c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7z" fill={item.avatarIconColor} />
                    </Svg>
                  </View>
                  <Text style={[styles.avatarChipName, isSelected && styles.avatarChipNameSelected]} numberOfLines={1}>
                    {givenName(item.name)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Section: Người đồng hành */}
          {currentMember && (
            <>
              <Text style={styles.sectionHeading}>Người đồng hành</Text>
              <View style={styles.memberCard}>
                <View style={styles.avatarCircleBig}>
                  <Image
                    source={require('../../assets/mockup_assets/avatar-trang.jpg')}
                    style={styles.avatarTrangImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.memberMainInfo}>
                  <Text style={styles.memberName}>Trang Nguyễn</Text>
                  <Text style={styles.memberRoleGroup}>CLB CTXH UIT</Text>
                </View>
                <View style={styles.memberIconCircle}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="#2F80ED">
                    <Circle cx={8.5} cy={8.5} r={2.7} />
                    <Circle cx={16} cy={9.5} r={2.2} />
                    <Path d="M3 18c0-3 2.4-5.2 5.5-5.2S14 15 14 18z" />
                    <Path d="M14 18c0-2.3 1.4-4.1 3.6-4.7 2.3.5 3.9 2.4 3.9 4.7z" />
                  </Svg>
                </View>
              </View>

              {/* Section: Trang đang giúp: */}
              <Text style={styles.helpingHeading}>{t('team.profile.helping_heading', { firstName, defaultValue: `${firstName} đang phụ trách:` })}</Text>

              <View style={styles.taskCard}>
                <View style={styles.taskIconBox}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x="5" y="4" width="14" height="17" rx="2" />
                    <Path d="M9 4V3h6v1" />
                    <Path d="M9 12l2 2 4-4" />
                  </Svg>
                </View>
                <Text style={styles.taskCardText}>{currentMember.task}</Text>
              </View>

              <View style={styles.dueDateCard}>
                <View style={styles.taskIconBox}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x="4" y="5" width="16" height="16" rx="2" />
                    <Path d="M4 9h16M8 3v4M16 3v4" />
                  </Svg>
                </View>
                <Text style={styles.dueDateLabel}>{t('team.profile.due_date_label', 'Dự kiến hoàn thành:')}</Text>
                <Text style={styles.dueDateValue}>{currentMember.dueDate}</Text>
              </View>

              {/* Button: Nhờ một người khác đồng hành */}
              <TouchableOpacity
                style={styles.requestHelpBtn}
                onPress={() => handleRequestHelp(currentMember.name)}
                activeOpacity={0.8}
              >
                <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="9" cy="8" r="3.5" />
                  <Path d="M2.5 20c0-3.6 2.9-6 6.5-6 1.3 0 2.5.3 3.5.9" />
                  <Path d="M17 11v6M14 14h6" />
                </Svg>
                <Text style={styles.requestHelpText}>{t('team.btn.request_peer_help', 'Nhờ đồng đội khác cùng đồng hành')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Section: Điều cần tôn trọng */}
          <Text style={styles.respectTitle}>{t('team.respect.section_title', 'Nguyên tắc tôn trọng & bảo vệ')}</Text>
          <View style={styles.respectContainer}>
            <View style={styles.respectItem}>
              <View style={styles.respectIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="#2F80ED">
                  <Path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
                </Svg>
              </View>
              <Text style={styles.respectText}>{t('team.respect.rule_no_photo', 'Tuyệt đối không chụp ảnh khuôn mặt')}</Text>
            </View>

            <View style={styles.respectItem}>
              <View style={styles.respectIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="#2F80ED">
                  <Path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
                </Svg>
              </View>
              <Text style={styles.respectText}>{t('team.respect.rule_no_phone_share', 'Không tiết lộ số điện thoại cá nhân')}</Text>
            </View>

            <View style={styles.respectItemLast}>
              <View style={styles.respectIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="#2F80ED">
                  <Path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
                </Svg>
              </View>
              <Text style={styles.respectText}>{t('team.respect.rule_preferred_name', { preferredName, defaultValue: `Mong muốn được gọi bằng danh xưng '${preferredName}'` })}</Text>
            </View>
          </View>

          {/* Button: Theo dõi tiến độ */}
          {onCheckIn && (
            <TouchableOpacity style={styles.trackProgressBtn} onPress={() => onCheckIn?.('case-lan-01')} activeOpacity={0.85}>
              <Text style={styles.trackProgressBtnText}>{t('team.btn.track_progress', { name: beneficiaryName, defaultValue: `Theo dõi tiến độ ${beneficiaryName}` })}</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 12h15M13 6l6 6-6 6" />
              </Svg>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  container: {
    padding: 22,
    paddingTop: 12,
    paddingBottom: 140,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16375D',
    letterSpacing: 0.5,
  },
  badgeDot: {
    fontSize: 13,
    color: '#B3C4D3',
  },
  badgeSub: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.6,
    marginTop: 8,
    marginBottom: 22,
  },
  meetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E0EBF6',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  meetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meetingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCEBFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetingTitleBox: {
    flex: 1,
  },
  meetingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  meetingTime: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16375D',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F7',
    marginVertical: 14,
  },
  meetingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  meetingLocationText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#16375D',
    flex: 1,
  },
  meetingNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  startBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16375D',
  },
  sectionSub: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'right',
    fontWeight: '600',
  },
  horizontalAvatarScroll: {
    marginBottom: 18,
  },
  avatarListContent: {
    gap: 10,
    paddingRight: 10,
  },
  avatarChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#EEF2F7',
    width: 72,
  },
  avatarChipSelected: {
    borderColor: '#2F80ED',
    backgroundColor: '#EAF3FF',
  },
  avatarCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  avatarChipNameSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16375D',
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 22,
    shadowColor: 'rgba(31,80,140,0.09)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 3,
  },
  avatarCircleBig: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CFE6B8',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  avatarTrangImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  memberMainInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16375D',
  },
  memberRoleGroup: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  memberIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCEBFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpingHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16375D',
    marginBottom: 10,
  },
  taskCard: {
    backgroundColor: '#E9F3FF',
    borderWidth: 1,
    borderColor: '#E0EBF6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  taskIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCEBFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCardText: {
    fontSize: 16,
    color: '#16375D',
    fontWeight: '600',
    flex: 1,
  },
  dueDateCard: {
    backgroundColor: '#E9F3FF',
    borderWidth: 1,
    borderColor: '#E0EBF6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  dueDateLabel: {
    flex: 1,
    fontSize: 16,
    color: '#16375D',
    fontWeight: '600',
  },
  dueDateValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#16375D',
  },
  requestHelpBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.6,
    borderColor: '#BCD4EE',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  requestHelpText: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '700',
  },
  respectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16375D',
    marginBottom: 12,
  },
  respectContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  respectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  respectItemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  respectIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#DCEBFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  respectText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },
  trackProgressBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    shadowColor: '#2F7CF0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 4,
  },
  trackProgressBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assignTaskBtnChip: {
    backgroundColor: '#EAF3FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BCD4EE',
  },
  assignTaskBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2F80ED',
  },
});
