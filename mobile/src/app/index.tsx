import { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://scoutool-lilac.vercel.app";

type QueueItem = {
  email: string;
  subject?: string;
  gmailUrl?: string;
};

type JobState = {
  running: boolean;
  completed: number;
  failed: number;
  currentIndex: number;
};

const DEFAULT_STATE: JobState = {
  running: false,
  completed: 0,
  failed: 0,
  currentIndex: 0,
};

export default function HomeScreen() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [state, setState] = useState<JobState>(DEFAULT_STATE);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [pairCode, setPairCode] = useState("");
  const [deviceName, setDeviceName] =
    useState("My Scout Mail PC");
  const [pairing, setPairing] = useState(false);
  const [paired, setPaired] = useState(false);

  const [delay, setDelay] = useState("6");

  async function loadBackend() {
    try {
      setError("");

      const [queueResponse, stateResponse] =
        await Promise.all([
          fetch(`${API}/api/bridge/queue`, {
            cache: "no-store",
          }),
          fetch(`${API}/api/bridge/state`, {
            cache: "no-store",
          }),
        ]);

      if (!queueResponse.ok || !stateResponse.ok) {
        throw new Error("Backend unavailable");
      }

      const queueData = await queueResponse.json();
      const stateData = await stateResponse.json();

      setQueue(
        Array.isArray(queueData.items)
          ? queueData.items
          : []
      );

      setState({
        ...DEFAULT_STATE,
        ...(stateData.state || {}),
      });

      setConnected(true);
    } catch (err) {
      setConnected(false);
      setError(
        err instanceof Error
          ? err.message
          : "Connection failed"
      );
    }
  }

  async function pairDesktop() {
    const code = pairCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setError(
        "Enter the 6-digit pairing code."
      );
      return;
    }

    try {
      setPairing(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API}/api/pair/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            deviceName:
              deviceName.trim() ||
              "My Scout Mail PC",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Pairing failed."
        );
      }

      await AsyncStorage.multiSet([
        ["scoutmail.userToken", data.userToken],
        ["scoutmail.deviceId", data.deviceId],
      ]);

      setPaired(true);
      setMessage(
        "Desktop paired successfully."
      );
      setPairCode("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Pairing failed."
      );
    } finally {
      setPairing(false);
    }
  }

  async function updateState(
    patch: Partial<JobState>
  ) {
    try {
      setError("");

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update state."
        );
      }

      setState({
        ...DEFAULT_STATE,
        ...(data.state || {}),
      });

      setMessage("State updated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update state."
      );
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadBackend();
    setRefreshing(false);
  }

  useEffect(() => {
    loadBackend();

    const timer = setInterval(
      loadBackend,
      5000
    );

    return () => clearInterval(timer);
  }, []);

  const completed =
    Number(state.completed || 0);

  const failed =
    Number(state.failed || 0);

  const remaining = Math.max(
    0,
    queue.length - completed - failed
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.container
        }
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
                connected
                  ? styles.online
                  : styles.offline,
              ]}
            />

            <Text style={styles.connectionText}>
              {connected
                ? "Online"
                : "Offline"}
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

        {message ? (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              {message}
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
            value={completed}
          />

          <Stat
            label="Failed"
            value={failed}
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
            Computer name
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
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
          />

          <Pressable
            style={[
              styles.start,
              pairing && styles.disabled,
            ]}
            disabled={pairing}
            onPress={pairDesktop}
          >
            <Text style={styles.buttonText}>
              {pairing
                ? "CONNECTING..."
                : "CONNECT DESKTOP"}
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
              value={delay}
              keyboardType="number-pad"
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

            <Text style={styles.seconds}>
              seconds
            </Text>

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
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                No queue data
              </Text>

              <Text style={styles.emptyText}>
                Connect the desktop and open
                Scoutool to synchronize queue
                data.
              </Text>
            </View>
          ) : (
            queue
              .slice(0, 100)
              .map((item, index) => (
                <View
                  key={`${item.email}-${index}`}
                  style={styles.queueItem}
                >
                  <Text style={styles.number}>
                    #{index + 1}
                  </Text>

                  <View
                    style={
                      styles.queueContent
                    }
                  >
                    <Text
                      style={styles.email}
                    >
                      {item.email}
                    </Text>

                    {item.subject ? (
                      <Text
                        style={styles.subject}
                      >
                        {item.subject}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
          )}
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

  scroll: {
    flex: 1,
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

  online: {
    backgroundColor: "#2e9b78",
  },

  offline: {
    backgroundColor: "#a33b3b",
  },

  connectionText: {
    fontWeight: "700",
    color: "#173b37",
  },

  error: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff0f0",
    marginBottom: 12,
  },

  errorText: {
    color: "#a33b3b",
  },

  message: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#edf8f4",
    marginBottom: 12,
  },

  messageText: {
    color: "#2e8067",
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
    padding: 18,
    borderRadius: 14,
  },

  cardLabel: {
    color: "#70807d",
    marginBottom: 7,
  },

  cardValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#173b37",
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
    color: "#173b37",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d7dfdd",
    borderRadius: 9,
    padding: 12,
    marginBottom: 12,
    color: "#173b37",
    backgroundColor: "#fff",
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
    alignItems: "center",
    justifyContent: "center",
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

  seconds: {
    color: "#70807d",
  },

  start: {
    backgroundColor: "#117c72",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 9,
  },

  disabled: {
    opacity: 0.6,
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

  success: {
    color: "#2e8067",
    marginTop: 8,
    fontWeight: "700",
  },

  empty: {
    paddingVertical: 10,
  },

  emptyTitle: {
    fontWeight: "700",
    color: "#173b37",
  },

  emptyText: {
    marginTop: 5,
    color: "#70807d",
    lineHeight: 20,
  },

  queueItem: {
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

  queueContent: {
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
