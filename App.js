import OfflineBanner from './components/OfflineBanner';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import './i18n';

import LanguagePicker from './screens/LanguagePicker';
import ClerkLogin    from './screens/clerk/ClerkLogin';
import ClerkHome     from './screens/clerk/ClerkHome';
import WalkIn        from './screens/clerk/WalkIn';
import QRScanner     from './screens/clerk/QRScanner';
import FlaggedList   from './screens/clerk/FlaggedList';

const Stack = createNativeStackNavigator();

export default function App() {
  const [hasLanguage, setHasLanguage] = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('tms_language').then(lang => {
      setHasLanguage(lang !== null && lang !== '');
      setLoading(false);
    });
  }, []);

  const initialRoute = hasLanguage ? 'ClerkLogin' : 'Language';

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#111110' }}>
        <ActivityIndicator color="#3DB34A" size="large" />
      </View>
    );
  }

  return (
    <>
    <OfflineBanner />
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Language"    component={LanguagePicker} />
            <Stack.Screen name="ClerkLogin"  component={ClerkLogin} />
            <Stack.Screen name="ClerkHome"   component={ClerkHome} />
            <Stack.Screen name="WalkIn"      component={WalkIn} />
            <Stack.Screen name="QRScanner"   component={QRScanner} />
            <Stack.Screen name="FlaggedList" component={FlaggedList} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
