import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { initAppLanguage } from './src/i18n';
import { apiService } from './src/services/api';
import { setupAutoSyncListener } from './src/storage';

import { BottomNav } from './src/components/BottomNav';

import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { BeforeYouGoScreen } from './src/screens/BeforeYouGoScreen';
import { PrioritySelectionScreen } from './src/screens/PrioritySelectionScreen';
import { VoiceListeningScreen } from './src/screens/VoiceListeningScreen';
import { CheckInScreen } from './src/screens/CheckInScreen';
import { MilScreen } from './src/screens/MilScreen';
import { ResourceDirectoryScreen } from './src/screens/ResourceDirectoryScreen';
import { LivelihoodPassportScreen } from './src/screens/LivelihoodPassportScreen';
import { ImpactDashboardScreen } from './src/screens/ImpactDashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TaskAssignmentScreen } from './src/screens/TaskAssignmentScreen';
import { TeamScreen } from './src/screens/TeamScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { SafeguardingReviewScreen } from './src/screens/SafeguardingReviewScreen';
import { VerifiedInfoCardScreen } from './src/screens/VerifiedInfoCardScreen';
import { PhotoIntakeScreen } from './src/screens/PhotoIntakeScreen';

export interface UserSession {
  name: string;
  role: 'volunteer' | 'leader';
  email: string;
}

