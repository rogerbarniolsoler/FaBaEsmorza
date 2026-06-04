import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { COLORS, MIDES } from '../constants/tema';

export default function FabaLocation({ esmorzar }) {
  // Lògica per solucionar el renderitzat de marcadors a Android
  const [trackChanges, setTrackChanges] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Donem 500ms a Android perquè dibuixi l'SVG i després congelem el marcador
      const timer = setTimeout(() => {
        setTrackChanges(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Funció per generar les estrelles ràpidament
  const renderEstrelles = (valoracio) => {
    return (
      <View style={styles.estrellesContainer}>
        {[...Array(5)].map((_, i) => (
          <MaterialIcons 
            key={i} 
            name={i < valoracio ? "star" : "star-border"} 
            size={16} 
            color={COLORS.taronja} 
          />
        ))}
      </View>
    );
  };

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(esmorzar.latitud),
        longitude: parseFloat(esmorzar.longitud),
      }}
      // Ara a Android utilitzarà l'estat que passa de true a false
      tracksViewChanges={Platform.OS === 'ios' ? true : trackChanges} 
    >
      {/* Icona del Marcador */}
      <View style={styles.markerIcon}>
        <Svg width="24" height="26" viewBox="0 0 116 123" fill="none">
          <G clipPath="url(#clip0_159_1059)">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.1085 83.6194C16.5005 82.5234 15.8946 81.4141 15.3661 80.273C9.59507 67.8122 7.43865 53.9511 9.2861 40.3437C11.1711 26.4594 17.7022 13.781 30.1766 6.78713C30.9238 6.36815 31.6948 5.97374 32.4502 5.60601C35.658 4.04454 39.1235 3.07649 42.6789 2.78192C46.0879 2.49948 49.5202 2.93601 52.7492 4.06485C68.2984 9.50063 70.6053 20.7354 73.1427 32.5431C74.4303 38.5351 75.6962 44.7567 78.9973 50.0368C82.5114 55.6576 87.2117 59.3242 91.765 62.937C92.8056 63.7626 93.8385 64.5976 95.2219 65.7329C99.0043 68.8372 102.181 72.6075 104.616 76.8521C107.492 81.8673 108.958 87.5791 108.731 93.3562C108.504 99.107 106.342 104.617 102.636 109.021C100.122 112.007 97.0483 114.46 93.6377 116.359C81.5306 123.099 67.2962 121.727 54.0273 115.928C38.3581 109.08 24.1005 96.0948 17.1202 83.6544C17.1132 83.6418 17.1155 83.632 17.1085 83.6194ZM57.9728 49.8055C54.9283 60.0062 64.1365 72.0607 73.0852 72.0365C79.7472 72.0185 77.197 70.6507 74.1778 68.6051C67.676 64.1999 63.1155 57.5096 61.1931 49.8949C60.2232 46.0533 60.0299 43.141 58.0196 49.8521C58.0122 49.8768 57.9802 49.7808 57.9728 49.8055ZM20.6016 77.7816C21.0929 78.8077 21.6387 79.8109 22.2154 80.8364C28.6541 92.2865 41.8199 104.313 56.3777 110.652C68.0615 115.739 80.5133 117.077 90.8083 111.345C93.6192 109.78 96.1569 107.762 98.233 105.304C101.129 101.876 102.829 97.5789 103.002 93.0947C103.183 88.3977 101.966 83.7579 99.6255 79.6816C97.5383 76.0464 94.8154 72.8188 91.5754 70.1592C90.7048 69.4445 89.4726 68.4591 88.2237 67.4681C83.3065 63.5663 78.2366 59.5975 74.1708 53.1228C70.3227 46.9947 68.9035 40.3282 67.5206 33.81C65.3599 23.625 63.3076 13.9242 50.8775 9.609C48.4098 8.75231 45.7906 8.40644 43.1876 8.62655C40.3488 8.8666 37.5832 9.64917 35.0234 10.8998C34.3482 11.2296 33.6902 11.5478 33.0762 11.8938C22.4041 17.9083 16.7483 28.999 15.0974 41.2C13.4092 53.6766 15.3915 66.3753 20.6716 77.8048C20.6837 77.831 20.5892 77.7556 20.6016 77.7816Z"
              fill="#FFFFFF"
            />
          </G>
          <Defs>
            <ClipPath id="clip0_159_1059">
              <Rect width="115.9" height="122.88" fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      </View>

      {/* Globus d'informació en clicar la fava */}
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <View style={styles.calloutBurbuja}>
            {/* Títol del local */}
            <Text style={styles.titol} numberOfLines={5}>{esmorzar.nom}</Text>
            
            {/* Estrelles */}
            {renderEstrelles(esmorzar.valoracio)}
            
            {/* Si hi ha foto, la mostrem */}
            {esmorzar.foto_url && (
              <Text style={styles.imatgeContainer}>
                 <Image 
                   source={{ uri: esmorzar.foto_url }} 
                   style={styles.imatge} 
                   resizeMode="cover"
                 />
              </Text>
            )}
          </View>
          {/* El triangle de sota del globus */}
          <View style={styles.calloutTriangle} />
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.taronja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutContainer: {
    alignItems: 'center',
    width: 160,
  },
  calloutBurbuja: {
    backgroundColor: COLORS.fons,
    borderRadius: 10,
    padding: 10,
    width: '100%',
    shadowColor: '#000',
    alignItems: 'center',
  },
  calloutTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderLeftWidth: 10,
    borderTopColor: COLORS.fons,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  titol: {
    fontSize: MIDES.mitjana,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  estrellesContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  imatgeContainer: {
    width: 140,
    height: 100,
    marginTop: 5,
  },
  imatge: {
    width: 140,
    height: 100,
    borderRadius: 5,
  },
});