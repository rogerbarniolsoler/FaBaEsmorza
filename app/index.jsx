import { MaterialIcons } from '@expo/vector-icons'; // Corregit a @expo/vector-icons
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, Vibration, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import FabaLocation from '../components/FabaLocation';
import Header from '../components/Header';
import { COLORS } from '../constants/tema';
import { supabase } from '../lib/supabase';

export default function IndexScreen() {
  const mapRef = useRef(null);
  const [localitzacioActual, setLocalitzacioActual] = useState(null);
  const [esmorzars, setEsmorzars] = useState([]); // Estat per guardar les dades dels llocs on hem anat

  // Control celebració
  const [mostrarConfeti, setMostrarConfeti] = useState(false);
  const totalEsmorzarsRef = useRef(null); // Guardarà quants en teníem abans de rebre el focus

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
          const llistaDades = data || [];
          
          // Si no és la primera vegada que obrim l'app i la llista és més llarga, celebrem!
          if (totalEsmorzarsRef.current !== null && llistaDades.length > totalEsmorzarsRef.current) {
            
            // Triple vibració curteta (bbb-bbb-bbb)
            // Temps: 0ms pausa -> 80ms vibració -> 100ms pausa -> 80ms vibració -> 100ms pausa -> 80ms vibració
            Vibration.vibrate([0, 80, 100, 80, 100, 80]);

            // Disparem el canó de confeti
            setMostrarConfeti(true);
          }

          // Actualitzem sempre la referència amb el total actual
          totalEsmorzarsRef.current = llistaDades.length;
          setEsmorzars(llistaDades);
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
  const recentrarMapa = async () => {
    // Intentem demanar permís
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    // Si està bloquejat, oferim la drecera als Ajustos
    if (status !== 'granted') {
      Alert.alert(
        'Permís necessari', 
        'Has denegat l\'accés al GPS anteriorment. Per poder centrar el mapa, has d\'activar-ho des dels ajustos del telèfon.',
        [
          { text: 'Cancel·lar', style: 'cancel' },
          { 
            text: 'Obrir Ajustos', 
            onPress: () => Linking.openSettings() // Settings natius
          }
        ]
      );
      return;
    }

    // 3. Si tenim permís centrem el mapa
    try {
      let localitzacio = await Location.getCurrentPositionAsync({});
      const novesCoordenades = localitzacio.coords;
      
      setLocalitzacioActual(novesCoordenades); 
      
      mapRef.current?.animateToRegion({
        latitude: novesCoordenades.latitude,
        longitude: novesCoordenades.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'No s\'ha pogut connectar amb el GPS del telèfon.');
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
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
        
        {/* Confeti */}
        {mostrarConfeti && (
          <ConfettiCannon 
            count={180}           // Quantitat de trossets de paper
            origin={{ x: 180, y: -30 }} // Surt centrat des de dalt de la pantalla
            autoStart={true}
            fadeOut={true}        // Desapareixen gradualment en tocar el fons
            fallSpeed={2800}      // Velocitat de la caiguda en mil·lisegons
            onAnimationEnd={() => setMostrarConfeti(false)} // Es neteja sol en acabar
          />
        )}
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