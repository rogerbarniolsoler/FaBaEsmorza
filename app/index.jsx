import { MaterialIcons } from '@expo/vector-icons'; // Corregit a @expo/vector-icons
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import FabaLocation from '../components/FabaLocation';
import Header from '../components/Header';
import { COLORS } from '../constants/tema';
import { supabase } from '../lib/supabase';

export default function IndexScreen() {
  const mapRef = useRef(null);
  const [localitzacioActual, setLocalitzacioActual] = useState(null);
  const [esmorzars, setEsmorzars] = useState([]); // Estat per guardar les dades

  const router = useRouter();

  // Coordenades de seguretat en cas que deneguin el permís. Coordenades de Barcelona
  const regioPerDefecte = {
    latitude: 41.3851,
    longitude: 2.1734,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Descarreguem les dades quan la pantalla rep el focus
  useFocusEffect(
    useCallback(() => {
      const carregarEsmorzars = async () => {
        const { data, error } = await supabase.from('esmorzars').select('*');
        if (error) {
          console.error("Error carregant esmorzars:", error.message);
        } else {
          setEsmorzars(data || []);
        }
      };
      
      carregarEsmorzars();
    }, [])
  );

  useEffect(() => {
    (async () => {
      // Demanar el permís de geolocalització a l'usuari
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      // Gestió d'errors: Què passa si diu que no?
      if (status !== 'granted') {
        Alert.alert(
          'Permís denegat',
          'Com que no tenim accés al GPS, et mostrarem el mapa manual. Podràs afegir els teus esmorzars igualment!'
        );
        return; // Parem l'execució aquí
      }

      // Si diu que sí, obtenim les coordenades
      let localitzacio = await Location.getCurrentPositionAsync({});
      setLocalitzacioActual(localitzacio.coords);
      
      // Centrem el mapa de forma animada cap a la teva ubicació real
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: localitzacio.coords.latitude,
          longitude: localitzacio.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 1000);
      }
    })();
  }, []);

  // Funció del botó blau per tornar a centrar-nos
  const recentrarMapa = () => {
    if (!localitzacioActual) {
      Alert.alert('Sense senyal', 'No tenim la teva ubicació actual per centrar el mapa.');
      return;
    }
    
    mapRef.current?.animateToRegion({
      latitude: localitzacioActual.latitude,
      longitude: localitzacioActual.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <View style={styles.content}>
        <MapView 
          ref={mapRef}
          style={styles.map} 
          initialRegion={regioPerDefecte}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Pintem totes les faves descarregades sobre el mapa */}
          {esmorzars.map((esmorzar) => (
            <FabaLocation key={esmorzar.id} esmorzar={esmorzar} />
          ))}
        </MapView>

        {/* Botó de recentrar flotant */}
        <TouchableOpacity style={styles.btnLocalitzacio} onPress={recentrarMapa}>
          <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Botó per afegir esmorzar */}
        <TouchableOpacity style={styles.btnNouEsmorzar} onPress={() => router.push('/nouEsmorzar')}>
          <MaterialIcons name="add" size={36} color={COLORS.fons} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.fons,
  },
  content: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  btnLocalitzacio: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',

  },
  btnNouEsmorzar: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: COLORS.taronja,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  }
});