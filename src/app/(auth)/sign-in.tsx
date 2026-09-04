import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { useAuth } from '@/features/auth/authStore';

type Mode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { submitting, error, signIn, signUp, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !submitting;

  const localError = useMemo(() => {
    if (!touched) return null;
    if (!emailValid) return 'Enter a valid email address.';
    if (!passwordValid) return 'Password must be at least 6 characters.';
    return null;
  }, [touched, emailValid, passwordValid]);

  const submit = () => {
    setTouched(true);
    if (!emailValid || !passwordValid) return;
    if (mode === 'signin') void signIn(email, password);
    else void signUp(email, password);
  };

  const swap = (next: Mode) => {
    setMode(next);
    setTouched(false);
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
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) clearError();
            }}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          />

          {localError || error ? (
            <Text variant="caption" color="danger" style={styles.error}>
              {localError ?? error}
            </Text>
          ) : null}

          <Button
            label={mode === 'signin' ? 'Sign in' : 'Create account'}
            size="lg"
            loading={submitting}
            disabled={!canSubmit && touched}
            onPress={submit}
            style={styles.primaryBtn}
          />

          {mode === 'signin' ? (
            <Link href="/reset-password" asChild>
              <Pressable style={styles.link} accessibilityRole="link">
                <Text variant="caption" color="textSecondary" center>
                  Forgot your password?
                </Text>
              </Pressable>
            </Link>
          ) : null}
        </View>

        <Pressable
          onPress={() => swap(mode === 'signin' ? 'signup' : 'signin')}
          style={styles.switch}
          accessibilityRole="button"
        >
          <Text variant="caption" color="textMuted" center>
            {mode === 'signin' ? 'New to Sprig?' : 'Already have an account?'}
          </Text>
          <Text variant="label" color="primary" center>
            {mode === 'signin' ? 'Create an account' : 'Sign in instead'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
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
  link: { paddingVertical: 8 },
  switch: { gap: 3, paddingVertical: 8 },
});
