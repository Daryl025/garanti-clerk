import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API } from '../../api';
import { useAuthStore } from '../../store/authStore';

export default function SeatMapView({ route }) {
  const { trip } = route.params;
  const token = useAuthStore(s => s.token);
  const [seats, setSeats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [trip.id])
  );

  async function load() {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API}/api/trips/${trip.id}/seats/manifest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSeats(res.data.seats || []);
    } catch (e) {
      console.error('SeatMap error', e.message);
    } finally {
      setRefreshing(false);
    }
  }

  const rows = [...new Set(seats.map(s => s.seat_row))].sort((a, b) => a - b);
  const booked  = seats.filter(s => s.status === 'booked').length;
  const scanned = seats.filter(s => s.ticket_status === 'scanned').length;
  const free    = seats.filter(s => s.status === 'free').length;

  function seatColor(seat) {
    if (seat.ticket_status === 'scanned') return '#3DB34A';
    if (seat.status === 'booked') return '#E53E3E';
    return '#E2E8F0';
  }

  function seatText(seat) {
    if (seat.ticket_status === 'scanned') return '#fff';
    if (seat.status === 'booked') return '#fff';
    return '#4A5568';
  }

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3DB34A" />}
    >
      <View style={s.header}>
        <Text style={s.title}>Seat Map</Text>
        <Text style={s.subtitle}>{trip.bus_code} · {trip.depart_time?.slice(0,5)} → {trip.arrive_time?.slice(0,5)}</Text>
      </View>

      <View style={s.legend}>
        {[['#E2E8F0','#4A5568','Free'],['#E53E3E','#fff','Booked'],['#3DB34A','#fff','Scanned']].map(([bg,tc,label]) => (
          <View key={label} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: bg }]} />
            <Text style={s.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={s.stats}>
        <Text style={s.statText}>Free: {free}</Text>
        <Text style={s.statText}>Booked: {booked}</Text>
        <Text style={[s.statText, { color: '#3DB34A' }]}>Scanned: {scanned}</Text>
      </View>

      <View style={s.map}>
        {rows.map(row => (
          <View key={row} style={s.row}>
            <Text style={s.rowLabel}>{row}</Text>
            {seats.filter(seat => seat.seat_row === row).map(seat => (
              <TouchableOpacity key={seat.seat_number} style={[s.seat, { backgroundColor: seatColor(seat) }]}>
                <Text style={[s.seatText, { color: seatText(seat) }]}>{seat.seat_col}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F6' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: '700', color: '#111110' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, padding: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#555' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingBottom: 12 },
  statText: { fontSize: 14, fontWeight: '600', color: '#333' },
  map: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowLabel: { width: 24, fontSize: 13, color: '#888', fontWeight: '600' },
  seat: { width: 40, height: 40, borderRadius: 8, marginHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  seatText: { fontSize: 12, fontWeight: '700' },
});
