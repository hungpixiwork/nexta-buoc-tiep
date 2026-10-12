import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

export interface QuizItem {
  id: string;
  scenario: string;
  isScam: boolean;
  explanation: string;
}

interface ScamQuizCardProps {
  currentIndex: number;
  totalCount: number;
  quiz: QuizItem;
  onNextQuiz: () => void;
}

export const ScamQuizCard: React.FC<ScamQuizCardProps> = ({
  currentIndex,
  totalCount,
  quiz,
  onNextQuiz,
}) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<'scam' | 'safe' | null>(null);

  const handleSelectOption = (choice: 'scam' | 'safe') => {
    setSelectedOption(choice);
  };

  const handleNext = () => {
    setSelectedOption(null);
    onNextQuiz();
  };

  const isUserCorrect =
    selectedOption !== null &&
    ((selectedOption === 'scam' && quiz.isScam) || (selectedOption === 'safe' && !quiz.isScam));

  return (
    <View style={styles.cardContainer}>
      {/* Header Row: Progress indicator */}
      <View style={styles.headerRow}>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {t('components.scamQuiz.progress', {
              current: currentIndex + 1,
              total: totalCount,
            })}
          </Text>
        </View>
        <Text style={styles.cardHint}>{t('components.scamQuiz.cardHint')}</Text>
      </View>

      {/* Scenario text */}
      <Text style={styles.scenarioText}>{quiz.scenario}</Text>

      {/* 2 Big Choice Buttons */}
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[
            styles.optionBtn,
            styles.optionScamBtn,
            selectedOption === 'scam' && styles.optionScamSelected,
          ]}
          onPress={() => handleSelectOption('scam')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('components.scamQuiz.scamChoiceA11y')}
        >
          <Text style={[styles.optionText, selectedOption === 'scam' && styles.optionScamTextSelected]}>
            {t('components.scamQuiz.scamChoice')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionBtn,
            styles.optionSafeBtn,
            selectedOption === 'safe' && styles.optionSafeSelected,
          ]}
          onPress={() => handleSelectOption('safe')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('components.scamQuiz.safeChoiceA11y')}
        >
          <Text style={[styles.optionText, selectedOption === 'safe' && styles.optionSafeTextSelected]}>
            {t('components.scamQuiz.safeChoice')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline Feedback Box */}
      {selectedOption !== null && (
        <View style={[styles.feedbackBox, isUserCorrect ? styles.feedbackSuccess : styles.feedbackWarning]}>
          <View style={styles.feedbackTitleRow}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={isUserCorrect ? '#16A34A' : '#EAB308'} strokeWidth={2.4}>
              {isUserCorrect ? (
                <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </Svg>
            <Text style={[styles.feedbackTitle, { color: isUserCorrect ? '#15803D' : '#854D0E' }]}>
              {isUserCorrect ? t('components.scamQuiz.correctTitle') : t('components.scamQuiz.incorrectTitle')}
            </Text>
          </View>

          <Text style={styles.explanationText}>{quiz.explanation}</Text>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>{t('components.scamQuiz.nextBtn')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2F80ED',
  },
  cardHint: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  scenarioText: {
    fontSize: 16.5,
    lineHeight: 24,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  optionScamBtn: {
    borderColor: '#FCA5A5',
  },
  optionScamSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  optionScamTextSelected: {
    color: '#DC2626',
    fontWeight: '800',
  },
  optionSafeBtn: {
    borderColor: '#86EFAC',
  },
  optionSafeSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  optionSafeTextSelected: {
    color: '#15803D',
    fontWeight: '800',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  feedbackBox: {
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  feedbackWarning: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  explanationText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  nextBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#2F80ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
