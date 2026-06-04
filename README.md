# FàBa 🍽️🫘

**FàBa** és una app dissenyada exclusivament per immortalitzar, geolocalitzar i catalogar els grans temples de la gastronomia tradicional on el **sr. Fàbrega** i el **sr. Barniol** es reuneixen per fer el sagrat ritual de l'**esmorzar de forquilla**. 

L'aplicació permet portar un diari visual i interactiu de cada tiberi, assegurant que cap plat de cap i pota, callos o botifarra quedi en l'oblit.

---

## 🚀 Què fa l'app? (Funcionalitats Clau)

* **El Mapa de Faves:** La pantalla principal és un mapa interactiu que mostra l'historial de visites. Cada esmorzar guardat es converteix en una icona personalitzada en forma de **fava**. En clicar-la, s'obre un globus informatiu amb el nom del local, la valoració en estrelles i la foto real del plat.
* **Geolocalització Dinàmica:** L'app demana permís de GPS per centrar la càmera automàticament sobre la posició actual de l'usuari. Si el permís es denega inicialment, el botó blau de la interfície inclou una drecera intel·ligent que obre els ajustos natius del telèfon per reactivar-lo fàcilment.
* **Cercador de Locals Intel·ligent:** Al formulari de registre, l'usuari només ha de començar a escriure el nom del bar (ex: *Bodega Montferry*). L'app connecta en temps real amb un motor de cerca (Nominatim d'OpenStreetMap) per oferir un desplegable de suggeriments. Al triar-ne un, **s'autoemplena l'adreça exacta amb el número de carrer real** i s'assignen les coordenades de fons de manera invisible.
* **Fotografia Nativa Cuadrada:** Captura el record del plat directament fent servir la càmera del dispositiu o seleccionant una imatge des de la galeria de fotos. La interfície força un format quadrat (proporció 1:1) i una compressió òptima per pujar-la al núvol a l'acte.
* **Festa de Registre 🎉:** Perquè guardar un bon tiberi mereix una celebració, en desar el formulari i tornar al mapa, l'aplicació reacciona amb una **triple vibració curta hàptica** i una **pluja de confeti digital** que cau des de la part superior de la pantalla.

---

## 🛠️ Detalls Tècnics de l'Arquitectura

Tot i que l'experiència és fluida i senzilla per a l'usuari, per sota s'han utilitzat les següents tecnologies:

* **Framework:** `React Native` amb `Expo Router` per a una navegació nativa basada en fitxers (flux de pantalles i modals d'iOS/Android).
* **Base de Dades i Storage:** Connexió directa amb `Supabase` per emmagatzemar la taula relacional d'esmorzars i un *Bucket de Storage* públic on es guarden les imatges optimitzades.
* **Motor de Mapes:** `react-native-maps` amb marcadors asíncrons congelats per garantir un rendiment fluid fins i tot amb centenars de faves pintades a la pantalla.
* **Cercador de Direccions i GPS:** Integració gratuïta i oberta amb l'API de **Nominatim (OpenStreetMap)** utilitzant capçaleres personalitzades d'identificació (`User-Agent`) per esquivar bloquejos tant en iOS com en Android.

---

## 🔒 Configuració del Projecte (.env)

Per motius evidents de seguretat, les claus privades de connexió al servidor de Supabase (`EXPO_PUBLIC_SUPABASE_URL` i `EXPO_PUBLIC_SUPABASE_ANON_KEY`) no es troben pujades en aquest repositori públic. 

El fitxer de configuració **`.env`** es troba a l'entrega d'Atenea. S'ha de descarregar i col·locar a l'arrel del projecte abans d'executar el servidor de desenvolupament (`npx expo start`), amb el pas previ d'intal·lar les dependències amb (`npx install`).