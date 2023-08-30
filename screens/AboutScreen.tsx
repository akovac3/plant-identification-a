import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { View } from '../components/Themed';
import { AppConfig } from '../config';
import { getColor } from '../components/Themed';
import { ScrollView } from 'react-native';

export default function AboutScreen() {
  const color = getColor('text');
  const modelClasses = require("../assets/model_tfjs/classes.json")


  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.text, { color: color }]}>{AppConfig.title}</Text>
      <Text style={[styles.description, { color: color }]}>{AppConfig.description}</Text>
      <View style={styles.container}>
        <View style={{}}>
        <Text style={[styles.text, { color: color }]}>Classes</Text>
        </View>

       <View>
          {modelClasses.map((p: string) => {
            return (
              <View key={p} >
                <Text>{p}</Text>
              </View>
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
  },
  description: {
    fontSize: 16,
    marginTop: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
