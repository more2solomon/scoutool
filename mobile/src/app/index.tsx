import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { mobileApiClient } from '../api-client';

interface QueueItem {
  email: string;
  subject?: string;
  gmailUrl?: string;
}

interface AppState {
  running: boolean;
  completed: number;
  failed: number;
  currentIndex: number;
}

export default function Dashboard() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [state, setState] = useState<AppState>({
    running: false,
    completed: 0,
    failed: 0,
    currentIndex: 0
  });
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [delay, setDelay] = useState('6');
  const [baseUrl, setBaseUrl] = useState('https://scoutool-mail.created.app/');
  const [busy, setBusy] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    refresh();
    refreshGmailStatus();
    const timer = setInterval(refresh, 3000);
    const gmailTimer = setInterval(refreshGmailStatus, 10000);
    return () => {
      clearInterval(timer);
      clearInterval(gmailTimer);
    };
  }, []);

  async function refresh() {
    try {
      const [queueData, stateData] = await Promise.all([
        mobileApiClient.getQueue(),
        mobileApiClient.getState()
      ]);
      setQueue(Array.isArray(queueData.items) ? queueData.items : []);
      setState(stateData.state || { running: false, completed: 0, failed: 0, currentIndex: 0 });
      setBridgeOnline(true);
      setMessage('');
    } catch (error) {
      setBridgeOnline(false);
      setMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async function refreshGmailStatus() {
    try {
      const data = await mobileApiClient.getGmailStatus();
      setGmailConnected(Boolean(data.connected));
      setGmailEmail(data.email || '');
    } catch {
      setGmailConnected(false);
      setGmailEmail('');
    }
  }

  async function changeState(patch: Partial<AppState>) {
    setBusy(true);
    try {
      const data = await mobileApiClient.updateState(patch);
      setState(data.state);
      setMessage('State updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  const remaining = Math.max(0, queue.length - state.completed - state.failed);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scout Mail</Text>
          <Text style={styles.subtitle}>Gmail draft automation dashboard</Text>
        </View>
        <View style={[styles.bridgeStatus, bridgeOnline ? styles.online : styles.offline]}>
          <View style={[styles.dot, bridgeOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.bridgeText}>{bridgeOnline ? 'API connected' : 'API offline'}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Settings</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Scoutool URL</Text>
          <TextInput
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Delay (seconds)</Text>
          <TextInput
            style={styles.input}
            value={delay}
            onChangeText={setDelay}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.gmailStatus}>
          <Text style={styles.gmailText}>
            Gmail: <Text style={styles.bold}>{gmailConnected ? gmailEmail : 'Not connected'}</Text>
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Alert.alert('Connect Gmail', 'OAuth flow will be implemented')}
          >
            <Text style={styles.linkText}>{gmailConnected ? 'Reconnect Gmail' : 'Connect Gmail'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Queued</Text>
          <Text style={styles.cardValue}>{queue.length}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Completed</Text>
          <Text style={styles.cardValue}>{state.completed}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Failed</Text>
          <Text style={styles.cardValue}>{state.failed}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Remaining</Text>
          <Text style={styles.cardValue}>{remaining}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          disabled={busy || state.running}
          onPress={() => changeState({ running: true, currentIndex: state.currentIndex })}
        >
          <Text style={styles.buttonText}>START</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          disabled={busy || !state.running}
          onPress={() => changeState({ running: false })}
        >
          <Text style={[styles.buttonText, styles.stopButtonText]}>STOP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          disabled={busy}
          onPress={refresh}
        >
          <Text style={styles.buttonText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.panelTitle}>Live Queue</Text>
          <Text style={styles.count}>{queue.length} items</Text>
        </View>

        {queue.length === 0 ? (
          <Text style={styles.empty}>No queue has been received yet.</Text>
        ) : (
          queue.map((item, index) => (
            <View key={`${item.email}-${index}`} style={styles.row}>
              <Text style={styles.rowIndex}>#{index + 1}</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowEmail}>{item.email}</Text>
                {item.subject && <Text style={styles.rowSubject}>{item.subject}</Text>}
              </View>
              {item.gmailUrl ? (
                <Text style={styles.rowLink}>Gmail</Text>
              ) : (
                <Text style={styles.rowPlaceholder}>-</Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Activity</Text>
        <Text style={styles.activityText}>
          Status: <Text style={styles.bold}>{state.running ? 'Running' : 'Stopped'}</Text>
        </Text>
        <Text style={styles.activityText}>
          Current item: <Text style={styles.bold}>{state.currentIndex + 1}</Text>
        </Text>
        <Text style={styles.message}>{message || 'Waiting for bridge data.'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  bridgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  online: {
    backgroundColor: '#f5f5f5',
  },
  offline: {
    backgroundColor: '#f5f5f5',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  dotOnline: {
    backgroundColor: '#000000',
  },
  dotOffline: {
    backgroundColor: '#999999',
  },
  bridgeText: {
    fontSize: 13,
    color: '#000000',
  },
  panel: {
    margin: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  gmailStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 18,
  },
  gmailText: {
    fontSize: 13,
    color: '#000000',
  },
  bold: {
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 16,
    gap: 14,
  },
  card: {
    flex: 1,
    minWidth: 100,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    minWidth: 100,
    padding: 13,
    borderRadius: 9,
    alignItems: 'center',
    borderWidth: 1,
  },
  startButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  stopButton: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
  },
  refreshButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stopButtonText: {
    color: '#000000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  count: {
    fontSize: 13,
    color: '#666666',
  },
  empty: {
    color: '#666666',
    padding: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rowIndex: {
    fontSize: 13,
    color: '#666666',
    width: 50,
  },
  rowContent: {
    flex: 1,
  },
  rowEmail: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  rowSubject: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  rowLink: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  rowPlaceholder: {
    fontSize: 13,
    color: '#666666',
  },
  activityText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666666',
  },
});
