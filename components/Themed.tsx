import * as React from 'react';
import { View as DefaultView, ScrollView as DefaultScrollView, ActivityIndicator as DefaultActivityIndicator } from 'react-native';
import { Text as DefaultText, ListItem as DefaultListItem } from 'react-native-elements';

import Colors from '../constants/Colors';

export type ThemeProps = {};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  const color = Colors.text;

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = Colors.backgroundColor;

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function ScrollView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = Colors.backgroundColor;

  return <DefaultScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function getColor(property: keyof typeof Colors) {
  return Colors[property];
}

export function ActivityIndicator(props: ViewProps) {
  const { style, ...otherProps } = props;
  const textColor = Colors.text;

  return <DefaultActivityIndicator size="large" color={textColor} />;
}

export function ListItem(props: any) {
  const { style, ...otherProps } = props;
  const backgroundColor = Colors.backgroundColor;
  const color = Colors.text;

  return <DefaultListItem containerStyle={[{ backgroundColor, color }, style]} style={[{ backgroundColor, color }, style]} {...otherProps} />;
}
