import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'https://sweet-patience-production.up.railway.app';
const FALLBACK_TRIPS = [
  { id: '501afc2a-91eb-4136-a92d-e96da16242c9', label: 'GE-101', time: '06:00', dest: 'Yaoundé Nsam' },
  { id: 'd94859c6-c214-4d78-a775-0c0bdc3a9c7b', label: 'GE-102', time: '13:00', dest: 'Yaoundé Nsam' },
];
import LangToggle from '../../components/LangToggle';



const ACTIONS = [
  { icon: '👤', label: 'Register Walk-in', sub: 'New passenger', screen: 'WalkIn', color: '#EAF3DE' },
  { icon: '📷', label: 'Scan Ticket', sub: 'Online bookings', screen: 'QRScanner', color: '#E6F1FB' },
  { icon: '🚌', label: 'Seat Map', sub: 'Trip passenger list', screen: null, color: '#FAEEDA' },
  { icon: '⚠️', label: 'Flagged Tickets', sub: 'Issues today', screen: 'FlaggedList', color: '#FCEBEB' },
];

export default function ClerkHome({ navigation }) {
  const [clerkName, setClerkName] = useState('');
  const [clerkTerminal, setClerkTerminal] = useState('');
  const [tripPickerVisible, setTripPickerVisible] = useState(false);
  const [todayTrips, setTodayTrips] = useState(FALLBACK_TRIPS);

  useEffect(() => {
    AsyncStorage.getItem('clerk_name').then(n => setClerkName(n || 'Agent'));
    fetchTodayTrips();
    AsyncStorage.getItem('clerk_terminal').then(t => setClerkTerminal(t || ''));
  }, []);

  async function fetchTodayTrips() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`${API}/api/trips/search?origin=65887779-2ea0-4615-813f-45772a8f5770&destination=81bb4e6e-c758-47cd-a689-40e0f43a31f4&date=${today}&passengers=1`, { timeout: 8000 });
      const data = res.data.trips || res.data;
      if (data && data.length) {
        setTodayTrips(data.map(t => ({ id: t.id, label: t.trip_code || t.id.slice(0,8), time: t.depart_time?.slice(0,5), dest: t.destination_name || 'Yaoundé' })));
      }
    } catch (e) { /* keep fallback */ }
  }

  async function logout() {
    await AsyncStorage.removeItem('clerk_token');
    await AsyncStorage.removeItem('tms_language');
    navigation.replace('Language');
  }

  function handleAction(a) {
    if (a.screen === null) {
      setTripPickerVisible(true);
    } else {
      navigation.navigate(a.screen);
    }
  }

  return (
    <SafeAreaView style={s.shell}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Clerk Station</Text>
          <Text style={s.subtitle}>Garanti Express · {clerkTerminal}</Text>
        </View>
        <LangToggle />
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.agentRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{clerkName.split(' ').map(n => n[0]).join('').slice(0,2)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.agentName}>{clerkName}</Text>
            <Text style={s.agentMeta}>Shift: 06:00 – 14:00</Text>
          </View>
          <View style={s.activeBadge}><Text style={s.activeBadgeText}>Active</Text></View>
        </View>

        <View style={s.grid}>
          {ACTIONS.map(a => (
            <TouchableOpacity key={a.label} style={s.actionCard} onPress={() => handleAction(a)} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: a.color }]}>
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
              <Text style={s.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal transparent visible={tripPickerVisible} animationType="slide" onRequestClose={() => setTripPickerVisible(false)}>
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setTripPickerVisible(false)}>
          <View style={s.pickerSheet}>
            <Text style={s.pickerTitle}>Choisir un voyage</Text>
            {todayTrips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={s.pickerRow}
                onPress={() => { setTripPickerVisible(false); navigation.navigate('SeatMapView', { trip }); }}
              >
                <Text style={s.pickerBus}>{trip.label}</Text>
                <Text style={s.pickerTime}>{trip.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  shell:          { flex: 1, backgroundColor: '#F7F7F5' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  title:          { fontSize: 20, fontWeight: '600', color: '#111110' },
  subtitle:       { fontSize: 11, color: '#ADADAA', marginTop: 2 },
  body:           { flex: 1, padding: 14 },
  agentRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 12, marginBottom: 12 },
  avatar:         { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 12, fontWeight: '600', color: '#0C447C' },
  agentName:      { fontSize: 14, fontWeight: '500', color: '#111110' },
  agentMeta:      { fontSize: 11, color: '#ADADAA', marginTop: 1 },
  activeBadge:    { backgroundColor: '#EAF3DE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText:{ fontSize: 11, fontWeight: '600', color: '#27500A' },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  actionCard:     { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EFEFED', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  actionIcon:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel:    { fontSize: 13, fontWeight: '500', color: '#111110', textAlign: 'center' },
  actionSub:      { fontSize: 11, color: '#ADADAA', textAlign: 'center' },
  logoutBtn:      { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 14, alignItems: 'center', marginBottom: 8 },
  logoutText:     { fontSize: 14, color: '#E24B4A', fontWeight: '500' },
  pickerOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  pickerTitle:    { fontSize: 15, fontWeight: '600', color: '#111110', marginBottom: 16, textAlign: 'center' },
  pickerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  pickerBus:      { fontSize: 15, fontWeight: '600', color: '#111110' },
  pickerTime:     { fontSize: 13, color: '#737370' },
});
