import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LangToggle from '../../components/LangToggle';

const REASON_CONFIG = {
  already_used: { label: 'Already scanned', color: '#BA7517', bg: '#FAEEDA' },
  expired:      { label: 'Expired ticket',  color: '#E24B4A', bg: '#FCEBEB' },
  not_found:    { label: 'Fake / Not found', color: '#333331', bg: '#EFEFED' },
  suspicious:   { label: 'Suspicious',       color: '#BA7517', bg: '#FAEEDA' },
};

export default function FlaggedList({ navigation, route }) {
  const [flags, setFlags]       = useState([]);
  const [filter, setFilter]     = useState('all');
  const [expandedId, setExpanded] = useState(null);
  const [noteText, setNoteText]   = useState('');

  useEffect(() => {
    loadFlags();
    const interval = setInterval(loadFlags, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadFlags() {
    try {
      const data = await AsyncStorage.getItem('clerk_flags');
      if (data) setFlags(JSON.parse(data));
    } catch (e) {}
  }

  async function markReviewed(id) {
    const updated = flags.map(f =>
      f.id === id ? { ...f, status: 'reviewed', notes: noteText || f.notes } : f
    );
    setFlags(updated);
    await AsyncStorage.setItem('clerk_flags', JSON.stringify(updated));
    setExpanded(null);
    setNoteText('');
  }

  const filtered = filter === 'all' ? flags : flags.filter(f => f.status === filter);
  const openCount = flags.filter(f => f.status === 'open').length;

  return (
    <SafeAreaView style={s.shell}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Flagged Tickets</Text>
          <Text style={s.subtitle}>Douala Akwa · Today</Text>
        </View>
        <LangToggle />
      </View>

      {openCount > 0 && (
        <View style={s.alertBanner}>
          <Text style={s.alertText}>⚠ {openCount} open issue{openCount > 1 ? 's' : ''} requiring review</Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={s.tabs}>
        {['all', 'open', 'reviewed'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, filter === tab && s.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[s.tabText, filter === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'open' && openCount > 0 ? ` (${openCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No flagged tickets</Text>
          </View>
        )}

        {filtered.map(flag => {
          const cfg = REASON_CONFIG[flag.reason] || REASON_CONFIG.suspicious;
          const isExpanded = expandedId === flag.id;
          return (
            <TouchableOpacity
              key={flag.id}
              style={[s.flagCard, flag.status === 'reviewed' && s.flagCardReviewed]}
              onPress={() => setExpanded(isExpanded ? null : flag.id)}
              activeOpacity={0.85}
            >
              <View style={s.flagTop}>
                <View style={[s.reasonBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.reasonText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={s.flagTime}>{flag.time}</Text>
                {flag.status === 'reviewed' && (
                  <View style={s.reviewedBadge}>
                    <Text style={s.reviewedText}>✓ Reviewed</Text>
                  </View>
                )}
              </View>

              <View style={s.flagMid}>
                <Text style={s.flagPassenger}>{flag.passenger}</Text>
                <Text style={s.flagRef}>{flag.ref}</Text>
              </View>

              <Text style={s.flagMeta}>Flagged by {flag.agent} · {flag.terminal}</Text>

              {isExpanded && (
                <View style={s.expandedSection}>
                  <Text style={s.expandLabel}>RESOLUTION NOTES</Text>
                  <TextInput
                    style={s.noteInput}
                    placeholder="Add notes about this case..."
                    placeholderTextColor="#ADADAA"
                    value={noteText}
                    onChangeText={setNoteText}
                    multiline
                    numberOfLines={3}
                  />
                  {flag.status === 'open' && (
                    <TouchableOpacity style={s.resolveBtn} onPress={() => markReviewed(flag.id)}>
                      <Text style={s.resolveBtnText}>✓ Mark as Reviewed</Text>
                    </TouchableOpacity>
                  )}
                  {flag.notes ? (
                    <Text style={s.existingNote}>Previous note: {flag.notes}</Text>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  shell:            { flex: 1, backgroundColor: '#F7F7F5' },
  header:           { backgroundColor: '#fff', padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#EFEFED', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText:         { fontSize: 14, color: '#3DB34A', fontWeight: '500' },
  title:            { fontSize: 16, fontWeight: '600', color: '#111110' },
  subtitle:         { fontSize: 11, color: '#ADADAA', marginTop: 1 },
  alertBanner:      { backgroundColor: '#FAEEDA', borderBottomWidth: 1, borderBottomColor: '#EF9F27', padding: 10, paddingHorizontal: 14 },
  alertText:        { fontSize: 12, color: '#633806', fontWeight: '500' },
  tabs:             { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EFEFED' },
  tab:              { flex: 1, padding: 10, alignItems: 'center' },
  tabActive:        { borderBottomWidth: 2, borderBottomColor: '#3DB34A' },
  tabText:          { fontSize: 12, color: '#ADADAA', fontWeight: '500' },
  tabTextActive:    { color: '#3DB34A', fontWeight: '600' },
  body:             { flex: 1, padding: 12 },
  empty:            { alignItems: 'center', paddingTop: 40 },
  emptyText:        { fontSize: 14, color: '#ADADAA' },
  flagCard:         { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFED', padding: 12, gap: 6 },
  flagCardReviewed: { opacity: 0.7 },
  flagTop:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reasonBadge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  reasonText:       { fontSize: 11, fontWeight: '600' },
  flagTime:         { fontSize: 11, color: '#ADADAA', marginLeft: 'auto' },
  reviewedBadge:    { backgroundColor: '#EAF3DE', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  reviewedText:     { fontSize: 11, color: '#27500A', fontWeight: '500' },
  flagMid:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flagPassenger:    { fontSize: 14, fontWeight: '600', color: '#111110' },
  flagRef:          { fontSize: 12, color: '#ADADAA', fontFamily: 'monospace' },
  flagMeta:         { fontSize: 11, color: '#ADADAA' },
  expandedSection:  { borderTopWidth: 1, borderTopColor: '#EFEFED', paddingTop: 10, gap: 8, marginTop: 4 },
  expandLabel:      { fontSize: 10, color: '#ADADAA', letterSpacing: 0.6 },
  noteInput:        { borderWidth: 1, borderColor: '#DDDDD9', borderRadius: 8, padding: 8, fontSize: 13, color: '#111110', minHeight: 60, textAlignVertical: 'top' },
  resolveBtn:       { backgroundColor: '#3DB34A', borderRadius: 8, padding: 10, alignItems: 'center' },
  resolveBtnText:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  existingNote:     { fontSize: 11, color: '#737370', fontStyle: 'italic' },
});
