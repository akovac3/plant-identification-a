import * as tf from '@tensorflow/tfjs';
import * as FileSystem from 'expo-file-system'
import { fetch ,asyncStorageIO,bundleResourceIO,decodeJpeg} from '@tensorflow/tfjs-react-native'
import {Image} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import {AppConfig} from "../config"

export interface ModelPrediction {
  className:string;
  link:string;
  latin:string;
  probability:number;
}

export interface IModelPredictionTiming {
  totalTime:number;
}

export interface IModelPredictionResponse {
  predictions?:ModelPrediction[] | null
  timing?:IModelPredictionTiming | null
  error?:string | null
}

const imageToTensor = (rawImageData:Uint8Array)=> {
  return decodeJpeg(rawImageData);
}


const  fetchImage = async (image:ImageManipulator.ImageResult) => {
  let imgB64:string;
  if(image.base64){
    imgB64=image.base64
  }else{ 
    const imageAssetPath = Image.resolveAssetSource(image)
    console.log(imageAssetPath.uri);
  
    imgB64 = await FileSystem.readAsStringAsync(imageAssetPath.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
 
  const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
  const rawImageData = new Uint8Array(imgBuffer)  

  return rawImageData;
}
const preprocessImage = (img:tf.Tensor3D,imageSize:number) =>{
      // https://github.com/keras-team/keras-applications/blob/master/keras_applications/imagenet_utils.py#L43

      let imageTensor = img.resizeBilinear([imageSize, imageSize]).toFloat();

      const offset = tf.scalar(127.5);
      const normalized = imageTensor.sub(offset).div(offset);
      const preProcessedImage = normalized.reshape([1, imageSize, imageSize, 3]);
      return preProcessedImage;
      
}

const decodePredictions = (predictions:tf.Tensor, classes:String[],links:String[], latins:String[], topK=3) =>{
  const {values, indices} = predictions.topk(topK);
  const topKValues = values.dataSync();
  const topKIndices = indices.dataSync();

  const topClassesAndProbs:ModelPrediction[] = [];
  for (let i = 0; i < topKIndices.length; i++) {
    topClassesAndProbs.push({
      className: classes[topKIndices[i]],
      link:links[topKIndices[i]],
      latin:latins[topKIndices[i]],
      probability: topKValues[i]
    } as ModelPrediction);
  }
  return topClassesAndProbs;
}


export class ModelService {

    private model:tf.LayersModel;
    private model_classes: String[];
    private model_links: String[];
    private model_latins: String[];

    private model_plants: String[] = [];
    private imageSize:number;
    private static instance: ModelService;

    constructor(imageSize:number,model:tf.LayersModel, model_classes: String[],  model_links: String[], model_latins: String[]){
        this.imageSize=imageSize;
        this.model = model;
        this.model_classes=model_classes;
        this.model_links=model_links;
        this.model_latins=model_latins;
    }


    static async create(imageSize:number) {
      if (!ModelService.instance){
        await tf.ready(); 
        const modelJSON = require('../assets/model_tfjs/model.json');
        const modelWeights1 = require('../assets/model_tfjs/group1-shard1of3.bin');
        const modelWeights2 = require('../assets/model_tfjs/group1-shard2of3.bin');
        const modelWeights3 = require('../assets/model_tfjs/group1-shard3of3.bin');


        const model_classes = require("../assets/model_tfjs/classes.json")
        const model_plants = require("../assets/model_tfjs/labels.json")
        const model_links = require("../assets/model_tfjs/links.json")
        const model_latins = require("../assets/model_tfjs/latins.json")

        // Load the model from the models folder
    const model = await tf
      .loadLayersModel(bundleResourceIO(modelJSON, [modelWeights1, modelWeights2, modelWeights3]))
      .catch(e => console.log(e)) as tf.LayersModel;
    console.log("Model loaded!");

        
        ModelService.instance = new ModelService(imageSize,model,model_classes, model_links, model_latins);
      }

      return ModelService.instance;

    }

    async classifyImage(image:ImageManipulator.ImageResult):Promise<IModelPredictionResponse>{ 
      const predictionResponse = {timing:null,predictions:null,error:null} as IModelPredictionResponse;
      try {
          console.log(`Classifying Image: Start `)
          
          let imgBuffer:Uint8Array = await fetchImage(image); 
          const timeStart = new Date().getTime()
          console.log(`Backend: ${tf.getBackend()} `)
          tf.tidy(()=>{
            console.log(`Fetching Image: Start `)
          
            const imageTensor:tf.Tensor3D = imageToTensor(imgBuffer);
            
            
            console.log(`Fetching Image: Done `)      
            console.log("Preprocessing image: Start")
            
            const preProcessedImage = preprocessImage(imageTensor,this.imageSize);
      
            console.log("Preprocessing image: Done")
      
            console.log("Prediction: Start")
            const predictionsTensor:tf.Tensor = this.model.predict(preProcessedImage) as tf.Tensor;
            
            console.log("Prediction: Done")
      
            console.log("Post Processing: Start")

        
      
            // post processing
            predictionResponse.predictions  = decodePredictions(predictionsTensor,this.model_classes,this.model_links, this.model_latins, AppConfig.topK);
           // console.log(predictionsTensor.dataSync())
            
            //tf.dispose(imageTensor);
            //tf.dispose(preProcessedImage);
            //tf.dispose(predictions);

            console.log("Post Processing: Done")

            const timeEnd = new Date().getTime()
            
            const timing:IModelPredictionTiming = {
              totalTime: timeEnd-timeStart
            } as IModelPredictionTiming;
            predictionResponse.timing = timing;

          });
          
          
          console.log(`Classifying Image: End `);

          console.log(`Response:  ${JSON.stringify(predictionResponse ,null, 2 ) } `);
          return predictionResponse as IModelPredictionResponse
          
      } catch (error) {
          console.log('Exception Error: ', error)
           return {error} as IModelPredictionResponse;
      }
    }
}

