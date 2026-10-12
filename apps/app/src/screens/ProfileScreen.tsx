import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';
import { ScreenState } from '../components/ScreenState';

interface ProfileScreenProps {
  onBack?: () => void;
}

const COORDINATOR_ROLES = ['leader', 'coordinator', 'social_worker', 'admin'];

/** Account details from /api/auth/me. Settings, language and logout live in the "Thêm" tab. */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [user, setUser] = useState<{ name?: string; full_name?: string; email?: string; role?: string } | null>(null);

  const loadProfile = useCallback(() => {
    let isMounted = true;
    setStatus('loading');
    apiService
      .getProfile()
      .then((res) => {
        if (!isMounted) return;
        setUser(res.user ?? null);
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('[ProfileScreen] Get profile error:', err);
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => loadProfile(), [loadProfile]);

  const displayName = user?.name || user?.full_name || t('profile.defaultUserName');
  const displayRole = COORDINATOR_ROLES.includes(user?.role ?? '') ? t('profile.roleFieldLeader') : t('profile.roleVolunteer');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {onBack && (
        <TouchableOpacity style={styles.backHeader} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backHeaderText}>{t('common.back')}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.badge}>{t('profile.badge')}</Text>
      <Text style={styles.title}>{t('profile.title')}</Text>
      <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>

      {status === 'ready' ? (
        <View style={styles.profileBox}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.nameText}>{displayName}</Text>
            <Text style={styles.roleText}>{displayRole}</Text>
            {user?.email ? <Text style={styles.emailText}>{user.email}</Text> : null}
          </View>
        </View>
      ) : (
        <ScreenState kind={status} onRetry={loadProfile} />
      )}

      <View style={styles.footerAppInfo}>
        <Text style={styles.appInfoText}>{t('profile.appVersion')}</Text>
        <Text style={styles.appInfoSub}>{t('profile.projectTagline')}</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#2F6DBF',
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 19,
  },
  profileBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginBottom: 20,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E7F2FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 26,
  },
  profileText: {
    flex: 1,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16375D',
  },
  roleText: {
    fontSize: 12.5,
    color: '#2F80ED',
    fontWeight: '600',
    marginTop: 2,
  },
  emailText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  footerAppInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  backHeader: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  backHeaderText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16375D',
  },
  appInfoText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  appInfoSub: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
});
