import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Returns animated style for a press-scale effect.
 * Usage:
 *   const { scale, onPressIn, onPressOut } = usePressScale();
 *   <Animated.View style={{ transform: [{ scale }] }}>
 */
export function usePressScale(toValue = 0.965) {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
        Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();

    return { scale, onPressIn, onPressOut };
}

/**
 * Returns animated style for a staggered slide-up + fade entry.
 * @param {number} delay  - delay in ms before this item animates in
 * @param {number} offsetY - starting Y offset (default 24)
 */
export function useEntryAnimation(delay = 0, offsetY = 24) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(offsetY)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 380,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay,
                speed: 14,
                bounciness: 4,
                useNativeDriver: true,
            }),
        ]).start();
    }, [delay]);

    return { opacity, translateY };
}

/**
 * Returns animated style for a fade-only transition.
 * Triggers when `trigger` changes (e.g. active tab).
 */
export function useFadeTransition(trigger) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        opacity.setValue(0);
        Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [trigger]);

    return opacity;
}
