import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../lib/dialog';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ScamQuizItem } from '../types';
import { Header } from '../components/Header';
import { ScamQuizCard } from '../components/ScamQuizCard';
import { SafetyChecklist } from '../components/SafetyChecklist';
import { EmergencySupportCard } from '../components/EmergencySupportCard';
import { apiService, isOfflineQueued } from '../services/api';

interface MilScreenProps {
  onBack?: () => void;
  onAvatarPress?: () => void;
}

type IncidentType = 'fake_job_scam' | 'cyberbullying' | 'deepfake' | 'misinformation';

interface IncidentTypeConfig {
  key: IncidentType;
  labelKey: string;
  icon: string;
}

const INCIDENT_TYPES: IncidentTypeConfig[] = [
  { key: 'fake_job_scam', labelKey: 'mil.incidentTypeJobScam', icon: '💸' },
  { key: 'cyberbullying', labelKey: 'mil.incidentTypeCyberbullying', icon: '👤' },
  { key: 'deepfake', labelKey: 'mil.incidentTypeDeepfake', icon: '🎭' },
  { key: 'misinformation', labelKey: 'mil.incidentTypeMisinformation', icon: '⚠️' },
];

const getQuizData = (t: (key: string) => string): ScamQuizItem[] => [
  {
    id: 'quiz-1',
    scenario: t('mil.quiz1Scenario'),
    isScam: true,
    explanation: t('mil.quiz1Explanation'),
  },
  {
    id: 'quiz-2',
    scenario: t('mil.quiz2Scenario'),
    isScam: true,
    explanation: t('mil.quiz2Explanation'),
  },
  {
    id: 'quiz-3',
    scenario: t('mil.quiz3Scenario'),
    isScam: false,
    explanation: t('mil.quiz3Explanation'),
  },
];

export const MilScreen: React.FC<MilScreenProps> = ({ onBack, onAvatarPress }) => {
  const { t } = useTranslation();
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);

  // MIL Incident Form State
  const [selectedType, setSelectedType] = useState<IncidentType>('fake_job_scam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quizData = getQuizData(t);
  const currentQuiz = {
    id: `quiz-${activeQuizIndex}`,
    scenario: quizData[activeQuizIndex].scenario,
    isScam: quizData[activeQuizIndex].isScam,
    explanation: quizData[activeQuizIndex].explanation,
  };

  const handleNextQuiz = () => {
    setActiveQuizIndex((prev) => (prev + 1) % quizData.length);
  };

  const handleReportIncident = async () => {
    if (!description.trim() || description.trim().length < 5) {
      showAlert(t('mil.invalidInputTitle'), t('mil.invalidInputMessage'));
      return;
    }

    setIsSubmitting(true);
    const incidentPayload = {
      incidentType: selectedType,
      description: description.trim(),
      riskLevel: 'high' as const,
    };

    try {
      const res = await apiService.reportMilIncident(incidentPayload);
      if (isOfflineQueued(res)) {
        showAlert(t('mil.reportSavedOfflineTitle'), t('mil.reportSavedOfflineBody'));
      } else {
        showAlert(t('mil.reportSuccessTitle'), t('mil.reportSuccessBody', { id: res.id }));
      }
      setDescription('');
    } catch (error) {
      console.warn('[MilScreen] Lỗi khi gửi báo cáo:', error);
      showAlert(t('common.error'), t('mil.reportErrorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <Header showBack={!!onBack} onBack={onBack} onAvatarPress={onAvatarPress} />

        {/* Screen Title & Header Group */}
        <View style={styles.headerGroup}>
          <Text style={styles.eyebrowText}>{t('mil.eyebrow')}</Text>
          <Text style={styles.title}>{t('mil.title')}</Text>
          <Text style={styles.subtitle}>
            {t('mil.subtitle')}
          </Text>
        </View>

        {/* 1. Interactive Situation Quiz Card Component */}
        <ScamQuizCard
          currentIndex={activeQuizIndex}
          totalCount={quizData.length}
          quiz={currentQuiz}
          onNextQuiz={handleNextQuiz}
        />

        {/* 2. Clean Safety Principles Checklist Component */}
        <SafetyChecklist />

        {/* 3. MIL Incident Reporting Form */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeaderRow}>
            <View style={styles.reportIconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2.2}>
                <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <Path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              </Svg>
            </View>
            <View style={styles.reportTitleBox}>
              <Text style={styles.reportTitle}>{t('mil.reportCardTitle')}</Text>
              <Text style={styles.reportSub}>{t('mil.reportCardSub')}</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>{t('mil.labelIncidentType')}</Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map((item) => {
              const isSelected = selectedType === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                  onPress={() => setSelectedType(item.key)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t(item.labelKey)}
                >
                  <Text style={styles.typeChipIcon}>{item.icon}</Text>
                  <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                    {t(item.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>{t('mil.labelDescription')}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('mil.descriptionPlaceholder')}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.btnSubmit, isSubmitting && styles.btnDisabled]}
            onPress={handleReportIncident}
            disabled={isSubmitting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('mil.submitBtn')}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4}>
                  <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.btnSubmitText}>{t('mil.submitBtn')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 4. Emergency Support CTA Card Component */}
        <EmergencySupportCard />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
  },
  headerGroup: {
    marginTop: 4,
    marginBottom: 20,
  },
  eyebrowText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2F80ED',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 19.5,
    fontWeight: '500',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  reportIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportTitleBox: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16375D',
  },
  reportSub: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16375D',
    marginTop: 10,
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChipSelected: {
    backgroundColor: '#DCEBFB',
    borderColor: '#2F80ED',
  },
  typeChipIcon: {
    fontSize: 14,
  },
  typeChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  typeChipTextSelected: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#16375D',
    minHeight: 80,
  },
  btnSubmit: {
    backgroundColor: '#2F80ED',
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
