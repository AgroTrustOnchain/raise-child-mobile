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
            <Ionicons name="camera-outline" size={32} color="#64748b" />
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
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
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
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
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
    backgroundColor: '#f8fafc',
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
    color: '#1e40af',
  },
  subtitle: {
    color: '#64748b',
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
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#fb923c',
  },
  card: {
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 14,
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
  },
  nameMuted: {
    fontWeight: '600',
    color: '#64748b',
  },
  asset: {
    fontSize: 12,
    color: '#94a3b8',
  },

  badge: {
    backgroundColor: '#fb923c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  giftBox: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
  },
  giftTitle: {
    fontWeight: '600',
  },
  giftSub: {
    fontSize: 12,
    color: '#64748b',
  },

  uploadBox: {
    marginTop: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 6,
    color: '#64748b',
  },

  confirmBtn: {
    marginTop: 16,
    backgroundColor: '#1e40af',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
  },

  statsCard: {
    marginTop: 20,
    backgroundColor: '#1e40af',
    padding: 20,
    borderRadius: 16,
  },
  statsLabel: {
    color: '#c7d2fe',
    fontSize: 12,
  },
  statsValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1e3a8a',
    borderRadius: 6,
    marginTop: 10,
  },
  progressFill: {
    width: '98%',
    height: '100%',
    backgroundColor: '#fb923c',
    borderRadius: 6,
  },
});

export default ConfirmReceiptsScreen;
