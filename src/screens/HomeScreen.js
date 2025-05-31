import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, ImageBackground, Modal } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  // Estado para el modal de mapa
  const [showMap, setShowMap] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapTitle, setMapTitle] = useState('');

  // Pedir permiso y obtener ubicación
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede mostrar plantas cercanas sin permiso de ubicación.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  // Buscar ciudad a partir de la ubicación
  useEffect(() => {
    if (!location) return;
    (async () => {
      try {
        const [place] = await Location.reverseGeocodeAsync(location);
        setCity(place.city || place.town || place.village || '');
      } catch (e) {
        setCity('');
      }
    })();
  }, [location]);

  // Buscar especies cercanas cuando hay ubicación usando iNaturalist
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    const fetchNearbySpecies = async () => {
      try {
        const url = `https://api.inaturalist.org/v1/observations?lat=${location.latitude}&lng=${location.longitude}&radius=50&taxon_id=47126&photos=true&per_page=7&order=desc&order_by=created_at`;
        const res = await fetch(url);
        const data = await res.json();
        const unique = {};
        (data.results || []).forEach(obs => {
          if (
            obs.taxon &&
            obs.taxon.name &&
            obs.photos &&
            obs.photos.length > 0 &&
            !unique[obs.taxon.name]
          ) {
            let spanishName = null;
            if (obs.taxon.common_names && Array.isArray(obs.taxon.common_names)) {
              const es = obs.taxon.common_names.find(n => n.locale === 'es');
              if (es) spanishName = es.name;
            }
            unique[obs.taxon.name] = {
              name: spanishName || obs.taxon.name,
              image: obs.photos[0].url.replace('square', 'medium'),
              scientificName: obs.taxon.name,
            };
          }
        });
        setSpecies(Object.values(unique));
      } catch (e) {
        setSpecies([]);
      }
      setLoading(false);
    };
    fetchNearbySpecies();
  }, [location]);

  // Función para abrir el modal del mapa
  const openMapModal = async (scientificName) => {
    setShowMap(true);
    setMapLoading(true);
    setMapTitle(scientificName);
    try {
      const url = `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(scientificName)}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      const pts = (data.results || [])
        .filter(r => r.decimalLatitude && r.decimalLongitude)
        .map(r => ({
          latitude: r.decimalLatitude,
          longitude: r.decimalLongitude,
        }));
      setMapPoints(pts);
    } catch (e) {
      setMapPoints([]);
    }
    setMapLoading(false);
  };

  // Siempre centrado en Europa
  const initialRegion = {
    latitude: 50.0,
    longitude: 10.0,
    latitudeDelta: 35,
    longitudeDelta: 35,
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
        <View style={styles.carouselContainer}>
          <Text style={styles.subtitle}>Plantas observadas cerca de ti:</Text>
          <View style={styles.carouselBox}>
            {loading ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : species.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', paddingLeft: 0 }}
                style={{ flexGrow: 0 }}
              >
                {species.map((sp, idx) => (
                  <TouchableOpacity key={idx} style={styles.card} onPress={() => openMapModal(sp.scientificName)}>
                    <Image source={{ uri: sp.image }} style={styles.image} />
                    <Text style={styles.speciesName}>{sp.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ fontStyle: 'italic', marginVertical: 10, color: '#1976d2' }}>
                No se han encontrado plantas cercanas.
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.ubicacionText}>
          Ubicación actual: {city ? city : 'Desconocida'}
        </Text>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('Identificacion')}
        >
          <Text style={styles.buttonText}>Hacer foto a una planta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('Favoritos')}
        >
          <Text style={styles.buttonText}>Ver favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('Amigos')}
        >
          <Text style={styles.buttonText}>Amigos</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={showMap}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMap(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 10,
            width: '95%',
            maxHeight: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
              Distribución: {mapTitle}
            </Text>
            {mapLoading ? (
              <ActivityIndicator style={{ marginTop: 30 }} />
            ) : mapPoints.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 30 }}>No hay datos de distribución.</Text>
            ) : (
              <MapView
                style={{ width: '100%', height: 350, borderRadius: 10 }}
                initialRegion={initialRegion}
                region={initialRegion} // Siempre centrado en Europa
              >
                {mapPoints.map((p, i) => (
                  <Marker key={i} coordinate={p} />
                ))}
              </MapView>
            )}
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: '#1976d2',
                paddingVertical: 8,
                paddingHorizontal: 24,
                borderRadius: 8,
              }}
              onPress={() => setShowMap(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(255,255,255,0.0)', // transparente
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: -40,
    marginTop: -30,
  },
  carouselContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 1,
    marginTop: -20,
  },
  carouselBox: {
    width: '100%',
    height: 250,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 0,
    alignSelf: 'stretch',
  },
  card: {
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.91)',
    borderRadius: 18,
    padding: 12,
    width: 210,
    height: 220,
    justifyContent: 'flex-start',
  },
  image: {
    width: 190,
    height: 150,
    borderRadius: 18,
    marginBottom: 15,
    backgroundColor: '#e0e0e0',
  },
  speciesName: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1976d2',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 8,
    width: '80%',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  ubicacionText: {
    marginTop: -20,
    marginBottom: 48,
    fontSize: 18,
    color: '#1976d2',
    fontWeight: 'bold',
    textAlign: 'center'
  },
});