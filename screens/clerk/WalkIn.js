import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LangToggle from '../../components/LangToggle';

const API = 'https://sweet-patience-production.up.railway.app';
const PAY_OPTIONS = [
  { key: 'cash',         label: 'Cash',         icon: '💵' },
  { key: 'mtn_momo',     label: 'MTN MoMo',     icon: '📱' },
  { key: 'orange_money', label: 'Orange Money', icon: '🟠' },
];
const FALLBACK_TRIPS = [
  { id: '9ce29be5-b241-42cd-85fb-7feb5ded92c4', time: '06:00', label: 'GE-101', from: 'Douala Akwa', to: 'Yaoundé Nsam', fare: 6000 },
  { id: '30dbfb01-81a2-4ae6-b4ba-4e6832b89f01', time: '13:00', label: 'GE-102', from: 'Douala Akwa', to: 'Yaoundé Nsam', fare: 6000 },
];

export default function WalkIn({ navigation }) {
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [idNo, setIdNo]               = useState('');
  const [selectedTrip, setTrip]       = useState(null);
  const [payMethod, setPayMethod]     = useState('cash');
  const [errors, setErrors]           = useState({});
  const [stage, setStage]             = useState('form');
  const [trips, setTrips]             = useState(FALLBACK_TRIPS);
  const [submitting, setSubmitting]   = useState(false);
  const [seats, setSeats]             = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showPicker, setShowPicker]   = useState(false);
  const [seatsLoading, setSeatsLoading] = useState(false);

  // Load live trips on mount
  useEffect(() => {
    axios.get(`${API}/api/trips/today`, { timeout: 10000 })
      .then(r => {
        const mapped = (r.data?.trips || []).map(t => ({
          id:    t.id,
          label: t.bus_code,
          time:  t.depart_time?.slice(0, 5) || '',
          from:  t.origin_name,
          to:    t.destination_name,
          fare:  t.fare_standard || 5000,
        }));
        if (mapped.length > 0) setTrips(mapped);
      })
      .catch(() => {});
  }, []);

  // Fetch seats + poll every 10s when trip selected
  useEffect(() => {
    if (!selectedTrip) { setSeats([]); return; }
    async function load() {
      try {
        const token = await AsyncStorage.getItem('clerk_token');
        const r = await axios.get(`${API}/api/trips/${selectedTrip.id}/seats`, {
          headers: { Authorization: `Bearer ${token}` }, timeout: 8000
        });
        setSeats(r.data?.seats || []);
      } catch (e) { console.log('fetchSeats error:', e.message); }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [selectedTrip]);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name required';
    if (!phone.trim()) e.phone = 'Phone required';
    if (!selectedTrip) e.trip = 'Select a departure';
    if (!selectedSeat) e.seat = 'Select a seat';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('clerk_token');
      const res = await axios.post(`${API}/api/tickets/book`, {
        trip_id:          selectedTrip.id,
        seat_numbers:     [selectedSeat],
        passenger_name:   name.trim(),
        passenger_phone:  phone.trim(),
        passenger_id:     idNo.trim() || undefined,
        payment_method:   payMethod,
        ticket_type:      'online',
        seat_class:       'standard',
      }, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      if (res.data?.tickets?.length || res.data?.ticket) {
        setStage('success');
      } else {
        Alert.alert('Error', res.data?.error || 'Booking failed');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setName(''); setPhone(''); setIdNo('');
    setTrip(null); setSelectedSeat(null);
    setPayMethod('cash'); setErrors({});
    setSeats([]); setStage('form');
  }

  if (stage === 'success') {
    return (
      <SafeAreaView style={s.shell}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111110', marginTop: 16 }}>Ticket Issued</Text>
          <Text style={{ fontSize: 14, color: '#737370', marginTop: 8, textAlign: 'center' }}>
            {name} · Seat {selectedSeat} · {selectedTrip?.label} {selectedTrip?.time}
          </Text>
          <TouchableOpacity style={[s.btn, { marginTop: 32, paddingHorizontal: 40 }]} onPress={reset}>
            <Text style={s.btnText}>New Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.shell}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={s.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.title}>Walk-in Registration</Text>
              </View>
              <LangToggle />
            </View>

            <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={s.label}>Full Name *</Text>
              <View style={[s.input, errors.name && s.inputError]}>
                <TextInput style={s.inputText} placeholder="e.g. Tchounga Paul" placeholderTextColor="#ADADAA"
                  value={name} onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: null })); }} />
              </View>
              {errors.name && <Text style={s.errorText}>{errors.name}</Text>}

              {/* Phone */}
              <Text style={[s.label, { marginTop: 10 }]}>Phone *</Text>
              <View style={[s.input, errors.phone && s.inputError]}>
                <TextInput style={s.inputText} placeholder="+237 6XX XXX XXX" placeholderTextColor="#ADADAA"
                  value={phone} onChangeText={v => { setPhone(v); setErrors(e => ({ ...e, phone: null })); }}
                  keyboardType="phone-pad" maxLength={15} />
              </View>
              {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}

              {/* ID */}
              <Text style={[s.label, { marginTop: 10 }]}>ID / CNI (optional)</Text>
              <View style={s.input}>
                <TextInput style={s.inputText} placeholder="National ID number" placeholderTextColor="#ADADAA"
                  value={idNo} onChangeText={setIdNo} />
              </View>

              {/* Trip dropdown */}
              <Text style={[s.label, { marginTop: 10 }]}>Select Departure *</Text>
              <TouchableOpacity style={[s.dropdownBtn, errors.trip && s.inputError]} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
                <Text style={selectedTrip ? s.dropdownVal : s.dropdownPlaceholder}>
                  {selectedTrip ? `${selectedTrip.label} · ${selectedTrip.time} — ${selectedTrip.to}` : 'Choose a departure…'}
                </Text>
                <Text style={{ color: '#ADADAA' }}>▼</Text>
              </TouchableOpacity>
              {errors.trip && <Text style={s.errorText}>{errors.trip}</Text>}

              {/* Trip picker sheet */}
              {showPicker && (
                <View style={s.pickerSheet}>
                  <View style={s.pickerHeader}>
                    <Text style={s.pickerTitle}>Select Departure</Text>
                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                      <Text style={{ color: '#3DB34A', fontSize: 14, fontWeight: '600' }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                  {trips.map(trip => (
                    <TouchableOpacity key={trip.id}
                      style={[s.pickerItem, selectedTrip?.id === trip.id && { backgroundColor: '#3DB34A' }]}
                      onPress={() => { setTrip(trip); setSelectedSeat(null); setErrors(e => ({ ...e, trip: null })); setShowPicker(false); }}
                      activeOpacity={0.8}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.pickerItemLabel, selectedTrip?.id === trip.id && { color: '#fff' }]}>
                          {trip.label} · {trip.time}
                        </Text>
                        <Text style={[{ fontSize: 12, color: '#737370', marginTop: 2 }, selectedTrip?.id === trip.id && { color: '#c8f0c8' }]}>
                          {trip.from} → {trip.to}
                        </Text>
                      </View>
                      <Text style={[{ fontSize: 13, fontWeight: '600', color: '#3DB34A' }, selectedTrip?.id === trip.id && { color: '#fff' }]}>
                        FCFA {trip.fare?.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Seat map */}
              {selectedTrip && (
                <>
                  <Text style={[s.label, { marginTop: 14 }]}>Select Seat *</Text>
                  <>
                      <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 10, marginBottom: 10, gap: 6 }}>
                        {[{ label: 'Available', color: '#378ADD' }, { label: 'Booked', color: '#E24B4A' }, { label: 'Selected', color: '#3DB34A' }].map(l => (
                          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#F7F7F5' }}>
                            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: l.color }} />
                            <Text style={{ fontSize: 12, color: '#333331' }}>{l.label}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 10, alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#F7F7F5', borderRadius: 6, padding: 6, alignItems: 'center', marginBottom: 8, width: '100%' }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: '#ADADAA', letterSpacing: 0.8 }}>DRIVER CABIN</Text>
                        </View>
                        {[...new Set(seats.map(s => s.seat_row))].sort((a, b) => a - b).map(row => {
                          const rowSeats = seats.filter(s => s.seat_row === row);
                          const left  = rowSeats.filter(s => ['A', 'B'].includes(s.seat_col));
                          const right = rowSeats.filter(s => ['C', 'D', 'E'].includes(s.seat_col));
                          return (
                            <View key={row} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, justifyContent: 'center' }}>
                              <Text style={{ fontSize: 10, color: '#DDDDD9', width: 20, textAlign: 'right' }}>{row}</Text>
                              {left.map(seat => {
                                const isBooked   = seat.status === 'booked' || seat.status === 'locked';
                                const isSelected = selectedSeat === seat.seat_number;
                                return (
                                  <TouchableOpacity key={seat.seat_number} disabled={isBooked}
                                    onPress={() => { setSelectedSeat(seat.seat_number); setErrors(e => ({ ...e, seat: null })); }}
                                    style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                      backgroundColor: isBooked ? '#E24B4A' : isSelected ? '#3DB34A' : '#378ADD' }}>
                                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{seat.seat_number}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                              <View style={{ width: 16 }} />
                              {right.map(seat => {
                                const isBooked   = seat.status === 'booked' || seat.status === 'locked';
                                const isSelected = selectedSeat === seat.seat_number;
                                return (
                                  <TouchableOpacity key={seat.seat_number} disabled={isBooked}
                                    onPress={() => { setSelectedSeat(seat.seat_number); setErrors(e => ({ ...e, seat: null })); }}
                                    style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                      backgroundColor: isBooked ? '#E24B4A' : isSelected ? '#3DB34A' : '#378ADD' }}>
                                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{seat.seat_number}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          );
                        })}
                        {seats.length === 0 && <Text style={{ fontSize: 12, color: '#ADADAA', padding: 20 }}>No seat data</Text>}
                      </View>
                  </>
                  {errors.seat && <Text style={s.errorText}>{errors.seat}</Text>}
                </>
              )}

              {/* Payment */}
              <Text style={[s.label, { marginTop: 14 }]}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                {PAY_OPTIONS.map(p => (
                  <TouchableOpacity key={p.key} style={[s.payBtn, payMethod === p.key && s.payBtnActive]}
                    onPress={() => setPayMethod(p.key)} activeOpacity={0.8}>
                    <Text style={{ fontSize: 16 }}>{p.icon}</Text>
                    <Text style={[s.payLabel, payMethod === p.key && { color: '#fff' }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary */}
              {selectedTrip && selectedSeat && (
                <View style={s.summary}>
                  <Text style={s.summaryTitle}>Booking Summary</Text>
                  {[['Passenger', name || '—'], ['Phone', phone || '—'], ['Seat', selectedSeat],
                    ['Departure', `${selectedTrip.label} ${selectedTrip.time}`],
                    ['Route', `${selectedTrip.from} → ${selectedTrip.to}`],
                    ['Fare', `FCFA ${selectedTrip.fare?.toLocaleString()}`],
                    ['Payment', PAY_OPTIONS.find(p => p.key === payMethod)?.label]
                  ].map(([k, v]) => (
                    <View key={k} style={s.summaryRow}>
                      <Text style={s.summaryKey}>{k}</Text>
                      <Text style={s.summaryVal}>{v}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer */}
            <View style={s.footer}>
              <TouchableOpacity style={[s.btn, submitting && s.btnDisabled]} onPress={submit} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Issue Ticket →</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  shell:              { flex: 1, backgroundColor: '#F7F7F5' },
  header:             { backgroundColor: '#fff', padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFED', flexDirection: 'row', alignItems: 'flex-start' },
  backText:           { fontSize: 14, color: '#3DB34A', fontWeight: '500', marginBottom: 6 },
  title:              { fontSize: 17, fontWeight: '600', color: '#111110' },
  body:               { flex: 1, padding: 14 },
  label:              { fontSize: 12, fontWeight: '600', color: '#737370', marginBottom: 6, letterSpacing: 0.4 },
  input:              { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', paddingHorizontal: 14, height: 46, justifyContent: 'center' },
  inputText:          { fontSize: 14, color: '#111110' },
  inputError:         { borderColor: '#E24B4A' },
  errorText:          { fontSize: 11, color: '#E24B4A', marginTop: 4 },
  dropdownBtn:        { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', paddingHorizontal: 14, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownVal:        { fontSize: 14, color: '#111110', flex: 1 },
  dropdownPlaceholder:{ fontSize: 14, color: '#ADADAA', flex: 1 },
  pickerSheet:        { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', marginTop: 6, overflow: 'hidden' },
  pickerHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  pickerTitle:        { fontSize: 14, fontWeight: '600', color: '#111110' },
  pickerItem:         { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F7F7F5' },
  pickerItemLabel:    { fontSize: 14, fontWeight: '600', color: '#111110' },
  payBtn:             { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 10, alignItems: 'center', gap: 4 },
  payBtnActive:       { backgroundColor: '#3DB34A', borderColor: '#3DB34A' },
  payLabel:           { fontSize: 11, fontWeight: '600', color: '#737370' },
  summary:            { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 14, marginTop: 14 },
  summaryTitle:       { fontSize: 13, fontWeight: '700', color: '#111110', marginBottom: 10 },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F7F7F5' },
  summaryKey:         { fontSize: 12, color: '#737370' },
  summaryVal:         { fontSize: 12, fontWeight: '600', color: '#111110' },
  footer:             { padding: 14, paddingBottom: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EFEFED' },
  btn:                { backgroundColor: '#3DB34A', borderRadius: 14, padding: 15, alignItems: 'center' },
  btnDisabled:        { backgroundColor: '#9fd4a5' },
  btnText:            { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
