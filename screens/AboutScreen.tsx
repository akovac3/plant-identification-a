import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { View } from '../components/Theme';
import { AppConfig } from '../config';
import { getColor } from '../components/Theme';
import { ScrollView } from 'react-native';

export default function AboutScreen() {
  const color = getColor('text');
  const modelClasses = require("../assets/model_tfjs/classes.json")


  return (
    <ScrollView style={styles.container}>
      <View style={styles.predictionsContainer}>
       <View style={styles.predictionsContentContainer}>
      <Text style={[styles.text, { color: color }]}>{AppConfig.naslov}</Text>
      <Text style={[styles.dobrodosli, { color: color }]}>Dobrodošli!</Text>
      <Text style={[styles.description, { color: color }]}>{AppConfig.opis1}</Text>
      <Text style={[styles.description, { color: color }]}>{AppConfig.opis2}</Text>

        <Text style={[styles.text, { color: color }]}>Dostupne biljke</Text>
          {modelClasses.map((p: string) => {
            return (
                <Text style={{textAlign: 'center'}} key={p}>{p}</Text>
            );
          })}
       </View>
       </View>
    </ScrollView>

    
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 5,
    flex: 1,
    padding:10
},
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign:'center'
  },

  dobrodosli: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign:'left'
  },

  description: {
    fontSize: 16,
    marginTop: 1,
    paddingLeft:10,
    paddingHorizontal: 10,
  },
  
  predictionsContainer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predictionsContentContainer: {
    flex: 1,
    width:320,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Transparent background
    borderRadius: 10,
    marginBottom:20,
    marginTop:10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5, // Android shadow
  },
});
