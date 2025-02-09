import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  FlatList
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Share from 'react-native-share';
import Geolocation from '@react-native-community/geolocation';
import FontAwesome from 'react-native-vector-icons/FontAwesome';


MapboxGL.setAccessToken('pk.eyJ1IjoiYW5raXQ4MzYiLCJhIjoiY202dnV2dTJ2MGcwazJpczg5M3FyYmhwOCJ9.OToOdFg7n-0XKb6tA8BWdw');

const MapScreen = ({ navigation }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [offlineRegion, setOfflineRegion] = useState(null);
  const [route, setRoute] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);


  useEffect(() => {
    requestLocationPermission();
    loadSavedLocations();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
    }
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        Alert.alert('Error', 'Unable to fetch current location.');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  };

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
  
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=pk.eyJ1IjoiYW5raXQ4MzYiLCJhIjoiY202dnV2dTJ2MGcwazJpczg5M3FyYmhwOCJ9.OToOdFg7n-0XKb6tA8BWdw`
      );
      const data = await response.json();
  
      if (data.features) {
        setSuggestions(data.features.map((place) => place.place_name));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  
  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    searchLocationOnline(); // Call the function to fetch location details
  };

  

  const downloadOfflineRegion = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available.');
      return;
    }

    const bounds = [
      [currentLocation.longitude - 0.1, currentLocation.latitude - 0.1],
      [currentLocation.longitude + 0.1, currentLocation.latitude + 0.1],
    ];

    try {
      const packs = await MapboxGL.offlineManager.getPacks();
      if (packs.some((pack) => pack.name === 'offline_map')) {
        Alert.alert('Offline Map', 'Region already downloaded.');
        return;
      }

      const region = await MapboxGL.offlineManager.createPack({
        name: 'offline_map',
        styleURL: MapboxGL.StyleURL.Street,
        bounds,
        minZoom: 10,
        maxZoom: 16,
        metadata: { name: 'Offline Map' },
      });

      setOfflineRegion(region);
      Alert.alert('Offline Map', 'Map downloaded for offline use.');
    } catch (error) {
      Alert.alert('Error', 'Failed to download offline map.');
    }
  };

  const loadSavedLocations = async () => {
    try {
      const data = await AsyncStorage.getItem('savedLocations');
      if (data) {
        setSavedLocations(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading saved locations:', error);
    }
  };

  const searchLocationOnline = async () => {
    if (!searchQuery) return;
  
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=pk.eyJ1IjoiYW5raXQ4MzYiLCJhIjoiY202dnV2dTJ2MGcwazJpczg5M3FyYmhwOCJ9.OToOdFg7n-0XKb6tA8BWdw`
      );
      const data = await response.json();
  
      if (data.features.length > 0) {
        const { center, place_name, context } = data.features[0];
        const city = context?.find((c) => c.id.includes("place"))?.text || "Unknown City";
        const country = context?.find((c) => c.id.includes("country"))?.text || "Unknown Country";
  
        setSelectedLocation({ latitude: center[1], longitude: center[0], name: place_name, city, country });
        setSearchQuery(place_name);
      } else {
        Alert.alert("No results", "Try a different search term.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to fetch location. Check your internet.");
    }
  };
  

  const fetchOfflineDirections = async () => {
    if (!currentLocation || !selectedLocation) return;

    try {
      const storedRoute = await AsyncStorage.getItem('offlineRoute');
      if (storedRoute) {
        setRoute(JSON.parse(storedRoute));
        return;
      }

      const routeData = {
        geometry: {
          type: 'LineString',
          coordinates: [
            [currentLocation.longitude, currentLocation.latitude],
            [selectedLocation.longitude, selectedLocation.latitude],
          ],
        },
      };

      setRoute(routeData);
      await AsyncStorage.setItem('offlineRoute', JSON.stringify(routeData));
    } catch (error) {
      Alert.alert('Error', 'Could not fetch offline directions.');
    }
  };

  const fetchOnlineDirections = async () => {
    if (!currentLocation || !selectedLocation) {
      Alert.alert('Error', 'Please ensure both current and selected locations are available.');
      return;
    }
  
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${currentLocation.longitude},${currentLocation.latitude};${selectedLocation.longitude},${selectedLocation.latitude}?geometries=geojson&access_token=pk.eyJ1IjoiYW5raXQ4MzYiLCJhIjoiY202dnV2dTJ2MGcwazJpczg5M3FyYmhwOCJ9.OToOdFg7n-0XKb6tA8BWdw`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.routes.length > 0) {
        setRoute({
          type: 'Feature',
          geometry: data.routes[0].geometry,
        });
      } else {
        Alert.alert('Error', 'No route found. Try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch route. Check your internet connection.');
    }
  };
  
  const handleSave = async () => {
    if (!selectedLocation || !route) {
      Alert.alert("Error", "No location or route selected.");
      return;
    }
  
    const { name, country, latitude, longitude } = selectedLocation; // Exclude city here
    const { coordinates } = route.geometry;
  
    try {
      // Save the location data without the city
      const newLocation = { name, country, latitude, longitude };
      const existingLocations = await AsyncStorage.getItem("savedLocations");
      const locations = existingLocations ? JSON.parse(existingLocations) : [];
      locations.push(newLocation);
      await AsyncStorage.setItem("savedLocations", JSON.stringify(locations));
  
      // Save the route data using a dynamic key (routeData_<locationName>)
      const routeDataKey = `routeData_${name}`;
      const newRoute = { name, coordinates };
      await AsyncStorage.setItem(routeDataKey, JSON.stringify(newRoute));
  
      console.log("Location and route saved successfully:", newLocation, newRoute);
    } catch (error) {
      console.error("Error saving location and route:", error);
    }
  };
  
  
  
  

  const handleShare = async () => {
    if (!selectedLocation) {
      Alert.alert('No location selected', 'Please select a location first.');
      return;
    }

    const shareMessage = `📍 Location: ${searchQuery}\n🌍 Coordinates: ${selectedLocation.latitude}, ${selectedLocation.longitude}`;
    try {
      await Share.open({ message: shareMessage });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={
            currentLocation ? [currentLocation.longitude, currentLocation.latitude] : [0, 0]
          }
        />
        {currentLocation && (
          <MapboxGL.PointAnnotation
            id="currentLocation"
            coordinate={[currentLocation.longitude, currentLocation.latitude]}
          />
        )}
        {selectedLocation && (
          <MapboxGL.PointAnnotation
            id="selectedLocation"
            coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
          />
        )}
        {route && (
          <MapboxGL.ShapeSource id="routeSource" shape={route.geometry}>
            <MapboxGL.LineLayer id="routeLayer" style={styles.route} />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      <View style={styles.searchContainer}>
      <TextInput
  style={styles.searchInput}
  placeholder="Enter location name"
  value={searchQuery}
  onChangeText={(text) => {
    setSearchQuery(text);
    fetchSuggestions(text);
  }}
  
/>
        <TouchableOpacity style={styles.iconButton} onPress={searchLocationOnline}>
          <FontAwesome name="search" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
        
      )}
      {selectedLocation && (
        <View style={styles.locationCard}>
          <Text style={styles.locationName}>{searchQuery}</Text>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={fetchOnlineDirections}>
              <FontAwesome name="location-arrow" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
            onPress={() => {
              if (selectedLocation) {
                const { latitude, longitude } = selectedLocation;
                handleSave(searchQuery, "City Name", "Country Name", [longitude, latitude]);
              } else {
                Alert.alert("Error", "No location selected.");
              }
            }}
            >
              <FontAwesome name="bookmark" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <FontAwesome name="share-alt" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      )}
        {searchQuery === '' && (
  <TouchableOpacity style={styles.floatingSaveButton} onPress={() => navigation.navigate('SavedLocationsScreen')} >
    <FontAwesome name="save" size={30} color="white" />
  </TouchableOpacity>
)}

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    borderColor: '#48938F',
    borderWidth: 1,
    borderRadius: 5,
    fontSize: 16,
    color: 'black',
  },
  iconButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#48938F',
    borderRadius: 5,
  },
  locationCard: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    alignItems: 'center',
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  locationDetails: {
    fontSize: 14,
    color: '#666',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  route: {
    lineColor: '#48938F',
    lineWidth: 3,
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    top : 500,
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 5,
  },
  
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    padding: 5,
    maxHeight: 150,
    zIndex: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  floatingSaveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#48938F',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },

  
});

export default MapScreen;
