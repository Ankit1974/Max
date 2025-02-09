import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const RouteDetailsScreen = ({ route }) => {
  const { routeData } = route.params; // Get the passed route data

  if (!routeData) {
    return (
      <View style={styles.container}>
        <Text>No route data available.</Text>
      </View>
    );
  }

  // Extract name and coordinates from routeData
  const { name, coordinates } = routeData;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route Details: {name}</Text>

      <FlatList
        data={coordinates}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.coordinateItem}>
            <Text>Point {index + 1}:</Text>
            <Text>Latitude: {item[1]}</Text>
            <Text>Longitude: {item[0]}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  coordinateItem: {
    marginBottom: 15,
  },
});

export default RouteDetailsScreen;