export default function App() {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [subScreen, setSubScreen] = useState<string>('none');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<any>('health');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        await initAppLanguage();
        const token = await AsyncStorage.getItem('@buoc_tiep_jwt_token');
        const role = await AsyncStorage.getItem('@buoc_tiep_user_role');
        const savedName = await AsyncStorage.getItem('@buoc_tiep_user_name');
        const savedEmail = await AsyncStorage.getItem('@buoc_tiep_user_email');
        if (token && role) {
          setCurrentUser({
            name: savedName || (role === 'leader' ? 'Trần Văn Cường' : 'Nguyễn Văn Hưng'),
            role: role as 'volunteer' | 'leader',
            email: savedEmail || (role === 'leader' ? 'cuong.tran@buoctiep.vn' : 'volunteer@buoctiep.vn'),
          });
        }
      } catch (e) {
        console.warn('Failed to restore session', e);
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTabChange = (index: number) => {
    setSubScreen('none');
    setActiveTab(index);
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('@buoc_tiep_jwt_token');
      await AsyncStorage.removeItem('@buoc_tiep_user_role');
      await AsyncStorage.removeItem('@buoc_tiep_user_name');
      await AsyncStorage.removeItem('@buoc_tiep_user_email');
    } catch (e) {
      console.warn('Failed to clear AsyncStorage on logout', e);
    }
    setCurrentUser(null);
    setSubScreen('none');
    setActiveTab(0);
  };

  const handleLogout = async () => {
    await clearSession();
    showToast(t('app.toastLogout'));
  };

  // An expired or invalid token (401) sends the user back to the login screen.
  useEffect(() => {
    apiService.onUnauthorized(() => {
      clearSession();
    });
    return () => apiService.onUnauthorized(null);
  }, []);

  // While signed in, replay the offline queue when the network comes back.
  useEffect(() => {
    if (!currentUser) return;
    return setupAutoSyncListener(apiService);
  }, [currentUser]);

  // If user is not authenticated -> Render LoginScreen
  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="dark" />
        <Text style={{ marginTop: 10, color: '#2f80ed' }}>{t('app.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {toastMessage && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>✅ {toastMessage}</Text>
          </View>
        )}
        <LoginScreen
          onLoginSuccess={async (user) => {
            try {
              await AsyncStorage.setItem('@buoc_tiep_user_name', user.name);
              await AsyncStorage.setItem('@buoc_tiep_user_email', user.email);
            } catch (e) {
              console.warn('Failed to save user details to AsyncStorage', e);
            }
            setCurrentUser(user);
            showToast(t('app.toastWelcomeBack', { name: user.name }));
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Floating Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>✅ {toastMessage}</Text>
        </View>
      )}

      {/* Main Screen Router */}
      <View style={styles.content}>
        {/* SUB SCREENS (FULL SCREEN MODAL FLOWS) */}
        {subScreen === 'checkin' && (
          <CheckInScreen
            personId={selectedPersonId ?? undefined}
            onComplete={() => {
              setSubScreen('none');
              showToast(t('app.toastCheckinSaved'));
            }}
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'passport' && (
          <LivelihoodPassportScreen
            caseId={selectedPersonId ?? undefined}
            onBack={() => setSubScreen('voice_listening')}
            onConnectJob={() => {
              setSubScreen('resources');
              showToast(t('app.toastPassportApproved'));
            }}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'profile' && (
          <ProfileScreen onBack={() => setSubScreen('none')} />
        )}

        {subScreen === 'before_you_go' && (
          <BeforeYouGoScreen
            onReady={() => setSubScreen('priority_selection')}
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'priority_selection' && (
          <PrioritySelectionScreen
            selectedPriority={selectedPriority}
            onSelectPriority={(key) => setSelectedPriority(key)}
            onConfirm={() => {
              setSubScreen('voice_listening');
              showToast(t('app.toastPrioritySelected'));
            }}
            onBack={() => setSubScreen('before_you_go')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'voice_listening' && (
          <VoiceListeningScreen
            priority={selectedPriority}
            onApproved={(caseId) => {
              if (caseId) {
                setSelectedPersonId(caseId);
                showToast(t('app.toastVoiceSaved'));
              }
              setSubScreen('passport');
            }}
            onBack={() => setSubScreen('priority_selection')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'photo_intake' && (
          <PhotoIntakeScreen
            onApproved={(caseId) => {
              if (caseId) {
                setSelectedPersonId(caseId);
                showToast(t('app.toastPhotoIntakeSaved'));
              }
              setSubScreen('passport');
            }}
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'task_assignment' && (
          <TaskAssignmentScreen
            caseId={selectedPersonId ?? undefined}
            userName={currentUser.name}
            onAcceptTask={() => {
              setSubScreen('none');
              showToast(t('app.toastTaskAccepted'));
            }}
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'resources' && (
          <ResourceDirectoryScreen
            caseId={selectedPersonId ?? undefined}
            onReferCase={(name) => {
              showToast(t('app.toastResourceReferred', { name }));
            }}
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'mil' && (
          <MilScreen
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'safeguarding_review' && (
          <SafeguardingReviewScreen
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {subScreen === 'verified_card' && (
          <VerifiedInfoCardScreen
            onBack={() => setSubScreen('none')}
            onAvatarPress={() => setSubScreen('profile')}
          />
        )}

        {/* MAIN TAB SCREENS (4 BOTTOM TABS) */}
        {subScreen === 'none' && (
          <>
            {/* Tab 0: Hôm nay */}
            {activeTab === 0 && (
              <HomeScreen
                onStartJourney={() => setSubScreen('before_you_go')}
                onCheckIn={(personId) => {
                  setSelectedPersonId(personId ?? null);
                  setSubScreen('checkin');
                }}
                onListenNew={() => setSubScreen('photo_intake')}
                onAvatarPress={() => setSubScreen('profile')}
                onOpenDrafts={() => {
                  setSubScreen('none');
                  setActiveTab(3);
                }}
              />
            )}

            {/* Tab 1: Hành trình */}
            {activeTab === 1 && (
              <ImpactDashboardScreen
                onCheckIn={(personId) => {
                  setSelectedPersonId(personId ?? null);
                  setSubScreen('checkin');
                }}
                onAvatarPress={() => setSubScreen('profile')}
              />
            )}

            {/* Tab 2: Đội */}
            {activeTab === 2 && (
              <TeamScreen
                onStartJourney={() => setSubScreen('before_you_go')}
                onCheckIn={(personId) => {
                  setSelectedPersonId(personId ?? null);
                  setSubScreen('checkin');
                }}
                onAvatarPress={() => setSubScreen('profile')}
                onAssignTask={() => setSubScreen('task_assignment')}
              />
            )}

            {/* Tab 3: Thêm */}
            {activeTab === 3 && (
              <MoreScreen
                onNavigateToImpact={() => setActiveTab(1)}
                onNavigateToMil={() => setSubScreen('mil')}
                onNavigateToBeforeYouGo={() => setSubScreen('before_you_go')}
                onNavigateToResources={() => setSubScreen('resources')}
                onNavigateToProfile={() => setSubScreen('profile')}
                onNavigateToSafeguarding={() => setSubScreen('safeguarding_review')}
                onNavigateToVerifiedCard={() => setSubScreen('verified_card')}
                onAvatarPress={() => setSubScreen('profile')}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </View>

      {/* Standard 4-Button Bottom Navigation bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fafe',
  },
  content: {
    flex: 1,
  },
  toastBanner: {
    position: 'absolute',
    bottom: 88,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
