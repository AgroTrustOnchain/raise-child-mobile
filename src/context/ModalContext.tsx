import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface ModalOptions {
  type?: ModalType;
  title: string;
  message?: string;
  buttons?: ModalButton[];
}

interface ModalContextValue {
  show: (options: ModalOptions) => void;
  hide: () => void;
  /** Shorthand helpers */
  alert: (title: string, message?: string, onOk?: () => void) => void;
  success: (title: string, message?: string, onOk?: () => void) => void;
  error: (title: string, message?: string, onOk?: () => void) => void;
  warning: (title: string, message?: string, onOk?: () => void) => void;
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

// ─── Config per type ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ModalType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle',     color: '#1E40AF', bg: '#EFF6FF' },
  error:   { icon: 'close-circle',         color: '#1E40AF', bg: '#EFF6FF' },
  warning: { icon: 'warning',              color: '#1E40AF', bg: '#EFF6FF' },
  info:    { icon: 'information-circle',   color: '#1E40AF', bg: '#EFF6FF' },
  confirm: { icon: 'help-circle',          color: '#1E40AF', bg: '#EFF6FF' },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<ModalOptions>({ type: 'info', title: '' });

  const show = useCallback((options: ModalOptions) => {
    setOpts({ type: 'info', ...options });
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  const alert = useCallback((title: string, message?: string, onOk?: () => void) => {
    show({
      type: 'info',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  }, [show]);

  const success = useCallback((title: string, message?: string, onOk?: () => void) => {
    show({
      type: 'success',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  }, [show]);

  const error = useCallback((title: string, message?: string, onOk?: () => void) => {
    show({
      type: 'error',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  }, [show]);

  const warning = useCallback((title: string, message?: string, onOk?: () => void) => {
    show({
      type: 'warning',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  }, [show]);

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => {
    show({
      type: 'confirm',
      title,
      message,
      buttons: [
        { text: 'Hủy',      style: 'cancel',      onPress: onCancel },
        { text: 'Xác nhận', style: 'destructive',  onPress: onConfirm },
      ],
    });
  }, [show]);

  const handleButton = (btn: ModalButton) => {
    hide();
    btn.onPress?.();
  };

  const cfg = TYPE_CONFIG[opts.type ?? 'info'];
  const buttons: ModalButton[] = opts.buttons?.length
    ? opts.buttons
    : [{ text: 'OK' }];

  return (
    <ModalContext.Provider value={{ show, hide, alert, success, error, warning, confirm }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={hide}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={hide}
        >
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            {/* Icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon as any} size={40} color={cfg.color} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{opts.title}</Text>

            {/* Message */}
            {!!opts.message && (
              <Text style={styles.message}>{opts.message}</Text>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Buttons */}
            <View style={[styles.buttonRow, buttons.length === 1 && styles.buttonRowSingle]}>
              {buttons.map((btn, i) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.button,
                      buttons.length > 1 && styles.buttonFlex,
                      isCancel      && styles.buttonCancel,
                      isDestructive && { backgroundColor: cfg.color },
                      !isCancel && !isDestructive && { backgroundColor: cfg.color },
                    ]}
                    onPress={() => handleButton(btn)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ModalContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useModal = (): ModalContextValue => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
  return ctx;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 20,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  button: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minWidth: 100,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: '#F1F5F9',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: '#6B7280',
  },
});
