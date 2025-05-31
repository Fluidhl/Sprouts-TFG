// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultScreen from './src/screens/ResultScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import FavoritosScreen from './src/screens/FavoritosScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: 'rgb(215, 237, 244)',
            },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="Registro" component={RegisterScreen} options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="Inicio" component={HomeScreen} options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="Identificacion" component={CameraScreen} />
          <Stack.Screen name="Resultados de identificación" component={ResultScreen} />
          <Stack.Screen name="Amigos" component={FriendsScreen} />
          <Stack.Screen name="Favoritos" component={FavoritosScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}