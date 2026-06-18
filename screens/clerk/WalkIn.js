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
  { id: '501afc2a-91eb-4136-a92d-e96da16242c9', time: '06:00', label: 'GE-101', to: 'Yaoundé Nsam', fare: 6000 },
  { id: 'd94859c6-c214-4d78-a775-0c0bdc3a9c7b', time: '13:00', label: 'GE-102', to: 'Yaoundé Nsam', fare: 6000 },
];

export default function WalkIn({ navigation }) {
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [idNo, setIdNo]             = useState('');
  const [selectedTrip, setTrip]     = useState(null);
  const [seatClass, setSeatClass]   = useState('standard');
  const [payMethod, setPayMethod]   = useState('cash');
  const [errors, setErrors]         = useState({});
  const [stage, setStage]           = useState('form');
  const [trips, setTrips]           = useState(FALLBACK_TRIPS);
  const [submitting, setSubmitting] = useState(false);

  // fetchTrips disabled — hardcoded trips always show correct labels

  async function fetchTrips() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(
        `${API}/api/trips/search?origin=65887779-2ea0-4615-813f-45772a8f5770&destination=81bb4e6e-c758-47cd-a689-40e0f43a31f4&date=${today}&passengers=1`,
        { timeout: 10000 }
      );
      const data = res.data.trips || res.data;
      if (data && data.length) {
        setTrips(data.map(t => ({
          id: t.id,
          time: t.depart_time?.slice(0,5),
          label: t.trip_code || t.id.slice(0,8),
          to: t.destination_name || 'Yaoundé Nsam',
          fare: t.fare_standard || 6000,
        })));
      }
    } catch (e) {
      // keep fallback trips
    }
  }

  function validate() {
    const e = {};
    if (!name.trim())  e.name  = 'Name is required';
    if (!phone.trim()) e.phone = 'Phone is required';
    if (!selectedTrip) e.trip  = 'Select a departure';
    return e;
  }

  function proceed() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStage('confirm');
  }

  async function issueTicket() {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('clerk_token');
      // Get first available free seat for this trip
      const seatsRes = await axios.get(`${API}/api/trips/${selectedTrip.id}/seats`, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
      const seats = seatsRes.data?.seats || seatsRes.data || [];
      const freeSeatObj = seats.find(s => s.status === 'free' || s.status === 'available');
      if (!freeSeatObj) { Alert.alert('Error', 'No seats available for this trip'); setSubmitting(false); return; }
      const freeSeat = freeSeatObj.seat_number;
      const res = await axios.post(`${API}/api/tickets/book`, {
        trip_id: selectedTrip.id,
        passenger_name: name,
        passenger_phone: phone,
        passenger_id_no: idNo || null,
        seat_numbers: [freeSeat],
        payment_method: payMethod,
        ticket_type: 'walkin',
        extra_bags: 0,
        fare_paid: fare,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      const ticket = res.data.tickets?.[0];
      Alert.alert(
        'Ticket Issued',
        `Ref: ${ticket?.ref}\nSeat: ${ticket?.seat_number || 'Auto'}\nSMS sent to ${phone}`,
        [{ text: 'Done', onPress: () => navigation.navigate('ClerkHome') }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || e.message);
    }
    setSubmitting(false);
  }

  const fare = selectedTrip
    ? (seatClass === 'vip' ? selectedTrip.fare * 1.5 : selectedTrip.fare)
    : 0;

  if (stage === 'confirm') {
    return (
      <SafeAreaView style={s.shell}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStage('form')}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Confirm & Issue</Text>
          <LangToggle />
        </View>
        <ScrollView style={s.body} contentContainerStyle={{ gap: 12 }}>
          <View style={s.card}>
            <Text style={s.cardTitle}>BOOKING SUMMARY</Text>
            {[
              ['Passenger', name],
              ['Phone', phone],
              ['Departure', selectedTrip?.time],
              ['Destination', selectedTrip?.to],
              ['Class', seatClass === 'vip' ? 'VIP' : 'Standard'],
              ['Payment', payMethod === 'cash' ? 'Cash' : payMethod === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'],
            ].map(([label, value]) => (
              <View key={label} style={s.summaryRow}>
                <Text style={s.summaryLabel}>{label}</Text>
                <Text style={s.summaryVal}>{value}</Text>
              </View>
            ))}
            <View style={[s.summaryRow, { borderTopWidth: 1, borderTopColor: '#EFEFED', marginTop: 8, paddingTop: 8 }]}>
              <Text style={[s.summaryLabel, { fontWeight: '600', color: '#111110' }]}>Total</Text>
              <Text style={[s.summaryVal, { color: '#3DB34A', fontSize: 16, fontWeight: '700' }]}>
                FCFA {fare.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>SMS CONFIRMATION</Text>
            <View style={s.smsPreview}>
              <Text style={s.smsLabel}>Will be sent automatically to {phone}</Text>
              <Text style={s.smsText}>
                Garanti Express: Ticket confirmed! {selectedTrip?.time} DLA to {selectedTrip?.to}. FCFA {fare.toLocaleString()}. Show QR at boarding.
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.btn, submitting && { opacity: 0.6 }]}
            onPress={issueTicket}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Issue Ticket & Send SMS</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={s.shell}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.title}>Walk-in Registration</Text>
            <LangToggle />
          </View>
          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            <Text style={s.label}>Full Name *</Text>
            <View style={[s.input, errors.name && s.inputError]}>
              <TextInput style={s.inputText} placeholder="e.g. Tchounga Paul" placeholderTextColor="#ADADAA"
                value={name} onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: null })); }} />
            </View>
            {errors.name && <Text style={s.errorText}>{errors.name}</Text>}

            <Text style={[s.label, { marginTop: 10 }]}>Phone *</Text>
            <View style={[s.input, errors.phone && s.inputError]}>
              <TextInput style={s.inputText} placeholder="+237 6XX XXX XXX" placeholderTextColor="#ADADAA"
                value={phone} onChangeText={v => { setPhone(v); setErrors(e => ({ ...e, phone: null })); }}
                keyboardType="phone-pad" maxLength={15} />
            </View>
            {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}

            <Text style={[s.label, { marginTop: 10 }]}>ID / CNI (optional)</Text>
            <View style={s.input}>
              <TextInput style={s.inputText} placeholder="National ID number" placeholderTextColor="#ADADAA"
                value={idNo} onChangeText={setIdNo} />
            </View>

            <Text style={[s.label, { marginTop: 10 }]}>Select Departure *</Text>
            {trips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={[s.tripCard, selectedTrip?.id === trip.id && s.tripCardSelected]}
                onPress={() => { setTrip(trip); setErrors(e => ({ ...e, trip: null })); }}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={s.tripTime}>{trip.label} · Départ {trip.time}</Text>
                  <Text style={s.tripDest}>{trip.to}</Text>
                </View>
                <Text style={s.tripFare}>FCFA {trip.fare?.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
            {errors.trip && <Text style={s.errorText}>{errors.trip}</Text>}

            <Text style={[s.label, { marginTop: 14 }]}>Seat Class</Text>
            <View style={s.segRow}>
              {['standard','vip'].map(c => (
                <TouchableOpacity key={c} style={[s.seg, seatClass === c && s.segActive]} onPress={() => setSeatClass(c)}>
                  <Text style={[s.segText, seatClass === c && s.segTextActive]}>
                    {c === 'vip' ? 'VIP (+50%)' : 'Standard'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.label, { marginTop: 14 }]}>Payment Method</Text>
            <View style={s.payRow}>
              {PAY_OPTIONS.map(p => (
                <TouchableOpacity key={p.key} style={[s.payBtn, payMethod === p.key && s.payBtnActive]} onPress={() => setPayMethod(p.key)} activeOpacity={0.8}>
                  <Text style={s.payIcon}>{p.icon}</Text>
                  <Text style={[s.payLabel, payMethod === p.key && { color: '#fff' }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
          <View style={s.footer}>
            <View style={s.fareRow}>
              <Text style={s.fareLabel}>Total</Text>
              <Text style={s.fareVal}>FCFA {fare.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={s.btn} onPress={proceed} activeOpacity={0.85}>
              <Text style={s.btnText}>Review & Confirm</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  shell:           { flex: 1, backgroundColor: '#F7F7F5' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  backText:        { fontSize: 14, color: '#3DB34A', fontWeight: '500' },
  title:           { fontSize: 17, fontWeight: '600', color: '#111110' },
  body:            { flex: 1, padding: 14 },
  label:           { fontSize: 12, fontWeight: '600', color: '#737370', letterSpacing: 0.5, marginBottom: 6 },
  input:           { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#EFEFED', paddingHorizontal: 12, paddingVertical: 10 },
  inputText:       { fontSize: 14, color: '#111110' },
  inputError:      { borderColor: '#E24B4A' },
  errorText:       { fontSize: 11, color: '#E24B4A', marginTop: 4 },
  tripCard:        { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripCardSelected:{ borderColor: '#3DB34A', backgroundColor: '#F0FAF1' },
  tripTime:        { fontSize: 14, fontWeight: '600', color: '#111110' },
  tripDest:        { fontSize: 12, color: '#737370', marginTop: 2 },
  tripFare:        { fontSize: 13, fontWeight: '600', color: '#3DB34A' },
  segRow:          { flexDirection: 'row', gap: 8, marginBottom: 4 },
  seg:             { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#EFEFED', padding: 10, alignItems: 'center' },
  segActive:       { backgroundColor: '#3DB34A', borderColor: '#3DB34A' },
  segText:         { fontSize: 13, color: '#737370', fontWeight: '500' },
  segTextActive:   { color: '#fff' },
  payRow:          { flexDirection: 'row', gap: 8 },
  payBtn:          { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#EFEFED', padding: 10, alignItems: 'center', gap: 4 },
  payBtnActive:    { backgroundColor: '#3DB34A', borderColor: '#3DB34A' },
  payIcon:         { fontSize: 18 },
  payLabel:        { fontSize: 11, color: '#737370', fontWeight: '500' },
  footer:          { padding: 14, paddingBottom: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EFEFED' },
  fareRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  fareLabel:       { fontSize: 13, color: '#737370' },
  fareVal:         { fontSize: 16, fontWeight: '700', color: '#111110' },
  btn:             { backgroundColor: '#3DB34A', borderRadius: 14, padding: 15, alignItems: 'center' },
  btnText:         { color: '#fff', fontSize: 14, fontWeight: '600' },
  card:            { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 14 },
  cardTitle:       { fontSize: 11, fontWeight: '600', color: '#737370', letterSpacing: 0.8, marginBottom: 10 },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel:    { fontSize: 13, color: '#737370' },
  summaryVal:      { fontSize: 13, color: '#111110', fontWeight: '500' },
  smsPreview:      { backgroundColor: '#F7F7F5', borderRadius: 10, padding: 10, marginTop: 8 },
  smsLabel:        { fontSize: 11, color: '#ADADAA', marginBottom: 4 },
  smsText:         { fontSize: 12, color: '#333331', lineHeight: 18 },
});
