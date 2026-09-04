import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { Wordmark } from '@/components/Wordmark';
import { useAuth } from '@/features/auth/authStore';
import { supabase } from '@/lib/supabase';

type Phase = 'request' | 'set' | 'sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads `access_token` / `refresh_token` / `token_hash` from a URL's `#` or `?`. */
function tokensFrom(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of [url.split('#')[1], url.split('?')[1]?.split('#')[0]]) {
    if (!part) continue;
    for (const [k, v] of new URLSearchParams(part)) out[k] = v;
  }
  return out;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const url = Linking.useURL();
  const { submitting, error, sendPasswordReset, updatePassword, clearError } = useAuth();

  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Opened from the reset email → exchange the token for a recovery session.
  useEffect(() => {
    if (!url || !supabase) return;
    const t = tokensFrom(url);
    if (t.access_token && t.refresh_token) {
      void supabase.auth
        .setSession({ access_token: t.access_token, refresh_token: t.refresh_token })
        .then(({ error: e }) => {
          if (!e) setPhase('set');
        });
    } else if (t.token_hash) {
      void supabase.auth
        .verifyOtp({ token_hash: t.token_hash, type: 'recovery' })
        .then(({ error: e }) => {
          if (!e) setPhase('set');
        });
    }
  }, [url]);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 6;

  const heading = useMemo(() => {
    if (phase === 'set') return 'Choose a new password';
    if (phase === 'sent') return 'Check your email';
    return 'Reset your password';
  }, [phase]);

  const doSend = async () => {
    if (!emailValid) return;
    const ok = await sendPasswordReset(email);
    if (ok) setPhase('sent');
  };

  const doSet = async () => {
    if (!passwordValid) return;
    const ok = await updatePassword(password);
    if (ok) {
      toast.show('Password updated', 'success');
      router.replace('/');
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Wordmark size={36} />
          <Text variant="title" center>
            {heading}
          </Text>
        </View>

        <View style={styles.form}>
          {phase === 'request' ? (
            <>
              <Text variant="body" color="textSecondary" center style={styles.blurb}>
                Enter your email and we&apos;ll send a link to set a new password.
              </Text>
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
              {error ? (
                <Text variant="caption" color="danger" style={styles.err}>
                  {error}
                </Text>
              ) : null}
              <Button
                label="Send reset link"
                size="lg"
                loading={submitting}
                disabled={!emailValid}
                onPress={doSend}
                style={styles.btn}
              />
            </>
          ) : null}

          {phase === 'sent' ? (
            <Text variant="body" color="textSecondary" center style={styles.blurb}>
              If an account exists for {email.trim()}, a reset link is on its way. Open it on this
              device to continue.
            </Text>
          ) : null}

          {phase === 'set' ? (
            <>
              <Field
                label="New password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) clearError();
                }}
                placeholder="At least 6 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              {error ? (
                <Text variant="caption" color="danger" style={styles.err}>
                  {error}
                </Text>
              ) : null}
              <Button
                label="Update password"
                size="lg"
                loading={submitting}
                disabled={!passwordValid}
                onPress={doSet}
                style={styles.btn}
              />
            </>
          ) : null}
        </View>

        <Pressable onPress={() => router.replace('/')} style={styles.link} accessibilityRole="button">
          <Text variant="label" color="primary" center>
            Back to sign in
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { justifyContent: 'space-between', paddingVertical: 24, gap: 32 },
  header: { alignItems: 'center', gap: 16, marginTop: 32 },
  form: { gap: 14 },
  blurb: { maxWidth: 300, alignSelf: 'center' },
  err: { marginLeft: 2 },
  btn: { marginTop: 4 },
  link: { paddingVertical: 8 },
});
