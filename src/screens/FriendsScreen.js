import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function FriendsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myFriends, setMyFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const [myUserId, setMyUserId] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setMyUserId(data.user.id);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (myUserId) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [myUserId]);

  const fetchFriends = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('friends')
      .select('user_id, friend_id, status')
      .or(`user_id.eq.${myUserId},friend_id.eq.${myUserId}`)
      .eq('status', 'accepted');
    if (data) {
      const friendIds = data.map(f =>
        f.user_id === myUserId ? f.friend_id : f.user_id
      );
      if (friendIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', friendIds);
        setMyFriends(users || []);
      } else {
        setMyFriends([]);
      }
    }
    setLoading(false);
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from('friends')
      .select('id, user_id')
      .eq('friend_id', myUserId)
      .eq('status', 'pending');
    if (data && data.length > 0) {
      const userIds = data.map(r => r.user_id);
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      setPendingRequests(
        data.map(r => ({
          requestId: r.id,
          user: users.find(u => u.id === r.user_id),
        }))
      );
    } else {
      setPendingRequests([]);
    }
  };

  const handleSearch = async () => {
    if (!search.trim() || !myUserId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      .neq('id', myUserId);
    setResults(data || []);
    setLoading(false);
  };

  const sendFriendRequest = async (friendId) => {
    if (!myUserId) return;
    const { error } = await supabase
      .from('friends')
      .insert([{ user_id: myUserId, friend_id: friendId, status: 'pending' }]);
    if (!error) {
      Alert.alert('Solicitud enviada', 'La solicitud de amistad ha sido enviada.');
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (!error) {
      fetchFriends();
      fetchPendingRequests();
      Alert.alert('¡Ahora sois amigos!');
    } else {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar amigos</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre o email"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSearch}
          disabled={!myUserId || loading}
        >
          <Text style={styles.buttonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        ListHeaderComponent={() =>
          results.length > 0 ? <Text style={styles.sectionTitle}>Resultados</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.resultRow}>
            <Text style={styles.resultText}>{item.name} ({item.email})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => sendFriendRequest(item.id)}
            >
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {results.length === 0 && search.trim() && !loading && (
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 12 }}>
          No se encontraron usuarios.
        </Text>
      )}

      <FlatList
        data={pendingRequests}
        keyExtractor={item => item.requestId}
        ListHeaderComponent={() =>
          pendingRequests.length > 0 ? <Text style={styles.sectionTitle}>Solicitudes recibidas</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.resultRow}>
            <Text style={styles.resultText}>{item.user?.name} ({item.user?.email})</Text>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => acceptFriendRequest(item.requestId)}
            >
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <FlatList
        data={myFriends}
        keyExtractor={item => item.id}
        ListHeaderComponent={() =>
          myFriends.length > 0 ? <Text style={styles.sectionTitle}>Tus amigos</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.resultRow}>
            <Text style={styles.resultText}>{item.name} ({item.email})</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: '#f8fff8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#fff',
    color: '#222',
  },
  button: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
    color: '#222',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 8,
  },
  resultText: {
    flex: 1,
    color: '#222',
  },
  addButton: {
    backgroundColor: 'rgb(30, 210, 219)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: 'green',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});