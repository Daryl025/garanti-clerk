import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import LangToggle from '../../components/LangToggle';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'https://sweet-patience-production.up.railway.app';

const STATE_CONFIG = {
  valid:        { bg: '#3DB34A', icon: '✓', label: 'Valid ticket',      sub: 'Passenger may board' },
  expired:      { bg: '#E24B4A', icon: '⊘', label: 'Expired ticket',    sub: 'Trip date has passed' },
  already_used: { bg: '#BA7517', icon: '⚠', label: 'Already scanned',   sub: 'Check for duplicate' },
  not_found:    { bg: '#333331', icon: '✕', label: 'Ticket not found',   sub: 'QR not in system' },
};

export default function QRScanner({ navigation }) {
  const [result, setResult]         = useState(null);
  const [manualRef, setManualRef]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [scanned, setScanned]       = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLog, setScanLog] = useState({ valid: 0, expired: 0, already_used: 0, not_found: 0, date: new Date().toDateString() });

  useEffect(() => {
    AsyncStorage.getItem('clerk_scan_log').then(data => {
      if (data) {
        const saved = JSON.parse(data);
        if (saved.date === new Date().toDateString()) {
          setScanLog(saved);
        } else {
          const fresh = { valid: 0, expired: 0, already_used: 0, not_found: 0, date: new Date().toDateString() };
          AsyncStorage.setItem('clerk_scan_log', JSON.stringify(fresh));
          setScanLog(fresh);
        }
      }
    });
  }, []);

  async function refreshToken() {
    try {
      const phone = await AsyncStorage.getItem('clerk_phone');
      const pin = await AsyncStorage.getItem('clerk_pin');
      if (!phone || !pin) return null;
      const res = await axios.post('https://sweet-patience-production.up.railway.app/api/auth/agent/login', { phone, pin }, { timeout: 15000 });
      const { token } = res.data;
      await AsyncStorage.setItem('clerk_token', token);
      return token;
    } catch (e) { return null; }
  }

  async function validateTicket(ref) {
    if (!ref.trim()) return;
    setLoading(true);
    try {
      let token = await AsyncStorage.getItem('clerk_token');
      const payload = ref.trim()
      const ticketRef = payload.includes("|") ? payload.split("|")[0] : payload
      const body = payload.includes("|") ? { qr_payload: payload } : { ticket_ref: payload }
      let res;
      try {
        res = await axios.post(`https://sweet-patience-production.up.railway.app/api/tickets/validate`, body, {
          timeout: 15000,
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (authErr) {
        if (authErr.response?.status === 401) {
          token = await refreshToken();
          if (token) {
            res = await axios.post(`https://sweet-patience-production.up.railway.app/api/tickets/validate`, body, {
              timeout: 15000,
              headers: { Authorization: `Bearer ${token}` }
            });
          } else { throw authErr; }
        } else { throw authErr; }
      }
      const { status, ticket } = res.data;
      setResult({ status, ticket });
      setScanLog(prev => {
        const updated = { ...prev, [status]: (prev[status] || 0) + 1 };
        AsyncStorage.setItem('clerk_scan_log', JSON.stringify(updated));
        return updated;
      });
      if (status !== 'valid') {
        const flag = {
          id: Date.now(),
          ref: ticket?.ref || ticketRef,
          passenger: ticket?.passenger_name || 'Unknown',
          reason: status,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'open',
          notes: '',
        };
        AsyncStorage.getItem('clerk_flags').then(data => {
          const flags = data ? JSON.parse(data) : [];
          AsyncStorage.setItem('clerk_flags', JSON.stringify([flag, ...flags.slice(0, 99)]));
        });
      }
    } catch (err) {
      const status = err.response?.data?.status || 'not_found';
      console.log('Scan error:', err.response?.status, err.response?.data, err.message);
      const ticket = err.response?.data?.ticket || null;
      setResult({ status, ticket });
      setScanLog(prev => ({ ...prev, [status]: (prev[status] || 0) + 1 }));
    } finally {
      setLoading(false);
      setScanning(false);
      setManualRef('');
    }
  }

  async function startCamera() {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Camera permission needed', 'Please allow camera access to scan QR codes.');
        return;
      }
    }
    setScanning(true);
    setScanned(false);
  }

  const scanningRef = React.useRef(false);
  function onBarcodeScanned({ data }) {
    if (scanned || scanningRef.current) return;
    scanningRef.current = true;
    setScanned(true);
    setScanning(false);
    validateTicket(data).finally(() => { scanningRef.current = false; });
  }

  function simulateScan(status) {
    const MOCK = {
      valid:        { ticket_ref: 'GE-1001', passenger_name: 'Ngo Sandrine',  seat_numbers: ['8C'], depart_time: '06:00', trip_date: new Date().toISOString().split('T')[0] },
      expired:      { ticket_ref: 'GE-0999', passenger_name: 'Kamdem Roger',  seat_numbers: ['3B'], depart_time: '07:00', trip_date: '2026-05-26' },
      already_used: { ticket_ref: 'GE-1000', passenger_name: 'Fotso Jules',   seat_numbers: ['6A'], depart_time: '06:00', trip_date: new Date().toISOString().split('T')[0] },
      not_found:    null,
    };
    setResult({ status, ticket: MOCK[status] });
    setScanLog(prev => ({ ...prev, [status]: (prev[status] || 0) + 1 }));
  }

  function flagTicket() {
    navigation.navigate('FlaggedList', {
      newFlag: {
        ref: result?.ticket?.ticket_ref || manualRef,
        passenger: result?.ticket?.passenger_name || 'Unknown',
        reason: result?.status,
        time: new Date().toLocaleTimeString(),
      }
    });
    setResult(null);
  }

  function reset() { setResult(null); setManualRef(''); setScanned(false); }

  const cfg = result ? (STATE_CONFIG[result.status] || STATE_CONFIG["already_used"]) : null;

  return (
    <SafeAreaView style={s.shell}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { setScanning(false); navigation.goBack(); }}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Scan QR Ticket</Text>
        <LangToggle />
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>

        {/* Camera or viewport */}
        <View style={s.viewport}>
          {scanning ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
            />
          ) : loading ? (
            <View style={s.vpIdle}>
              <ActivityIndicator color="#3DB34A" size="large" />
              <Text style={s.vpHint}>Validating ticket...</Text>
            </View>
          ) : !result ? (
            <View style={s.vpIdle}>
              <Text style={s.vpIcon}>📷</Text>
              <Text style={s.vpHint}>Tap "Open Camera" to scan a QR code</Text>
            </View>
          ) : (
            <View style={[s.vpResult, { backgroundColor: cfg.bg + 'EE' }]}>
              <Text style={s.vpResultIcon}>{cfg.icon}</Text>
              <Text style={s.vpResultLabel}>{cfg.label}</Text>
              <Text style={s.vpResultSub}>{cfg.sub}</Text>
            </View>
          )}

          {/* Corner markers */}
          <View style={[s.corner, s.cTL]} />
          <View style={[s.corner, s.cTR]} />
          <View style={[s.corner, s.cBL]} />
          <View style={[s.corner, s.cBR]} />
        </View>

        {/* Camera button */}
        {!result && !loading && !scanning && (
          <TouchableOpacity style={s.cameraBtn} onPress={startCamera} activeOpacity={0.85}>
            <Text style={s.cameraBtnText}>📷 Open Camera to Scan</Text>
          </TouchableOpacity>
        )}

        {/* Cancel scanning */}
        {scanning && (
          <TouchableOpacity style={[s.cameraBtn, { backgroundColor: '#E24B4A' }]} onPress={() => setScanning(false)}>
            <Text style={s.cameraBtnText}>✕ Cancel Scan</Text>
          </TouchableOpacity>
        )}

        {/* Test buttons */}
        {!result && !loading && !scanning && (
          <View style={s.testRow}>
            <Text style={s.testLabel}>Test:</Text>
            {['valid','expired','already_used','not_found'].map(status => (
              <TouchableOpacity
                key={status}
                style={[s.testBtn, { backgroundColor: STATE_CONFIG[status].bg }]}
                onPress={() => simulateScan(status)}
              >
                <Text style={s.testBtnText}>{STATE_CONFIG[status].icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Manual lookup */}
        {!result && !loading && !scanning && (
          <>
            <View style={s.hintBar}>
              <Text style={s.hintText}>💡 Or enter ticket ref manually to validate</Text>
            </View>
            <View>
              <Text style={s.manualLabel}>ENTER TICKET REF</Text>
              <View style={s.manualRow}>
                <TextInput
                  style={s.manualInput}
                  placeholder="e.g. GE-1001"
                  placeholderTextColor="#ADADAA"
                  value={manualRef}
                  onChangeText={setManualRef}
                  onSubmitEditing={() => validateTicket(manualRef)}
                  returnKeyType="search"
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={s.manualBtn} onPress={() => validateTicket(manualRef)}>
                  <Text style={s.manualBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.logBox}>
              <Text style={s.logTitle}>TODAY'S SCAN LOG</Text>
              {Object.entries(scanLog).map(([k, v]) => (
                <View key={k} style={s.logRow}>
                  <Text style={s.logKey}>{k.replace('_', ' ')}</Text>
                  <Text style={[s.logVal, {
                    color: k==='valid'?'#3DB34A':k==='expired'?'#E24B4A':k==='already_used'?'#EF9F27':'#888'
                  }]}>{v}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Result detail */}
        {result && (
          <View style={s.resultCard}>
            <View style={[s.resultHeader, { backgroundColor: cfg.bg }]}>
              <Text style={s.resultName}>{result.ticket?.passenger_name || 'Unknown'}</Text>
              <Text style={s.resultRef}>{result.ticket ? `Ref ${result.ticket.ticket_ref}` : 'No record found'}</Text>
            </View>
            <View style={s.resultBody}>
              {result.ticket && (
                <>
                  <ResultRow label="Seat"      value={result.ticket.seat_numbers?.join(', ') || result.ticket.seat_number} highlight={result.status === 'valid'} />
                  <ResultRow label="Departure" value={`${result.ticket.depart_time?.slice(0,5)} · ${result.ticket.trip_date?.split('T')[0]}`} />
                  {result.status === 'already_used' && (
                    <ResultRow label="Scanned at" value={result.ticket.scanned_at ? new Date(result.ticket.scanned_at).toLocaleTimeString() : 'Unknown'} warn />
                  )}
                </>
              )}
              {result.status === 'not_found' && (
                <ResultRow label="Status" value="Not in system ✗" danger />
              )}
            </View>
          </View>
        )}

        {/* Action buttons */}
        {result?.status === 'valid' && (
          <>
            <TouchableOpacity style={[s.btn, { backgroundColor: '#3DB34A' }]} onPress={reset}>
              <Text style={s.btnText}>✓ MARK AS BOARDED</Text>
            </TouchableOpacity>
            <View style={s.actionRow}>
              <TouchableOpacity style={s.ghostBtn} onPress={reset}><Text style={s.ghostBtnText}>📷 Scan next</Text></TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn}><Text style={s.ghostBtnText}>🖨 Print receipt</Text></TouchableOpacity>
            </View>
          </>
        )}

        {result?.status === 'expired' && (
          <>
            <View style={[s.alertBanner, { backgroundColor: '#FCEBEB', borderColor: '#F09595' }]}>
              <Text style={[s.alertText, { color: '#791F1F' }]}>🚫 Do not allow boarding. Passenger must rebook.</Text>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={[s.btn, { backgroundColor: '#E24B4A', flex: 1 }]} onPress={reset}>
                <Text style={s.btnText}>✕ Refuse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.ghostBtn, { flex: 1 }]} onPress={flagTicket}>
                <Text style={s.ghostBtnText}>🚩 Flag</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {result?.status === 'already_used' && (
          <>
            <View style={[s.alertBanner, { backgroundColor: '#FAEEDA', borderColor: '#EF9F27' }]}>
              <Text style={[s.alertText, { color: '#633806' }]}>⚠ Possible duplicate. Check if passenger is already on board.</Text>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={[s.btn, { backgroundColor: '#E24B4A', flex: 1 }]} onPress={flagTicket}>
                <Text style={s.btnText}>🚩 Flag fraud</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.ghostBtn, { flex: 1 }]} onPress={reset}>
                <Text style={s.ghostBtnText}>📷 Scan next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {result?.status === 'not_found' && (
          <>
            <View style={[s.alertBanner, { backgroundColor: '#FCEBEB', borderColor: '#F09595' }]}>
              <Text style={[s.alertText, { color: '#791F1F' }]}>🛡 QR not from Garanti Express. Do not allow boarding.</Text>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={[s.btn, { backgroundColor: '#E24B4A', flex: 1 }]} onPress={flagTicket}>
                <Text style={s.btnText}>🚩 Report fake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.ghostBtn, { flex: 1 }]} onPress={reset}>
                <Text style={s.ghostBtnText}>📷 Scan next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultRow({ label, value, highlight, danger, warn }) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:5, borderBottomWidth:1, borderBottomColor:'#F7F7F5' }}>
      <Text style={{ fontSize:12, color:'#ADADAA' }}>{label}</Text>
      <Text style={{ fontSize:12, fontWeight:'500', color: highlight?'#3DB34A':danger?'#E24B4A':warn?'#BA7517':'#333331' }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  shell:          { flex: 1, backgroundColor: '#F7F7F5' },
  header:         { backgroundColor: '#fff', padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFED', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText:       { fontSize: 14, color: '#3DB34A', fontWeight: '500' },
  title:          { fontSize: 16, fontWeight: '600', color: '#111110' },
  body:           { flex: 1, padding: 12 },
  viewport:       { backgroundColor: '#0a0a0a', borderRadius: 16, height: 220, position: 'relative', overflow: 'hidden' },
  corner:         { position: 'absolute', width: 28, height: 28, borderColor: '#3DB34A', borderStyle: 'solid', borderWidth: 0 },
  cTL:            { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cTR:            { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  cBL:            { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cBR:            { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  vpIdle:         { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  vpIcon:         { fontSize: 32, opacity: 0.5 },
  vpHint:         { fontSize: 12, color: '#555', textAlign: 'center' },
  vpResult:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  vpResultIcon:   { fontSize: 32, color: '#fff' },
  vpResultLabel:  { fontSize: 16, fontWeight: '600', color: '#fff' },
  vpResultSub:    { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  cameraBtn:      { backgroundColor: '#111110', borderRadius: 12, padding: 14, alignItems: 'center' },
  cameraBtnText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  testRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F7F7F5', borderRadius: 10, padding: 8 },
  testLabel:      { fontSize: 11, color: '#ADADAA' },
  testBtn:        { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  testBtnText:    { fontSize: 16, color: '#fff' },
  hintBar:        { backgroundColor: '#F7F7F5', borderRadius: 10, padding: 10 },
  hintText:       { fontSize: 12, color: '#737370' },
  manualLabel:    { fontSize: 10, color: '#ADADAA', letterSpacing: 0.6, marginBottom: 6 },
  manualRow:      { flexDirection: 'row', gap: 8 },
  manualInput:    { flex: 1, borderWidth: 1, borderColor: '#DDDDD9', borderRadius: 10, padding: 10, fontSize: 14, color: '#111110', backgroundColor: '#fff' },
  manualBtn:      { backgroundColor: '#111110', borderRadius: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  manualBtnText:  { color: '#fff', fontSize: 13, fontWeight: '500' },
  logBox:         { backgroundColor: '#F7F7F5', borderRadius: 10, padding: 12 },
  logTitle:       { fontSize: 10, color: '#ADADAA', letterSpacing: 0.6, marginBottom: 8 },
  logRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  logKey:         { fontSize: 12, color: '#737370', textTransform: 'capitalize' },
  logVal:         { fontSize: 12, fontWeight: '600' },
  resultCard:     { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EFEFED', overflow: 'hidden' },
  resultHeader:   { padding: 12 },
  resultName:     { fontSize: 14, fontWeight: '600', color: '#fff' },
  resultRef:      { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  resultBody:     { padding: 12 },
  btn:            { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText:        { color: '#fff', fontSize: 13, fontWeight: '600' },
  ghostBtn:       { borderWidth: 1, borderColor: '#EFEFED', borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  ghostBtnText:   { fontSize: 13, color: '#737370', fontWeight: '500' },
  alertBanner:    { borderRadius: 10, padding: 10, borderWidth: 1 },
  alertText:      { fontSize: 12, lineHeight: 18 },
  actionRow:      { flexDirection: 'row', gap: 8 },
});
