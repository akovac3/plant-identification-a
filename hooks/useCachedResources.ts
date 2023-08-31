import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';

export default function useCachedResources() {
  //vrijednost u kojoj se cuva status
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);

  //Ovaj hook se koristi kako bi se učitali potrebni resursi prije renderiranja aplikacije.
  React.useEffect(() => {
    //funkcija za učitavanje resursa i podataka
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Učitavanje fontova za ikone i space-mono font
        await Font.loadAsync({
          ...Ionicons.font,
          'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}
