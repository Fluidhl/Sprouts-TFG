// src/screens/HomeScreen.js
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a PlantBuddy 🌱</Text>
      <Button
        title="Tomar Foto de Planta"
        onPress={() => navigation.navigate('Identificacion')}
      />
      <Button
        title="Amigos"
        onPress={() => navigation.navigate('Amigos')}
      />
      <TouchableOpacity
              style={{
                alignSelf: 'flex-end',
                marginBottom: 10,
                backgroundColor: '#1976d2',
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 8,
              }}
              onPress={() => navigation.navigate('Favoritos')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ver Favoritos</Text>
            </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
});
