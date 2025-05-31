import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Dimensions, TouchableOpacity, Alert, Modal, ImageBackground } from 'react-native';
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

function getConfianzaLabel(score) {
  const numScore = parseFloat(score);
  if (numScore > 45) {
    return { label: 'CONFIANZA ALTA', color: '#2c5f2d' };
  } else if (numScore > 20) {
    return { label: 'CONFIANZA MEDIA', color: '#ff9800' };
  } else {
    return { label: 'CONFIANZA BAJA', color: '#d32f2f' };
  }
}

export default function ResultScreen({ route, navigation }) {
  const { results } = route.params;
  const suggestions = results?.results || [];

  // Estado para el modal de mapa
  const [showMap, setShowMap] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapTitle, setMapTitle] = useState('');

  // Guardar favorito en AsyncStorage con fecha de observación
  const handleAddFavorite = async (item) => {
    try {
      const favs = await AsyncStorage.getItem('favoritos');
      let favoritos = favs ? JSON.parse(favs) : [];
      if (!favoritos.some(f => f.species.scientificName === item.species.scientificName)) {
        favoritos.push({
          ...item,
          fechaFavorito: new Date().toISOString(),
        });
        await AsyncStorage.setItem('favoritos', JSON.stringify(favoritos));
        Alert.alert('¡Guardado!', 'Añadido a favoritos.');
      } else {
        Alert.alert('Ya está en favoritos');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el favorito');
    }
  };

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

  const screenWidth = Dimensions.get('window').width;

  return (
    <ImageBackground
      source={require('../../assets/bgHS1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        {suggestions.length === 0 ? (
          <Text>No se encontraron coincidencias.</Text>
        ) : (
          suggestions.slice(0, 4).map((item, index) => {
            const isTopMatch = index === 0;
            const species = item.species;
            const score = (item.score * 100).toFixed(1);
            const { label: confianzaLabel, color: confianzaColor } = getConfianzaLabel(score);

            const commonNames = species.commonNames?.join(', ') || 'Desconocido';
            const family = species.family?.scientificName || 'Desconocida';
            const genus = species.genus?.scientificName || 'Desconocido';

            return (
              <View key={index} style={styles.card}>
                {isTopMatch && (
                  <View style={styles.topMatchContainer}>
                    <Text style={styles.topMatch}>🔍 Coincidencia más probable</Text>
                  </View>
                )}

                <Text style={styles.name}>{species.scientificName}</Text>
                <GBIFImageCarousel scientificName={species.scientificName} />
                <Text style={styles.common}>Nombre común: {commonNames}</Text>
                <Text style={styles.detail}>Familia: {family}</Text>
                <Text style={styles.detail}>Género: {genus}</Text>
                <Text style={[styles.score, { color: confianzaColor }]}>
                  {confianzaLabel} ({score}%)
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#ffb300',
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() => handleAddFavorite(item)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                      Favorito
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#1976d2',
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                    }}
                    onPress={() => openMapModal(species.scientificName)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                      Mapa de distribución
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Modal para el mapa de distribución */}
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
    marginVertical: 1,
  },
  score: {
    marginTop: 6,
    fontSize: 14,
    color: '#2c5f2d',
    fontWeight: '600',
  },
  carousel: {
    marginTop: 12,
  },
  image: {
    width: Dimensions.get('window').width * 0.6,
    height: 180,
    marginRight: 12,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  topMatch: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  topMatchContainer: {
    backgroundColor: '#d0f0c0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});