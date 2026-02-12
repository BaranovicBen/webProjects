// Import Calendar Screen
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
import { uploadBusyIntervals } from '../services/api';
import { parseICalToBusyIntervals, generateSampleICal } from '../utils/icalParser';

export default function ImportCalendarScreen({ route, navigation }) {
  const { sessionData } = route.params;
  const [icalContent, setIcalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyIntervals, setBusyIntervals] = useState([]);

  const handleUseSample = () => {
    const sample = generateSampleICal();
    setIcalContent(sample);
    Alert.alert('Sample Loaded', 'Sample iCal data has been loaded');
  };

  const handleParseICal = () => {
    if (!icalContent) {
      Alert.alert('Error', 'Please enter iCal content');
      return;
    }

    try {
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const intervals = parseICalToBusyIntervals(icalContent, now, now + oneWeek);
      
      setBusyIntervals(intervals);
      Alert.alert(
        'Success',
        `Parsed ${intervals.length} busy time slots from your calendar`
      );
    } catch (error) {
      console.error('Error parsing iCal:', error);
      Alert.alert('Error', 'Failed to parse iCal data. Please check the format.');
    }
  };

  const handleUpload = async () => {
    if (busyIntervals.length === 0) {
      Alert.alert('Error', 'Please parse your calendar first');
      return;
    }

    setLoading(true);
    try {
      await uploadBusyIntervals(
        sessionData.sessionId,
        sessionData.participantId,
        sessionData.secret,
        busyIntervals
      );
      
      Alert.alert('Success', 'Your availability has been uploaded!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Results', { sessionData }),
        },
      ]);
    } catch (error) {
      console.error('Error uploading intervals:', error);
      Alert.alert('Error', 'Failed to upload availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Import Calendar</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>iCal Content</Text>
          <Text style={styles.helpText}>
            Paste your iCal (.ics) file content below, or use the sample data
          </Text>
          
          <TextInput
            style={styles.textArea}
            value={icalContent}
            onChangeText={setIcalContent}
            placeholder="Paste iCal content here..."
            multiline={true}
            numberOfLines={10}
          />
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleUseSample}>
            <Text style={styles.secondaryButtonText}>Use Sample Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleParseICal}
          >
            <Text style={styles.buttonText}>Parse Calendar</Text>
          </TouchableOpacity>
        </View>
        
        {busyIntervals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Busy Time Slots</Text>
            <Text style={styles.helpText}>
              Found {busyIntervals.length} busy time slot(s)
            </Text>
            
            <ScrollView style={styles.intervalsList}>
              {busyIntervals.slice(0, 5).map((interval, index) => (
                <View key={index} style={styles.intervalItem}>
                  <Text style={styles.intervalText}>
                    {new Date(interval[0]).toLocaleString()} - {new Date(interval[1]).toLocaleString()}
                  </Text>
                </View>
              ))}
              {busyIntervals.length > 5 && (
                <Text style={styles.moreText}>
                  ... and {busyIntervals.length - 5} more
                </Text>
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Upload Availability</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 12,
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
  secondaryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  intervalsList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  intervalItem: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  intervalText: {
    fontSize: 12,
    color: '#333',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
