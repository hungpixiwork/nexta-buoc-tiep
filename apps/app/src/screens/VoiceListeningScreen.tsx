import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { apiService, isOfflineQueued } from '../services/api';
import { generateIdempotencyKey } from '../storage';
import { showAlert } from '../lib/dialog';

export interface VoiceListeningScreenProps {
  /** Called with the new case id, or undefined when the intake was queued offline. */
  onApproved: (caseId?: string) => void;
  /** Priority chosen on the previous step; sent as the case category. */
  priority?: string;
  onBack?: () => void;
  onAvatarPress?: () => void;
}

const SCAM_KEYWORDS = ['cọc', 'tiền cọc', 'cccd', 'chuyển khoản', 'nạp tiền', 'deposit', 'id card'];

export const VoiceListeningScreen: React.FC<VoiceListeningScreenProps> = ({
  onApproved,
  priority,
  onBack,
  onAvatarPress,
}) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech API (Chrome/Edge): live Vietnamese transcription while recording.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setTranscript((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
        }
      };
      recognition.onerror = (event: any) => {
        console.warn('[VoiceListening] Web Speech error:', event.error);
      };
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[VoiceListening] Failed to init SpeechRecognition', e);
    }
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  /** No microphone (denied or unsupported): fall back to typing, never to made-up text. */
  const openManualEntry = () => {
    setIsRecording(false);
    setIsEditing(true);
    setStatusMessage(t('voice.status.micUnavailable'));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
      }
      try {
        recognitionRef.current?.stop();
      } catch {}
      return;
    }

    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      openManualEntry();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlobUrl(URL.createObjectURL(blob));
        audioElementRef.current = null;
        setIsRecording(false);
        setStatusMessage(t('voice.status.recordingStopped'));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setStatusMessage(t('voice.status.listeningReal'));
      try {
        recognitionRef.current?.start();
      } catch {}
    } catch (micErr) {
      console.warn('[VoiceListening] getUserMedia error:', micErr);
      openManualEntry();
    }
  };

  const handlePlayAudio = () => {
    if (!audioBlobUrl || typeof window === 'undefined') return;
    if (!audioElementRef.current) {
      audioElementRef.current = new window.Audio(audioBlobUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const lowerTranscript = transcript.toLowerCase();
  const isScamDetected = SCAM_KEYWORDS.some((keyword) => lowerTranscript.includes(keyword));
  const hasTranscript = transcript.trim().length > 0;

  const handleSubmitVoiceCase = async () => {
    if (isSubmitting) return;
    if (!hasTranscript) {
      setIsEditing(true);
      setStatusMessage(t('voice.status.needTranscript'));
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(t('voice.status.submitting'));

    try {
      const result = await apiService.voiceIntakeSync({
        clientGeneratedId: generateIdempotencyKey('voice_intake'),
        rawTranscript: transcript.trim(),
        category: priority,
        isMinor,
        createdAt: new Date().toISOString(),
      });
      if (isOfflineQueued(result)) {
        showAlert(t('common.savedOfflineTitle'), t('common.savedOfflineMsg'));
        onApproved(undefined);
      } else {
        setStatusMessage(t('voice.status.synced'));
        onApproved(result.id);
      }
    } catch (e) {
      console.warn('[VoiceListening] Submit failed:', e);
      setStatusMessage(t('voice.status.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Header showBack={!!onBack} onBack={onBack} onAvatarPress={onAvatarPress} />

      <View style={styles.headerGroup}>
        <View style={styles.topHeaderRow}>
          <Text style={styles.eyebrowText}>
            {t('voice.header.eyebrow')} <Text style={styles.eyebrowSub}>{t('voice.header.eyebrowSub')}</Text>
          </Text>
          <View style={styles.safeguardBadge}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={2}>
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <Text style={styles.safeguardText}>{t('voice.header.safeguardBadge')}</Text>
          </View>
        </View>
        <Text style={styles.title}>{t('voice.header.title')}</Text>
      </View>

      <View style={styles.promptBubble}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.promptText}>{t('voice.header.promptQuote')}</Text>
        <Text style={styles.quoteMark}>”</Text>
      </View>

      <View style={styles.centralMicContainer}>
        <View style={styles.sideWaveform}>
          {[16, 24, 38, 20, 32].map((h, i) => (
            <View key={`l-${i}`} style={[styles.staticBar, { height: isRecording ? Math.random() * 30 + 15 : h }]} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.bigMicCircle, isRecording && styles.bigMicCircleActive]}
          onPress={toggleRecording}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? t('voice.mic.stopBtn') : t('voice.recording.holdToRecord')}
        >
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="#FFFFFF">
            <Rect x="9" y="3" width="6" height="12" rx="3" fill="#FFFFFF" />
            <Path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
            <Path d="M12 18v3M8 21h8" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.bigMicLabel}>
            {isRecording ? t('voice.recording.recording') : t('voice.recording.holdToRecord')}
          </Text>
        </TouchableOpacity>

        <View style={styles.sideWaveform}>
          {[32, 20, 38, 24, 16].map((h, i) => (
            <View key={`r-${i}`} style={[styles.staticBar, { height: isRecording ? Math.random() * 30 + 15 : h }]} />
          ))}
        </View>
      </View>

      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity style={styles.textOptionBtn} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={2}>
            <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </Svg>
          <Text style={styles.textOptionLabel}>{t('voice.recording.textOptionBtn')}</Text>
        </TouchableOpacity>
        {audioBlobUrl && Platform.OS === 'web' && (
          <TouchableOpacity style={styles.textOptionBtn} onPress={handlePlayAudio} activeOpacity={0.8}>
            <Text style={styles.textOptionLabel}>
              {isPlayingAudio ? t('voice.playback.pause') : t('voice.playback.play')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {statusMessage && (
        <View style={styles.statusBanner} accessibilityLiveRegion="polite">
          <Text style={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      )}

      {isScamDetected && (
        <View style={styles.scamAlertCard} accessibilityRole="alert">
          <View style={styles.scamHeader}>
            <Text style={styles.scamTitle}>{t('voice.scam.alertTitle')}</Text>
          </View>
          <Text style={styles.scamDesc}>{t('voice.scam.alertDesc')}</Text>
        </View>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.summaryHeaderTitle}>{t('voice.summary.title')}</Text>
        </View>

        {isEditing ? (
          <TextInput
            style={styles.transcriptInput}
            value={transcript}
            onChangeText={setTranscript}
            placeholder={t('voice.transcript.placeholder')}
            placeholderTextColor="#64748B"
            multiline
            autoFocus
            accessibilityLabel={t('voice.transcript.title')}
          />
        ) : (
          <Text style={[styles.summaryBodyText, !hasTranscript && styles.summaryEmptyText]}>
            {hasTranscript ? transcript : t('voice.transcript.empty')}
          </Text>
        )}

        <View style={styles.minorRow}>
          <View style={styles.minorTextGroup}>
            <Text style={styles.minorLabel}>{t('voice.minor.label')}</Text>
            <Text style={styles.minorSub}>{t('voice.minor.sub')}</Text>
          </View>
          <Switch
            value={isMinor}
            onValueChange={setIsMinor}
            trackColor={{ false: '#CBD5E1', true: '#DC2626' }}
            accessibilityLabel={t('voice.minor.label')}
          />
        </View>

        {hasTranscript && <Text style={styles.confirmPromptText}>{t('voice.summary.confirmQuestion')}</Text>}

        <View style={styles.summaryActionRow}>
          <TouchableOpacity
            style={[styles.btnConfirm, (!hasTranscript || isSubmitting) && styles.btnDisabled]}
            onPress={handleSubmitVoiceCase}
            disabled={isSubmitting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('voice.action.accessibilitySubmitLabel')}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
            <Text style={styles.btnConfirmText}>{t('voice.summary.btnConfirm')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnEdit}
            onPress={() => setIsEditing((editing) => !editing)}
            activeOpacity={0.85}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={2}>
              <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </Svg>
            <Text style={styles.btnEditText}>
              {isEditing ? t('voice.transcript.doneBtn') : t('voice.summary.btnEdit')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
  },
  headerGroup: {
    marginTop: 4,
    marginBottom: 16,
  },
  eyebrowText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2F80ED',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  statusBanner: {
    backgroundColor: '#E8F4FC',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    textAlign: 'center',
  },
  transcriptInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  scamAlertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  scamHeader: {
    marginBottom: 4,
  },
  scamTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  scamDesc: {
    fontSize: 13.5,
    color: '#7F1D1D',
    lineHeight: 19,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  safeguardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  safeguardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  promptBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  quoteMark: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0085FF',
    lineHeight: 24,
  },
  promptText: {
    flex: 1,
    fontSize: 14.5,
    color: '#334155',
    lineHeight: 21,
    fontWeight: '500',
  },
  centralMicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 18,
  },
  sideWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 60,
  },
  staticBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#BAE6FD',
  },
  bigMicCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#0085FF',
    borderWidth: 8,
    borderColor: '#D0E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0085FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  bigMicCircleActive: {
    backgroundColor: '#DC2626',
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
  },
  bigMicLabel: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 6,
  },
  textOptionBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  textOptionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0284C7',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sparkleIcon: {
    fontSize: 16,
  },
  summaryHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2C59',
  },
  summaryBodyText: {
    fontSize: 14.5,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 14,
  },
  confirmPromptText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  summaryActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: '#0085FF',
    borderRadius: 14,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0085FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  btnConfirmText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  btnEdit: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0284C7',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnEditText: {
    color: '#0284C7',
    fontSize: 14.5,
    fontWeight: '700',
  },
  eyebrowSub: {
    color: '#475569',
    fontWeight: '500',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryEmptyText: {
    color: '#475569',
    fontStyle: 'italic',
  },
  minorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  minorTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  minorLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  minorSub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#475569',
    marginTop: 2,
  },
  btnDisabled: {
    opacity: 0.55,
  },
});

