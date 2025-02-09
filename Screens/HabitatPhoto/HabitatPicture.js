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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {launchCamera} from 'react-native-image-picker';
//import auth from '@react-native-firebase/auth';
//import firestore from '@react-native-firebase/firestore';

const {width, height} = Dimensions.get('window');

const HabitatPicture = ({route}) => {
  const {
    projectId,
    serial,
    note: initialNote,
    projectName,
    noteSerial2,
    localityNumber,
    imageList,
    goBack,
  } = route.params;
  const [imagess, setImagess] = useState(imageList);
  const [showImage, setShowImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation();
  const [note, setNote] = useState(initialNote || null);

  const [country, setCountryName] = useState(route.params?.country || 'AUS');
  console.log('sdfsdfsdF>>>>>');
  useEffect(() => {
    //console.log('Country:', country);
    const fetchImageData = async () => {
      try {
        const projectData = await AsyncStorage.getItem(projectId);
        if (projectData) {
          const parsedData = JSON.parse(projectData);
          const fetchedNote = parsedData.find(n => n.Serial === serial);
          if (fetchedNote) {
            setNote(fetchedNote);
            // setImagess(fetchedNote.imagess || []);
            setImagess(prevImages => [
              ...prevImages,
              ...(fetchedNote.images || []),
            ]);
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

  const saveImagesToStorage = async updatedImages => {
    try {
      const projectData = await AsyncStorage.getItem(projectId);
      if (projectData) {
        const parsedData = JSON.parse(projectData);
        const noteIndex = parsedData.findIndex(n => n.Serial === serial);

        if (noteIndex !== -1) {
          parsedData[noteIndex].imagess = updatedImages;
          await AsyncStorage.setItem(projectId, JSON.stringify(parsedData));
        }
      }
    } catch (error) {
      console.error('Error saving images:', error);
    }
  };

  // const getProjectNumber = async () => {
  //   try {
  //     const user = auth().currentUser;
  //     if (user && user.email) {
  //       const projectRef = firestore()
  //         .collection('UserInformation')
  //         .doc(user.email)
  //         .collection('Allocated Project')
  //         .doc(projectId);

  //       const projectSnapshot = await projectRef.get();
  //       if (projectSnapshot.exists) {
  //         const projectData = projectSnapshot.data();
  //         return parseInt(projectData.Number, 10);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching project number:', error);
  //   }
  // };

  const openCameraHabitat = async () => {
    const options = {
      mediaType: 'photo',
      cameraType: 'back',
      quality: 1,
    };

    try {
      const result = await launchCamera(options);
      if (result.didCancel) {
        console.log('User cancelled camera');
      } else if (result.errorCode) {
        console.error('Camera error: ', result.errorCode);
        Alert.alert('Camera Error', result.errorMessage);
      } else if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const sizeInMB = (asset.fileSize / (1024 * 1024)).toFixed(2);

        //const year = new Date().getFullYear().toString().slice(-2);
        //const projectNumber = await getProjectNumber();
        //console.log('Sdfsfsdfsdf>>>>', projectNumber);
        //const expedition = `E${projectNumber}`;
        const habitatCount = imagess.length + 1;
        const generatedImageName = `${projectName}_${localityNumber}_H0${habitatCount}`;

        const newImage = {
          uri: asset.uri,
          name: generatedImageName,
          sizeMB: sizeInMB,
        };

        const newImagesList = [...imagess, newImage];
        setImagess(newImagesList);
        goBack(newImagesList);
        // Update the note state as well
        if (note) {
          const updatedNote = {
            ...note,
            imagess: newImagesList,
          };
          setNote(updatedNote); // Ensure the note state is updated as well
        }

        console.log('Image saved with name:', generatedImageName);

        // Save images and note to AsyncStorage
        await saveImagesToStorage(newImagesList);
      }
    } catch (error) {
      console.error('Error opening camera: ', error);
      Alert.alert('Error', 'Failed to open camera');s
    }
  };

  const handleDeleteImage = async imageUri => {
    try {
      const updatedImages = imagess.filter(image => image.uri !== imageUri);
      setImagess(updatedImages);
      goBack(updatedImages);
      if (note) {
        setNote(prevNote => ({
          ...prevNote,
          imagess: updatedImages,
        }));
      }

      const projectData = await AsyncStorage.getItem(projectId);
      if (projectData) {
        const parsedData = JSON.parse(projectData);
        const noteIndex = parsedData.findIndex(n => n.Serial === serial);

        if (noteIndex > -1) {
          parsedData[noteIndex].imagess = updatedImages;
          await AsyncStorage.setItem(projectId, JSON.stringify(parsedData));
        }
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
          <TouchableOpacity onPress={() => setShowImage(false)}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('CollectScreen', {
                  note,
                  projectId,
                  serial,
                });
              }}>
              <Text style={styles.backText2}>{'\u2039'}</Text>
            </TouchableOpacity>
            <Text style={styles.header}>Habitat Picture</Text>
          </View>
          <FlatList
            data={imagess}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.noteEntry}
                onPress={() => setSelectedImage(item)}>
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
                  onPress={() => handleDeleteImage(item.uri)}>
                  <Icon name="delete" size={32} color="black" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
          {/* <TouchableOpacity
            style={styles.captureButton}
            onPress={openCameraHabitat}>
            <FontAwesome name="camera" size={20} color="black" />
            <Text style={styles.captureButtonText}>Capture</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.captureButton} onPress={openCameraHabitat}>
                  <Icon name="camera" size={26} color="black" />
                  <Text style={styles.buttonText}>Capture</Text>
                </TouchableOpacity>
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
    fontSize: width * 0.052,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.03,
    marginBottom: height * 0.03,
    marginLeft: width * 0.05,
  },
  backText2: {
    fontSize: width * 0.09,
    marginRight: width * 0.25,
    marginBottom: height * 0.001,
    color: 'black',
    fontWeight: 'bold',
  },
  noteEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B9D1D0',
    padding: width * 0.04,
    borderRadius: 8,
    marginVertical: height * 0.01,
    width: width * 0.85,
    alignSelf: 'center',
  },
  iconContainer: {
    marginRight: width * 0.03,
  },
  iconContainer2: {
    marginLeft: 'auto',
  },
  noteInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  imageName: {
    fontSize: width * 0.04,
    color: '#333',
  },
  imageSize: {
    fontSize: width * 0.035,
    color: '#777',
    marginTop: 4,
  },
  imagePreview: {
    width: width * 0.99,
    height: height * 0.65,
    borderWidth: 3,
    borderColor: 'black',
    marginTop: height * 0.15,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: width * 0.05,
    color: 'black',
    fontWeight: 'bold',
    marginTop: height * 0.05,
  },
  listContent: {
    paddingBottom: height * 0.02,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#48938F",
    paddingVertical:  height * 0.022,
    paddingHorizontal: width * 0.1,
    borderRadius: 10,
    marginTop: 20,
    left:width * 0.09,
    marginRight:width * 0.19,
    borderWidth: 1,
    borderColor: "black",
    marginBottom: height * 0.05,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: width * 0.04,
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "black",
  },
});

export default HabitatPicture;
