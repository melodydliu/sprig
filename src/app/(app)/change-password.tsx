import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/features/auth/authStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { submitting, error, updatePassword, clearError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Don't carry a stale error in from another auth screen.
  useEffect(() => {
    clearError();
  }, [clearError]);

  const longEnough = password.length >= 6;
  const matches = password === confirm;
  const canSave = longEnough && matches && confirm.length > 0;

  const save = async () => {
    if (!canSave) return;
    const ok = await updatePassword(password);
    if (ok) {
      toast.show('Password updated', 'success');
      router.back();
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2.4} />
          </Pressable>
          <Text variant="title">Change password</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
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
          <Field
            label="Confirm new password"
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              if (error) clearError();
            }}
            placeholder="Re-enter your new password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          {confirm.length > 0 && !matches ? (
            <Text variant="caption" color="danger" style={styles.err}>
              Passwords don&apos;t match.
            </Text>
          ) : null}
          {error ? (
            <Text variant="caption" color="danger" style={styles.err}>
              {error}
            </Text>
          ) : null}
          <Button
            label="Update password"
            size="lg"
            loading={submitting}
            disabled={!canSave}
            onPress={save}
            style={styles.btn}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  form: { gap: 14, marginTop: 16 },
  err: { marginLeft: 2 },
  btn: { marginTop: 4 },
});
