import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function CameraScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [organ, setOrgan] = useState('leaf'); // 🌿 valor por defecto
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const { uri, base64 } = result.assets[0];
      setImageUri(uri);
      sendToPlantNet(base64);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const { uri, base64 } = result.assets[0];
      setImageUri(uri);
      sendToPlantNet(base64);
    }
  };

  const sendToPlantNet = async (base64Image) => {
    setLoading(true);

    try {
      const apiKey = '2b1017d8rp6CGNn8iyE6HScdse';
      const formData = new FormData();

      formData.append('images', {
        uri: `data:image/jpeg;base64,${base64Image}`,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      formData.append('organs', organ);

      const response = await fetch(`https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      console.log('🔍 Resultado:', data);

      Alert.alert('¡Análisis completo!', 'Mostrando resultados.');
      navigation.navigate('Resultados de identificación', { results: data });

    } catch (error) {
      console.error('Error al enviar imagen:', error);
      Alert.alert('Error', 'No se pudo analizar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/bgHS1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Image
          source={require('../../assets/logotipo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Identifica una planta 🌱</Text>

        <Text style={styles.label}>¿Qué parte de la planta estás enviando?</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={organ}
            onValueChange={(itemValue) => setOrgan(itemValue)}
            style={styles.picker}
            dropdownIconColor="#4a6a6a"
          >
            <Picker.Item label="Hoja" value="leaf" />
            <Picker.Item label="Flor" value="flower" />
            <Picker.Item label="Fruto" value="fruit" />
            <Picker.Item label="Corteza" value="bark" />
            <Picker.Item label="Hábito (forma completa)" value="habit" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={pickImage}>
          <Text style={styles.buttonText}>Seleccionar imagen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={takePhoto}>
          <Text style={styles.buttonText}>Hacer una foto</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 20 }} />}

        {imageUri && !loading && (
          <Image source={{ uri: imageUri }} style={styles.image} />
        )}
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
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: -60,
    marginTop: -100,
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    fontWeight: 'bold',
    color: 'rgb(28, 76, 76)',
    textAlign: 'center',
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgb(28, 76, 76)',
    textAlign: 'center',
  },
  pickerWrapper: {
    width: '70%',
    borderWidth: 1,
    borderColor: '#4a6a6a',
    borderRadius: 12,
    marginVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.93)',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 59,
    color: '#4a6a6a',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(3, 57, 57)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 12,
    width: '70%',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  image: {
    marginTop: 24,
    width: 300,
    height: 300,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4a6a6a',
    backgroundColor: '#e0e0e0',
  },
});