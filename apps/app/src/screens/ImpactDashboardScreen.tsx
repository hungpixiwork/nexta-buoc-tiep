import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header, InfoCard, StatusBadge, ProgressBar } from '../components';
import { apiService } from '../services/api';

interface ImpactDashboardScreenProps {
  onCheckIn?: (personId: string) => void;
  onAvatarPress?: () => void;
  onBack?: () => void;
}

export const ImpactDashboardScreen: React.FC<ImpactDashboardScreenProps> = ({
  onCheckIn,
  onAvatarPress,
  onBack,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([
    {
      id: 'case-lan-01',
      name: 'Cô Lan (50 tuổi)',
      currentArea: 'Hóc Môn, TP.HCM',
      status: 'need_followup',
      safeNextStep: 'Sáng mai 09:00 gặp Cán bộ tư vấn Bàn số 3',
      priority: 'high',
    },
    {
      id: 'case-bay-02',
      name: 'Bác Tư (68 tuổi)',
      currentArea: 'Xã Tân Thới Nhì, Hóc Môn',
      status: 'referred',
      safeNextStep: 'Thứ 2 mang Sổ hộ khẩu/CCCD đến Trạm Y tế xã Tân Thới Nhì',
      priority: 'medium',
    },
    {
      id: 'case-minh-03',
      name: 'CHILD-2026-0922 (Em Hoàng 15t)',
      currentArea: 'Bến xe An Sương, Hóc Môn',
      status: 'safeguarded',
      safeNextStep: 'Bàn giao Mái ấm Ánh Sáng & Bảo vệ Hotline 111',
      priority: 'urgent',
    }
  ]);
  const [impactData, setImpactData] = useState({
    activeCases: 12,
    totalEncounters: 42,
    successfulReferrals: 28,
    safeguardingActions: 5,
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      apiService.getImpactSummary().catch(e => {
        console.warn('API getImpactSummary error:', e);
        return null;
      }),
      apiService.getCases().catch(e => {
        console.warn('API getCases error:', e);
        return null;
      })
    ]).then(([impactRes, casesRes]) => {
      if (isMounted) {
        if (impactRes && impactRes.data) {
          setImpactData({
            activeCases: impactRes.data.activeCases ?? 12,
            totalEncounters: impactRes.data.totalEncounters ?? 42,
            successfulReferrals: impactRes.data.successfulReferrals ?? 28,
            safeguardingActions: impactRes.data.safeguardingActions ?? 5,
          });
        }
        if (casesRes && casesRes.data) {
          setCases(casesRes.data);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const renderAvatar = (id: string) => {
    if (id === 'case-bay-02') {
      return (
        <Svg width={38} height={38} viewBox="0 0 24 24">
          <Path d="M6 9a6 6 0 0 1 12 0v1H6z" fill="#9AA3AB" />
          <Circle cx={12} cy={9.5} r={4} fill="#D9B8A0" />
          <Path d="M4 22c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5z" fill="#8296A8" />
        </Svg>
      );
    }
    if (id === 'case-minh-03') {
      return (
        <Svg width={38} height={38} viewBox="0 0 24 24">
          <Path d="M6 8.5a6 6 0 0 1 12 0v1H6z" fill="#4A3B2F" />
          <Circle cx={12} cy={10} r={3.8} fill="#E8C4A8" />
          <Path d="M4.5 22c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7z" fill="#5B86AD" />
        </Svg>
      );
    }
    // Default Cô Lan
    return (
      <Svg width={38} height={38} viewBox="0 0 24 24">
        <Path d="M6 9.5a6 6 0 0 1 12 0v1H6z" fill="#C9CDD2" />
        <Circle cx={12} cy={11} r={4} fill="#D9B8A0" />
        <Path d="M4.5 22c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7z" fill="#B98F76" />
      </Svg>
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header Navigation */}
      <Header showBack={!!onBack} onBack={onBack} onAvatarPress={onAvatarPress} />

      {/* Badge Bầu trời tháng này */}
      <View style={styles.monthBadge}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0085FF" strokeWidth={2}>
          <Path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </Svg>
        <Text style={styles.monthBadgeText}>BẦU TRỜI THÁNG NÀY</Text>
      </View>

      {/* Screen Title */}
      <Text style={styles.mainTitle}>
        Tháng 7,{'\n'}chúng ta đã quay lại.
      </Text>

      {/* 4 Thẻ Kết Quả Lớn Chuẩn Mockup 10 */}
      <View style={styles.bigCardsList}>
        {/* Thẻ 1: 30 người đã được lắng nghe */}
        <View style={styles.metricBigCard}>
          <View style={styles.metricLeft}>
            <View style={[styles.iconCircleRound, { backgroundColor: '#E0F2FE' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="#0085FF">
                <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </Svg>
            </View>
            <View style={styles.metricTextGroup}>
              <Text style={styles.metricNumberRow}>
                <Text style={styles.metricBigNumber}>30 </Text>
                <Text style={styles.metricUnit}>người</Text>
              </Text>
              <Text style={styles.metricDesc}>đã được lắng nghe.</Text>
            </View>
          </View>
          <Image
            source={require('../../assets/mockup_assets/impact-listen.jpg')}
            style={styles.metricImgRight}
            resizeMode="contain"
          />
        </View>

        {/* Thẻ 2: 22 người đã tìm thấy một bước tiếp theo */}
        <View style={styles.metricBigCard}>
          <View style={styles.metricLeft}>
            <View style={[styles.iconCircleRound, { backgroundColor: '#DCFCE7' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}>
                <Path d="M12 21v-7" />
                <Path d="M12 14c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" />
                <Path d="M12 14c0-2.8-1.8-4.7-4.5-5.3 0 2.8 1.8 4.7 4.5 5.3Z" />
              </Svg>
            </View>
            <View style={styles.metricTextGroup}>
              <Text style={styles.metricNumberRow}>
                <Text style={styles.metricBigNumber}>22 </Text>
                <Text style={styles.metricUnit}>người</Text>
              </Text>
              <Text style={styles.metricDesc}>đã tìm thấy một bước tiếp theo.</Text>
            </View>
          </View>
          <Image
            source={require('../../assets/mockup_assets/impact-step.jpg')}
            style={styles.metricImgRight}
            resizeMode="contain"
          />
        </View>

        {/* Thẻ 3: 18 người đã có người quay lại hỏi thăm */}
        <View style={styles.metricBigCard}>
          <View style={styles.metricLeft}>
            <View style={[styles.iconCircleRound, { backgroundColor: '#FEF3C7' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="#D97706">
                <Circle cx={8.5} cy={8.5} r={2.7} />
                <Circle cx={16} cy={9.5} r={2.2} />
                <Path d="M3 18c0-3 2.4-5.2 5.5-5.2S14 15 14 18z" />
                <Path d="M14 18c0-2.3 1.4-4.1 3.6-4.7 2.3.5 3.9 2.4 3.9 4.7z" />
              </Svg>
            </View>
            <View style={styles.metricTextGroup}>
              <Text style={styles.metricNumberRow}>
                <Text style={styles.metricBigNumber}>18 </Text>
                <Text style={styles.metricUnit}>người</Text>
              </Text>
              <Text style={styles.metricDesc}>đã có người quay lại hỏi thăm.</Text>
            </View>
          </View>
          <Image
            source={require('../../assets/mockup_assets/impact-care.jpg')}
            style={styles.metricImgRight}
            resizeMode="contain"
          />
        </View>

        {/* Thẻ 4: 11 người nói rằng một điều gì đó đã tốt hơn */}
        <View style={styles.metricBigCard}>
          <View style={styles.metricLeft}>
            <View style={[styles.iconCircleRound, { backgroundColor: '#F3E8FF' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={2}>
                <Circle cx={12} cy={12} r={4} />
                <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </Svg>
            </View>
            <View style={styles.metricTextGroup}>
              <Text style={styles.metricNumberRow}>
                <Text style={styles.metricBigNumber}>11 </Text>
                <Text style={styles.metricUnit}>người</Text>
              </Text>
              <Text style={styles.metricDesc}>nói rằng một điều gì đó{'\n'}đã tốt hơn.</Text>
            </View>
          </View>
          <Image
            source={require('../../assets/mockup_assets/impact-sun.jpg')}
            style={styles.metricImgRight}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Sub-section: Những kết quả nhỏ, đầy ý nghĩa */}
      <Text style={styles.subSectionTitle}>Những kết quả nhỏ, đầy ý nghĩa</Text>
      <View style={styles.smallMetricsRow}>
        <View style={styles.smallMetricBox}>
          <View style={styles.smallMetricHeader}>
            <Text style={{ fontSize: 16 }}>💼</Text>
            <Text style={styles.smallMetricNum}>5 người</Text>
          </View>
          <Text style={styles.smallMetricLabel}>sinh kế / việc làm</Text>
        </View>

        <View style={styles.smallMetricBox}>
          <View style={styles.smallMetricHeader}>
            <Text style={{ fontSize: 16 }}>💚</Text>
            <Text style={styles.smallMetricNum}>3 người</Text>
          </View>
          <Text style={styles.smallMetricLabel}>y tế / an sinh</Text>
        </View>

        <View style={styles.smallMetricBox}>
          <View style={styles.smallMetricHeader}>
            <Text style={{ fontSize: 16 }}>👶</Text>
            <Text style={styles.smallMetricNum}>2 trẻ em</Text>
          </View>
          <Text style={styles.smallMetricLabel}>được chuyển đến môi trường bảo vệ</Text>
        </View>

        <View style={styles.smallMetricBox}>
          <View style={styles.smallMetricHeader}>
            <Text style={{ fontSize: 16 }}>📄</Text>
            <Text style={styles.smallMetricNum}>1 người</Text>
          </View>
          <Text style={styles.smallMetricLabel}>hoàn thành giấy tờ</Text>
        </View>
      </View>

      {/* Footer Banner: Và vẫn còn 7 người đang trên đường */}
      <View style={styles.footerWalkCard}>
        <Image
          source={require('../../assets/mockup_assets/impact-two-walking.jpg')}
          style={styles.footerWalkImg}
          resizeMode="contain"
        />
        <View style={styles.footerWalkRight}>
          <Text style={styles.footerWalkText}>
            Và vẫn còn <Text style={{ color: '#0085FF', fontWeight: '800' }}>7 người</Text> đang trên đường.
          </Text>
          <TouchableOpacity
            style={styles.btnContinueJourney}
            onPress={() => onCheckIn?.('case-lan-01')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnContinueJourneyText}>Tiếp tục đồng hành</Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4}>
              <Path d="M4 12h15M13 6l6 6-6 6" />
            </Svg>
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
  monthBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 6,
    marginBottom: 8,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0085FF',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0F2C59',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  bigCardsList: {
    gap: 12,
    marginBottom: 20,
  },
  metricBigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    minHeight: 88,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircleRound: {
    flexShrink: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTextGroup: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  metricNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricBigNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0085FF',
  },
  metricUnit: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F2C59',
  },
  metricDesc: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginTop: 1,
  },
  metricImgRight: {
    flexShrink: 0,
    marginLeft: 8,
    width: 84,
    height: 52,
    borderRadius: 10,
  },
  subSectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F2C59',
    marginBottom: 10,
  },
  smallMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  smallMetricBox: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    minHeight: 76,
  },
  smallMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  smallMetricNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0085FF',
  },
  smallMetricLabel: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
  },
  footerWalkCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  footerWalkImg: {
    width: 65,
    height: 70,
    borderRadius: 10,
  },
  footerWalkRight: {
    flex: 1,
  },
  footerWalkText: {
    fontSize: 13.5,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 8,
  },
  btnContinueJourney: {
    backgroundColor: '#0085FF',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    shadowColor: '#0085FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnContinueJourneyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: '#334155',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16375D',
    marginBottom: 12,
  },
  cardList: {
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16375D',
  },
  personSub: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
    marginTop: 1,
  },
  stepInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
});
