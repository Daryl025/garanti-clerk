import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import LangToggle from '../../components/LangToggle';

const TERMINALS = [
  { code: 'GE-DLA-AKWA', name: 'Douala Akwa' },
  { code: 'GE-DLA-BON',  name: 'Douala Bonabéri' },
  { code: 'GE-YDE-NSAM', name: 'Yaoundé Nsam' },
  { code: 'GE-BMD-CC',   name: 'Bamenda City Chemist' },
  { code: 'GE-BFS',      name: 'Bafoussam' },
  { code: 'GE-BUE',      name: 'Buea' },
  { code: 'GE-LMB',      name: 'Limbe' },
];

const TRIPS = [
  { id: 't1', time: '06:00', to: 'Yaoundé Nsam',  seats: 11, fare: 6000 },
  { id: 't2', time: '10:30', to: 'Yaoundé Nsam',  seats: 7,  fare: 6000 },
  { id: 't3', time: '14:00', to: 'Bamenda CC',     seats: 23, fare: 10500 },
  { id: 't4', time: '16:00', to: 'Bafoussam',      seats: 18, fare: 5500 },
];

const PAY_OPTIONS = [
  { key: 'cash',         label: 'Cash',         icon: '💵' },
  { key: 'mtn_momo',     label: 'MTN MoMo',     icon: '📱' },
  { key: 'orange_money', label: 'Orange Money', icon: '🟠' },
];

