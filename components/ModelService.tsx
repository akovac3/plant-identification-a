import * as tf from '@tensorflow/tfjs';
import * as FileSystem from 'expo-file-system'
import { fetch, bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native'
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { AppConfig } from "../config"

export interface PredikcijaModela {
  nazivKlase: string;
  link: string;
  latinskiNaziv: string;
  vjerovatnoca: number;
}

export interface VrijemePredikcije {
  ukupnoVrijeme: number;
}

export interface odgovorModela {
  predikcije?: PredikcijaModela[] | null
  vrijeme?: VrijemePredikcije | null
  greska?: string | null
}

const slikaUTenzor = (slikaRaw: Uint8Array) => {
  return decodeJpeg(slikaRaw);
}

const ucitajSliku = async (slika: ImageManipulator.ImageResult) => {
  let imgB64: string;
  if (slika.base64) {
    imgB64 = slika.base64
  } else {
    const putanjaSlike = Image.resolveAssetSource(slika)
    console.log(putanjaSlike.uri);

    imgB64 = await FileSystem.readAsStringAsync(putanjaSlike.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
  const slikaRaw = new Uint8Array(imgBuffer)

  return slikaRaw;
}

  const pripremiSliku = (slika: tf.Tensor3D, velicinaSlike: number) => {
  let tensorSlike = slika.resizeBilinear([velicinaSlike, velicinaSlike]).toFloat();

  const offset = tf.scalar(127.5);
  const normalizirano = tensorSlike.sub(offset).div(offset);
  const novaSlika = normalizirano.reshape([1, velicinaSlike, velicinaSlike, 3]);
  return novaSlika;

}

const dekodirajPredikcije = (predikcije: tf.Tensor, klase: String[], linkovi: String[], latinskiNazivi: String[], topK = 3) => {
  const { values, indices } = predikcije.topk(topK);
  const vrhVrijednosti = values.dataSync();
  const topKIndices = indices.dataSync();

  const topClassesAndProbs: PredikcijaModela[] = [];
  for (let i = 0; i < topKIndices.length; i++) {
    topClassesAndProbs.push({
      nazivKlase: klase[topKIndices[i]],
      link: linkovi[topKIndices[i]],
      latinskiNaziv: latinskiNazivi[topKIndices[i]],
      vjerovatnoca: vrhVrijednosti[i]
    } as PredikcijaModela);
  }
  return topClassesAndProbs;
}


export class ModelService {

    private model: tf.LayersModel;
    private modelKlase: String[];
    private modelLinkovi: String[];
    private modelLatinskiNazivi: String[];

    private velicinaSlike: number;
    private static instanca: ModelService;

    constructor(velicinaSlike: number, model: tf.LayersModel, modelKlase: String[], modelLinkovi: String[], modelLatinskiNazivi: String[]){
        this.velicinaSlike = velicinaSlike;
        this.model = model;
        this.modelKlase = modelKlase;
        this.modelLinkovi = modelLinkovi;
        this.modelLatinskiNazivi = modelLatinskiNazivi;
    }


    static async create(velicinaSlike: number) {
      if (!ModelService.instanca){
        await tf.ready(); 
        const modelJSON = require('../assets/model_tfjs/model.json');
        const modelWeights1 = require('../assets/model_tfjs/group1-shard1of3.bin');
        const modelWeights2 = require('../assets/model_tfjs/group1-shard2of3.bin');
        const modelWeights3 = require('../assets/model_tfjs/group1-shard3of3.bin');


        const modelKlase = require("../assets/model_tfjs/classes.json")
        const modelLinkovi = require("../assets/model_tfjs/links.json")
        const modelLatinskiNazivi = require("../assets/model_tfjs/latins.json")

        // Učitavanje modela iz model_tfjs foldera
        const model = await tf
          .loadLayersModel(bundleResourceIO(modelJSON, [modelWeights1, modelWeights2, modelWeights3]))
          .catch(e => console.log(e)) as tf.LayersModel;
        console.log("Model učitan!");

        ModelService.instanca = new ModelService(velicinaSlike, model, modelKlase, modelLinkovi, modelLatinskiNazivi);
      }

      return ModelService.instanca;

    }

    async klasificirajSliku(slika: ImageManipulator.ImageResult): Promise<odgovorModela>{ 
      const odgovor = { vrijeme: null, predikcije: null, greska: null } as odgovorModela;
      try {
          console.log(`Klasificiranje slike: Početak `)
          
          let slikaRaw: Uint8Array = await ucitajSliku(slika); 
          const vrijemePocetka = new Date().getTime()
          console.log(`Backend: ${tf.getBackend()} `)
          tf.tidy(()=>{
            //ucitavanje slike
            const tensorSlike:tf.Tensor3D = slikaUTenzor(slikaRaw);
            //priprema slike
            const novaSlika = pripremiSliku(tensorSlike, this.velicinaSlike);
            //Izvođenje predviđanja
            const tensorPredikcije:tf.Tensor = this.model.predict(novaSlika) as tf.Tensor;      
            // post-procesiranje
            odgovor.predikcije  = dekodirajPredikcije(tensorPredikcije, this.modelKlase, this.modelLinkovi, this.modelLatinskiNazivi, AppConfig.topK);
            // postavljanje vremena potrebnog za cijeli proces 
            const vrijemeZavrsetka = new Date().getTime()
            
            const vrijeme:VrijemePredikcije = {
              ukupnoVrijeme: vrijemeZavrsetka - vrijemePocetka
            } as VrijemePredikcije;
            odgovor.vrijeme = vrijeme;

          });
          
          
          console.log(`Klasificiranje slike: Završetak `);

          console.log(`Odgovor:  ${JSON.stringify(odgovor, null, 2) } `);
          return odgovor as odgovorModela
          
      } catch (greska) {
          console.log('Greška pri izvođenju: ', greska)
           return { greska } as odgovorModela;
      }
    }
}
