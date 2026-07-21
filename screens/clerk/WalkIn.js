import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, FlatList, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API } from '../../api';

const TERMINALS = [
  { code: 'GE-DLA-AKWA', name: 'Douala Akwa' },
  { code: 'GE-DLA-BON',  name: 'Douala Bonabéri' },
  { code: 'GE-YDE-NSAM', name: 'Yaoundé Nsam' },
  { code: 'GE-BMD-CC',   name: 'Bamenda City Chemist' },
  { code: 'GE-BFS',      name: 'Bafoussam' },
  { code: 'GE-BUE',      name: 'Buea' },
  { code: 'GE-LMB',      name: 'Limbe' },
];

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function WalkIn({ navigation }) {
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [idNo, setIdNo]           = useState('');
  const [from, setFrom]           = useState(null);
  const [to, setTo]               = useState(null);
  const [date, setDate]           = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker]     = useState(false);
  const [trips, setTrips]         = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [seats, setSeats]         = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [payment, setPayment]     = useState('cash');
  const [loading, setLoading]     = useState(false);
  const [issuing, setIssuing]     = useState(false);
  const [issued, setIssued]       = useState(null);
  const [token, setToken]         = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('userToken').then(t => setToken(t));
  }, []);

  useEffect(() => {
    if (!from || !to || !date) return;
    setTrips([]);
    setSelectedTrip(null);
    setSeats([]);
    setSelectedSeat(null);
    const ds = formatDate(date);
    axios.get(`${API}/api/trips/search?origin=${from.code}&destination=${to.code}&date=${ds}&passengers=1`).then(r => { console.log('SEARCH URL:', `${API}/api/trips/search?origin=${from.code}&destination=${to.code}&date=${ds}`); return r; })
      .then(r => setTrips(r.data?.trips || []))
      .catch(() => setTrips([]));
  }, [from, to, date]);

  useEffect(() => {
    if (!selectedTrip || !token) return;
    setSeats([]);
    setSelectedSeat(null);
    axios.get(`${API}/api/trips/${selectedTrip.id}/seats/manifest`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setSeats(r.data?.seats || [])).catch(() => {});
  }, [selectedTrip, token]);

  async function issueTicket() {
    if (!name || !phone || !from || !to || !selectedTrip || !selectedSeat) return;
    setIssuing(true);
    try {
      const t = token || await AsyncStorage.getItem('userToken');
      const r = await axios.post(`${API}/api/tickets/book`, {
        trip_id: selectedTrip.id,
        seat_numbers: [selectedSeat.seat_number],
        passenger_name: name,
        passenger_phone: phone,
        passenger_id_no: idNo || null,
        payment_method: payment,
        seat_class: 'standard',
      }, { headers: { Authorization: `Bearer ${t}` } });
      setIssued(r.data.tickets?.[0]);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to issue ticket');
    } finally {
      setIssuing(false);
    }
  }

  function reset() {
    setName(''); setPhone(''); setIdNo('');
    setFrom(null); setTo(null); setDate(new Date());
    setTrips([]); setSelectedTrip(null);
    setSeats([]); setSelectedSeat(null);
    setIssued(null);
  }

  const rows = [...new Set(seats.map(s => s.seat_row))].sort((a, b) => a - b);

  if (issued) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 48 }}>✅</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111110', marginTop: 16 }}>Ticket Issued</Text>
        <Text style={{ fontSize: 14, color: '#737370', marginTop: 8, textAlign: 'center' }}>
          {issued.ref} · Seat {issued.seat_number}{'\n'}{name} · {phone}
        </Text>
        <TouchableOpacity onPress={reset} style={[s.btn, { marginTop: 32 }]}>
          <Text style={s.btnText}>Issue Another Ticket</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Walk-in Registration</Text>

      {/* Passenger Info */}
      <Text style={s.label}>Full Name *</Text>
      <TextInput style={s.input} placeholder="Passenger name" value={name} onChangeText={setName} />

      <Text style={s.label}>Phone *</Text>
      <TextInput style={s.input} placeholder="+237 6XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={s.label}>ID / CNI (optional)</Text>
      <TextInput style={s.input} placeholder="National ID number" value={idNo} onChangeText={setIdNo} />

      {/* Route */}
      <Text style={s.label}>From *</Text>
      <TouchableOpacity style={s.picker} onPress={() => setShowFromPicker(true)}>
        <Text style={{ color: from ? '#111110' : '#ADADAA', fontSize: 15 }}>{from ? from.name : 'Select origin...'}</Text>
        <Text style={{ color: '#ADADAA' }}>▼</Text>
      </TouchableOpacity>

      <Text style={s.label}>To *</Text>
      <TouchableOpacity style={s.picker} onPress={() => setShowToPicker(true)}>
        <Text style={{ color: to ? '#111110' : '#ADADAA', fontSize: 15 }}>{to ? to.name : 'Select destination...'}</Text>
        <Text style={{ color: '#ADADAA' }}>▼</Text>
      </TouchableOpacity>

      {/* Date */}
      <Text style={s.label}>Date *</Text>
      <TouchableOpacity style={s.picker} onPress={() => setShowDatePicker(true)}>
        <Text style={{ color: '#111110', fontSize: 15 }}>{date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        <Text style={{ color: '#ADADAA' }}>📅</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          minimumDate={new Date()}
          onChange={(event, d) => { setShowDatePicker(false); if (d) setDate(d); }}
        />
      )}

      {/* Trip */}
      {trips.length > 0 && (
        <>
          <Text style={s.label}>Select Departure *</Text>
          <TouchableOpacity style={s.picker} onPress={() => setShowTripPicker(true)}>
            <Text style={{ color: selectedTrip ? '#111110' : '#ADADAA', fontSize: 15 }}>
              {selectedTrip ? `${selectedTrip.bus_code} · ${selectedTrip.depart_time?.slice(0,5)} → ${selectedTrip.arrive_time?.slice(0,5)}` : 'Select trip...'}
            </Text>
            <Text style={{ color: '#ADADAA' }}>▼</Text>
          </TouchableOpacity>
        </>
      )}
      {from && to && trips.length === 0 && (
        <Text style={{ color: '#ADADAA', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>No trips found for this route and date.</Text>
      )}

      {/* Seat Map */}
      {seats.length > 0 && (
        <>
          <Text style={s.label}>Select Seat *</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 10, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10, justifyContent: 'center' }}>
              {[['#378ADD','Available'],['#E24B4A','Booked'],['#3DB34A','Selected']].map(([color, label]) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color }} />
                  <Text style={{ fontSize: 11, color: '#555' }}>{label}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#ADADAA', textAlign: 'center', marginBottom: 8 }}>DRIVER CABIN</Text>
            {rows.map(row => (
              <View key={row} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ width: 20, fontSize: 11, color: '#ADADAA' }}>{row}</Text>
                {seats.filter(seat => seat.seat_row === row).map(seat => {
                  const isBooked   = seat.status === 'booked' || seat.status === 'locked';
                  const isSelected = selectedSeat?.seat_number === seat.seat_number;
                  return (
                    <TouchableOpacity
                      key={seat.seat_number}
                      disabled={isBooked}
                      onPress={() => setSelectedSeat(seat)}
                      style={{ width: 36, height: 36, borderRadius: 6, margin: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: isBooked ? '#E24B4A' : isSelected ? '#3DB34A' : '#378ADD' }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{seat.seat_number}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}

      {/* Payment */}
      <Text style={s.label}>Payment Method</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
        {[['cash','💵 Cash'],['momo','📱 MTN MoMo'],['orange','🟠 Orange Money']].map(([val, label]) => (
          <TouchableOpacity key={val} onPress={() => setPayment(val)}
            style={{ flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: payment === val ? '#3DB34A' : '#fff', borderWidth: 1, borderColor: payment === val ? '#3DB34A' : '#EFEFED' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: payment === val ? '#fff' : '#555' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.btn, { opacity: (!name || !phone || !from || !to || !selectedTrip || !selectedSeat || issuing) ? 0.5 : 1 }]}
        onPress={issueTicket}
        disabled={!name || !phone || !from || !to || !selectedTrip || !selectedSeat || issuing}
      >
        {issuing ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Issue Ticket →</Text>}
      </TouchableOpacity>

      {/* From Picker Modal */}
      <Modal visible={showFromPicker} transparent animationType="slide">
        <View style={s.modal}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Origin</Text>
            <FlatList data={TERMINALS.filter(t => t.code !== to?.code)} keyExtractor={t => t.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => { setFrom(item); setShowFromPicker(false); }}>
                  <Text style={{ fontSize: 15, color: '#111110' }}>{item.name}</Text>
                </TouchableOpacity>
              )} />
            <TouchableOpacity onPress={() => setShowFromPicker(false)} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#3DB34A', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* To Picker Modal */}
      <Modal visible={showToPicker} transparent animationType="slide">
        <View style={s.modal}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Destination</Text>
            <FlatList data={TERMINALS.filter(t => t.code !== from?.code)} keyExtractor={t => t.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => { setTo(item); setShowToPicker(false); }}>
                  <Text style={{ fontSize: 15, color: '#111110' }}>{item.name}</Text>
                </TouchableOpacity>
              )} />
            <TouchableOpacity onPress={() => setShowToPicker(false)} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#3DB34A', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Trip Picker Modal */}
      <Modal visible={showTripPicker} transparent animationType="slide">
        <View style={s.modal}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Departure</Text>
            <FlatList data={trips} keyExtractor={t => t.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => { setSelectedTrip(item); setShowTripPicker(false); }}>
                  <Text style={{ fontSize: 15, color: '#111110', fontWeight: '600' }}>{item.depart_time?.slice(0,5)} → {item.arrive_time?.slice(0,5)}</Text>
                  <Text style={{ fontSize: 12, color: '#737370', marginTop: 2 }}>{item.bus_code} · {item.available_seats} seats available</Text>
                </TouchableOpacity>
              )} />
            <TouchableOpacity onPress={() => setShowTripPicker(false)} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#3DB34A', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F6', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111110', marginBottom: 24, marginTop: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#737370', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 14, fontSize: 15, color: '#111110' },
  picker: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btn: { backgroundColor: '#3DB34A', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111110', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F7F7F6' },
});
