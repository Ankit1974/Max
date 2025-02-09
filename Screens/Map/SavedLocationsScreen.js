import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';

const SavedLocationsScreen = ({ navigation }) => {
  const [savedLocations, setSavedLocations] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchLocations = async () => {
        try {
          const storedLocations = await AsyncStorage.getItem('savedLocations');
          if (storedLocations) {
            const parsedData = JSON.parse(storedLocations);
  
            // Log the raw stored data for debugging
            console.log('Raw Stored Locations:', parsedData);
  
            // Filter out invalid data
            const validLocations = parsedData.filter(item => {
              return (
                item &&
                item.name &&
                typeof item.name === 'string' &&
                item.country &&
                typeof item.country === 'string'
              );
            });
  
            console.log('Filtered Saved Locations:', validLocations); // Debugging
            setSavedLocations(validLocations);
          }
        } catch (error) {
          console.error('Error fetching saved locations:', error);
        }
      };
      fetchLocations();
    }, [])
  );

  const handleLocationClick = async (location) => {
    try {
      const routeDataKey = `routeData_${location.name}`;
      console.log('Fetching Route Data with Key:', routeDataKey);  // Debugging key
      const routeData = await AsyncStorage.getItem(routeDataKey);
      console.log('Route Data:', routeData);  // Check if null or valid data is returned
  
      if (routeData) {
        const parsedRouteData = JSON.parse(routeData);
        navigation.navigate('RouteDetailsScreen', { routeData: parsedRouteData });
      } else {
        Alert.alert('No route data available', 'No route data found for this location.');
      }
    } catch (error) {
      console.error('Error fetching route data:', error);
      Alert.alert('Error', 'An error occurred while retrieving the route data.');
    }
  };
  

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <FontAwesome name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Saved Locations</Text>
      {savedLocations.length === 0 ? (
        <Text style={styles.noDataText}>No saved locations found.</Text>
      ) : (
        <FlatList
          data={savedLocations}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity 
                style={styles.locationCard}
                onPress={() => handleLocationClick(item)} // Handle location click
              >
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{item.name}</Text>
                  <Text style={styles.locationDetails}>{item.country}</Text>
                </View>
                <TouchableOpacity style={styles.shareButton}>
                  <FontAwesome name="share-alt" size={24} color="#000" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
    marginTop: 20,
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  locationDetails: {
    fontSize: 14,
    color: '#555',
  },
  shareButton: {
    padding: 10,
  },
});

export default SavedLocationsScreen;
