import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOffline } from '../hooks/useOffline';

export default function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <View style={s.banner}>
      <Text style={s.text}>📡 Pas de connexion — mode hors ligne</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: { backgroundColor: '#E24B4A', paddingVertical: 6, paddingHorizontal: 14, alignItems: 'center' },
  text:   { color: '#fff', fontSize: 12, fontWeight: '500' },
});
