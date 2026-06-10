import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, FlatList } from 'react-native';
import LangToggle from '../../components/LangToggle';

const ACTIONS = [
  { icon: '👤', label: 'Register Walk-in', sub: 'New passenger', screen: 'WalkIn', color: '#EAF3DE', iconColor: '#27500A' },
  { icon: '📷', label: 'Scan Ticket',      sub: 'Online bookings', screen: 'QRScanner', color: '#E6F1FB', iconColor: '#0C447C' },
  { icon: '🪑', label: 'Plan des sièges',  sub: 'Grille en temps réel', screen: 'SeatMapView', color: '#EDE8FB', iconColor: '#3D1F8A' },
  { icon: '⚠️',  label: 'Flagged Tickets', sub: 'Issues today', screen: 'FlaggedList', color: '#FCEBEB', iconColor: '#791F1F' },
];

const TODAY_TRIPS = [
  { id: '501afc2a-91eb-4136-a92d-e96da16242c9', bus_code: 'GE-101', depart_time: '06:00:00', arrive_time: '09:30:00' },
  { id: 'd94859c6-c214-4d78-a775-0c0bdc3a9c7b', bus_code: 'GE-102', depart_time: '13:00:00', arrive_time: '16:30:00' },
];

const RECENT = [
  { name: 'Tchounga Paul', meta: 'Walk-in · BFS→DLA · Seat 12B', time: '09:14', amount: '4,500', dot: '#3DB34A' },
  { name: 'Ngo Sandrine',  meta: 'QR scan · Valid ✓',            time: '09:08', dot: '#378ADD' },
  { name: 'Kamdem Roger',  meta: 'QR scan · Expired ✗',          time: '08:55', dot: '#E24B4A' },
  { name: 'Fomba Eric',    meta: 'Walk-in · BFS→BMD · Seat 7A',  time: '08:41', amount: '4,500', dot: '#3DB34A' },
];

export default function ClerkHome({ navigation }) {
  const [clerkName, setClerkName]       = useState('');
  const [clerkTerminal, setClerkTerminal] = useState('');
  const [tripPickerVisible, setTripPickerVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('clerk_name').then(n => setClerkName(n || 'Agent'));
    AsyncStorage.getItem('clerk_terminal').then(t => setClerkTerminal(t || ''));
  }, []);

  async function logout() {
    await AsyncStorage.removeItem('clerk_token');
    await AsyncStorage.removeItem('tms_language');
    navigation.replace('Language');
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
        {/* Agent row */}
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

        {/* Stats */}
        <View style={s.stats}>
          <View style={s.stat}><Text style={s.statVal}>23</Text><Text style={s.statLabel}>Walk-ins</Text></View>
          <View style={s.stat}><Text style={s.statVal}>41</Text><Text style={s.statLabel}>Scanned</Text></View>
          <View style={s.stat}><Text style={[s.statVal, { color: '#E24B4A' }]}>3</Text><Text style={[s.statLabel, { color: '#E24B4A' }]}>Flagged</Text></View>
        </View>

        {/* Action grid */}
        <View style={s.grid}>
          {ACTIONS.map(a => (
            <TouchableOpacity key={a.label} style={s.actionCard} onPress={() => a.screen === 'SeatMapView' ? setTripPickerVisible(true) : navigation.navigate(a.screen)} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: a.color }]}>
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
              <Text style={s.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        <View style={s.card}>
          <Text style={s.cardTitle}>RECENT ACTIVITY</Text>
          {RECENT.map((r, i) => (
            <View key={i} style={s.recentRow}>
              <View style={[s.dot, { backgroundColor: r.dot }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.recentName}>{r.name}</Text>
                <Text style={s.recentMeta}>{r.meta}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.recentTime}>{r.time}</Text>
                {r.amount && <Text style={s.recentAmount}>{r.amount}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

        {/* Trip picker for seat map */}
        <Modal transparent visible={tripPickerVisible} animationType="slide" onRequestClose={() => setTripPickerVisible(false)}>
          <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setTripPickerVisible(false)}>
            <View style={s.pickerSheet}>
              <Text style={s.pickerTitle}>Choisir un voyage</Text>
              {TODAY_TRIPS.map(trip => (
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
  pickerOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  pickerTitle:    { fontSize: 15, fontWeight: '600', color: '#111110', marginBottom: 16, textAlign: 'center' },
  pickerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  pickerBus:      { fontSize: 15, fontWeight: '600', color: '#111110' },
  pickerTime:     { fontSize: 13, color: '#737370' },
}); }}
                >
                  <Text style={s.pickerBus}>{trip.bus_code}</Text>
                  <Text style={s.pickerTime}>{trip.depart_time.slice(0,5)} → {trip.arrive_time.slice(0,5)}</Text>
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
  header:         { backgroundColor: '#fff', padding: 16, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: '#EFEFED', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
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
  stats:          { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat:           { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#EFEFED', padding: 10, alignItems: 'center' },
  statVal:        { fontSize: 20, fontWeight: '600', color: '#111110' },
  statLabel:      { fontSize: 10, color: '#ADADAA', marginTop: 2 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  actionCard:     { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EFEFED', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  actionIcon:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel:    { fontSize: 13, fontWeight: '500', color: '#111110', textAlign: 'center' },
  actionSub:      { fontSize: 11, color: '#ADADAA', textAlign: 'center' },
  card:           { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 14, marginBottom: 12 },
  cardTitle:      { fontSize: 11, fontWeight: '600', color: '#737370', letterSpacing: 0.8, marginBottom: 10 },
  recentRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F7F7F5' },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  recentName:     { fontSize: 13, fontWeight: '500', color: '#111110' },
  recentMeta:     { fontSize: 11, color: '#ADADAA', marginTop: 1 },
  recentTime:     { fontSize: 11, color: '#ADADAA' },
  recentAmount:   { fontSize: 12, fontWeight: '500', color: '#3DB34A', marginTop: 1 },
  logoutBtn:      { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 14, alignItems: 'center', marginBottom: 8 },
  logoutText:     { fontSize: 14, color: '#E24B4A', fontWeight: '500' },
});
