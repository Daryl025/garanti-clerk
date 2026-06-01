import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../i18n';
import i18n from '../i18n';

export default function LanguagePicker({ navigation }) {
  async function pick(lang) {
    await AsyncStorage.setItem('tms_language', lang);
    i18n.changeLanguage(lang);
    navigation.navigate('ClerkLogin');
  }

  return (
    <SafeAreaView style={s.shell}>
      <View style={s.inner}>
        <View style={s.logo}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkText}>GE</Text>
          </View>
          <View>
            <Text style={s.logoName}>Garanti Express</Text>
            <Text style={s.logoTag}>Clerk Station</Text>
          </View>
        </View>
        <Text style={s.title}>Choose your language</Text>
        <Text style={s.sub}>Choisissez votre langue</Text>
        <View style={s.options}>
          <TouchableOpacity style={s.langBtn} onPress={() => pick('en')} activeOpacity={0.85}>
            <Text style={s.flag}>EN</Text>
            <Text style={s.langName}>English</Text>
            <Text style={s.arrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.langBtn} onPress={() => pick('fr')} activeOpacity={0.85}>
            <Text style={s.flag}>FR</Text>
            <Text style={s.langName}>Français</Text>
            <Text style={s.arrow}>→</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.hint}>You can change this any time</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  shell:        { flex: 1, backgroundColor: '#111110' },
  inner:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo:         { flexDirection: 'row', alignItems: 'center', marginBottom: 48, gap: 12 },
  logoMark:     { width: 52, height: 52, borderRadius: 16, backgroundColor: '#3DB34A', alignItems: 'center', justifyContent: 'center' },
  logoMarkText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  logoName:     { fontSize: 20, fontWeight: '700', color: '#fff' },
  logoTag:      { fontSize: 12, color: '#555', marginTop: 2 },
  title:        { fontSize: 24, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 6 },
  sub:          { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 36 },
  options:      { width: '100%', gap: 12, marginBottom: 32 },
  langBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a', borderRadius: 16, padding: 18, gap: 16 },
  flag:         { fontSize: 20, fontWeight: '700', color: '#fff', width: 36 },
  langName:     { fontSize: 18, fontWeight: '600', color: '#fff', flex: 1 },
  arrow:        { fontSize: 20, color: '#3DB34A' },
  hint:         { fontSize: 12, color: '#444', textAlign: 'center' },
});
