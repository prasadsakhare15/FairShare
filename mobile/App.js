import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {
  View, ActivityIndicator, StyleSheet, Animated, Text, Easing,
} from 'react-native';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

// Shared screen animation config — shorter = snappier
const fadeSlideOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 240,
  contentStyle: { backgroundColor: colors.background },
};

const fadeOptions = {
  headerShown: false,
  animation: 'fade',
  animationDuration: 180,
  contentStyle: { backgroundColor: colors.background },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={fadeOptions}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right', animationDuration: 220 }} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={fadeSlideOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ animation: 'slide_from_right', animationDuration: 260 }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right', animationDuration: 220 }}
      />
    </Stack.Navigator>
  );
}

function SplashScreen() {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, easing: EASE, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.splash}>
      <Animated.View style={[styles.splashIcon, { transform: [{ scale }], opacity }]}>
        <Text style={styles.splashEmoji}>⚖️</Text>
      </Animated.View>
      <Animated.Text style={[styles.splashTitle, { opacity }]}>FairShare</Animated.Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return user ? <MainStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NavigationContainer>
          <StatusBar style="dark" backgroundColor={colors.surface} />
          <RootNavigator />
        </NavigationContainer>
      </ToastProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  splashEmoji: { fontSize: 44 },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
});
