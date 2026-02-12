// Join Session Screen
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
import { joinSession } from '../services/api';

export default function JoinSessionScreen({ navigation }) {
  const [sessionId, setSessionId] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinSession = async () => {
    if (!sessionId || !secret) {
      Alert.alert('Error', 'Please enter both Session ID and Secret');
      return;
    }

    setLoading(true);
    try {
      const result = await joinSession(sessionId, secret);
      
      Alert.alert('Success', 'Joined session successfully!');
      navigation.navigate('ImportCalendar', {
        sessionData: {
          sessionId,
          secret,
          participantId: result.participantId,
        },
      });
    } catch (error) {
      console.error('Error joining session:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Join Session</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Session ID or Join Code</Text>
          <TextInput
            style={styles.input}
            value={sessionId}
            onChangeText={setSessionId}
            placeholder="Enter session ID or join code"
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>Secret</Text>
          <TextInput
            style={styles.input}
            value={secret}
            onChangeText={setSecret}
            placeholder="Enter session secret"
            autoCapitalize="none"
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleJoinSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Join Session</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Need help?</Text>
          <Text style={styles.infoText}>
            Ask the session host to share:
          </Text>
          <Text style={styles.infoText}>• Session ID or Join Code</Text>
          <Text style={styles.infoText}>• Session Secret</Text>
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
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
});
