import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';

const { width , height } = Dimensions.get('window');

const SavedLocationsScreen = ({ navigation }) => {
  const [savedLocations, setSavedLocations] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchLocations = async () => {
        try {
          const storedLocations = await AsyncStorage.getItem('savedLocations');
          if (storedLocations) {
            const parsedData = JSON.parse(storedLocations);

            const validLocations = parsedData.filter(item => (
              item &&
              item.name && typeof item.name === 'string' &&
              item.country && typeof item.country === 'string'
            ));
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
      const routeData = await AsyncStorage.getItem(routeDataKey);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Locations</Text>
      </View>
      
      {savedLocations.length === 0 ? (
        <Text style={styles.noDataText}>No saved locations found.</Text>
      ) : (
        <FlatList
          data={savedLocations}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.locationCard}
              onPress={() => handleLocationClick(item)}
            >
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationDetails}>{item.country}</Text>
              </View>
              <TouchableOpacity style={styles.shareButton}>
                <FontAwesome name="share-alt" size={24} color="#000" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: width * 0.05, // Adjust padding based on screen width
    paddingTop: height * 0.03,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.01,
    marginBottom: height * 0.05,
  },
  title: {
    fontSize: width * 0.06, // Responsive font size
    fontWeight: 'bold',
    color: '#000',
    marginLeft: width * 0.2, // Adjust spacing dynamically
  },
  noDataText: {
    textAlign: 'center',
    fontSize: width * 0.04,
    color: '#777',
    marginTop: height * 0.02,
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#48938F',
    borderRadius: 10,
    padding: width * 0.05, // Responsive padding
    marginBottom: height * 0.01,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: width * 0.045, // Adjust font size based on width
    fontWeight: 'bold',
    color: '#000',
  },
  locationDetails: {
    fontSize: width * 0.035,
    color: '#555',
  },
  shareButton: {
    padding: width * 0.02,
  },
});

export default SavedLocationsScreen;
