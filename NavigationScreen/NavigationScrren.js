import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SetupScreen from '../Screens/ProjectSetup/SetupScreen';
import CollectScreen from '../Screens/DataCollection/CollectScreen';
import ProjectDetails from '../Screens/DataCollection/ProjectDetails';
import SetupDetail from '../Screens/ProjectSetup/SetupDetail';
import CollectDataScreen from '../Screens/DataCollection/CollectData';
import UploadedData from '../Screens/UploadedDataCollection/UploadedDataScreen';
import VialPictureUplaoded from '../Screens/UploadedDataCollection/VialPictureUplaoded';
import HabitatPictureUploaded from '../Screens/UploadedDataCollection/HabitatPictureUploaded';
import VialPicture from '../Screens/VialPhoto/VialPicture';
import HabitatPicture from '../Screens/HabitatPhoto/HabitatPicture';
import MapScreen from '../Screens/Map/MapsScreen';
import HomeScreen from '../Screens/Home/HomeScreen';
import LoginScreen from '../Screens/User/LoginScreen';
import SignUpScreen from '../Screens/User/SignUpScreen';
import ProfileScreen from '../Screens/ProfileScreens/ProfileScreens';
import UploadSetupScreen from '../Screens/ProjectSetup/UploadSetupScreen';
import MangerView from '../Screens/UploadedDataCollection/MangerView';
import SavedLocationsScreen from '../Screens/Map/SavedLocationsScreen';
import RouteDetailsScreen from '../Screens/Map/RouteDetailsScreen';
import MangerVialPictureUplaoded from '../Screens/UploadedDataCollection/MangerVialPictureUplaoded';
import ManagerHabitatPictureUploaded from '../Screens/UploadedDataCollection/ManagerHabitatPictureUploaded';
//import RouteDetailsScreen from '../Screens/Map/RouteDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create a stack navigator for each tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="VialPicture" component={VialPicture} />
    <Stack.Screen name="HabitatPicture" component={HabitatPicture} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
  </Stack.Navigator>
);

const SetupStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SetupMain" component={SetupScreen} />
    <Stack.Screen name="SetupDetail" component={SetupDetail} />
    <Stack.Screen name="SetupScreen" component={SetupScreen} options={{ headerShown: false }}/>
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
    <Stack.Screen name="SetupScreen2" component={SetupScreen} options={{ headerShown: false }}/>
    <Stack.Screen name="UploadSetupScreen" component={UploadSetupScreen} options={{ headerShown: false }}/>
    <Stack.Screen name="MangerView" component={MangerView} options={{ headerShown: false }}/>
    <Stack.Screen name="Home2" component={HomeScreen} options={{ headerShown: false }}/>
    <Stack.Screen name="Project" component={CollectScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MangerVialPictureUplaoded" component={MangerVialPictureUplaoded} options={{ headerShown: false }} />
    <Stack.Screen name="ManagerHabitatPictureUploaded " component={ManagerHabitatPictureUploaded} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const CollectStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CollectMain" component={CollectScreen} />
    <Stack.Screen name="ProjectDetails" component={ProjectDetails} />
    <Stack.Screen name="CollectDataScreen" component={CollectDataScreen} />
    <Stack.Screen name="UploadedNoteScreen" component={UploadedData} options={{ headerShown: false }} />
    <Stack.Screen name="VialPictureUploaded" component={VialPictureUplaoded} options={{ headerShown: false }} />
    <Stack.Screen name="HabitaPictureUploaded" component={HabitatPictureUploaded} options={{ headerShown: false }} />
    <Stack.Screen name="Project" component={CollectScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CollectScreen" component={CollectDataScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CollectScreen2" component={CollectScreen} options={{ headerShown: false }} />
    <Stack.Screen name="VialPicture" component={VialPicture} options={{ headerShown: false }}/>
    <Stack.Screen name="HabitatPicture" component={HabitatPicture} options={{ headerShown: false }}/>
    <Stack.Screen name="Home2" component={HomeScreen} options={{ headerShown: false }}/>
  </Stack.Navigator>
);

const Map = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MapScreen" component={MapScreen} />
    <Stack.Screen name="SavedLocationsScreen" component={SavedLocationsScreen} />
    <Stack.Screen name="RouteDetailsScreen" component={RouteDetailsScreen} />
    
  </Stack.Navigator>
);

// Define the bottom tab navigator
const MainTabs = () => (
  <Tab.Navigator
    initialRouteName="HomeStack"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        height: 70,
        paddingBottom: 10,
        backgroundColor: '#ACCAC8',
      },
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'HomeStack') {
          return <Entypo name="home" size={size + 10} color={color} />;
        } else if (route.name === 'SetupStack') {
          return <MaterialCommunityIcons name="plus-box-multiple" size={size + 10} color={color} />;
        } else if (route.name === 'CollectStack') {
          return <MaterialCommunityIcons name="clipboard-text" size={size + 10} color={color} />;
        } else if (route.name === 'Map') {
          return <Entypo name="location-pin" size={size + 10} color={color} />;
        }
      },
      tabBarActiveTintColor: '#48938F',
      tabBarInactiveTintColor: 'black',
    })}
  >
    <Tab.Screen
      name="HomeStack"
      component={HomeStack}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen
      name="SetupStack"
      component={SetupStack}
      options={{ tabBarLabel: 'Setup' }}
    />
    <Tab.Screen
      name="CollectStack"
      component={CollectStack}
      options={{ tabBarLabel: 'Collect' }}
    />
    <Tab.Screen
      name="Map"
      component={Map}
      options={{ tabBarLabel: 'Map' }}
    />
  </Tab.Navigator>
);

// Main Navigation
export default function NavigationScreen() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        

      </Stack.Navigator>
    </NavigationContainer>
  );
}
