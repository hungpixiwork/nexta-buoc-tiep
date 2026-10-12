import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, ActivityIndicator, TextInput } from 'react-native';
import { showAlert } from '../lib/dialog';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { SkyBackground } from '../components/SkyBackground';
import { ScreenState } from '../components/ScreenState';
import { apiService, isOfflineQueued } from '../services/api';

interface TaskAssignmentScreenProps {
  /** Case the task belongs to; when missing the user picks one from the list. */
  caseId?: string;
  /** Signed-in user's name for the greeting. */
  userName?: string;
  onAcceptTask?: () => void;
  onAvatarPress?: () => void;
  onBack?: () => void;
}

interface CaseOption {
  id: string;
  label: string;
}

interface MemberOption {
  id: string;
  name: string;
}

const DUE_IN_DAYS = [1, 3, 7];

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date;
};

export const TaskAssignmentScreen: React.FC<TaskAssignmentScreenProps> = ({
  caseId: initialCaseId,
  userName,
  onAcceptTask,
  onAvatarPress,
  onBack,
}) => {
  const { t, i18n } = useTranslation();

  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);

  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(initialCaseId);
  const [assignee, setAssignee] = useState<MemberOption | null>(null);
  const [dueInDays, setDueInDays] = useState<number>(3);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const load = useCallback(() => {
    let isMounted = true;
    setStatus('loading');
    Promise.all([apiService.getCases(), apiService.getVolunteers()])
      .then(([casesRes, volunteersRes]) => {
        if (!isMounted) return;
        setCases(
          (casesRes.data ?? []).map((item: any) => ({
            id: item.id,
            label: item.aliasName || item.fullName || item.id,
          }))
        );
        setMembers(
          (volunteersRes.data ?? []).map((item: any) => ({
            id: item.id,
            name: item.fullName || item.name || item.email || item.id,
          }))
        );
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('[TaskAssignment] Load failed:', err);
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  const selectedCase = cases.find((item) => item.id === selectedCaseId);
  const formatDue = useMemo(
    () => (days: number) =>
      addDays(days).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
      }),
    [i18n.language]
  );

  const handleAcceptTask = async () => {
    if (isSubmitting) return;
    const cleanTitle = title.trim();
    if (!selectedCaseId) {
      setFormError(t('tasks.error.case_required'));
      return;
    }
    if (!cleanTitle) {
      setFormError(t('tasks.error.title_required'));
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await apiService.createTask({
        caseId: selectedCaseId,
        title: cleanTitle,
        assignedTo: assignee?.id,
        dueAt: addDays(dueInDays).toISOString(),
        priority: 'medium',
      });
      if (isOfflineQueued(result)) {
        showAlert(t('common.savedOfflineTitle'), t('common.savedOfflineMsg'));
      } else {
        showAlert(
          t('tasks.alert.online_success_title'),
          t('tasks.alert.online_success_msg', {
            taskTitle: cleanTitle,
            assignee: assignee?.name ?? t('tasks.picker.unassigned'),
            dueDate: formatDue(dueInDays),
          })
        );
      }
      onAcceptTask?.();
    } catch (err) {
      console.warn('[TaskAssignment] Create task failed:', err);
      setFormError(t('tasks.error.save_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const chevron = (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  );

  return (
    <View style={styles.screenWrapper}>
      <SkyBackground height={840} borderRadius={0}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Header showBack={!!onBack} onBack={onBack} onAvatarPress={onAvatarPress} />

          {userName ? <Text style={styles.greeting}>{t('tasks.header.greeting', { name: userName })}</Text> : null}
          <Text style={styles.title}>
            {selectedCase ? t('tasks.header.title', { targetPerson: selectedCase.label }) : t('tasks.header.title_no_case')}
          </Text>

          {status !== 'ready' ? (
            <ScreenState kind={status} onRetry={load} />
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.iconWrapper}>
                  <View style={styles.heartCircle}>
                    <Svg width={30} height={20} viewBox="0 0 40 24" fill="none" stroke="#5BA3FF" strokeWidth={3} strokeLinecap="round" style={styles.sparkSvg}>
                      <Path d="M6 12h4M20 4l3 3M32 12h-4" />
                    </Svg>
                    <Svg width={44} height={44} viewBox="0 0 24 24" fill="#2F80ED">
                      <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
                      <Path d="M12 8v6M9 11h6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  </View>
                </View>

                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('tasks.form.title_placeholder')}
                  placeholderTextColor="#64748B"
                  multiline
                  accessibilityLabel={t('tasks.form.title_label')}
                />

                <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={() => setShowCaseModal(true)} accessibilityRole="button">
                  <View style={styles.rowIconCircle}>
                    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#5B86AD" strokeWidth={2}>
                      <Path d="M4 6h16v13H4z" />
                      <Path d="M9 6V4h6v2" />
                    </Svg>
                  </View>
                  <Text style={styles.rowLabel}>{t('tasks.picker.case_label')}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {selectedCase?.label ?? t('tasks.picker.choose')}
                  </Text>
                  {chevron}
                </TouchableOpacity>

                <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={() => setShowMemberModal(true)} accessibilityRole="button">
                  <View style={styles.rowIconCircle}>
                    <Svg width={19} height={19} viewBox="0 0 24 24" fill="#5B86AD">
                      <Circle cx={12} cy={8} r={4} />
                      <Path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
                    </Svg>
                  </View>
                  <Text style={styles.rowLabel}>{t('tasks.picker.assignee_label')}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {assignee?.name ?? t('tasks.picker.unassigned')}
                  </Text>
                  {chevron}
                </TouchableOpacity>

                <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={() => setShowDatePickerModal(true)} accessibilityRole="button">
                  <View style={styles.rowIconCircle}>
                    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#5B86AD" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Rect x={4} y={5} width={16} height={16} rx={2} />
                      <Path d="M4 9h16M8 3v4M16 3v4" />
                    </Svg>
                  </View>
                  <Text style={styles.rowLabel}>{t('tasks.picker.due_date_label')}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {formatDue(dueInDays)}
                  </Text>
                  {chevron}
                </TouchableOpacity>
              </View>

              {formError && (
                <Text style={styles.formErrorText} accessibilityRole="alert">
                  {formError}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.acceptButton, isSubmitting && styles.acceptButtonDisabled]}
                onPress={handleAcceptTask}
                disabled={isSubmitting}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <View style={styles.buttonIconCircle}>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M4 12h15M13 6l6 6-6 6" />
                      </Svg>
                    </View>
                    <Text style={styles.acceptButtonText}>{t('tasks.btn.accept_step')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SkyBackground>

      <Modal visible={showCaseModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCaseModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('tasks.modal.case_title')}</Text>
            <ScrollView style={styles.modalList}>
              {cases.length === 0 ? (
                <Text style={styles.modalSub}>{t('common.empty')}</Text>
              ) : (
                cases.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.optionRow, selectedCaseId === item.id && styles.optionRowActive]}
                    onPress={() => {
                      setSelectedCaseId(item.id);
                      setShowCaseModal(false);
                    }}
                  >
                    <Text style={styles.optionName}>{item.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCaseModal(false)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showMemberModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMemberModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('tasks.modal.member_title')}</Text>
            <ScrollView style={styles.modalList}>
              {members.length === 0 ? (
                <Text style={styles.modalSub}>{t('common.empty')}</Text>
              ) : (
                members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.optionRow, assignee?.id === member.id && styles.optionRowActive]}
                    onPress={() => {
                      setAssignee(member);
                      setShowMemberModal(false);
                    }}
                  >
                    <Text style={styles.optionName}>{member.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowMemberModal(false)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showDatePickerModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePickerModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('tasks.modal.date_title')}</Text>
            {DUE_IN_DAYS.map((days) => (
              <TouchableOpacity
                key={days}
                style={[styles.optionRow, dueInDays === days && styles.optionRowActive]}
                onPress={() => {
                  setDueInDays(days);
                  setShowDatePickerModal(false);
                }}
              >
                <Text style={styles.optionName}>{formatDue(days)}</Text>
                <Text style={styles.optionRole}>{t('tasks.due_dates.in_days', { count: days })}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDatePickerModal(false)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#EEF7E6',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
    marginTop: 6,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E6EFF7',
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heartCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCEBFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sparkSvg: {
    position: 'absolute',
    top: 6,
    left: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6EFF7',
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF3FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14.5,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  rowValue: {
    fontSize: 15,
    color: '#16375D',
    fontWeight: '700',
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: '#2F80ED',
    borderRadius: 999,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 22,
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 5,
  },
  buttonIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 17.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16375D',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionRowActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2F80ED',
  },
  optionName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionRole: {
    fontSize: 12,
    color: '#2F80ED',
    fontWeight: '600',
  },
  modalCloseBtn: {
    marginTop: 10,
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  titleInput: {
    width: '100%',
    minHeight: 64,
    fontSize: 20,
    fontWeight: '700',
    color: '#16375D',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  formErrorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 320,
  },
});
