import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LangToggle({ dark = false }) {
  const isEN = i18n.language === 'en';

  function toggle() {
    const next = isEN ? 'fr' : 'en';
    i18n.changeLanguage(next);
    AsyncStorage.setItem('tms_language', next);
  }

  return (
    <TouchableOpacity style={s.container} onPress={toggle} activeOpacity={0.8}>
      <View style={[s.option, isEN && s.active]}>
        <Text style={[s.optionText, isEN && s.activeText]}>🇬🇧 EN</Text>
      </View>
      <View style={[s.option, !isEN && s.active]}>
        <Text style={[s.optionText, !isEN && s.activeText]}>🇫🇷 FR</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#EFEFED',
    borderRadius: 20,
    padding: 2,
    gap: 2,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 18,
  },
  active: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ADADAA',
  },
  activeText: {
    color: '#111110',
    fontWeight: '600',
  },
});
