import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DataProvider } from '../src/store';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <DataProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="customer-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="invoice-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reports" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </DataProvider>
  );
}
