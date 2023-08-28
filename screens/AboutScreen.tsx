import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { View } from '../components/Themed';
import { AppConfig } from '../config';
import { getColor } from '../components/Themed';

export default function AboutScreen() {
  const color = getColor('text');

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: color }]}>{AppConfig.title}</Text>
      <Text style={[styles.description, { color: color }]}>{AppConfig.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
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
