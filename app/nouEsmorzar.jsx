import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { COLORS, MIDES } from '../constants/tema';
import { supabase } from '../lib/supabase';

export default function NouEsmorzarScreen() {
  const router = useRouter();

  // Estats del formulari
  const [nom, setNom] = useState('');
  const [adreca, setAdreca] = useState('');
  const [comentari, setComentari] = useState('');
  const [valoracio, setValoracio] = useState(0);
  const [dataVisita, setDataVisita] = useState(new Date()); // Avui per defecte
  const [mostrantDatePicker, setMostrantDatePicker] = useState(false);
  const [foto, setFoto] = useState(null);
  
  // Estats interns de control
  const [latitud, setLatitud] = useState(null);
  const [longitud, setLongitud] = useState(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [guardant, setGuardant] = useState(false);

  // Estats per a suggeriments de llocs amb Nominatim
  const debounceTimer = useRef(null);
  const [suggeriments, setSuggeriments] = useState([]);
  const [mostrantSuggeriments, setMostrantSuggeriments] = useState(false);

  // Obtenir la ubicació per GPS (Geocodificació Inversa optimitzada amb Nominatim)
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

      // Hem de passar un USER-AGENT pq no ens dongui error el JSON que rebem
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
        headers: {
          'User-Agent': 'ProjecteUniversitatFaba/1.0',
          'Accept-Language': 'ca,es' // Demanem els noms en català/castellà
        }
      });
      
      // Protecció contra respostes HTML/Errors del servidor
      if (!response.ok) throw new Error("Resposta invàlida de Nominatim");
      
      const data = await response.json();
      
      if (data && data.address) {
        const { road, house_number, city, town, village } = data.address;
        const poblacio = city || town || village || '';
        const carrerAmbNumero = `${road || ''} ${house_number || ''}`.trim();
        
        // Emplenem l'adreça amb el carrer i número reals que el GPS d'Expo es deixava
        setAdreca([carrerAmbNumero, poblacio].filter(Boolean).join(', '));
      }
    } catch (error) {
      Alert.alert('Error', 'No hem pogut obtenir la ubicació exacta del GPS.');
    }
    setLoadingGPS(false);
  };

  // Cercador Nominatim vinculat al NOM del local
  const buscarLocalsNominatim = (text) => {
    setNom(text);

    // Si l'usuari esborra o modifica el nom, netegem l'adreça i coordenades per coherència
    setAdreca('');
    setLatitud(null);
    setLongitud(null);

    if (text.length < 3) {
      setSuggeriments([]);
      setMostrantSuggeriments(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Hem de passar un USER-AGENT pq no ens dongui error el JSON que rebem
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&countrycodes=es`, {
          headers: {
            'User-Agent': 'ProjecteUniversitatFaba/1.0',
            'Accept-Language': 'ca,es'
          }
        });
        
        // Si Nominatim retorna HTML o error (per exemple, límit de peticions), no intentem fer parse del JSON
        if (!response.ok) {
          console.warn("Avís Nominatim: Petició bloquejada o servidor caigut");
          return;
        }

        const data = await response.json();
        setSuggeriments(data || []);
        setMostrantSuggeriments(true);
      } catch (error) {
        console.error("Error Nominatim:", error);
      }
    }, 600);
  };

  // Selecció del suggeriment (Emplena automàticament Nom i Adreça)
  const seleccionarSuggeriment = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    
    const { road, house_number, city, town, village } = item.address || {};
    const poblacio = city || town || village || '';
    const carrerAmbNumero = `${road || ''} ${house_number || ''}`.trim();
    
    // El nom del local serà la propietat principal de la cerca (ex: "Can Recasens")
    const nomLocal = item.name || carrerAmbNumero || item.display_name.split(',')[0];
    
    // L'adreça contindrà el carrer, número i ciutat de fons
    const textAdreca = [carrerAmbNumero, poblacio].filter(Boolean).join(', ');

    setNom(nomLocal);
    setAdreca(textAdreca.length > 0 ? textAdreca : item.display_name.split(',').slice(1, 3).join(', '));
    setLatitud(lat);
    setLongitud(lon);
    
    setSuggeriments([]);
    setMostrantSuggeriments(false);
    Keyboard.dismiss();
  };

  // Imatge
  const triarOrigenFoto = () => {
    Alert.alert('Foto del plat', "D'on vols pujar la imatge?", [
      { text: 'Fer una foto ara', onPress: ferFotoCamera },
      { text: 'Triar de la galeria', onPress: triarFotoGaleria },
      { text: 'Cancel·lar', style: 'cancel' }
    ]);
  };

  const configuracioImatge = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  };

  const ferFotoCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permís denegat', 'Necessitem accés a la càmera per fer fotos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(configuracioImatge);
    if (!result.canceled) setFoto(result.assets[0]);
  };

  const triarFotoGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permís denegat', 'Necessitem accés a la galeria per triar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(configuracioImatge);
    if (!result.canceled) setFoto(result.assets[0]);
  };

  // Guardar a Supabase
  const guardarEsmorzar = async () => {
    if (!nom.trim()) {
      Alert.alert('Falten dades', 'Has de posar un nom al local.');
      return;
    }
    if (!adreca.trim() && !latitud) {
      Alert.alert('Falten dades', 'Has de posar una adreça o fer servir el GPS.');
      return;
    }

    // Preparació imatge
    setGuardant(true);
    let latFinal = latitud;
    let lonFinal = longitud;

    if (!latFinal || !lonFinal) {
      try {
        const resultatsGeocode = await Location.geocodeAsync(adreca);
        if (resultatsGeocode.length > 0) {
          latFinal = resultatsGeocode[0].latitude;
          lonFinal = resultatsGeocode[0].longitude;
        } else {
          Alert.alert('Adreça no trobada', "Revisa-la.");
          setGuardant(false);
          return;
        }
      } catch (error) {
        Alert.alert('Error', "Problema buscant l'adreça.");
        setGuardant(false);
        return;
      }
    }

    let fotoUrlFinal = null;
    
    if (foto) {
      // Creem un nom d'arxiu únic basat en la data i hora actual
      const pathImatge = `plats/${Date.now()}.jpg`; 
      
      // Pugem l'arxiu a Supabase Storage descodificant el Base64
      const { error: uploadError } = await supabase.storage
        .from('imatges')
        .upload(pathImatge, decode(foto.base64), { contentType: 'image/jpeg' });

      if (uploadError) {
        Alert.alert('Error pujant la foto', uploadError.message);
        setGuardant(false);
        return; // Parem si la foto falla
      }

      // Si s'ha pujat bé, demanem l'URL pública
      const { data: publicUrlData } = supabase.storage
        .from('imatges')
        .getPublicUrl(pathImatge);
        
      fotoUrlFinal = publicUrlData.publicUrl;
    }

    // INSERCIÓ A LA BASE DE DADES
    const { error } = await supabase.from('esmorzars').insert([
      {
        nom: nom.trim(),
        adreca: adreca.trim(),
        latitud: latFinal,
        longitud: lonFinal,
        comentari: comentari.trim(),
        valoracio: valoracio,
        data_visita: dataVisita.toISOString().split('T')[0],
        foto_url: fotoUrlFinal
      }
    ]);

    setGuardant(false);

    if (error) {
      Alert.alert('Error guardant dades', error.message);
    } else {
      router.back();
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={() => {
        setMostrantSuggeriments(false);
        Keyboard.dismiss();
      }}>
        <View style={{ flex: 1 }}>
          
          {/* Nom del Local amb Autocompletat Integrat */}
          <View style={[styles.inputGroup, { zIndex: 20 }]}>
            <Text style={styles.label}>Nom del local *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Bar La Plata"
              value={nom}
              onChangeText={buscarLocalsNominatim}
            />

            {/* Desplegable d'adreces penjat del Nom del Local */}
            {mostrantSuggeriments && suggeriments.length > 0 && (
              <View style={styles.desplegable}>
                {suggeriments.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.itemSuggeriment}
                    onPress={() => seleccionarSuggeriment(item)}
                  >
                    <Text style={styles.textSuggerimentTitol} numberOfLines={2}>
                      {item.name || `${item.address?.road || ''} ${item.address?.house_number || ''}`.trim()}
                    </Text>
                    <Text style={styles.textSuggerimentDetall} numberOfLines={2}>
                      {item.display_name} 
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Adreça (Emplenada sola, però editable */}
          <View style={[styles.inputGroup, { zIndex: 10 }]}> 
            <Text style={styles.label}>Adreça *</Text>
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                placeholder="S'emplenarà sola o escriu-la aquí"
                value={adreca}
                onChangeText={(text) => {
                  setAdreca(text);
                  setLatitud(null); // Si l'edita manualment, invalidem coordenades velles
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

          {/* Data esmorzar */}
          <View style={[styles.inputGroup, { zIndex: 5 }]}>
            <Text style={styles.label}>Data de la visita</Text>
            
            {/* Tractament diferenciat per OS per una UI perfecta */}
            {Platform.OS === 'ios' ? (
              <View style={{ alignItems: 'flex-start' }}>
                <DateTimePicker
                  value={dataVisita}
                  mode="date"
                  display="default"
                  maximumDate={new Date()} // Bloqueja el futur, permet el passat
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setDataVisita(selectedDate);
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.input, { justifyContent: 'center' }]} 
                  onPress={() => setMostrantDatePicker(true)}
                >
                  <Text style={{ fontSize: MIDES.mitjana, color: COLORS.text }}>
                    {dataVisita.toLocaleDateString('ca-ES')}
                  </Text>
                </TouchableOpacity>

                {mostrantDatePicker && (
                  <DateTimePicker
                    value={dataVisita}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setMostrantDatePicker(false);
                      if (selectedDate) setDataVisita(selectedDate);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Valoració */}
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

          {/* Comentari */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comentari</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Què t'ha semblat la FàBa-da?"
              multiline
              numberOfLines={4}
              value={comentari}
              onChangeText={setComentari}
            />
          </View>

          {/* Imatge */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Foto del plat</Text>
            <TouchableOpacity 
              style={[styles.fotoPlaceholder, foto && { borderWidth: 0, backgroundColor: 'transparent' }]} 
              onPress={triarOrigenFoto}
            >
              {foto ? (
                <Image 
                  source={{ uri: foto.uri }} 
                  style={{ width: '100%', height: '100%', borderRadius: 10 }} 
                  resizeMode="cover"
                />
              ) : (
                <>
                  <MaterialIcons name="add-a-photo" size={40} color={COLORS.grisClar} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Botó Guardar */}
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
        </View>
      </TouchableWithoutFeedback>
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
    textAlignVertical: 'top',
  },

  desplegable: {
    position: 'absolute',
    top: 75,
    left: 0,
    right: 60,
    backgroundColor: COLORS.fons,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.grisClar,
  },
  itemSuggeriment: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grisClar,
  },
  textSuggerimentTitol: {
    fontSize: MIDES.mitjana,
    fontWeight: '600',
    color: COLORS.text,
  },
  textSuggerimentDetall: {
    fontSize: MIDES.petita,
    color: COLORS.grisFosc,
    marginTop: 2,
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