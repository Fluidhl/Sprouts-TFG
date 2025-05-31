import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Email inválido');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (signUpError) {
        Alert.alert('Error al registrarse', signUpError.message);
        return;
      }
      Alert.alert('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (e) {
      console.error('Error inesperado en el registro:', e);
      Alert.alert('Error inesperado', e.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/bgLS1.jpg')}
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
        <Text style={styles.title}>Registro</Text>

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

        <TextInput
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#fff"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 16 }} />
        ) : (
          <TouchableOpacity style={styles.customButton} onPress={handleRegister} disabled={loading}>
            <Text style={styles.customButtonText}>Registrarse</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.link} onPress={() => navigation.goBack()}>
          ¿Ya tienes cuenta? Inicia sesión
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
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -80,
    marginTop: 4,
  },
  logo: {
    width: 400,
    height: 400,
  },
  title: {
    fontSize: 33,
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
    color: 'rgb(27, 166, 3)',
    textAlign: 'center',
  },
  customButton: {
    backgroundColor: 'green',
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
});