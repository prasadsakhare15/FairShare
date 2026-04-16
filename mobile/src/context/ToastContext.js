import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../theme';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    const EASE = Easing.in(Easing.cubic);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, easing: EASE, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 16, duration: 180, easing: EASE, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback((message, type = 'error') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    opacity.setValue(0);
    translateY.setValue(16);
    const EASE = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: EASE, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 240, easing: EASE, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(hideToast, 3500);
  }, [opacity, translateY, hideToast]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const toastConfig = {
    error: { bg: colors.error, icon: '⚠️' },
    success: { bg: colors.success, icon: '✅' },
    info: { bg: colors.primary, icon: 'ℹ️' },
  };
  const cfg = toastConfig[toast?.type] ?? toastConfig.error;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            { backgroundColor: cfg.bg, opacity, transform: [{ translateY }] },
          ]}
        >
          <Text style={styles.toastIcon}>{cfg.icon}</Text>
          <Text style={styles.toastText} numberOfLines={3}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.lg,
  },
  toastIcon: {
    fontSize: 18,
  },
  toastText: {
    ...typography.body,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
    lineHeight: 22,
  },
});
