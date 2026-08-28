import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";

const API = "https://scoutool-lilac.vercel.app";

type QueueItem = {
  email: string;
  gmailUrl?: string;
  subject?: string;
};

type State = {
  running: boolean;
  completed: number;
  failed: number;
  currentIndex: number;
};

const defaultState: State = {
  running: false,
  completed: 0,
  failed: 0,
  currentIndex: 0,
};

export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [state, setState] = useState<State>(defaultState);
  const [connected, setConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [delay, setDelay] = useState("6");
  const [error, setError] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [deviceName, setDeviceName] = useState("My Scout Mail PC");
  const [pairing, setPairing] = useState(false);
  const [paired, setPaired] = useState(false);

  async function load() {
    try {
      const [q, s] = await Promise.all([
        fetch(`${API}/api/bridge/queue`, {
          cache: "no-store",
        }),
        fetch(`${API}/api/bridge/state`, {
          cache: "no-store",
        }),
      ]);

      if (!q.ok || !s.ok) {
        throw new Error("Backend unavailable");
      }

      const queueData = await q.json();
      const stateData = await s.json();

      setQueue(
        Array.isArray(queueData.items)
          ? queueData.items
          : []
      );

      setState({
        ...defaultState,
        ...(stateData.state || {}),
      });

      setConnected(true);
      setError("");
    } catch (e) {
      setConnected(false);
      setError(
        e instanceof Error
          ? e.message
          : "Connection failed"
      );
    }
  }

  async function updateState(patch: Partial<State>) {
    try {
      const response = await fetch(
        `${API}/api/bridge/state`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patch),
        }
      );

      if (!response.ok) {
        throw new Error("State update failed");
      }

      const data = await response.json();

      setState({
        ...defaultState,
        ...(data.state || {}),
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "State update failed"
      );
    }
  }

  async function pairDesktop() {
    if (!/^\\d{6}$/.test(pairCode.trim())) {
      setError("Enter the 6-digit desktop pairing code.");
      return;
    }

    try {
      setPairing(true);
      setError("");

      const response = await fetch(
        `${API}/api/pair/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: pairCode.trim(),
            deviceName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Pairing failed."
        );
      }

      await AsyncStorage.setItem(
        "scoutmail.userToken",
        data.userToken
      );

      await AsyncStorage.setItem(
        "scoutmail.deviceId",
        data.deviceId
      );

      setPaired(true);
      setMessage("Desktop paired successfully.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Pairing failed."
      );
    } finally {
      setPairing(false);
    }
  }

  async function pairDesktop() {
    if (!/^\\d{6}$/.test(pairCode.trim())) {
      setError("Enter the 6-digit desktop pairing code.");
      return;
    }

    try {
      setPairing(true);
      setError("");

      const response = await fetch(
        `${API}/api/pair/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: pairCode.trim(),
            deviceName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Pairing failed."
        );
      }

      await AsyncStorage.setItem(
        "scoutmail.userToken",
        data.userToken
      );

      await AsyncStorage.setItem(
        "scoutmail.deviceId",
        data.deviceId
      );

      setPaired(true);
      setMessage("Desktop paired successfully.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Pairing failed."
      );
    } finally {
      setPairing(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  useEffect(() => {
    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(
    0,
    queue.length -
      state.completed -
      state.failed
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Scout Mail
            </Text>

            <Text style={styles.subtitle}>
              Mobile control center
            </Text>
          </View>

          <View style={styles.connection}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: connected
                    ? "#2e9b78"
                    : "#a33b3b",
                },
              ]}
            />

            <Text>
              {connected ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.stats}>
          <Stat
            label="Queued"
            value={queue.length}
          />
          <Stat
            label="Completed"
            value={state.completed}
          />
          <Stat
            label="Failed"
            value={state.failed}
          />
          <Stat
            label="Remaining"
            value={remaining}
          />
        </View>

        <View style={styles.panel}>
          <Text style={styles.heading}>
            Connect Desktop
          </Text>

          <Text style={styles.label}>
            Desktop name
          </Text>

          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="My Scout Mail PC"
          />

          <Text style={styles.label}>
            Pairing code
          </Text>

          <TextInput
            style={styles.input}
            value={pairCode}
            onChangeText={setPairCode}
            keyboardType="numeric"
            maxLength={6}
            placeholder="123456"
          />

          <Pressable
            style={styles.start}
            onPress={pairDesktop}
            disabled={pairing}
          >
            <Text style={styles.buttonText}>
              {pairing ? "CONNECTING..." : "CONNECT DESKTOP"}
            </Text>
          </Pressable>

          {paired ? (
            <Text style={styles.success}>
              Desktop connected.
            </Text>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.heading}>
            Controls
          </Text>

          <Text style={styles.label}>
            Delay
          </Text>

          <View style={styles.delayRow}>
            <Pressable
              style={styles.step}
              onPress={() =>
                setDelay(
                  String(
                    Math.max(
                      1,
                      Number(delay) - 1
                    )
                  )
                )
              }
            >
              <Text style={styles.stepText}>
                −
              </Text>
            </Pressable>

            <TextInput
              style={styles.delayInput}
              keyboardType="numeric"
              value={delay}
              onChangeText={(value) =>
                setDelay(
                  String(
                    Math.max(
                      1,
                      Number(value) || 1
                    )
                  )
                )
              }
            />

            <Text>seconds</Text>

            <Pressable
              style={styles.step}
              onPress={() =>
                setDelay(
                  String(
                    Number(delay) + 1
                  )
                )
              }
            >
              <Text style={styles.stepText}>
                +
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.start}
            onPress={() =>
              updateState({
                running: true,
              })
            }
          >
            <Text style={styles.buttonText}>
              START
            </Text>
          </Pressable>

          <Pressable
            style={styles.stop}
            onPress={() =>
              updateState({
                running: false,
              })
            }
          >
            <Text style={styles.buttonText}>
              STOP
            </Text>
          </Pressable>

          <Pressable
            style={styles.refresh}
            onPress={refresh}
          >
            <Text style={styles.refreshText}>
              REFRESH
            </Text>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.heading}>
            Live Queue
          </Text>

          {queue.length === 0 ? (
            <Text style={styles.muted}>
              No queue data received yet.
            </Text>
          ) : (
            queue
              .slice(0, 100)
              .map((item, index) => (
                <View
                  key={`${item.email}-${index}`}
                  style={styles.item}
                >
                  <Text style={styles.number}>
                    #{index + 1}
                  </Text>

                  <View style={styles.itemBody}>
                    <Text style={styles.email}>
                      {item.email}
                    </Text>

                    {item.subject ? (
                      <Text style={styles.subject}>
                        {item.subject}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.heading}>
            Desktop
          </Text>

          <Text style={styles.muted}>
            The Windows desktop client holds the
            Scoutool and mail browser sessions.
          </Text>

          <Text style={styles.muted}>
            The mobile app controls and monitors
            the shared job state.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>
        {label}
      </Text>

      <Text style={styles.cardValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f7f6",
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#173b37",
  },

  subtitle: {
    marginTop: 4,
    color: "#70807d",
  },

  connection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 9,
  },

  error: {
    padding: 12,
    backgroundColor: "#fff0f0",
    borderRadius: 10,
    marginBottom: 14,
  },

  errorText: {
    color: "#a33b3b",
  },

  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
  },

  cardLabel: {
    color: "#70807d",
    marginBottom: 7,
  },

  cardValue: {
    color: "#173b37",
    fontSize: 28,
    fontWeight: "800",
  },

  panel: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
  },

  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173b37",
    marginBottom: 15,
  },

  label: {
    fontWeight: "700",
    marginBottom: 8,
  },

  delayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  step: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: "#117c72",
    justifyContent: "center",
    alignItems: "center",
  },

  stepText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  delayInput: {
    width: 70,
    height: 42,
    borderWidth: 1,
    borderColor: "#d7dfdd",
    borderRadius: 9,
    textAlign: "center",
  },

  start: {
    backgroundColor: "#117c72",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 9,
  },

  stop: {
    backgroundColor: "#a33b3b",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 9,
  },

  refresh: {
    borderWidth: 1,
    borderColor: "#117c72",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },

  refreshText: {
    color: "#117c72",
    fontWeight: "800",
  },

  muted: {
    color: "#70807d",
    lineHeight: 21,
  },

  item: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f0",
  },

  number: {
    width: 42,
    color: "#70807d",
  },

  itemBody: {
    flex: 1,
  },

  email: {
    fontWeight: "700",
    color: "#173b37",
  },

  subject: {
    marginTop: 4,
    color: "#70807d",
    fontSize: 12,
  },
});
