import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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

      formData.append('organs', organ); //Para mriar que organo se está usando para identificar

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
      navigation.navigate('Resultado', { results: data });


    } catch (error) {
      console.error('Error al enviar imagen:', error);
      Alert.alert('Error', 'No se pudo analizar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Identifica una planta 🌱</Text>

      <Text style={styles.label}>¿Qué parte de la planta estás enviando?</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={organ}
          onValueChange={(itemValue) => setOrgan(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Hoja" value="leaf" />
          <Picker.Item label="Flor" value="flower" />
          <Picker.Item label="Fruto" value="fruit" />
          <Picker.Item label="Corteza" value="bark" />
          <Picker.Item label="Hábito (forma completa)" value="habit" />
        </Picker>
      </View>

      <Button title="Seleccionar imagen" onPress={pickImage} />

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      
      {imageUri && !loading && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f6fff4',
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
  },
  picker: {
    width: '100%',
    height: 44,
  },
  image: {
    marginTop: 20,
    width: 300,
    height: 300,
    borderRadius: 10,
  },
});
