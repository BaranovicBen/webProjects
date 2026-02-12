// Results Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { finalizeSession, getResults, getSessionInfo } from '../services/api';

export default function ResultsScreen({ route, navigation }) {
  const { sessionData } = route.params;
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    loadSessionInfo();
  }, []);

  const loadSessionInfo = async () => {
    try {
      const info = await getSessionInfo(sessionData.sessionId);
      setSessionInfo(info);
    } catch (error) {
      console.error('Error loading session info:', error);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const finalResults = await finalizeSession(sessionData.sessionId, sessionData.secret);
      setResults(finalResults);
      Alert.alert('Success', 'Session finalized! Here are your common free times.');
    } catch (error) {
      console.error('Error finalizing session:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to finalize session');
    } finally {
      setLoading(false);
    }
  };

  const handleGetResults = async () => {
    setLoading(true);
    try {
      const sessionResults = await getResults(sessionData.sessionId, sessionData.secret);
      setResults(sessionResults);
    } catch (error) {
      console.error('Error getting results:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to get results');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Session Results</Text>
        
        {sessionInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session Status</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{sessionInfo.state}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Participants:</Text>
              <Text style={styles.value}>{sessionInfo.participantCount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>With Data:</Text>
              <Text style={styles.value}>{sessionInfo.participantsWithData}</Text>
            </View>
          </View>
        )}
        
        {!results && sessionInfo?.state === 'open' && (
          <View style={styles.card}>
            <Text style={styles.helpText}>
              Once all participants have uploaded their calendars, finalize the session to compute common free times.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleFinalize}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Finalize Session</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {!results && sessionInfo?.state === 'locked' && (
          <View style={styles.card}>
            <Text style={styles.helpText}>
              Session has been finalized. Click below to view results.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleGetResults}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>View Results</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {results && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Common Free Times</Text>
            <Text style={styles.helpText}>
              Found {results.totalCount} common free time slot(s)
            </Text>
            
            {results.topResults.length === 0 ? (
              <Text style={styles.noResultsText}>
                No common free times found. Try adjusting your constraints or date range.
              </Text>
            ) : (
              <ScrollView style={styles.resultsList}>
                {results.topResults.map((slot, index) => (
                  <View key={index} style={styles.slotCard}>
                    <View style={styles.slotHeader}>
                      <Text style={styles.slotNumber}>#{index + 1}</Text>
                      <Text style={styles.slotDuration}>
                        {formatDuration(slot.duration)}
                      </Text>
                    </View>
                    <Text style={styles.slotDate}>
                      {new Date(slot.start).toLocaleDateString()} {' '}
                      {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.slotTime}>
                      {new Date(slot.start).toLocaleTimeString()} - {new Date(slot.end).toLocaleTimeString()}
                    </Text>
                    {slot.isWeekend && (
                      <Text style={styles.weekendBadge}>Weekend</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsList: {
    maxHeight: 500,
  },
  slotCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slotNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  slotDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  slotDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  slotTime: {
    fontSize: 14,
    color: '#666',
  },
  weekendBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
