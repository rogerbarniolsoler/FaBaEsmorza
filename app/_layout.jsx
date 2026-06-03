import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen 
        name="nouEsmorzar" 
        options={{ 
          title: 'Registrar Esmorzar', // El títol que sortirà a dalt
          presentation: 'modal'        // S'obrirà lliscant des de baix
        }} 
      />
    </Stack>
  );
}