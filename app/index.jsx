import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { COLORS } from '../constants/tema';

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <View style={styles.content}>
        <MapView 
          style={styles.map} 
          initialRegion={{
            latitude: 41.3851,       // Latitud de Barcelona
            longitude: 2.1734,       // Longitud de Barcelona
            latitudeDelta: 0.0922,   // Zoom vertical
            longitudeDelta: 0.0421,  // Zoom horitzontal
          }}
          showsUserLocation={true}   // Més endavant, quan tinguem permisos de GPS, això mostrarà el punt blau
          showsMyLocationButton={true}
        />
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
    flex: 1, // Ocupa tot l'espai restant a sota del Header
  },
  map: {
    width: '100%',
    height: '100%',
  },
});