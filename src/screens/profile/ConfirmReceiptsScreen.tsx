import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ConfirmReceiptsScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Receipts</Text>
          <Text style={styles.subtitle}>Region: South Sector | 12 Pending</Text>
        </View>

        {/* Active Card */}
        <View style={styles.cardActive}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYM5EgDPrC0LiOxkFvipR9MbeSw4MG9rHa2hvaL_KjCYknOmbUYzMsfs7Fss7tMkdf1uN7OE3s_NhqwFW1wItCgCxtaTemm9TzXN1ksRwRlJK6OhDw43tONWHf_vNqQJesuXy8XjhKVWDxhZ_abiubwQm1xcpwuS4gnTR86E9Usb_AG_BgGhD6pQbN3WJ-73ezJASL6-7y8cOPD_a3nKfT1sSVzpPWOvbSV-YHiU4exH6juyzEHsgdrq2JzLArpxNeKcq8tMmQY99N' }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.name}>Abebe Selassie</Text>
                <Text style={styles.asset}>Asset ID: #TRUST-9021</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>URGENT</Text>
            </View>
          </View>

          <View style={styles.giftBox}>
            <Text style={styles.giftTitle}>Scholastic Kit (Grade 4)</Text>
            <Text style={styles.giftSub}>Gifted by Global Reach Foundation</Text>
          </View>

          {/* Upload */}
          <View style={styles.uploadBox}>
            <Ionicons name="camera-outline" size={32} color="#6B7280" />
            <Text style={styles.uploadText}>Upload delivery photo</Text>
          </View>

          <TouchableOpacity style={styles.confirmBtn}>
            <Text style={styles.confirmText}>Confirm Receipt</Text>
          </TouchableOpacity>
        </View>

        {/* Other Items */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpDPVonpwR5YM4vJpIiGETc-iJr5ZEtEwFa_H051e35BTFXEPTmojuKBoNSjMrszV7aA42MfpIllnKn3bqhQRu3wzg6vYUx7F3kei0ue_MRWUbhx0GBjSrwtK2s_ieX5piokKAw-9MtxePt-7Yp1GaR7zRsKqSVwP5ALWsfcdMBKxHUNCKCXKUwEirH9qDpy_PiuhZhuTGjb_ZyWpITygeAYi-MOitCkuCYuzZGydXJAep5784MnIuluK887PxA218HodDGFaiXRvh' }}
                style={styles.avatarSmall}
              />
              <View>
                <Text style={styles.nameMuted}>Fatima Diallo</Text>
                <Text style={styles.asset}>Livestock Supplement</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB92GEh6dTO5NVyGefntufNnt4AkSXPvxcKqKtMgXlXPHeU40r98OOr4YgDdEzuqSSMGW5Qc-4N-h31YpLAxZV2oFHg2yW74bpXS3yI_yYXcSyjVjRUB3lDC1F5vhMJftWjSnu74otOQ4qYJp3-QsbSi9oPCy9MB-ZV2re_KSQ6XmVv2SQc-FAx2Ssl4n40BqSWSUbGS9MB6cJtM5k0RU4PEgrBYtjSzJ-rMmc1zFnUg9ESjsjrBhSODcaoVxHb28XMD09gFkgFhh9J' }}
                style={styles.avatarSmall}
              />
              <View>
                <Text style={styles.nameMuted}>Kwame Osei</Text>
                <Text style={styles.asset}>Irrigation Toolset</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Trust Score</Text>
          <Text style={styles.statsValue}>98%</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E40AF',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardActive: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },

  name: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  nameMuted: {
    fontWeight: '600',
    color: '#6B7280',
  },
  asset: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  badge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  giftBox: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
  },
  giftTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  giftSub: {
    fontSize: 12,
    color: '#6B7280',
  },

  uploadBox: {
    marginTop: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 6,
    color: '#6B7280',
  },

  confirmBtn: {
    marginTop: 16,
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  statsCard: {
    marginTop: 20,
    backgroundColor: '#1E40AF',
    padding: 20,
    borderRadius: 16,
  },
  statsLabel: {
    color: '#DBEAFE',
    fontSize: 12,
  },
  statsValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    marginTop: 10,
  },
  progressFill: {
    width: '98%',
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 6,
  },
});

export default ConfirmReceiptsScreen;