export default function WalkIn({ navigation }) {
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [idNo, setIdNo]           = useState('');
  const [selectedTrip, setTrip]   = useState(null);
  const [seatClass, setSeatClass] = useState('standard');
  const [payMethod, setPayMethod] = useState('cash');
  const [errors, setErrors]       = useState({});
  const [stage, setStage]         = useState('form'); // form | confirm

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

  function issueTicket() {
    // TODO: wire to real backend
    navigation.navigate('ClerkHome');
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
            <Text style={s.cardTitle}>SEND TICKET TO PASSENGER</Text>
            <View style={s.smsPreview}>
              <Text style={s.smsLabel}>📱 SMS preview</Text>
              <Text style={s.smsText}>
                Garanti Express: Ticket confirmed! {selectedTrip?.time} to {selectedTrip?.to}. FCFA {fare.toLocaleString()}. Show QR at boarding gate.
              </Text>
            </View>
            <View style={s.sendRow}>
              <TouchableOpacity style={s.sendBtn}>
                <Text style={s.sendBtnText}>📱 SMS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sendBtn}>
                <Text style={s.sendBtnText}>💬 WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sendBtn}>
                <Text style={s.sendBtnText}>🖨 Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <View style={s.footer}>
          <TouchableOpacity style={s.btn} onPress={issueTicket} activeOpacity={0.85}>
            <Text style={s.btnText}>✓ ISSUE TICKET</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.shell}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Register Walk-in</Text>
        <LangToggle />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={s.body} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>

          {/* Passenger info */}
          <View style={s.card}>
            <Text style={s.cardTitle}>PASSENGER INFO</Text>

            <Text style={s.label}>Full Name</Text>
            <View style={[s.input, errors.name && s.inputError]}>
              <Text style={s.inputIcon}>👤</Text>
              <TextInput style={s.inputField} placeholder="e.g. Marie Nkomo" placeholderTextColor="#ADADAA"
                value={name} onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: null })); }} />
            </View>
            {errors.name && <Text style={s.errorText}>{errors.name}</Text>}

            <Text style={[s.label, { marginTop: 10 }]}>Phone (SMS ticket)</Text>
            <View style={[s.input, errors.phone && s.inputError]}>
              <Text style={s.inputIcon}>📞</Text>
              <TextInput style={s.inputField} placeholder="e.g. 677123456" placeholderTextColor="#ADADAA"
                value={phone} onChangeText={v => { setPhone(v); setErrors(e => ({ ...e, phone: null })); }}
                keyboardType="phone-pad" maxLength={12} />
            </View>
            {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}

            <Text style={[s.label, { marginTop: 10 }]}>ID Number <Text style={{ color: '#ADADAA', fontWeight: '400' }}>(optional)</Text></Text>
            <View style={s.input}>
              <Text style={s.inputIcon}>🪪</Text>
              <TextInput style={s.inputField} placeholder="National ID / Passport" placeholderTextColor="#ADADAA"
                value={idNo} onChangeText={setIdNo} />
            </View>
          </View>

          {/* Trip selection */}
          <View style={s.card}>
            <Text style={s.cardTitle}>SELECT DEPARTURE</Text>
            {errors.trip && <Text style={s.errorText}>{errors.trip}</Text>}
            {TRIPS.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={[s.tripOption, selectedTrip?.id === trip.id && s.tripOptionActive]}
                onPress={() => { setTrip(trip); setErrors(e => ({ ...e, trip: null })); }}
                activeOpacity={0.85}
              >
                <Text style={s.tripTime}>{trip.time}</Text>
                <Text style={s.tripTo}>{trip.to}</Text>
                <View style={[s.seatsBadge, trip.seats <= 5 && { backgroundColor: '#FCEBEB' }]}>
                  <Text style={[s.seatsBadgeText, trip.seats <= 5 && { color: '#791F1F' }]}>{trip.seats} seats</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Class */}
          <View style={s.card}>
            <Text style={s.cardTitle}>CLASS</Text>
            <View style={s.classRow}>
              <TouchableOpacity
                style={[s.classBtn, seatClass === 'standard' && s.classBtnActive]}
                onPress={() => setSeatClass('standard')}
              >
                <Text style={[s.classBtnText, seatClass === 'standard' && s.classBtnTextActive]}>Standard</Text>
                <Text style={[s.classBtnFare, seatClass === 'standard' && { color: '#3DB34A' }]}>
                  FCFA {selectedTrip ? selectedTrip.fare.toLocaleString() : '—'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.classBtn, seatClass === 'vip' && s.classBtnActive]}
                onPress={() => setSeatClass('vip')}
              >
                <Text style={[s.classBtnText, seatClass === 'vip' && s.classBtnTextActive]}>VIP</Text>
                <Text style={[s.classBtnFare, seatClass === 'vip' && { color: '#3DB34A' }]}>
                  FCFA {selectedTrip ? Math.round(selectedTrip.fare * 1.5).toLocaleString() : '—'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment */}
          <View style={s.card}>
            <Text style={s.cardTitle}>PAYMENT METHOD</Text>
            {PAY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[s.payOption, payMethod === opt.key && s.payOptionActive]}
                onPress={() => setPayMethod(opt.key)}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                <Text style={s.payLabel}>{opt.label}</Text>
                {payMethod === opt.key && <Text style={{ color: '#3DB34A' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Total */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total fare</Text>
            <Text style={s.totalVal}>FCFA {fare.toLocaleString()}</Text>
          </View>

          <View style={{ height: 10 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={s.footer}>
        <TouchableOpacity style={s.btn} onPress={proceed} activeOpacity={0.85}>
          <Text style={s.btnText}>CONTINUE →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  shell:            { flex: 1, backgroundColor: '#F7F7F5' },
  header:           { backgroundColor: '#fff', padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFED', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText:         { fontSize: 14, color: '#3DB34A', fontWeight: '500' },
  title:            { fontSize: 16, fontWeight: '600', color: '#111110' },
  body:             { flex: 1, padding: 14 },
  card:             { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', padding: 14, gap: 8 },
  cardTitle:        { fontSize: 11, fontWeight: '600', color: '#737370', letterSpacing: 0.8, marginBottom: 4 },
  label:            { fontSize: 11, fontWeight: '600', color: '#737370', letterSpacing: 0.8, textTransform: 'uppercase' },
  input:            { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EFEFED', borderRadius: 10, padding: 10, gap: 8 },
  inputError:       { borderColor: '#E24B4A' },
  inputIcon:        { fontSize: 16 },
  inputField:       { flex: 1, fontSize: 14, color: '#111110' },
  errorText:        { fontSize: 11, color: '#E24B4A' },
  tripOption:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EFEFED', borderRadius: 10, padding: 10, marginBottom: 6 },
  tripOptionActive: { borderColor: '#3DB34A', backgroundColor: '#F8FEF5' },
  tripTime:         { fontSize: 15, fontWeight: '600', color: '#111110', minWidth: 50 },
  tripTo:           { flex: 1, fontSize: 13, color: '#737370' },
  seatsBadge:       { backgroundColor: '#EAF3DE', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  seatsBadgeText:   { fontSize: 11, fontWeight: '500', color: '#27500A' },
  classRow:         { flexDirection: 'row', gap: 8 },
  classBtn:         { flex: 1, borderWidth: 1, borderColor: '#EFEFED', borderRadius: 10, padding: 12, alignItems: 'center', gap: 4 },
  classBtnActive:   { borderColor: '#3DB34A', backgroundColor: '#F8FEF5' },
  classBtnText:     { fontSize: 13, fontWeight: '600', color: '#737370' },
  classBtnTextActive:{ color: '#3DB34A' },
  classBtnFare:     { fontSize: 11, color: '#ADADAA' },
  payOption:        { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#EFEFED', borderRadius: 10, padding: 10, marginBottom: 6 },
  payOptionActive:  { borderColor: '#3DB34A', backgroundColor: '#F8FEF5' },
  payLabel:         { flex: 1, fontSize: 13, fontWeight: '500', color: '#333331' },
  totalRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EAF3DE', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#C0DD97' },
  totalLabel:       { fontSize: 13, color: '#27500A' },
  totalVal:         { fontSize: 17, fontWeight: '700', color: '#3DB34A' },
  footer:           { padding: 14, paddingBottom: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EFEFED' },
  btn:              { backgroundColor: '#3DB34A', borderRadius: 14, padding: 15, alignItems: 'center' },
  btnText:          { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F7F7F5' },
  summaryLabel:     { fontSize: 12, color: '#737370' },
  summaryVal:       { fontSize: 12, fontWeight: '500', color: '#333331' },
  smsPreview:       { backgroundColor: '#F7F7F5', borderRadius: 10, padding: 10, marginBottom: 8 },
  smsLabel:         { fontSize: 10, color: '#ADADAA', marginBottom: 4 },
  smsText:          { fontSize: 12, color: '#333331', lineHeight: 18 },
  sendRow:          { flexDirection: 'row', gap: 8 },
  sendBtn:          { flex: 1, borderWidth: 1, borderColor: '#3DB34A', borderRadius: 10, padding: 8, alignItems: 'center' },
  sendBtnText:      { fontSize: 12, color: '#3DB34A', fontWeight: '500' },
});
