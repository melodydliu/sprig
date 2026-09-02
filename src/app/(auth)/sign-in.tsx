import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { TEST_EMAIL, TEST_PASSWORD } from '@/data';
import { useAuth } from '@/features/auth/authStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignInScreen() {
  const theme = useTheme();
  const { submitting, error, signInWithPassword, signInWithApple, signInWithGoogle, clearError } =
    useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillTestLogin = () => {
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
    clearError();
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Wordmark size={40} />
          <Text variant="serifItalic" color="textSecondary" style={styles.tagline}>
            A quiet place to remember what&apos;s growing where.
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) clearError();
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            inputMode="email"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) clearError();
            }}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          {error ? (
            <Text variant="caption" color="danger" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button
            label="Sign in"
            size="lg"
            loading={submitting}
            onPress={() => signInWithPassword(email, password)}
            style={styles.primaryBtn}
          />

          <View style={styles.dividerRow}>
            <View style={[styles.rule, { backgroundColor: theme.colors.border }]} />
            <Text variant="caption" color="textMuted">
              or
            </Text>
            <View style={[styles.rule, { backgroundColor: theme.colors.border }]} />
          </View>

          <SocialButton
            label="Continue with Apple"
            onPress={signInWithApple}
            disabled={submitting}
            icon={
              <Svg width={17} height={17} viewBox="0 0 24 24">
                <Path
                  fill={theme.colors.text}
                  d="M16.36 12.9c.02 2.53 2.22 3.37 2.25 3.38-.02.06-.35 1.2-1.16 2.38-.7 1.02-1.42 2.03-2.56 2.05-1.12.02-1.48-.66-2.76-.66s-1.68.64-2.74.68c-1.1.04-1.94-1.1-2.64-2.12-1.44-2.08-2.54-5.87-1.06-8.44.73-1.27 2.04-2.08 3.46-2.1 1.08-.02 2.1.73 2.76.73.66 0 1.9-.9 3.2-.77.55.02 2.08.22 3.07 1.67-.08.05-1.83 1.07-1.82 3.2M14.28 5.1c.58-.71.98-1.7.87-2.68-.84.03-1.86.56-2.47 1.26-.54.63-1.02 1.63-.89 2.6.94.07 1.9-.48 2.49-1.18"
                />
              </Svg>
            }
          />
          <SocialButton
            label="Continue with Google"
            onPress={signInWithGoogle}
            disabled={submitting}
            icon={
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path fill="#4285F4" d="M23 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72C21.78 18.63 23 15.75 23 12.27" />
                <Path fill="#34A853" d="M12 23.5c3.1 0 5.7-1.03 7.6-2.8l-3.72-2.9c-1.03.7-2.35 1.1-3.88 1.1-2.98 0-5.5-2-6.4-4.72H1.75v2.96A11.5 11.5 0 0 0 12 23.5" />
                <Path fill="#FBBC05" d="M5.6 14.18a6.9 6.9 0 0 1 0-4.36V6.86H1.75a11.5 11.5 0 0 0 0 10.28z" />
                <Path fill="#EA4335" d="M12 5.1c1.68 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.65 15.1.5 12 .5A11.5 11.5 0 0 0 1.75 6.86l3.85 2.96C6.5 7.1 9.02 5.1 12 5.1" />
              </Svg>
            }
          />
        </View>

        <Pressable onPress={fillTestLogin} style={styles.testHint} accessibilityRole="button">
          <Text variant="caption" color="textMuted" center>
            MVP build — no backend yet. Tap to use the test login
          </Text>
          <Text variant="caption" color="textSecondary" center>
            {TEST_EMAIL} · {TEST_PASSWORD}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SocialButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.social,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
      <Text variant="label" style={{ color: theme.colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { justifyContent: 'space-between', paddingVertical: 24, gap: 32 },
  header: { alignItems: 'center', gap: 14, marginTop: 24 },
  tagline: { textAlign: 'center', maxWidth: 280 },
  form: { gap: 14 },
  error: { marginLeft: 2 },
  primaryBtn: { marginTop: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  social: {
    minHeight: 50,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  testHint: { gap: 3, paddingVertical: 8 },
});
