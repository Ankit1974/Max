import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const {width, height} = Dimensions.get('window');

const VialPicture = ({route}) => {
  const {projectId, serial, note: initialNote} = route.params; // Receive projectId, serial, and note
  const [note, setNote] = useState(initialNote || null); // State to store the note if not passed initially
  const [images, setImages] = useState([]); // To store all images
  const [showImage, setShowImage] = useState(false); // State to toggle visibility
  const [selectedImage, setSelectedImage] = useState(null); // Track selected image for full view
  const navigation = useNavigation();

  useEffect(() => {
    const fetchImageData = async () => {
      try {
        const projectData = await AsyncStorage.getItem(projectId);
        if (projectData) {
          const parsedData = JSON.parse(projectData);
          const fetchedNote = parsedData.find(n => n.Serial === serial); // Find the specific note by serial
          if (fetchedNote) {
            setNote(fetchedNote); // Set note if not already available
            setImages(fetchedNote.images); // Set all images from the note
          } else {
            console.error('Note not found for serial:', serial);
          }
        }
      } catch (error) {
        console.error('Error fetching image data:', error);
      }
    };

    if (!initialNote) {
      fetchImageData();
    }
  }, [projectId, serial, initialNote]);

  const handleImagePress = image => {
    setSelectedImage(image);
    setShowImage(true);
  };

  const handleBackPress = () => {
    setShowImage(false);
    setSelectedImage(null);
  };

  const handleDeleteImage = async (imageUri) => {
  try {
    console.log('Deleting image with URI:', imageUri);

    // Remove selected image from the 'images' array
    const updatedImages = images.filter(image => image.uri !== imageUri);
    console.log('Updated images array after deletion:', updatedImages);

    // Update the images state
    setImages(updatedImages);

    // If note is already set, update the note object as well
    if (note) {
      setNote(prevNote => ({
        ...prevNote,
        images: updatedImages,  // Update the images in the note
      }));
    }

    // Fetch the project data from AsyncStorage
    const projectData = await AsyncStorage.getItem(projectId);
    if (projectData) {
      const parsedData = JSON.parse(projectData);

      // Find the note in the project data
      const noteIndex = parsedData.findIndex(n => n.Serial === serial);

      if (noteIndex > -1) {
        // Update the images in the note
        parsedData[noteIndex].images = updatedImages;
        console.log('Updated project data after image deletion:', parsedData);

        // Save the updated project data to AsyncStorage
        await AsyncStorage.setItem(projectId, JSON.stringify(parsedData));
        console.log('Successfully saved updated project data to AsyncStorage.');
      } else {
        console.error('Note not found in project data.');
      }
    } else {
      console.error('Project data not found in AsyncStorage.');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

  

  return (
    <SafeAreaView style={styles.container}>
      {showImage && selectedImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{uri: selectedImage.uri}}
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <TouchableOpacity
            // onPress={() => {
            //   navigation.navigate('CollectScreen');
            // }}
            onPress={() => {
              // Assuming `note` is available and you want to pass it to the next screen
              if (note) {
                navigation.navigate('CollectScreen', {
                  note,  // Passing the note
                  noteSerial: note.Serial,  // Passing the note serial (if needed)
                  projectId,  // Passing the project ID
                });
              } else {
                console.error('Note is undefined');
              }
            }}
            >
              <Text style={styles.backText2}>{'\u2039'}</Text>
            </TouchableOpacity>
            <Text style={styles.header}>Vial Picture</Text>
          </View>

          <FlatList
            data={images}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.noteEntry}
                onPress={() => handleImagePress(item)}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome name="file-picture-o" size={34} color="black" />
                </View>
                <View style={styles.noteInfo}>
                  <Text style={styles.imageName}>
                    {item.name || 'Unnamed'}.jpeg
                  </Text>
                  <Text style={styles.imageSize}>{item.sizeMB || '0'}MB</Text>
                </View>
                <TouchableOpacity
                  style={styles.iconContainer2}
                  onPress={() => handleDeleteImage(item.uri)}
                >
                  <Icon name="delete" size={32} color="black" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  headerContainer: {
    flexDirection: 'row', // Display items in a row
    alignItems: 'center', // Align items vertically in the center
    padding: 10, // Optional: Add padding for better spacing
    marginBottom: 30,
    marginLeft: 25,
  },
  backText2: {
    fontSize: 37, // Adjust size of the back icon
    marginRight: 95, // Add some space between the back icon and the text
    color: 'black',
    fontWeight: 'bold',
  },
  noteEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B9D1D0',
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    width: width * 0.85, // 90% of the screen width
    alignSelf: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  iconContainer2: {
    marginLeft: 'auto',
  },
  noteInfo: {
    justifyContent: 'center',
    flex: 1, // Allow text to take up remaining space
  },
  imageName: {
    fontSize: 16,
    color: '#333',
  },
  imageSize: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  imagePreview: {
    width: width * 0.99, // 90% of the screen width
    height: height * 0.65, // 60% of the screen height
    borderWidth: 3,
    borderColor: 'black',
    marginTop: height * 0.15,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    color: 'black',
    marginTop: height * 0.05,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default VialPicture;
