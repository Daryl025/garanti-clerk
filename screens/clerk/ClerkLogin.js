import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'https://sweet-patience-production.up.railway.app';
import LangToggle from '../../components/LangToggle';

export default function ClerkLogin({ navigation }) {
  const [phone, setPhone]     = useState('');
  const [pin, setPin]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function login() {
    if (!phone || !pin) { setError('Enter your phone and PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/auth/agent/login`, { phone, pin }, { timeout: 15000 });
      const { token, agent } = res.data;
      await AsyncStorage.setItem('clerk_token', token);
      await AsyncStorage.setItem('clerk_name', agent.name);
      await AsyncStorage.setItem('clerk_terminal', agent.terminal_name);
      await AsyncStorage.setItem('clerk_terminal_code', agent.terminal_id);
      navigation.replace('ClerkHome');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid phone or PIN');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.shell}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView style={s.inner} behavior="padding">
          <View style={s.topRow}>
            <View />
            <LangToggle dark />
          </View>
          <View style={s.logoWrap}>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>GE</Text>
            </View>
            <Text style={s.logoName}>Garanti Express</Text>
            <Text style={s.logoTag}>Clerk Station</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>AGENT LOGIN</Text>
            <Text style={s.label}>Phone number</Text>
            <View style={s.input}>
              <Text style={s.inputIcon}>📞</Text>
              <TextInput
                style={s.inputField}
                placeholder="+237 677 000 000"
                placeholderTextColor="#ADADAA"
                value={phone}
                onChangeText={v => { setPhone(v); setError(''); }}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={[s.label, { marginTop: 12 }]}>PIN</Text>
            <View style={s.input}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.inputField}
                placeholder="4-digit PIN"
                placeholderTextColor="#ADADAA"
                value={pin}
                onChangeText={v => { setPin(v); setError(''); }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={login}
              />
            </View>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <TouchableOpacity style={s.btn} onPress={login} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>LOGIN →</Text>
              }
            </TouchableOpacity>
            <Text style={s.hint}>Demo PIN: 1234</Text>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  shell:        { flex: 1, backgroundColor: '#111110' },
  inner:        { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  logoWrap:     { alignItems: 'center', marginBottom: 32 },
  logoMark:     { width: 64, height: 64, borderRadius: 20, backgroundColor: '#3DB34A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoMarkText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  logoName:     { fontSize: 22, fontWeight: '700', color: '#fff' },
  logoTag:      { fontSize: 13, color: '#555', marginTop: 4 },
  card:         { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2a2a2a' },
  cardTitle:    { fontSize: 11, fontWeight: '600', color: '#555', letterSpacing: 0.8, marginBottom: 16 },
  label:        { fontSize: 11, fontWeight: '600', color: '#888', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  input:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, padding: 12, gap: 10, backgroundColor: '#111110' },
  inputIcon:    { fontSize: 16 },
  inputField:   { flex: 1, fontSize: 15, color: '#fff' },
  errorText:    { fontSize: 12, color: '#E24B4A', marginTop: 8 },
  btn:          { backgroundColor: '#3DB34A', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  btnText:      { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  hint:         { fontSize: 11, color: '#444', textAlign: 'center', marginTop: 12 },
});
