import * as React from 'react';
import * as tf from '@tensorflow/tfjs';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Image, Linking, StyleSheet } from 'react-native';
import { AppConfig } from "../config";
import { Text, View, ActivityIndicator, ScrollView } from '../components/Theme';
import { Icon, ListItem } from 'react-native-elements';
import * as ImagePicker from 'expo-image-picker';
import { ModelService, odgovorModela, VrijemePredikcije, PredikcijaModela } from '../components/ModelService';
import { TouchableOpacity } from 'react-native';

type Stanje = {
  slika: ImageManipulator.ImageResult;
  ucitavanje: boolean;
  tfUcitano: boolean;
  modelUcitan: boolean;
  predikcije: PredikcijaModela[] | null;
  greska: string | null;
  vrijeme: VrijemePredikcije | null;
};

export default class PočetnaStranica extends React.Component<{}, Stanje> {
  static navigationOptions = {
    header: null,
  };

  state: Stanje = {
    slika: {
      uri: 'https://cdn-icons-png.flaticon.com/512/6959/6959474.png',
      width: 0,
      height: 0
    },
    ucitavanje: false,
    tfUcitano: false,
    modelUcitan: false,
    predikcije: null,
    greska: null,
    vrijeme: null
  }

  ModelService!: ModelService;

  async componentDidMount() {
    this.setState({ ucitavanje: true });
    this.ModelService = await ModelService.create(AppConfig.velicinaSlike);
    this.setState({ tfUcitano: true, modelUcitan: true, ucitavanje: false });
  }

  render() {
    const statusUcitavanjaModela = this.state.modelUcitan ? "✅" : "❓";
    return (
      <ScrollView style={styles.kontejner}>
        <View style={styles.content}>
          <View>
            <View>
              <Text style={[styles.naslov, { color: '#3b3b3b' }]}>{AppConfig.naslov}</Text>
            </View>
            <View>
              <Text>Status modela: {statusUcitavanjaModela}</Text>
            </View>
          </View>

          <View style={styles.akcijeKontejner}>
            <View style={styles.callToActionContainer}>
              <Icon size={40} name='camera-alt' raised onPress={this._uslikajKamerom} />
              <Icon size={40} name='image' raised onPress={this._uzmiSlikuIzGalerije} />
            </View>
          </View>

          <View style={styles.slikaKontejner}>
            <Image source={this.state.slika} style={{ height: 250, width: 250 }} />
          </View>

          {this.renderujPredikcije()}
        </View>
      </ScrollView>
    );
  }

  renderujPredikcije() {
    if (this.state.ucitavanje) {
      return <ActivityIndicator />
    }
    const predikcije = this.state.predikcije || [];
   
    if (predikcije.length > 0) {
      return (
        <View style={styles.predikcijecontent}>
          <Text h3> Rezultat </Text>
          {predikcije.map((item, index) => (
            <ListItem key={index} style={styles.predikcijeListaKontejner}>
              <ListItem.Content style={{ padding: 5 }}>
                <ListItem.Title style={{ fontSize: 25, fontWeight: "bold", color: "#60a66c" }}>{item.nazivKlase}</ListItem.Title>
                <ListItem.Title style={{ fontSize: 20, color: "#60a66c" }}>{item.latinskiNaziv}</ListItem.Title>
                <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
                  <Text style={{ marginTop: 10, marginBottom: 10, color: 'black', textDecorationLine: "underline", fontSize: 15 }}>
                    {`${item.link}`}
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12 }}>{`Vjerovatnoća: ${(item.vjerovatnoca * 100).toFixed(AppConfig.preciznost)}%`}</Text>
              </ListItem.Content>
            </ListItem>
          ))}
          <Text style={{ textAlign: 'right' }}>Vrijeme: {this.state.vrijeme?.ukupnoVrijeme} ms</Text>
        </View>
      );
    } else {
      return null;
    }
  }

  _provjeriDozvole = async () => {
    console.log("Provjeravanje dozvola");
    const permisijeKamere = await Camera.getCameraPermissionsAsync();
    const permisijeBiblioteke = await MediaLibrary.getPermissionsAsync();

    if (!permisijeKamere.granted) {
      const permisijeKamere = await Camera.requestCameraPermissionsAsync();
    }

    if (!permisijeBiblioteke.granted) {
      const permisijeBiblioteke = await MediaLibrary.requestPermissionsAsync();
    }

    if (permisijeKamere.granted && permisijeBiblioteke.granted) {
      console.log("Dozvole su omogućene");
      return true;
    } else {
      alert('Niste omogućili odabrane dozvole!');
      return false;
    }
  };

  _uzmiSlikuIzGalerije = async () => {
    const status = await this._provjeriDozvole();

    try {
      let odgovor = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3]
      });

      if (!odgovor.canceled) {
        this._klasificirajSliku(odgovor.assets[0].uri);
      }
    } catch (error) {
      console.log(error);
    }
  };

  _uslikajKamerom = async () => {
    const status = await this._provjeriDozvole();

    try {
      let odgovor = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3]
      });

      if (!odgovor.canceled) {
        this._klasificirajSliku(odgovor.assets[0].uri);
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  _klasificirajSliku = async (uriSlike: string) => {
    try {
      const odgovorManipulatora: ImageManipulator.ImageResult = await ImageManipulator.manipulateAsync(
        uriSlike,
        [{ resize: { width: AppConfig.velicinaSlike, height: AppConfig.velicinaSlike } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      this.setState({ slika: odgovorManipulatora })
      console.log('BrojTensora (prije predikcije): ' + tf.memory().numTensors);
      this.setState({ predikcije: [], greska: null, ucitavanje: true })

      const odgovorModela: odgovorModela = await this.ModelService.klasificirajSliku(odgovorManipulatora);
      
      if (odgovorModela.greska) {
        this.setState({ greska: odgovorModela.greska, ucitavanje: false })
      } else {
        const predikcije = odgovorModela.predikcije || null;
        this.setState({ predikcije: predikcije, vrijeme: odgovorModela.vrijeme as VrijemePredikcije, ucitavanje: false })
      }
      
      console.log('BrojTensora (nakon predikcije): ' + tf.memory().numTensors);
    } catch (error) {
      console.log('Greška prilikom izvršavanja: ', error)
    }
  }

}

const styles = StyleSheet.create({
  kontejner: {
    paddingTop: 5,
    flex: 1
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  naslov: {
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    textAlign:'center'
  },
  akcijeKontejner: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
    padding: 30
  },
  slikaKontejner: {
    alignItems: 'center',
    padding: 10
  },
  callToActionContainer: {
    flexDirection: "row"
  },
  feedBackActionsContainer: {
    flexDirection: "row"
  },
  predikcijecontent: {
    flex: 1,
    width: 320,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  predikcijeListaKontejner: {
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
  }
});
