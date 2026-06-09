import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Dimensions,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getChildById } from '../../services/child.service';
import WalrusImage from '../../components/WalrusImage';
import {
  SupportType,
  submitSponsorship,
  getBookNeedDetails,
  getMealNeedDetails,
  getHealthInsuranceNeedDetails,
} from '../../services/sponsorship.service';
import { getPaymentStatus } from '../../services/payment.service';
import { formatVND, formatVNDNumber } from '../../utils/currency';
import { useModal } from '../../context/ModalContext';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;
const SUCCESS_STATUSES = new Set(["PAID", "paid", "SUCCESS", "Success", "success", "completed", "COMPLETED"]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "Cancelled", "cancelled", "CANCELED", "canceled"]);

const { width } = Dimensions.get('window');


const ChildDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const modal = useModal();

  const [beneficiary, setBeneficiary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [mealValue, setMealValue] = useState(100000);
  const [healthValue, setHealthValue] = useState(0);
  const [healthFunded, setHealthFunded] = useState(false);
  const [healthSupportedYears, setHealthSupportedYears] = useState<number[]>([]);
  const [mealDurations, setMealDurations] = useState<{ start_period: string; end_period: string }[]>([]);
  const [mealSupportedMonths, setMealSupportedMonths] = useState(0);

  // Books: one entry per semester (typically 2)
  type BookSemester = {
    needId: string;
    value: number;
    semester: number;
    funded: boolean;
  };
  const [bookSemesters, setBookSemesters] = useState<BookSemester[]>([]);
  const [selectedBookSemester, setSelectedBookSemester] = useState<number>(0);
  const [selectedSupport, setSelectedSupport] = useState<SupportType>('books');
  const [mealMonths, setMealMonths] = useState('3');
  const [recurringEnabled, setRecurringEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment polling
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const paymentIdRef = useRef<string | number | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const resolvedRef = useRef(false);

  const clearPoll = () => {
    if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null; }
  };

  useEffect(() => () => clearPoll(), []);

  const navigateToResult = useCallback((
    result: 'success' | 'cancelled',
    data: { amount?: number; description?: string }
  ) => {
    resolvedRef.current = true;
    clearPoll();
    if (result === 'cancelled') {
      navigation.replace('PaymentCallbackScreen', {
        status: 'cancelled',
        title: 'Giao dịch đã bị huỷ',
        message: 'Giao dịch đã bị huỷ bởi người dùng hoặc hệ thống thanh toán.',
      });
      return;
    }
    const parts: string[] = [];
    if (typeof data.amount === 'number' && data.amount > 0) {
      parts.push(`Khoản thanh toán ${formatVNDNumber(data.amount)}đ đã được ghi nhận.`);
    } else {
      parts.push('Khoản thanh toán của bạn đã được ghi nhận.');
    }
    if (data.description) parts.push(data.description);
    navigation.replace('PaymentCallbackScreen', {
      status: 'success',
      title: 'Bảo trợ thành công!',
      message: parts.join(' '),
    });
  }, [navigation]);

  const checkStatus = useCallback(async () => {
    const pid = paymentIdRef.current;
    if (!pid || resolvedRef.current) return;
    try {
      const data = await getPaymentStatus(pid);
      const status = data.status ?? '';
      setPaymentStatus(status);
      if (SUCCESS_STATUSES.has(status)) { navigateToResult('success', data); return; }
      if (CANCELLED_STATUSES.has(status)) { navigateToResult('cancelled', data); return; }
    } catch { /* keep polling */ }
    pollCountRef.current += 1;
    if (pollCountRef.current < MAX_POLLS) {
      pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
    }
  }, [navigateToResult]);

  useEffect(() => {
    const params = route.params as { childId?: string } | undefined;
    const id = params?.childId as string | undefined;
    if (id) loadChild(id);
  }, [route.params]);

  const loadChild = async (id: string) => {
    try {
      setLoading(true);
      const c = await getChildById(id);
      // console.log(c)
      const mapped = {
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        age: (() => {
          if (!c.date_of_birth) return undefined;
          const b = new Date(c.date_of_birth);
          const now = new Date();
          let age = now.getFullYear() - b.getFullYear();
          const m = now.getMonth() - b.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
          return age;
        })(),
        grade: 0,
        avatarBlobId: c.avatar_blob_id || undefined,
        homeBlobId: c.home_blob_id || undefined,
        birthCertBlobId: c.birth_certificate_blob_id || undefined,
        campaign: c.region || c.uploaded_by || '',
        status: 'Awaiting Sponsor',
        address: c.home_address || 'Not provided',
        firstGuardian: c.first_guardian ? {
          name: c.first_guardian.guardian_full_name || 'Not provided',
          phone: c.first_guardian.guardian_phone_number || 'Not provided',
          relation: c.first_guardian.guardian_relation || 'Not provided',
          identityCardBlobId: c.first_guardian.identity_card_blob_id || undefined,
        } : null,
        secondGuardian: c.second_guardian ? {
          name: c.second_guardian.guardian_full_name || 'Not provided',
          phone: c.second_guardian.guardian_phone_number || 'Not provided',
          relation: c.second_guardian.guardian_relation || 'Not provided',
          identityCardBlobId: c.second_guardian.identity_card_blob_id || undefined,
        } : null,
        story: c.story || 'No story provided',
        needs: {
          books: c.books_needs || false,
          healthInsurance: c.health_insurance_need || false,
          meals: c.meal_need || false,
          specialNeeds: c.special_need_proposals || 'None',
          gifts: c.gifts || false,
        },
        raw: c,
      };
      setBeneficiary(mapped);

      // Fetch need values in parallel — books are one entry per semester
      const bookIds: string[] = c.books_needs ?? [];
      const [bookResults, mealRes, healthRes] = await Promise.all([
        Promise.allSettled(bookIds.map((id) => getBookNeedDetails(id))),
        c.meal_need ? getMealNeedDetails(c.meal_need).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        ) : Promise.resolve({ status: 'rejected' as const, reason: 'no meal need' }),
        c.health_insurance_need ? getHealthInsuranceNeedDetails(c.health_insurance_need).then(
          (v) => ({ status: 'fulfilled' as const, value: v }),
          (e) => ({ status: 'rejected' as const, reason: e }),
        ) : Promise.resolve({ status: 'rejected' as const, reason: 'no health need' }),
      ]);

      const semesters: BookSemester[] = bookResults
        .map((r, i) => {
          if (r.status !== 'fulfilled') return null;
          return {
            needId: bookIds[i],
            value: r.value.value,
            semester: r.value.semester ?? i + 1,
            funded: (r.value.donations ?? []).length > 0,
          };
        })
        .filter((s): s is BookSemester => s !== null);
      setBookSemesters(semesters);

      const mealMonthsThisYear = mealRes.status === 'fulfilled'
        ? (mealRes.value.supported_years ?? []).find((s) => s.year === new Date().getFullYear())?.supported_months ?? 0
        : 0;
      const mealDone = mealMonthsThisYear >= 12;
      const isHealthFunded =
        healthRes.status === 'fulfilled' && (healthRes.value.donations ?? []).length > 0;

      const firstAvailableSemester = semesters.findIndex((s) => !s.funded);
      const anyBookAvailable = firstAvailableSemester >= 0;
      setSelectedBookSemester(firstAvailableSemester >= 0 ? firstAvailableSemester : 0);

      // Default selected support to first AVAILABLE need
      if (anyBookAvailable) setSelectedSupport('books');
      else if (c.meal_need && !mealDone) setSelectedSupport('meals');
      else if (c.health_insurance_need && !isHealthFunded) setSelectedSupport('health');
      else setSelectedSupport(null);

      if (mealRes.status === 'fulfilled') {
        setMealValue(mealRes.value.value);
        setMealDurations(mealRes.value.durations ?? []);
        setMealSupportedMonths(mealMonthsThisYear);
        const remaining = Math.max(0, 12 - mealMonthsThisYear);
        if (remaining > 0) setMealMonths(String(Math.min(3, remaining)));
      }
      if (healthRes.status === 'fulfilled') {
        setHealthValue(healthRes.value.value);
        setHealthSupportedYears(healthRes.value.supported_years ?? []);
        setHealthFunded(isHealthFunded);
      }
    } catch (e) {
      console.warn('loadChild failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!selectedSupport) {
      modal.warning('Lỗi', 'Vui lòng chọn loại hỗ trợ');
      return;
    }
    if (!beneficiary) return;
    const { raw } = beneficiary;
    const months = parseInt(mealMonths, 10);
    if (selectedSupport === 'meals' && (!months || months < 1)) {
      modal.warning('Lỗi', 'Vui lòng nhập số tháng hợp lệ');
      return;
    }
    if (selectedSupport === 'meals' && months > mealRemainingMonths) {
      modal.warning('Lỗi', `Chỉ còn ${mealRemainingMonths} tháng có thể hỗ trợ trong năm nay (tối đa 12 tháng/năm).`);
      return;
    }
    try {
      setIsSubmitting(true);
      let res;
      if (selectedSupport === 'books') {
        const sem = bookSemesters[selectedBookSemester];
        if (!sem || sem.funded) {
          modal.warning('Lỗi', 'Học kỳ này đã được hỗ trợ.');
          return;
        }
        res = await submitSponsorship({ type: 'books', childId: sem.needId });
      } else if (selectedSupport === 'meals') {
        res = await submitSponsorship({ type: 'meals', childId: raw.meal_need, months });
      } else if (selectedSupport === 'health') {
        res = await submitSponsorship({ type: 'health', childId: raw.health_insurance_need });
      }
      console.log(res)
      if (res?.url) {
        const supported = await Linking.canOpenURL(res.url);
        if (supported) await Linking.openURL(res.url);
        else modal.error('Lỗi', 'Không thể mở liên kết thanh toán.');

        const pid = res.payment_id ?? res.order_code ?? res.id ?? null;
        if (pid) {
          paymentIdRef.current = pid;
          pollCountRef.current = 0;
          resolvedRef.current = false;
          setPaymentStatus(null);
          setWaitingPayment(true);
          pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
        }
      } else {
        modal.success(
          'Đã gửi bảo trợ!',
          `Hỗ trợ của bạn cho ${beneficiary.name} đã được xác nhận.`,
          () => navigation.goBack(),
        );
      }
    } catch (err: any) {
      modal.error('Xác nhận thất bại', err.message || 'Vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCheck = async () => {
    const pid = paymentIdRef.current;
    if (!pid) return;
    setChecking(true);
    clearPoll();
    try {
      const data = await getPaymentStatus(pid);
      const status = data.status ?? '';
      setPaymentStatus(status);
      if (SUCCESS_STATUSES.has(status)) {
        navigateToResult('success', data);
      } else if (CANCELLED_STATUSES.has(status)) {
        navigateToResult('cancelled', data);
      } else {
        modal.info('Chưa xác nhận', `Trạng thái: ${status || 'Đang xử lý'}. Vui lòng thử lại sau vài giây.`);
        pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
      }
    } catch {
      modal.error('Lỗi', 'Không thể kiểm tra trạng thái. Vui lòng thử lại.');
      pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
    } finally {
      setChecking(false);
    }
  };

  const handleCancelWaiting = () => {
    clearPoll();
    setWaitingPayment(false);
    setPaymentStatus(null);
    paymentIdRef.current = null;
    pollCountRef.current = 0;
    resolvedRef.current = false;
  };

  const handleProof = () => {
    navigation.navigate('ProofScreen', { childId: beneficiary.id, hideValue: true });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Help sponsor ${beneficiary.name} - ${beneficiary.campaign}`,
        title: 'AgroTrust Sponsorship',
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (waitingPayment) {
    const timedOut = pollCountRef.current >= MAX_POLLS;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancelWaiting}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bảo trợ {beneficiary?.name}</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="card-outline" size={40} color="#1E40AF" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            Đang chờ thanh toán
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
            Hoàn tất thanh toán trên trình duyệt. Ứng dụng sẽ tự động chuyển khi giao dịch thành công.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE' }}>
            <ActivityIndicator size="small" color={timedOut ? '#9CA3AF' : '#1E40AF'} animating={!timedOut && !resolvedRef.current} />
            <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF', fontWeight: '500', lineHeight: 18 }}>
              {timedOut ? 'Tự động kiểm tra đã hết thời gian — nhấn nút bên dưới để xác nhận' : paymentStatus ? `Trạng thái: ${paymentStatus}` : 'Đang tự động kiểm tra trạng thái thanh toán…'}
            </Text>
          </View>
          <TouchableOpacity
            style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E40AF', height: 60, borderRadius: 16, width: '100%', marginBottom: 12, elevation: 4 }, checking && { opacity: 0.6 }]}
            onPress={handleManualCheck}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF' }}>Tôi đã thanh toán xong</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 24 }} onPress={handleCancelWaiting} activeOpacity={0.7}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Huỷ giao dịch</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!beneficiary) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Không có dữ liệu trẻ em</Text>
      </View>
    );
  }

  const { raw } = beneficiary;
  const hasBooks = bookSemesters.some((s) => s.value > 0);
  const hasMeals = !!raw.meal_need && mealValue > 0;
  const hasHealth = !!raw.health_insurance_need && healthValue > 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const healthSupported = healthSupportedYears.includes(currentYear) || healthFunded;
  // getMonth() is 0-based: Jan=0, Dec=11 → months left including current = 12 - getMonth()
  const monthsLeftInYear = 12 - now.getMonth();
  const mealRemainingMonths = Math.max(0, Math.min(12 - mealSupportedMonths, monthsLeftInYear));
  const mealSupported = mealRemainingMonths === 0;

  const formatPeriod = (p: string) => {
    if (!p) return '';
    const d = new Date(p);
    if (isNaN(d.getTime())) return p;
    return d.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
  };
  const mealDurationLabel = mealDurations
    .map((d) => `${formatPeriod(d.start_period)} – ${formatPeriod(d.end_period)}`)
    .join(', ');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{beneficiary.name}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <WalrusImage blobId={beneficiary.avatarBlobId} style={styles.heroImage} resizeMode="cover" fallbackIconSize={48} />
        </View>

        <View style={styles.content}>
          {/* Region Card */}
          <View style={styles.card}>
            <View style={styles.regionCardContent}>
              <View style={styles.regionIconContainer}>
                <Ionicons name="location" size={20} color="#1E40AF" />
              </View>
              <View style={styles.regionInfo}>
                <Text style={styles.regionLabel}>Vùng</Text>
                <Text style={styles.regionTitle}>{beneficiary.campaign}</Text>
              </View>
            </View>
          </View>

          {/* Story & Needs Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Câu chuyện & Nhu cầu</Text>

            {beneficiary.story && (
              <View style={styles.storySection}>
                <Text style={styles.storyLabel}>Câu chuyện</Text>
                <Text style={styles.storyText}>{beneficiary.story}</Text>
              </View>
            )}

            {(beneficiary.firstGuardian || beneficiary.secondGuardian) && (
              <View>
                <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 12, marginTop: 16 }]}>Người giám hộ</Text>
                {beneficiary.firstGuardian && (
                  <View style={styles.guardianCard}>
                    <View style={styles.guardianHeader}>
                      <View style={styles.guardianIconContainer}>
                        <Ionicons name="people" size={20} color="#1E40AF" />
                      </View>
                      <View style={styles.guardianHeaderContent}>
                        <Text style={styles.guardianRelation}>{beneficiary.firstGuardian.relation}</Text>
                        <Text style={styles.guardianName}>{beneficiary.firstGuardian.name}</Text>
                      </View>
                    </View>
                    <View style={styles.guardianDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="call" size={16} color="#6B7280" style={styles.detailIcon} />
                        <Text style={styles.detailValue}>{beneficiary.firstGuardian.phone}</Text>
                      </View>
                    </View>
                    {beneficiary.firstGuardian.identityCardBlobId && (
                      <View style={styles.idCardBlock}>
                        <Text style={styles.idCardLabel}>CMND/CCCD</Text>
                        <WalrusImage blobId={beneficiary.firstGuardian.identityCardBlobId} style={styles.idCardImage} resizeMode="cover" />
                      </View>
                    )}
                  </View>
                )}
                {beneficiary.secondGuardian && (
                  <View style={styles.guardianCard}>
                    <View style={styles.guardianHeader}>
                      <View style={styles.guardianIconContainer}>
                        <Ionicons name="people" size={20} color="#1E40AF" />
                      </View>
                      <View style={styles.guardianHeaderContent}>
                        <Text style={styles.guardianRelation}>{beneficiary.secondGuardian.relation}</Text>
                        <Text style={styles.guardianName}>{beneficiary.secondGuardian.name}</Text>
                      </View>
                    </View>
                    <View style={styles.guardianDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="call" size={16} color="#6B7280" style={styles.detailIcon} />
                        <Text style={styles.detailValue}>{beneficiary.secondGuardian.phone}</Text>
                      </View>
                    </View>
                    {beneficiary.secondGuardian.identityCardBlobId && (
                      <View style={styles.idCardBlock}>
                        <Text style={styles.idCardLabel}>CMND/CCCD</Text>
                        <WalrusImage blobId={beneficiary.secondGuardian.identityCardBlobId} style={styles.idCardImage} resizeMode="cover" />
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {beneficiary.address && (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location" size={18} color="#1E40AF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Địa chỉ</Text>
                    <Text style={styles.infoValue}>{beneficiary.address}</Text>
                  </View>
                </View>
              </View>
            )}

            {beneficiary.homeBlobId && (
              <View style={styles.blobImageBlock}>
                <Text style={styles.idCardLabel}>Ảnh nơi ở</Text>
                <WalrusImage blobId={beneficiary.homeBlobId} style={styles.blobImage} resizeMode="cover" />
              </View>
            )}
            {beneficiary.birthCertBlobId && (
              <View style={styles.blobImageBlock}>
                <Text style={styles.idCardLabel}>Giấy khai sinh</Text>
                <WalrusImage blobId={beneficiary.birthCertBlobId} style={styles.blobImage} resizeMode="cover" />
              </View>
            )}
          </View>

          {/* Transparency Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Minh bạch</Text>
            <View style={styles.blockchainCard}>
              <View style={styles.blockchainIcon}>
                <Ionicons name="shield-checkmark" size={80} color="rgba(30, 64, 175, 0.1)" />
              </View>
              <View style={styles.blockchainContent}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#1E40AF" />
                  <Text style={styles.verifiedText}>ĐÃ XÁC MINH BLOCKCHAIN</Text>
                </View>
                <Text style={styles.blockchainDescription}>
                  Đóng góp của bạn được bảo mật và theo dõi trên blockchain để đảm bảo minh bạch hoàn toàn.
                </Text>
              </View>
            </View>
          </View>

          {/* Impact Proof */}
          <TouchableOpacity style={styles.proofCard} onPress={handleProof} activeOpacity={0.8}>
            <View style={styles.proofCardLeft}>
              <View style={styles.proofIconContainer}>
                <Ionicons name="receipt-outline" size={22} color="#1E40AF" />
              </View>
              <View>
                <Text style={styles.proofCardTitle}>Bằng chứng tác động</Text>
                <Text style={styles.proofCardSubtitle}>Xem dòng thời gian blockchain đã xác minh</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#1E40AF" />
          </TouchableOpacity>

          {/* ── Support Type Selection ───────────────────────────────────────── */}
          {!(hasBooks || hasMeals || hasHealth) && (
            <View style={styles.card}>
              <View style={styles.noNeedsRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
                <Text style={styles.noNeedsText}>
                  Trẻ này hiện chưa có nhu cầu hỗ trợ đang mở.
                </Text>
              </View>
            </View>
          )}
          {(hasBooks || hasMeals || hasHealth) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Chọn loại hỗ trợ</Text>

              {hasBooks && bookSemesters.map((sem, idx) => {
                const isSelected = selectedSupport === 'books' && selectedBookSemester === idx;
                return (
                  <TouchableOpacity
                    key={sem.needId}
                    style={[
                      styles.supportOption,
                      isSelected && !sem.funded && styles.supportOptionSelected,
                      sem.funded && styles.supportOptionDisabled,
                    ]}
                    onPress={() => {
                      if (sem.funded) return;
                      setSelectedSupport('books');
                      setSelectedBookSemester(idx);
                    }}
                    disabled={sem.funded}
                    activeOpacity={0.8}
                  >
                    <View style={styles.supportOptionLeft}>
                      <View style={[styles.supportIconContainer, isSelected && !sem.funded && styles.supportIconContainerSelected]}>
                        <Ionicons name="book-outline" size={22} color={isSelected && !sem.funded ? '#FFFFFF' : '#1E40AF'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.supportOptionTitle}>Sách giáo khoa - Học kỳ {sem.semester}</Text>
                        {sem.funded && (
                          <Text style={styles.supportedNote}>Đã có người hỗ trợ học kỳ này</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.supportOptionRight}>
                      <Text style={styles.supportOptionPrice}>{formatVND(sem.value)}</Text>
                      <Text style={styles.supportOptionFrequency}>Mỗi học kỳ</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {hasMeals && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.supportOption,
                      selectedSupport === 'meals' && !mealSupported && styles.supportOptionSelected,
                      mealSupported && styles.supportOptionDisabled,
                    ]}
                    onPress={() => !mealSupported && setSelectedSupport('meals')}
                    disabled={mealSupported}
                    activeOpacity={0.8}
                  >
                    <View style={styles.supportOptionLeft}>
                      <View style={[styles.supportIconContainer, selectedSupport === 'meals' && !mealSupported && styles.supportIconContainerSelected]}>
                        <Ionicons name="restaurant-outline" size={22} color={selectedSupport === 'meals' && !mealSupported ? '#FFFFFF' : '#1E40AF'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.supportOptionTitle}>Bữa ăn hàng tháng</Text>
                        {mealSupported ? (
                          <Text style={styles.supportedNote}>Đã đủ 12 tháng năm {currentYear}{mealDurationLabel ? ` (${mealDurationLabel})` : ''}</Text>
                        ) : mealSupportedMonths > 0 ? (
                          <Text style={styles.supportedNote}>Đã hỗ trợ {mealSupportedMonths}/{mealRemainingMonths + 1} tháng — còn lại {mealRemainingMonths} tháng</Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.supportOptionRight}>
                      <Text style={styles.supportOptionPrice}>{formatVND(mealValue * parseInt(mealMonths || '1'))}</Text>
                      <Text style={styles.supportOptionFrequency}>{formatVND(mealValue)}/month</Text>
                    </View>
                  </TouchableOpacity>
                  {selectedSupport === 'meals' && !mealSupported && (
                    <>
                      <View style={styles.monthsInputContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.monthsLabel}>Số tháng (tối đa {mealRemainingMonths})</Text>
                        <TextInput
                          style={styles.monthsInput}
                          value={mealMonths}
                          onChangeText={(t) => {
                            const cleaned = t.replace(/[^0-9]/g, '');
                            if (!cleaned) { setMealMonths(''); return; }
                            const n = Math.min(parseInt(cleaned, 10), mealRemainingMonths);
                            setMealMonths(String(n));
                          }}
                          keyboardType="numeric"
                          maxLength={2}
                          placeholder={String(Math.min(3, mealRemainingMonths))}
                          placeholderTextColor="#9CA3AF"
                        />
                        <Text style={styles.monthsUnit}>tháng</Text>
                      </View>
                    </>
                  )}
                </>
              )}

              {hasHealth && (
                <TouchableOpacity
                  style={[
                    styles.supportOption,
                    styles.urgentOption,
                    selectedSupport === 'health' && !healthSupported && styles.urgentOptionSelected,
                    healthSupported && styles.supportOptionDisabled,
                  ]}
                  onPress={() => !healthSupported && setSelectedSupport('health')}
                  disabled={healthSupported}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportOptionLeft}>
                    <View style={[
                      styles.supportIconContainer,
                      { backgroundColor: selectedSupport === 'health' && !healthSupported ? '#EA580C' : '#FFEDD5' },
                    ]}>
                      <Ionicons name="medkit-outline" size={22} color={selectedSupport === 'health' && !healthSupported ? '#FFFFFF' : '#EA580C'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supportOptionTitle}>Bảo hiểm y tế</Text>
                      {healthSupported && (
                        <Text style={styles.supportedNote}>
                          {healthFunded
                            ? 'Đã có người hỗ trợ — chỉ một người có thể tài trợ'
                            : `Đã hỗ trợ năm ${healthSupportedYears.join(', ')}`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.supportOptionRight}>
                    <Text style={[styles.supportOptionPrice, { color: '#EA580C' }]}>
                      {healthValue > 0 ? formatVND(healthValue) : 'Custom'}
                    </Text>
                    <Text style={styles.supportOptionFrequency}>{healthValue > 0 ? 'Bắt buộc' : 'Số tiền'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Recurring Support Toggle ─────────────────────────────────────── */}
          {(hasBooks || hasMeals || hasHealth) && (
            <View style={styles.card}>
              <View style={styles.recurringRow}>
                <View style={styles.recurringLeft}>
                  <View style={styles.recurringIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#1E40AF" />
                  </View>
                  <View>
                    <Text style={styles.recurringTitle}>Hỗ trợ định kỳ</Text>
                    <Text style={styles.recurringSubtitle}>Bật bảo trợ hàng tháng</Text>
                  </View>
                </View>
                <Switch
                  value={recurringEnabled}
                  onValueChange={setRecurringEnabled}
                  trackColor={{ false: '#E5E7EB', true: '#1E40AF' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      {(hasBooks || hasMeals || hasHealth) && (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.authorizeButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleAuthorize}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.authorizeButtonText}>Xác nhận</Text>
              <Ionicons name="flash" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
        {/* <View style={styles.securedRow}>
          <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
          <Text style={styles.securedText}>Bảo mật bởi Giao thức Mạng Sui</Text>
        </View> */}
      </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  heroContainer: { height: 300 },
  heroImage: { width: '100%', height: '100%' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  noNeedsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noNeedsText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  regionCardContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  regionIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  regionInfo: { flex: 1 },
  regionLabel: { fontSize: 10, fontWeight: '700', color: '#1E40AF', letterSpacing: 2, textTransform: 'uppercase' },
  regionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  storySection: { marginTop: 12 },
  storyLabel: {
    fontSize: 12, fontWeight: '600', color: '#6B7280',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  storyText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1,
    borderColor: '#F1F5F9', padding: 14, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#111827', lineHeight: 20 },
  guardianCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1,
    borderColor: '#F1F5F9', padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  guardianHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  guardianIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  guardianHeaderContent: { flex: 1 },
  guardianRelation: {
    fontSize: 11, fontWeight: '600', color: '#1E40AF',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  guardianName: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  idCardBlock: { marginTop: 12 },
  idCardLabel: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  idCardImage: {
    width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#F1F5F9',
  },
  blobImageBlock: { marginTop: 12 },
  blobImage: {
    width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#F1F5F9',
  },
  guardianDetails: { paddingLeft: 60, gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: { marginTop: 2 },
  detailValue: { fontSize: 15, color: '#374151', fontWeight: '500' },
  blockchainCard: {
    backgroundColor: '#1F2937', borderRadius: 16, padding: 20,
    position: 'relative', overflow: 'hidden', marginTop: 12,
  },
  blockchainIcon: { position: 'absolute', right: -16, top: -16, transform: [{ rotate: '12deg' }] },
  blockchainContent: { position: 'relative', zIndex: 10 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  verifiedText: { fontSize: 14, fontWeight: 'bold', color: '#60A5FA', letterSpacing: 0.5 },
  blockchainDescription: { fontSize: 14, color: '#D1D5DB', lineHeight: 22 },
  // Support options
  supportOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, borderWidth: 1,
    borderColor: '#E5E7EB', marginBottom: 12, backgroundColor: '#FFFFFF',
  },
  urgentOption: { borderColor: '#FED7AA', backgroundColor: 'rgba(255,247,237,0.5)' },
  supportOptionSelected: { borderColor: '#1E40AF', borderWidth: 2 },
  supportOptionDisabled: { opacity: 0.55, backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  supportedNote: { fontSize: 13, color: '#4B5563', marginTop: 4, fontStyle: 'italic' },
  urgentOptionSelected: { borderColor: '#EA580C', borderWidth: 2 },
  supportOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  supportIconContainer: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  supportIconContainerSelected: { backgroundColor: '#1E40AF' },
  supportOptionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  supportOptionRight: { alignItems: 'flex-end' },
  supportOptionPrice: { fontSize: 18, fontWeight: '800', color: '#1E40AF' },
  supportOptionFrequency: {
    fontSize: 12, fontWeight: '600', color: '#6B7280',
    marginTop: 2,
  },
  monthsInputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#DBEAFE',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  monthsLabel: { fontSize: 15, fontWeight: '500', color: '#374151', flex: 1 },
  monthsInput: {
    width: 52, textAlign: 'center', fontSize: 18, fontWeight: '700',
    color: '#1E40AF', backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 6,
  },
  monthsUnit: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  recurringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recurringLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  recurringIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  recurringTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  recurringSubtitle: { fontSize: 12, color: '#4B5563', marginTop: 3 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  authorizeButton: {
    backgroundColor: '#1E40AF', height: 60, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  authorizeButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  securedRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginTop: 12,
  },
  securedText: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  proofCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  proofCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  proofIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  proofCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  proofCardSubtitle: { fontSize: 12, color: '#4B5563', marginTop: 3 },
});

export default ChildDetailScreen;
