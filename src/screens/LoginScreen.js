// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ImageBackground,
  TouchableOpacity,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password || !name.trim()) {
      Alert.alert('Campos incompletos', 'Rellena todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signIn({ email, password });

      if (error) {
        Alert.alert('Error al iniciar sesión', error.message);
      } else {
        const user = supabase.auth.user();
        if (user) {
          // Primero comprobar si existe
          const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', user.id)
            .single();

          // Actualizar la tabla
          if (!existingUser) {
            await supabase.from('users').insert([
              {
                id: user.id,
                email: user.email,
                name: name.trim(),
                total_identifications: 0,
                fav_plants: [],
              },
            ]);
          } else if (!existingUser.name) {
            await supabase.from('users')
              .update({ name: name.trim() })
              .eq('id', user.id);
          }
        }
        Alert.alert('¡Bienvenido!', 'Iniciado sesión correctamente.');
        navigation.replace('Inicio');
      }
    } catch (err) {
      Alert.alert('Error inesperado', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/bgRS1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/logotipo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Iniciar Sesión</Text>

        <TextInput
          placeholder="Nombre de usuario"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#fff"
        />

        <TextInput
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#fff"
        />

        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#fff"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 16 }} />
        ) : (
          <TouchableOpacity style={styles.customButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.customButtonText}>Entrar</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.link} onPress={() => navigation.navigate('Registro')}>
          ¿No tienes cuenta? Regístrate
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    padding: 24,
    paddingTop: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  title: {
    fontSize: 25,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    width: '77%',
    alignSelf: 'center',
    textAlign: 'center',
    color: '#fff',
  },
  link: {
    marginTop: 25,
    color: 'rgb(30, 210, 219)',
    textAlign: 'center',
  },
  customButton: {
    backgroundColor: 'blue',
    padding: 14,
    paddingHorizontal: 54,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
  customButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -40,
  },
  logo: {
    width: 410,
    height: 410,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 5,
  },
});