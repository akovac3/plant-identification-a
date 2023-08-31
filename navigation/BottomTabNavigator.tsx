import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import Colors from '../constants/Colors';
import HomeScreen from '../screens/HomeScreen';
import AboutScreen from '../screens/AboutScreen';
import { BottomTabParams, HomeParams, AboutParams } from '../types';

const Tab = createBottomTabNavigator<BottomTabParams>();

export default function BottomTabNavigator() {

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBarOptions={{ activeTintColor: Colors.tint }}>
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Početna', 
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={30}
              style={{ marginBottom: -3 }}
              color={color}
              name={Platform.OS === 'ios' ? 'ios-home' : 'md-home'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="About"
        component={TabAboutNavigator}
        options={{
          tabBarLabel: 'O aplikaciji',
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={30}
              style={{ marginBottom: -3 }}
              color={color}
              name={Platform.OS === 'ios' ? 'ios-information' : 'md-information'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

//Svaki tab ima svoj vlastiti navigacijski stek
const HomeStack = createStackNavigator<HomeParams>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerTitle: 'Početna' }}
      />
    </HomeStack.Navigator>
  );
}

const AboutStack = createStackNavigator<AboutParams>();

function TabAboutNavigator() {
  return (
    <AboutStack.Navigator>
      <AboutStack.Screen
        name="AboutScreen"
        component={AboutScreen}
        options={{ headerTitle: 'O aplikaciji' }}
      />
    </AboutStack.Navigator>
  );
}
