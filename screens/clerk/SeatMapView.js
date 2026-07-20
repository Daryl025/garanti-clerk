import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, RefreshControl, Modal, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'https://sweet-patience-production.up.railway.app';

export default function SeatMapView({ navigation, route }) {
  const { trip } = route.params;
  const [seats, setSeats] = useState([]);
  const [busType, setBusType] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null); // tapped booked seat
  const [modalVisible, setModalVisible] = useState(false);

  const loadSeats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const token = await AsyncStorage.getItem('agent_token');
      const res = await axios.get(`${API}/api/trips/${trip.id}/seats/manifest`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      setSeats(res.data.seats || []);
      setBusType(res.data.bus_type || 'classic');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger le plan de salle.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trip.id]));

  useFocusEffect(useCallback(() => { loadSeats(); }, [loadSeats]);

  const rows = [...new Set(seats.map(s => s.seat_row))].sort((a, b) => a - b);
  const isVip = busType === 'vip';
  const leftCols  = ['A', 'B'];
  const rightCols = isVip ? ['C', 'D'] : ['C', 'D', 'E'];

  const booked  = seats.filter(s => s.status === 'booked').length;
  const scanned = seats.filter(s => s.ticket_status === 'scanned').length;
  const free    = seats.filter(s => s.status === 'free').length;

  function getSeatColor(seat) {
    if (seat.ticket_status === 'scanned') return '#3DB34A';   // scanned = green
    if (seat.status === 'booked')         return '#E24B4A';   // booked = red
    if (seat.status === 'locked')         return '#EF9F27';   // locked = orange
    return '#378ADD';                                          // free = blue
  }

  function handleSeatPress(seat) {
    if (seat.status === 'booked' || seat.ticket_status === 'scanned') {
      setSelected(seat);
      setModalVisible(true);
    }
  }

  function renderSeat(seat) {
    const color = getSeatColor(seat);
    return (
      <TouchableOpacity
        key={seat.seat_number}
        style={[s.seat, { backgroundColor: color }]}
        onPress={() => handleSeatPress(seat)}
        activeOpacity={seat.status === 'free' ? 1 : 0.75}
      >
        <Text style={s.seatText}>{seat.seat_number}</Text>
        {seat.ticket_status === 'scanned' && <Text style={s.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.shell}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Plan des sièges</Text>
        <Text style={s.subtitle}>{trip.bus_code} · {trip.depart_time?.slice(0,5)} → {trip.arrive_time?.slice(0,5)}</Text>
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <View style={s.stat}><View style={[s.dot, { backgroundColor: '#378ADD' }]} /><Text style={s.statTxt}>{free} libre{free !== 1 ? 's' : ''}</Text></View>
        <View style={s.stat}><View style={[s.dot, { backgroundColor: '#E24B4A' }]} /><Text style={s.statTxt}>{booked - scanned} réservé{booked - scanned !== 1 ? 's' : ''}</Text></View>
        <View style={s.stat}><View style={[s.dot, { backgroundColor: '#3DB34A' }]} /><Text style={s.statTxt}>{scanned} scanné{scanned !== 1 ? 's' : ''}</Text></View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#3DB34A" size="large" />
        </View>
      ) : (
        <ScrollView
          style={s.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSeats(true)} tintColor="#3DB34A" />}
        >
          {/* Legend */}
          <View style={s.legend}>
            {[['#378ADD','Libre'],['#EF9F27','Bloqué'],['#E24B4A','Réservé'],['#3DB34A','Scanné']].map(([c,l]) => (
              <View key={l} style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: c }]} />
                <Text style={s.legendTxt}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Seat grid */}
          <View style={s.bus}>
            <View style={s.cabinLabel}><Text style={s.cabinText}>CABINE CHAUFFEUR</Text></View>
            {rows.map(row => {
              const rowSeats = seats.filter(seat => seat.seat_row === row);
              const left  = rowSeats.filter(seat => leftCols.includes(seat.seat_col));
              const right = rowSeats.filter(seat => rightCols.includes(seat.seat_col));
              return (
                <View key={row} style={s.seatRow}>
                  <Text style={s.rowNum}>{row}</Text>
                  {left.map(renderSeat)}
                  <View style={s.aisle} />
                  {right.map(renderSeat)}
                </View>
              );
            })}
          </View>
          <Text style={s.hint}>Touchez un siège réservé pour voir le passager</Text>
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Passenger detail modal */}
      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={s.modal}>
            <View style={[s.modalBadge, { backgroundColor: selected?.ticket_status === 'scanned' ? '#3DB34A' : '#E24B4A' }]}>
              <Text style={s.modalBadgeTxt}>{selected?.seat_number}</Text>
            </View>
            <Text style={s.modalName}>{selected?.passenger_name || '—'}</Text>
            <Text style={s.modalPhone}>{selected?.passenger_phone || '—'}</Text>
            <Text style={s.modalRef}>Réf: {selected?.ref || '—'}</Text>
            <Text style={[s.modalStatus, { color: selected?.ticket_status === 'scanned' ? '#3DB34A' : '#E24B4A' }]}>
              {selected?.ticket_status === 'scanned' ? '✓ Scanné' : '● Pas encore scanné'}
            </Text>
            <TouchableOpacity style={s.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={s.modalCloseTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  shell:        { flex: 1, backgroundColor: '#F7F7F5' },
  header:       { backgroundColor: '#111110', padding: 14, paddingTop: 10 },
  backText:     { fontSize: 14, color: '#3DB34A', fontWeight: '500', marginBottom: 6 },
  title:        { fontSize: 17, fontWeight: '600', color: '#fff' },
  subtitle:     { fontSize: 11, color: '#ADADAA', marginTop: 2 },
  statsBar:     { flexDirection: 'row', backgroundColor: '#fff', padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EFEFED', gap: 20 },
  stat:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:          { width: 10, height: 10, borderRadius: 5 },
  statTxt:      { fontSize: 12, color: '#333331', fontWeight: '500' },
  body:         { flex: 1, padding: 12 },
  legend:       { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 10, marginBottom: 10, gap: 10 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:    { width: 14, height: 14, borderRadius: 4 },
  legendTxt:    { fontSize: 11, color: '#333331' },
  bus:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 10, alignItems: 'center' },
  cabinLabel:   { backgroundColor: '#F7F7F5', borderRadius: 6, padding: 6, alignItems: 'center', marginBottom: 8, width: '100%' },
  cabinText:    { fontSize: 9, fontWeight: '600', color: '#ADADAA', letterSpacing: 1 },
  seatRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, justifyContent: 'center' },
  rowNum:       { fontSize: 10, color: '#DDDDD9', width: 20, textAlign: 'right' },
  aisle:        { width: 16 },
  seat:         { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  seatText:     { fontSize: 8, fontWeight: '700', color: '#fff' },
  checkmark:    { fontSize: 9, color: '#fff', marginTop: -2 },
  hint:         { textAlign: 'center', fontSize: 11, color: '#ADADAA', marginTop: 10 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: 280, alignItems: 'center', gap: 8 },
  modalBadge:   { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalBadgeTxt:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  modalName:    { fontSize: 17, fontWeight: '600', color: '#111110', textAlign: 'center' },
  modalPhone:   { fontSize: 13, color: '#737370' },
  modalRef:     { fontSize: 12, color: '#ADADAA', letterSpacing: 0.5 },
  modalStatus:  { fontSize: 13, fontWeight: '600' },
  modalClose:   { marginTop: 8, backgroundColor: '#F7F7F5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28 },
  modalCloseTxt:{ fontSize: 14, fontWeight: '600', color: '#111110' },
});
