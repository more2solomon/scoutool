import { Stack } from 'expo-router';
import { Metadata } from 'expo-router';

export const metadata: Metadata = {
  title: 'Scout Mail',
  verification: {
    google: 'oOcGx7wm08vZ2eTeKoLbZaM9bqd_4VMl2tfFPJkGYhU',
  },
};

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
