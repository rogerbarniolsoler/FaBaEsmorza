import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, MIDES } from '../constants/tema';
import { supabase } from '../lib/supabase';

export default function NouEsmorzarScreen() {
  const router = useRouter();

  // Estats del formulari
  const [nom, setNom] = useState('');
  const [adreca, setAdreca] = useState('');
  const [comentari, setComentari] = useState('');
  const [valoracio, setValoracio] = useState(4); // Per defecte 3 estrelles
  
  // Estats interns de control
  const [latitud, setLatitud] = useState(null);
  const [longitud, setLongitud] = useState(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [guardant, setGuardant] = useState(false);

  // 1. Obtenir la ubicació per GPS (Geocodificació Inversa)
  const obtenirUbicacioActual = async () => {
    setLoadingGPS(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permís denegat', 'No podem accedir a la teva ubicació.');
        setLoadingGPS(false);
        return;
      }

      let localitzacio = await Location.getCurrentPositionAsync({});
      const lat = localitzacio.coords.latitude;
      const lon = localitzacio.coords.longitude;
      
      setLatitud(lat);
      setLongitud(lon);

      // Geocodificació inversa: Coordenades -> Adreça text
      let adreces = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (adreces.length > 0) {
        const carrer = adreces[0].street || adreces[0].name;
        const ciutat = adreces[0].city || adreces[0].subregion;
        // Muntem un string maco, ex: "Carrer de Pelai, Barcelona"
        setAdreca(`${carrer ? carrer + ', ' : ''}${ciutat || ''}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No hem pogut obtenir la ubicació.');
    }
    setLoadingGPS(false);
  };

  // 2. Guardar a Supabase
  const guardarEsmorzar = async () => {
    if (!nom.trim()) {
      Alert.alert('Falten dades', 'Has de posar un nom al local.');
      return;
    }
    if (!adreca.trim() && !latitud) {
      Alert.alert('Falten dades', 'Has de posar una adreça o fer servir el GPS.');
      return;
    }

    setGuardant(true);
    let latFinal = latitud;
    let lonFinal = longitud;

    // Si l'usuari ha escrit l'adreça a mà i no tenim coordenades, fem Geocodificació Directa (Text -> Coordenades)
    if (!latFinal || !lonFinal) {
      try {
        const resultatsGeocode = await Location.geocodeAsync(adreca);
        if (resultatsGeocode.length > 0) {
          latFinal = resultatsGeocode[0].latitude;
          lonFinal = resultatsGeocode[0].longitude;
        } else {
          Alert.alert('Adreça no trobada', 'No hem pogut trobar coordenades per aquesta adreça. Revisa-la.');
          setGuardant(false);
          return;
        }
      } catch (error) {
        Alert.alert('Error', 'Hi ha hagut un problema buscant l\'adreça.');
        setGuardant(false);
        return;
      }
    }

    // Inserir a la base de dades
    const { error } = await supabase.from('esmorzars').insert([
      {
        nom: nom.trim(),
        adreca: adreca.trim(),
        latitud: latFinal,
        longitud: lonFinal,
        comentari: comentari.trim(),
        valoracio: valoracio,
        foto_url: null // De moment buit
      }
    ]);

    setGuardant(false);

    if (error) {
      Alert.alert('Error guardant', error.message);
    } else {
      router.back(); // Tornem al mapa un cop guardat!
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* 1. Nom del Local */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom del local *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: Bar La Plata"
          value={nom}
          onChangeText={setNom}
        />
      </View>

      {/* 2. Adreça i GPS */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Adreça *</Text>
        <View style={styles.row}>
          <TextInput 
            style={[styles.input, { flex: 1, marginBottom: 0 }]} 
            placeholder="Escriu o fes servir el GPS"
            value={adreca}
            onChangeText={(text) => {
              setAdreca(text);
              // Si l'usuari modifica el text manualment, esborrem les coordenades velles
              setLatitud(null); 
              setLongitud(null);
            }}
          />
          <TouchableOpacity style={styles.btnGPS} onPress={obtenirUbicacioActual}>
            {loadingGPS ? (
              <ActivityIndicator color={COLORS.fons} />
            ) : (
              <MaterialIcons name="my-location" size={24} color={COLORS.fons} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Valoració (Estrelles) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Valoració</Text>
        <View style={styles.estrellesContainer}>
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity key={num} onPress={() => setValoracio(num)}>
              <MaterialIcons 
                name={num <= valoracio ? "star" : "star-border"} 
                size={40} 
                color={COLORS.taronja} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 4. Comentari */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Comentari</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Què t'ha semblat la fava?"
          multiline
          numberOfLines={4}
          value={comentari}
          onChangeText={setComentari}
        />
      </View>

      {/* 5. Placeholder Càmera */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Foto del plat</Text>
        <TouchableOpacity style={styles.fotoPlaceholder}>
          <MaterialIcons name="add-a-photo" size={40} color={COLORS.grisFosc} />
          <Text style={styles.textFoto}>Afegir foto (Proximament)</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Botó Guardar */}
      <TouchableOpacity 
        style={styles.btnGuardar} 
        onPress={guardarEsmorzar}
        disabled={guardant}
      >
        {guardant ? (
          <ActivityIndicator color={COLORS.fons} />
        ) : (
          <Text style={styles.textBtnGuardar}>Guardar Esmorzar</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fons,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: MIDES.mitjana,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grisClar,
    borderRadius: 10,
    padding: 12,
    fontSize: MIDES.mitjana,
    color: COLORS.text,
    backgroundColor: '#FAFAFA',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnGPS: {
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  estrellesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top', // Necessari a Android perquè el text comenci a dalt
  },
  fotoPlaceholder: {
    borderWidth: 2,
    borderColor: COLORS.grisClar,
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  textFoto: {
    marginTop: 10,
    color: COLORS.grisFosc,
    fontSize: MIDES.mitjana,
  },
  btnGuardar: {
    backgroundColor: COLORS.taronja,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  textBtnGuardar: {
    color: COLORS.fons,
    fontSize: MIDES.gran,
    fontWeight: 'bold',
  }
});