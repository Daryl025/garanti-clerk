import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Animated
} from 'react-native';
import LangToggle from '../../components/LangToggle';

const MOCK_TICKETS = [
  {
    ref: 'GE-4820', status: 'valid',
    passenger: 'Ngo Sandrine', phone: '677234567',
    from: 'Douala Akwa', to: 'Yaoundé Nsam',
    seat: '8C', bus: 'GE-211', date: '2026-05-31', time: '10:30',
    ticket_type: 'online', scanned_at: null,
  },
  {
    ref: 'GE-4791', status: 'expired',
    passenger: 'Kamdem Roger', phone: '699112233',
    from: 'Douala Akwa', to: 'Yaoundé Nsam',
    seat: '3B', bus: 'GE-104', date: '2026-05-26', time: '07:00',
    ticket_type: 'online', scanned_at: null,
  },
  {
    ref: 'GE-4801', status: 'already_used',
    passenger: 'Fotso Jules', phone: '655998877',
    from: 'Douala Akwa', to: 'Yaoundé Nsam',
    seat: '6A', bus: 'GE-104', date: '2026-05-31', time: '06:00',
    ticket_type: 'walk-in', scanned_at: '2026-05-31T08:12:00', scanned_by: 'Clerk Nkeng',
  },
];

const STATE_CONFIG = {
  valid:        { bg: '#3DB34A', icon: '✓', label: 'Valid ticket',      sub: 'Passenger may board' },
  expired:      { bg: '#E24B4A', icon: '⊘', label: 'Expired ticket',    sub: 'Trip date has passed' },
  already_used: { bg: '#BA7517', icon: '⚠', label: 'Already scanned',   sub: 'Check for duplicate' },
  not_found:    { bg: '#333331', icon: '✕', label: 'Ticket not found',   sub: 'QR not in system' },
};

export default function QRScanner({ navigation }) {
  const [result, setResult]     = useState(null);
  const [manualRef, setManualRef] = useState('');
  const [scanLog] = useState({ valid: 41, expired: 3, already_used: 2, not_found: 1 });

  function simulateScan(status) {
    const ticket = MOCK_TICKETS.find(t => t.status === status) || null;
    setResult({ status, ticket });
  }

  function lookupManual() {
    if (!manualRef.trim()) return;
    const ticket = MOCK_TICKETS.find(t => t.ref.toLowerCase() === manualRef.trim().toLowerCase());
    if (ticket) setResult({ status: ticket.status, ticket });
    else setResult({ status: 'not_found', ticket: null });
    setManualRef('');
  }

  function flagTicket() {
    navigation.navigate('FlaggedList', {
      newFlag: {
        ref: result?.ticket?.ref || manualRef,
        passenger: result?.ticket?.passenger || 'Unknown',
        reason: result?.status,
        time: new Date().toLocaleTimeString(),
      }
    });
    setResult(null);
  }

  function reset() { setResult(null); setManualRef(''); }

  const cfg = result ? STATE_CONFIG[result.status] : null;

  return (
    <SafeAreaView style={s.shell}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Scan QR Ticket</Text>
        <LangToggle />
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>

        {/* Viewport */}
        <View style={s.viewport}>
          <View style={[s.corner, s.cTL]} />
          <View style={[s.corner, s.cTR]} />
          <View style={[s.corner, s.cBL]} />
          <View style={[s.corner, s.cBR]} />

          {!result ? (
            <View style={s.vpIdle}>
              <Text style={s.vpIcon}>⬛</Text>
              <Text style={s.vpHint}>Point camera at passenger QR code</Text>
            </View>
          ) : (
            <View style={[s.vpResult, { backgroundColor: cfg.bg + 'EE' }]}>
              <Text style={s.vpResultIcon}>{cfg.icon}</Text>
              <Text style={s.vpResultLabel}>{cfg.label}</Text>
              <Text style={s.vpResultSub}>{cfg.sub}</Text>
            </View>
          )}
        </View>

        {/* Test buttons */}
        {!result && (
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
        {!result && (
          <>
            <View style={s.hintBar}>
              <Text style={s.hintText}>💡 Works in direct sunlight. Keep QR well-lit.</Text>
            </View>
            <View>
              <Text style={s.manualLabel}>OR ENTER REF MANUALLY</Text>
              <View style={s.manualRow}>
                <TextInput
                  style={s.manualInput}
                  placeholder="e.g. GE-4820"
                  placeholderTextColor="#ADADAA"
                  value={manualRef}
                  onChangeText={setManualRef}
                  onSubmitEditing={lookupManual}
                  returnKeyType="search"
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={s.manualBtn} onPress={lookupManual}>
                  <Text style={s.manualBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scan log */}
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
              <Text style={s.resultName}>{result.ticket?.passenger || 'Unknown'}</Text>
              <Text style={s.resultRef}>{result.ticket ? `Ref ${result.ticket.ref}` : 'No record found'}</Text>
            </View>
            <View style={s.resultBody}>
              {result.ticket && (
                <>
                  <ResultRow label="Route"     value={`${result.ticket.from} → ${result.ticket.to}`} />
                  <ResultRow label="Seat"      value={result.ticket.seat} highlight={result.status === 'valid'} />
                  <ResultRow label="Departure" value={`${result.ticket.time} · ${result.ticket.date}`} />
                  <ResultRow label="Type"      value={result.ticket.ticket_type} />
                  {result.status === 'expired' && (
                    <ResultRow label="Trip date" value={`${result.ticket.date} · EXPIRED`} danger />
                  )}
                  {result.status === 'already_used' && (
                    <ResultRow label="First scan" value={result.ticket.scanned_by || 'Unknown'} warn />
                  )}
                </>
              )}
              {result.status === 'not_found' && (
                <ResultRow label="Signature" value="Failed ✗" danger />
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
                <Text style={s.ghostBtnText}>�� Flag</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.ghostBtn} onPress={reset}><Text style={s.ghostBtnText}>📷 Scan next</Text></TouchableOpacity>
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
  viewport:       { backgroundColor: '#0a0a0a', borderRadius: 16, height: 180, position: 'relative', overflow: 'hidden' },
  corner:         { position: 'absolute', width: 28, height: 28, borderColor: '#3DB34A', borderStyle: 'solid', borderWidth: 0 },
  cTL:            { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cTR:            { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  cBL:            { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cBR:            { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  vpIdle:         { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  vpIcon:         { fontSize: 32, opacity: 0.3 },
  vpHint:         { fontSize: 12, color: '#555', textAlign: 'center' },
  vpResult:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  vpResultIcon:   { fontSize: 32, color: '#fff' },
  vpResultLabel:  { fontSize: 16, fontWeight: '600', color: '#fff' },
  vpResultSub:    { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
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
