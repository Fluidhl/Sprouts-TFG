import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Modal, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Heatmap } from 'react-native-maps';

function GBIFImageCarousel({ scientificName }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGBIFImages() {
      setLoading(true);
      try {
        const url = `https://api.gbif.org/v1/occurrence/search?mediaType=StillImage&scientificName=${encodeURIComponent(scientificName)}&limit=4`;
        const res = await fetch(url);
        const data = await res.json();
        const imgUrls = (data.results || [])
          .flatMap(r => (r.media || []).map(m => m.identifier))
          .filter(Boolean)
          .slice(0, 5);
        setImages(imgUrls);
      } catch (e) {
        setImages([]);
      }
      setLoading(false);
    }
    fetchGBIFImages();
  }, [scientificName]);

  if (loading) return <ActivityIndicator size="small" color="#2e7d32" style={{ marginVertical: 8 }} />;
  if (!images.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
      {images.map((imgUrl, idx) => (
        <Image
          key={idx}
          source={{ uri: imgUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

export default function FavoritosScreen() {
  const [favoritos, setFavoritos] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapTitle, setMapTitle] = useState('');

  useEffect(() => {
    const loadFavs = async () => {
      const favs = await AsyncStorage.getItem('favoritos');
      setFavoritos(favs ? JSON.parse(favs) : []);
    };
    loadFavs();
  }, []);

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

  const eliminarFavorito = async (scientificName) => {
    try {
      const favs = await AsyncStorage.getItem('favoritos');
      let favoritos = favs ? JSON.parse(favs) : [];
      const nuevosFavoritos = favoritos.filter(f => f.species.scientificName !== scientificName);
      await AsyncStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
      setFavoritos(nuevosFavoritos);
      Alert.alert('Eliminado', 'El favorito ha sido eliminado.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar el favorito');
    }
  };

  // Siempre centrado en Europa
  const initialRegion = {
    latitude: 50.0,
    longitude: 10.0,
    latitudeDelta: 35,
    longitudeDelta: 35,
  };

  //formatear fecha a dd/mm/yyyy
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <ImageBackground
      source={require('../../assets/bgHS1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
        {favoritos.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 30 }}>No tienes favoritos aún.</Text>
        ) : (
          favoritos.map((item, index) => {
            const species = item.species;
            const commonNames = species.commonNames?.join(', ') || 'Desconocido';
            const family = species.family?.scientificName || 'Desconocida';
            const genus = species.genus?.scientificName || 'Desconocido';

            let fechaObs = item.fechaFavorito;
            if (!fechaObs && item.fecha) fechaObs = item.fecha;
            if (!fechaObs && item.timestamp) fechaObs = item.timestamp;

            return (
              <View key={index} style={styles.card}>
                <Text style={styles.name}>{species.scientificName}</Text>
                <GBIFImageCarousel scientificName={species.scientificName} />
                <Text style={styles.common}>Nombre común: {commonNames}</Text>
                <Text style={styles.detail}>Familia: {family}</Text>
                <Text style={styles.detail}>Género: {genus}</Text>
                <Text style={styles.detail}>
                  Fecha de observación: {fechaObs ? formatDate(fechaObs) : 'Sin fecha'}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#1976d2',
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() => openMapModal(species.scientificName)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                      Mapa de distribución
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#d32f2f',
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                    }}
                    onPress={() => eliminarFavorito(species.scientificName)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
                  provider={PROVIDER_GOOGLE}
                  style={{ width: '100%', height: 350, borderRadius: 10 }}
                  initialRegion={initialRegion}
                  region={initialRegion}
                >
                  {mapPoints.length > 0 && (
                    <Heatmap
                      points={mapPoints.map(p => ({
                        latitude: p.latitude,
                        longitude: p.longitude,
                        weight: 1,
                      }))}
                      radius={40}
                      opacity={0.7}
                      gradient={{
                        colors: ['#ff0000', 'rgba(255,0,0,0.3)', 'rgba(255,0,0,0.05)'],
                        startPoints: [0.2, 0.5, 1],
                        colorMapSize: 256,
                      }}
                    />
                  )}
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
      </ScrollView>
    </ImageBackground>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: 'rgb(219, 225, 238)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  common: {
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  detail: {
    fontSize: 14,
    marginVertical: 2,
    fontWeight: 'bold',
  },
  carousel: {
    marginTop: 12,
  },
  image: {
    width: screenWidth * 0.6,
    height: 180,
    marginRight: 12,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
});