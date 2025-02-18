// import React from 'react';
// import { View, Text, FlatList, StyleSheet } from 'react-native';

// const RouteDetailsScreen = ({ route }) => {
//   const { routeData } = route.params; // Get the passed route data

//   if (!routeData) {
//     return (
//       <View style={styles.container}>
//         <Text>No route data available.</Text>
//       </View>
//     );
//   }

//   // Extract name and coordinates from routeData
//   const { name, coordinates } = routeData;

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Route Details: {name}</Text>

//       <FlatList
//         data={coordinates}
//         keyExtractor={(item, index) => index.toString()}
//         renderItem={({ item, index }) => (
//           <View style={styles.coordinateItem}>
//             <Text>Point {index + 1}:</Text>
//             <Text>Latitude: {item[1]}</Text>
//             <Text>Longitude: {item[0]}</Text>
//           </View>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   coordinateItem: {
//     marginBottom: 15,
//   },
// });

// export default RouteDetailsScreen;


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

// Set your Mapbox access token
MapboxGL.setAccessToken('pk.eyJ1IjoiYW5raXQ4MzYiLCJhIjoiY202dnV2dTJ2MGcwazJpczg5M3FyYmhwOCJ9.OToOdFg7n-0XKb6tA8BWdw');

const RouteDetailsScreen = ({ route }) => {
  const { routeData } = route.params; // Get the passed route data

  if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No route data available.</Text>
      </View>
    );
  }

  // Format coordinates for Mapbox
  const formattedCoordinates = routeData.coordinates.map(coord => [coord[0], coord[1]]);

  // Set initial camera view
  const initialCamera = {
    centerCoordinate: formattedCoordinates[0],
    zoomLevel: 14, // Adjust for closer/farther view
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route Details: {routeData.name}</Text>

      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Offline}>
        <MapboxGL.Camera
          centerCoordinate={initialCamera.centerCoordinate}
          zoomLevel={initialCamera.zoomLevel}
        />

        {/* Show Start & End Markers */}
        <MapboxGL.PointAnnotation id="start" coordinate={formattedCoordinates[0]}>
          <View style={styles.marker}>
            <Text style={styles.markerText}>Start</Text>
          </View>
        </MapboxGL.PointAnnotation>
        <MapboxGL.PointAnnotation id="end" coordinate={formattedCoordinates[formattedCoordinates.length - 1]}>
          <View style={styles.marker}>
            <Text style={styles.markerText}>End</Text>
          </View>
        </MapboxGL.PointAnnotation>

        {/* Draw Route */}
        <MapboxGL.ShapeSource id="routeSource" shape={{ type: 'Feature', geometry: { type: 'LineString', coordinates: formattedCoordinates } }}>
          <MapboxGL.LineLayer id="routeLayer" style={{ lineColor: 'blue', lineWidth: 3 }} />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  map: {
    flex: 1,
    borderRadius: 10,
    marginTop: 10,
  },
  marker: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  markerText: {
    fontWeight: 'bold',
    color: 'black',
  },
});

export default RouteDetailsScreen;
