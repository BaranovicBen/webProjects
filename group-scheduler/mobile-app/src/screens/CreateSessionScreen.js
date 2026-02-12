// Create Session Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { createSession } from '../services/api';
import * as Clipboard from 'expo-clipboard';

export default function CreateSessionScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState('60');
  const [dateRange, setDateRange] = useState('7');
  const [sessionData, setSessionData] = useState(null);

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      const rangeEnd = now + parseInt(dateRange) * 24 * 60 * 60 * 1000;
      
      const constraints = {
        rangeStart: now,
        rangeEnd,
        minDuration: parseInt(duration) * 60 * 1000, // Convert minutes to ms
        maxResults: 10,
      };
      
      const hostDeviceId = `device-${Math.random().toString(36).substr(2, 9)}`;
      const result = await createSession(hostDeviceId, constraints);
      
      setSessionData(result);
      Alert.alert('Success', 'Session created successfully!');
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const getInviteLink = () => {
    if (!sessionData) return '';
    return `groupscheduler://join/${sessionData.sessionId}?secret=${sessionData.secret}`;
  };

  if (sessionData) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>Session Created!</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Session ID:</Text>
              <Text style={styles.value}>{sessionData.sessionId}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(sessionData.sessionId, 'Session ID')}>
                <Text style={styles.copyButton}>Copy</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Join Code:</Text>
              <Text style={styles.value}>{sessionData.joinCode}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(sessionData.joinCode, 'Join Code')}>
                <Text style={styles.copyButton}>Copy</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Secret:</Text>
              <Text style={styles.value} numberOfLines={1}>{sessionData.secret}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(sessionData.secret, 'Secret')}>
                <Text style={styles.copyButton}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Share Invite</Text>
            <Text style={styles.inviteLink}>{getInviteLink()}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => copyToClipboard(getInviteLink(), 'Invite link')}
            >
              <Text style={styles.buttonText}>Copy Invite Link</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('ImportCalendar', { sessionData })}
          >
            <Text style={styles.buttonText}>Import My Calendar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Create Session</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Minimum Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="60"
          />
          
          <Text style={styles.label}>Date Range (days)</Text>
          <TextInput
            style={styles.input}
            value={dateRange}
            onChangeText={setDateRange}
            keyboardType="numeric"
            placeholder="7"
          />
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCreateSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Session</Text>
            )}
          </TouchableOpacity>
        </View>
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
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  copyButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inviteLink: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
});
