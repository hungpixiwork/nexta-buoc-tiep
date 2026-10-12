import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { apiService, ApiError } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: { name: string; role: 'volunteer' | 'leader'; email: string }) => void;
}

const COORDINATOR_ROLES = ['leader', 'coordinator', 'social_worker', 'admin'];

/** The app has two experiences: coordinators ("leader") and field volunteers. */
const toAppRole = (serverRole?: string): 'volunteer' | 'leader' =>
  COORDINATOR_ROLES.includes(serverRole ?? '') ? 'leader' : 'volunteer';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Join Team Modal states
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  // UI & Demo Modal states
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSafeguardingModal, setShowSafeguardingModal] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState<'navigator' | 'leader' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [joinErrors, setJoinErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('auth.errorEmailRequired');
    } else if (!email.includes('@') && email.length < 8) {
      newErrors.email = t('auth.errorEmailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.errorPasswordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.errorPasswordTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Signs the user in with a real API session; the app never creates a local one. */
  const completeSignIn = async (res: { token: string; user: any }, fallbackEmail: string) => {
    const role = toAppRole(res.user?.role);
    await AsyncStorage.setItem('@buoc_tiep_jwt_token', res.token);
    await AsyncStorage.setItem('@buoc_tiep_user_role', role);
    onLoginSuccess({
      name: res.user?.full_name || res.user?.fullName || res.user?.name || fallbackEmail,
      role,
      email: res.user?.email || fallbackEmail,
    });
  };

  const authErrorMessage = (err: unknown) =>
    err instanceof ApiError && err.status === 401 ? t('auth.errorLoginFailed') : t('auth.errorNetworkFailed');

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await apiService.login(email.trim(), password.trim());
      await completeSignIn(res, email.trim());
    } catch (err) {
      console.warn('[LoginScreen] Auth error:', err);
      setErrors({ general: authErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'volunteer' | 'leader') => {
    setIsDemoLoading(role === 'volunteer' ? 'navigator' : 'leader');
    const demoEmail = role === 'leader' ? 'cuong.tran@buoctiep.vn' : 'volunteer@buoctiep.vn';
    try {
      const res = await apiService.login(demoEmail, '123456');
      setShowDemoModal(false);
      await completeSignIn(res, demoEmail);
    } catch (err) {
      console.warn('[LoginScreen] Demo sign-in failed:', err);
      setShowDemoModal(false);
      setErrors({ general: t('auth.errorDemoFailed') });
    } finally {
      setIsDemoLoading(null);
    }
  };

  const handleJoinTeamSubmit = async () => {
    const newErrors: { name?: string; email?: string; password?: string; general?: string } = {};
    if (!joinName.trim()) newErrors.name = t('auth.errorNameRequired');
    if (!joinEmail.trim() || !joinEmail.includes('@')) newErrors.email = t('auth.errorEmailInvalid');
    if (!joinPassword || joinPassword.trim().length < 8) newErrors.password = t('auth.errorPasswordMin8');

    if (Object.keys(newErrors).length > 0) {
      setJoinErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setJoinErrors({});
    try {
      const res = await apiService.register({
        full_name: joinName.trim(),
        email: joinEmail.trim(),
        password: joinPassword.trim(),
        role: 'volunteer',
      });
      setShowJoinTeamModal(false);
      await completeSignIn(res, joinEmail.trim());
    } catch (err) {
      console.warn('[LoginScreen] Register failed:', err);
      setJoinErrors({ general: err instanceof ApiError ? err.message : t('auth.errorNetworkFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainLayoutWrapper, isDesktop && styles.mainLayoutDesktop]}>
          
          {/* DESKTOP LEFT COLUMN: Narrative & Purpose */}
          {isDesktop && (
            <View style={styles.desktopHeroCol}>
              <View style={styles.heroLogoRow}>
                <View style={styles.heroLogoCircle}>
                  <Svg width={36} height={36} viewBox="0 0 44 44" fill="none">
                    <Circle cx={22} cy={22} r={22} fill="#EFF6FF" />
                    <Path
                      d="M12 28C15 21 21 17 29 17C32 17 34 18 36 20"
                      stroke="#2F80ED"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <Circle cx={17} cy={16} r={3.5} fill="#F59E0B" />
                    <Path
                      d="M15 30C19 26 25 25 31 28"
                      stroke="#60A5FA"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.heroBrandName}>{t('common.appName')}</Text>
              </View>

              <Text style={styles.heroMainHeading}>
                {t('auth.desktopHeroTagline')}
              </Text>

              <Text style={styles.heroSubHeading}>
                {t('auth.desktopHeroSub')}
              </Text>

              {/* 4 Pillars Highlight */}
              <View style={styles.pillarsGrid}>
                <View style={styles.pillarItem}>
                  <View style={styles.pillarDot} />
                  <Text style={styles.pillarText}>Listen with empathy & zero-PII security</Text>
                </View>
                <View style={styles.pillarItem}>
                  <View style={styles.pillarDot} />
                  <Text style={styles.pillarText}>Verify community resources under 30 days</Text>
                </View>
                <View style={styles.pillarItem}>
                  <View style={styles.pillarDot} />
                  <Text style={styles.pillarText}>Connect to accredited social welfare services</Text>
                </View>
                <View style={styles.pillarItem}>
                  <View style={styles.pillarDot} />
                  <Text style={styles.pillarText}>Follow through until reaching a Safe Next Step</Text>
                </View>
              </View>

              <View style={styles.heroTrustBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}>
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <Path d="M9 12l2 2 4-4" />
                </Svg>
                <Text style={styles.heroTrustText}>
                  {t('auth.trustLine')}
                </Text>
              </View>
            </View>
          )}

          {/* RIGHT COLUMN / MOBILE CARD: Clean Login Card */}
          <View style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop]}>
            
            {/* Header Section */}
            <View style={styles.headerGroup}>
              {/* Logo Emblem */}
              <View style={styles.logoBadge}>
                <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
                  <Circle cx={22} cy={22} r={22} fill="#EFF6FF" />
                  <Path
                    d="M12 28C15 21 21 17 29 17C32 17 34 18 36 20"
                    stroke="#2F80ED"
                    strokeWidth={3}
                    strokeLinecap="round"
                    />
                  <Circle cx={17} cy={16} r={3.5} fill="#F59E0B" />
                  <Path
                    d="M15 30C19 26 25 25 31 28"
                    stroke="#60A5FA"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>

              <Text style={styles.brandTitleText}>{t('common.appName')}</Text>
              <Text style={styles.headingTitle}>{t('auth.headingLogin')}</Text>
              <Text style={styles.headingSub}>{t('auth.subLogin')}</Text>
            </View>

            {/* General Auth Error Banner */}
            {errors.general && (
              <View style={styles.generalErrorBanner}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.2}>
                  <Circle cx={12} cy={12} r={10} />
                  <Path d="M12 8v4M12 16h.01" />
                </Svg>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('auth.labelEmail')}</Text>
              <View style={[styles.inputContainer, !!errors.email && styles.inputErrorBorder]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} style={styles.inputIcon}>
                  <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <Path d="M22 6l-10 7L2 6" />
                </Svg>
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email || errors.general) setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  placeholder={t('auth.placeholderEmail')}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {errors.email && <Text style={styles.errorInlineText}>{errors.email}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>{t('auth.labelPassword')}</Text>
                <TouchableOpacity
                  onPress={() => setForgotPasswordNotice(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.forgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputContainer, !!errors.password && styles.inputErrorBorder]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} style={styles.inputIcon}>
                  <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
                  <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </Svg>
                <TextInput
                  style={styles.inputField}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password || errors.general) setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  placeholder={t('auth.placeholderPassword')}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={styles.eyeToggleBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2}>
                    {showPassword ? (
                      <>
                        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <Circle cx={12} cy={12} r={3} />
                      </>
                    ) : (
                      <>
                        <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <Path d="M1 1l22 22" />
                      </>
                    )}
                  </Svg>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorInlineText}>{errors.password}</Text>}
            </View>

            {forgotPasswordNotice && (
              <View style={styles.inlineInfoBox}>
                <Text style={styles.inlineInfoText}>
                  ℹ️ {t('auth.forgotPasswordNotice')}
                </Text>
              </View>
            )}

            {/* Primary Action Button (Sign In) */}
            <TouchableOpacity
              style={[styles.primarySubmitBtn, isLoading && styles.primarySubmitBtnDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('auth.btnLogin')}
            >
              {isLoading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.primarySubmitText}>{t('common.loading')}</Text>
                </View>
              ) : (
                <Text style={styles.primarySubmitText}>{t('auth.btnLogin')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider 'or' */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.dividerOr')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Dedicated Demo Workspace Entry */}
            <View style={styles.demoEntrySection}>
              <Text style={styles.demoSectionLabel}>{t('auth.demoSectionTitle')}</Text>
              <TouchableOpacity
                style={styles.btnEnterDemo}
                onPress={() => setShowDemoModal(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('auth.demoEnterBtn')}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.2}>
                  <Circle cx={12} cy={12} r={10} />
                  <Path d="M10 8l6 4-6 4V8z" fill="#2563EB" />
                </Svg>
                <Text style={styles.btnEnterDemoText}>{t('auth.demoEnterBtn')}</Text>
              </TouchableOpacity>
            </View>

            {/* Join Team Secondary Link */}
            <View style={styles.joinTeamRow}>
              <Text style={styles.joinTeamPromptText}>{t('auth.joinTeamPrompt')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setJoinErrors({});
                  setShowJoinTeamModal(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('auth.joinTeamLink')}
              >
                <Text style={styles.joinTeamLinkText}> {t('auth.joinTeamLink')}</Text>
              </TouchableOpacity>
            </View>

            {/* Subtle Footer: UNESCO Context & Safeguarding */}
            <View style={styles.footerBrandSection}>
              <Text style={styles.footerBrandCaption}>
                {t('auth.footerBrandCaption')}
              </Text>
              <View style={styles.safeguardingInlineRow}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2}>
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <Path d="M9 12l2 2 4-4" />
                </Svg>
                <TouchableOpacity
                  style={styles.safeguardingLinkTouch}
                  onPress={() => setShowSafeguardingModal(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.safeguardingNotice')}
                >
                  <Text style={styles.safeguardingSmallLink}>
                    {t('auth.safeguardingNotice')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>

        {/* DEMO WORKSPACE MODAL (1-Click Judge Experience) */}
        <Modal visible={showDemoModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDemoModal(false)}
          >
            <View style={styles.demoModalCard} onStartShouldSetResponder={() => true}>
              <View style={styles.demoModalHeader}>
                <View style={styles.demoModalIconCircle}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.2}>
                    <Circle cx={12} cy={12} r={10} />
                    <Path d="M10 8l6 4-6 4V8z" fill="#2563EB" />
                  </Svg>
                </View>
                <Text style={styles.demoModalTitle}>{t('auth.demoModalTitle')}</Text>
                <Text style={styles.demoModalSubtitle}>{t('auth.demoModalSubtitle')}</Text>
              </View>

              {/* Option 1: Youth Navigator */}
              <View style={styles.demoOptionCard}>
                <View style={styles.demoOptionHeader}>
                  <View style={styles.roleIconCircle}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}>
                      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <Circle cx={9} cy={7} r={4} />
                      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </Svg>
                  </View>
                  <View style={styles.demoOptionTitles}>
                    <Text style={styles.demoOptionTitle}>{t('auth.demoRoleNavigatorTitle')}</Text>
                    <Text style={styles.demoOptionDesc}>{t('auth.demoRoleNavigatorDesc')}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.btnContinueDemoRole}
                  onPress={() => handleDemoSignIn('volunteer')}
                  disabled={isDemoLoading !== null}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {isDemoLoading === 'navigator' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.btnContinueDemoRoleText}>{t('auth.demoRoleNavigatorBtn')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Option 2: Team Lead */}
              <View style={styles.demoOptionCard}>
                <View style={styles.demoOptionHeader}>
                  <View style={[styles.roleIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2}>
                      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </Svg>
                  </View>
                  <View style={styles.demoOptionTitles}>
                    <Text style={styles.demoOptionTitle}>{t('auth.demoRoleLeadTitle')}</Text>
                    <Text style={styles.demoOptionDesc}>{t('auth.demoRoleLeadDesc')}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.btnContinueDemoRole, styles.btnContinueDemoRoleLeader]}
                  onPress={() => handleDemoSignIn('leader')}
                  disabled={isDemoLoading !== null}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {isDemoLoading === 'leader' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.btnContinueDemoRoleText, styles.btnContinueDemoRoleLeaderText]}>
                      {t('auth.demoRoleLeadBtn')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.btnCancelModal}
                onPress={() => setShowDemoModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.btnCancelModalText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* JOIN TEAM MODAL */}
        <Modal visible={showJoinTeamModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowJoinTeamModal(false)}
          >
            <View style={styles.demoModalCard} onStartShouldSetResponder={() => true}>
              <Text style={styles.demoModalTitle}>{t('auth.joinTeamModalTitle')}</Text>

              <View style={[styles.fieldGroup, { width: '100%' }]}>
                <Text style={styles.fieldLabel}>{t('auth.labelName')}</Text>
                <View style={[styles.inputContainer, !!joinErrors.name && styles.inputErrorBorder]}>
                  <TextInput
                    style={styles.inputField}
                    value={joinName}
                    onChangeText={setJoinName}
                    placeholder={t('auth.placeholderName')}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {joinErrors.name && <Text style={styles.errorInlineText}>{joinErrors.name}</Text>}
              </View>

              <View style={[styles.fieldGroup, { width: '100%' }]}>
                <Text style={styles.fieldLabel}>{t('auth.labelEmail')}</Text>
                <View style={[styles.inputContainer, !!joinErrors.email && styles.inputErrorBorder]}>
                  <TextInput
                    style={styles.inputField}
                    value={joinEmail}
                    onChangeText={setJoinEmail}
                    placeholder={t('auth.placeholderEmail')}
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {joinErrors.email && <Text style={styles.errorInlineText}>{joinErrors.email}</Text>}
              </View>

              <View style={[styles.fieldGroup, { width: '100%' }]}>
                <Text style={styles.fieldLabel}>{t('auth.labelPassword')}</Text>
                <View style={[styles.inputContainer, !!joinErrors.password && styles.inputErrorBorder]}>
                  <TextInput
                    style={styles.inputField}
                    value={joinPassword}
                    onChangeText={setJoinPassword}
                    placeholder={t('auth.placeholderPassword')}
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                  />
                </View>
                {joinErrors.password && <Text style={styles.errorInlineText}>{joinErrors.password}</Text>}
              </View>

              {joinErrors.general && (
                <Text style={styles.errorInlineText} accessibilityRole="alert">
                  {joinErrors.general}
                </Text>
              )}

              <TouchableOpacity
                style={styles.primarySubmitBtn}
                onPress={handleJoinTeamSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.primarySubmitText}>{t('auth.joinTeamSubmitBtn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnCancelModal}
                onPress={() => setShowJoinTeamModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.btnCancelModalText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Safeguarding Policy Modal */}
        <Modal visible={showSafeguardingModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSafeguardingModal(false)}
          >
            <View style={styles.modalCardContainer} onStartShouldSetResponder={() => true}>
              <View style={styles.modalIconCircle}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2}>
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Svg>
              </View>
              <Text style={styles.modalTitleText}>{t('auth.modalTitle')}</Text>
              <Text style={styles.modalBodyText}>
                {t('auth.modalPreamble')}
                {'\n\n'}
                1. <Text style={styles.boldText}>{t('auth.modalPoint1Title')}</Text>: {t('auth.modalPoint1Desc')}
                {'\n\n'}
                2. <Text style={styles.boldText}>{t('auth.modalPoint2Title')}</Text>: {t('auth.modalPoint2Desc')}
                {'\n\n'}
                3. <Text style={styles.boldText}>{t('auth.modalPoint3Title')}</Text>: {t('auth.modalPoint3Desc')}
              </Text>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowSafeguardingModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseText}>{t('auth.modalCloseBtn')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 40 : 28,
    justifyContent: 'center',
    minHeight: '100%',
  },
  containerDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 48,
    alignItems: 'center',
  },
  mainLayoutWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  mainLayoutDesktop: {
    maxWidth: 960,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 48,
  },
  desktopHeroCol: {
    flex: 1.1,
    paddingRight: 24,
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  heroLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBrandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  heroMainHeading: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroSubHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  pillarsGrid: {
    gap: 12,
    marginBottom: 28,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  pillarText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  heroTrustBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  heroTrustText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  cardWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  cardWrapperDesktop: {
    flex: 1,
    maxWidth: 440,
  },
  headerGroup: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    marginBottom: 10,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 2,
  },
  headingSub: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    paddingVertical: 10,
  },
  eyeToggleBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorInlineText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  inlineInfoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inlineInfoText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  primarySubmitBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primarySubmitBtnDisabled: {
    opacity: 0.7,
  },
  primarySubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  demoEntrySection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  demoSectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  btnEnterDemo: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnEnterDemoText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  joinTeamRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 16,
  },
  joinTeamPromptText: {
    fontSize: 13,
    color: '#64748B',
  },
  joinTeamLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  footerBrandSection: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  footerBrandCaption: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  safeguardingInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 6,
  },
  safeguardingLinkTouch: {
    flexShrink: 1,
  },
  safeguardingSmallLink: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  demoModalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 8,
  },
  demoModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  demoModalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  demoModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  demoModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  demoOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  demoOptionHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoOptionTitles: {
    flex: 1,
  },
  demoOptionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  demoOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  btnContinueDemoRole: {
    backgroundColor: '#2F80ED',
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContinueDemoRoleText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnContinueDemoRoleLeader: {
    backgroundColor: '#F59E0B',
  },
  btnContinueDemoRoleLeaderText: {
    color: '#FFFFFF',
  },
  btnCancelModal: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnCancelModalText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalBodyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseBtn: {
    backgroundColor: '#2F80ED',
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
