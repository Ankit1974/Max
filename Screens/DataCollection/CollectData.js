// Fixed the multiple picture are not saving issue jkn

import React, {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import CheckBox from '@react-native-community/checkbox';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchCamera} from 'react-native-image-picker';
import Slider from '@react-native-community/slider';
import {useNavigation} from '@react-navigation/native';
import Dialog from 'react-native-dialog';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const CollectDataScreen = ({noteId}) => {
  const [selectedHabitats, setSelectedHabitats] = useState([]);
  const [selectedSubstrates, setSelectedSubstrates] = useState([]);
  const [selectedWaterTypes, setSelectedWaterTypes] = useState([]);
  const [selectedGeology, setSelectedGeology] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [userName, setUserName] = useState('');
  const habitats = [
    'Pond',
    'Lake',
    'Ditch',
    'Creek',
    'River',
    'Spring',
    'Cave',
    'Artificial Habitat',
  ];
  const substrates = ['Rock', 'Sand', 'Vegetation', 'Plastic', 'Man-made'];
  const waterTypes = [
    'Fresh',
    'Brackish',
    'Marine',
    'Fast flow',
    'Medium',
    'Stagnant',
    'High turbidity',
    'Medium turbidity',
    'Clear',
  ];
  const geologyTypes = [
    'Limestone',
    'Other sediments',
    'Sandstone',
    'Igneous rock',
    'Alluvial',
  ];
  const [abundance, setAbundance] = useState(0); // State for abundance slider
  const [images, setImages] = useState([]); // storing vial image
  const [customImageName, setCustomImageName] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [imagess, setImagess] = useState([]); // storing Habitat image
  const [customImageNames, setCustomImageNames] = useState('');
  const [dialogVisibles, setDialogVisibles] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const [expandedBox, setExpandedBox] = useState(null);
  const [localityDesignation, setLocalityDesignation] = useState('');
  const [landmarkNearby, setLandmarkNearby] = useState('');
  const [numOfVials, setNumOfVials] = useState('');
  const [morphs, setMorphs] = useState('');
  const [observation, setObservation] = useState('');
  const [temperature, setTemperature] = useState('');
  const [hardness, setHardness] = useState('');
  const [pH, setPH] = useState('');
  const [additional, setAdditional] = useState('');
  const [planariansPresent, setPlanariansPresent] = useState(null); // null means no answer selected yet
  const [localityNumber, setLocalityNumber] = useState('01'); // Example for locality number
  const [countryName, setCountryName] = useState(
    route.params?.country || 'Aus',
  );
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [answers, setAnswers] = useState({}); // stores answers by localityDesignation
  const {country, noteSerial, isNewNote, projectId, noteSerial2, projectName} =
    route.params;
  const [isAnswered, setIsAnswered] = useState(false); // Whether the question is answered
  const [conductivity, setConductivity] = useState('');
  const [turbidity, setTurbidity] = useState('');
  const [o2dis, setO2dis] = useState('');
  const [note, setNote] = useState([]);
  const [getProjectName, setProjectname] = useState(projectName);

  //console.log ( country)
  console.log(noteSerial2);
  console.log('projectName:', route.params?.note, projectName);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('UserData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserName(userData.name || 'User'); // Assuming userData has a 'name' field
        } else {
          console.log('UserData not found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching UserData from AsyncStorage:', error);
      }
    };

    fetchUserName();
  }, []);

  useEffect(() => {
    if (!isNewNote) {
      const fetchQuestionAnswered = async () => {
        const answered = await AsyncStorage.getItem(
          `questionAnswered_${noteSerial}`,
        );
        if (answered !== null) {
          setQuestionAnswered(true);
          setPlanariansPresent(answered);
        }
      };
      fetchQuestionAnswered();
    }
  }, [noteSerial, isNewNote]);

  // Load saved answer from AsyncStorage
  useEffect(() => {
    const loadAnswer = async () => {
      const savedAnswer = await AsyncStorage.getItem('planariansPresentAnswer');
      if (savedAnswer) {
        setPlanariansPresent(savedAnswer);
        setIsAnswered(true);
      }
    };

    loadAnswer();
  }, []);

  // Save the answer to AsyncStorage
  const handleAnswer = async answer => {
    setPlanariansPresent(answer);
    setIsAnswered(true);

    // Save answer to AsyncStorage
    try {
      await AsyncStorage.setItem('planariansPresentAnswer', answer);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  // Log the current state of answers and whether the question is displayed
  console.log(`[LOG] Current answers:`, answers);
  console.log(
    `[LOG] Question displayed for ${localityDesignation}:`,
    !isAnswered,
  );

  // Check if the answer exists for the current localityDesignation
  useEffect(() => {
    const localityAnswer = answers[localityDesignation];
    if (localityAnswer) {
      setPlanariansPresent(localityAnswer);
      setIsAnswered(true); // The question has already been answered
    } else {
      setPlanariansPresent(null);
      setIsAnswered(false); // Reset for new locality
    }
  }, [localityDesignation, answers]);

  useEffect(() => {
    if (route.params?.note) {
      console.log('Updated note received:', route.params.note);
      loadNoteData(route.params.note);
    }
  }, [route.params?.note]);

  // Auto-generate Locality Designation
  useEffect(() => {
    const fetchExpeditionNumber = async () => {
      try {
        if (country && projectId) {
          const currentYear = new Date().getFullYear().toString().slice(-2); // Last 2 digits of the year

          // Get the current user
          const user = auth().currentUser;

          if (user && user.email) {
            // Reference to the specific project in the Allocated Project subcollection
            const projectRef = firestore()
              .collection('UserInformation')
              .doc(user.email)
              .collection('Allocated Project')
              .doc(projectId);

            // Fetch the specific project document
            const projectSnapshot = await projectRef.get();

            if (projectSnapshot.exists) {
              const projectData = projectSnapshot.data();

              // Extract the Number field from the project document
              const projectNumber = parseInt(projectData.Number, 10);
              const expedition = `E${projectNumber}`; // Increment the number for the new expedition

              // Check if we are editing an existing note
              //const formattedNoteSerial2 = parseInt(noteSerial2.replace(/[^\d]/g, ''), 10); // Convert to a number to remove leading zeros
              const localityNumber = route.params?.note
                ? `L0${noteSerial2}` // Use the processed number for editing
                : `L0${noteSerial}`;

              // Update the localityNumber state
              setLocalityNumber(localityNumber);

              // Generate the locality designation
              // const generatedDesignation = `${country
              //   .slice(0, 3)
              //   .toUpperCase()}${currentYear}${expedition}${localityNumber}`;
              // setLocalityDesignation(generatedDesignation);

              const generatedDesignation = `${projectName}${localityNumber}`;
              setLocalityDesignation(generatedDesignation);

              // Log the generated designation
              console.log(
                'Locality Designation Generated:',
                generatedDesignation,
              );
            } else {
              console.log(`Project with ID ${projectId} does not exist.`);
            }
          } else {
            console.log(
              'User email is not available. Cannot fetch the specific project.',
            );
          }
        } else {
          console.log(
            'Country or projectId is not available. Locality Designation not generated.',
          );
        }
      } catch (error) {
        console.error('Error fetching specific project:', error);
      }
    };

    fetchExpeditionNumber();
  }, [country, projectName, projectId, noteSerial, route.params?.note]); // Adding dependencies

  // Function to load existing note data
  const loadNoteData = note => {
    setSelectedHabitats(note.selectedHabitats || []);
    setSelectedSubstrates(note.selectedSubstrates || []);
    setSelectedWaterTypes(note.selectedWaterTypes || []);
    setSelectedGeology(note.selectedGeology || []);
    setCoordinates(note.coordinates || null);
    setAbundance(note.abundance || 0);
    setImages(note.images || []);
    setImagess(note.imagess || []);
    setLocalityDesignation(note.localityDesignation || '');
    setLandmarkNearby(note.landmarkNearby || '');
    setNumOfVials(note.numOfVials || '');
    setMorphs(note.morphs || '');
    setObservation(note.observation || '');
    setAdditional(note.additional || '');
    setTemperature(note.temperature || '');
    setHardness(note.hardness || '');
    setPH(note.pH || '');
    setConductivity(note.conductivity || '');
    setTurbidity(note.turbidity || '');
    setO2dis(note.o2dis || '');
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadExistingNote = async () => {
        try {
          const existingNotes = await AsyncStorage.getItem('notes');
          let notes = existingNotes ? JSON.parse(existingNotes) : [];

          //console.log("Route params note: ", route.params?.note);

          // If route.params?.note exists, load that specific note
          if (route.params?.note) {
            console.log('Loading specific note: ', route.params.note);
            loadNoteData(route.params.note);
          } else {
            console.log('No notes available');
          }
        } catch (error) {
          console.error('Error loading notes from AsyncStorage: ', error);
        }
      };

      // Run the loadExistingNote function whenever the screen gains focus
      loadExistingNote();

      // UseEffect inside for updates to route.params.note
      return () => {
        if (route.params?.note) {
          console.log('Updated note received:', route.params.note);
          loadNoteData(route.params.note);
        }
      };
    }, [route.params?.note]), // Adding dependency on route.params?.note
  );

  const toggleHabitat = habitat => {
    if (selectedHabitats.includes(habitat)) {
      setSelectedHabitats(selectedHabitats.filter(item => item !== habitat));
    } else {
      setSelectedHabitats([...selectedHabitats, habitat]);
    }
  };

  const toggleSubstrate = substrates => {
    if (selectedSubstrates.includes(substrates)) {
      setSelectedSubstrates(
        selectedSubstrates.filter(item => item !== substrates),
      );
    } else {
      setSelectedSubstrates([...selectedSubstrates, substrates]);
    }
  };

  const toggleWater = waterTypes => {
    if (selectedWaterTypes.includes(waterTypes)) {
      setSelectedWaterTypes(
        selectedWaterTypes.filter(item => item !== waterTypes),
      );
    } else {
      setSelectedWaterTypes([...selectedWaterTypes, waterTypes]);
    }
  };

  const toggleGeology = geologyTypes => {
    if (selectedGeology.includes(geologyTypes)) {
      setSelectedGeology(selectedGeology.filter(item => item !== geologyTypes));
    } else {
      setSelectedGeology([...selectedGeology, geologyTypes]);
    }
  };

  // Function to toggle expand/collapse of the selected box
  const toggleExpand = box => {
    setExpandedBox(expandedBox === box ? null : box); // Close if already open, open new box
  };

  const collectGPSCoordinates = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Location access is required to collect GPS coordinates.',
        );
        return;
      }
    }

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setCoordinates({latitude, longitude});
      },
      error => {
        Alert.alert('Error', `Failed to get location: ${error.message}`);
      },
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  // Function to validate form fields

  const handleSubmit = async () => {
    const projectId = route.params?.projectId;

    // Log the projectId for debugging
    console.log('Project ID:', projectId);

    // if (!validateForm()) {
    //   return; // Stop execution if validation fails
    // }

    try {
      // Retrieve existing notes for the project from AsyncStorage
      const existingNotesData = await AsyncStorage.getItem(projectId);
      const notes = existingNotesData ? JSON.parse(existingNotesData) : [];

      // Log the retrieved notes for debugging
      console.log('Existing Notes:', notes);

      // Determine the note number
      const noteNumber = route.params?.note
        ? route.params.note.Serial // If editing, keep the same Serial
        : `${getProjectName}_L0${notes.length + 1}`; // New note gets the next number

      console.log('noteNumber:', noteNumber);

      const createdBy = `Created by ${userName}`;

      const newNote = {
        id: route.params?.note?.id || `${projectId}-Note-${noteNumber}`, // Ensure unique ID
        Serial: noteNumber, // Use the determined note number
        createdBy: createdBy,
        selectedHabitats: selectedHabitats || [],
        selectedSubstrates: selectedSubstrates || [],
        selectedWaterTypes: selectedWaterTypes || [],
        selectedGeology: selectedGeology || [],
        coordinates: coordinates || null,
        abundance: abundance || 0,
        images: images.map((img, index) => ({
          uri: img.uri,
          name: img.name || `Image-${index + 1}`, // Default name if not set
          sizeMB: img.sizeMB || 0,
        })),
        imagess: imagess.map((img, index) => ({
          uri: img.uri,
          name: img.name || `Image-${index + 1}`, // Default name if not set
          sizeMB: img.sizeMB || 0,
        })),
        localityDesignation: localityDesignation || '',
        landmarkNearby: landmarkNearby || '',
        numOfVials: numOfVials || '',
        morphs: morphs || '',
        observation: observation || '',
        temperature: temperature || '',
        hardness: hardness || '',
        pH: pH || '',
        additional: additional || '',
        conductivity: conductivity || '',
        turbidity: turbidity || '',
        o2dis: o2dis || '',
      };

      // Log the new note object for debugging
      console.log('New Note Object:', newNote);

      if (route.params?.note) {
        // Update existing note
        const updatedNotes = notes.map(note =>
          note.Serial === route.params.note.Serial ? newNote : note,
        );
        await AsyncStorage.setItem(projectId, JSON.stringify(updatedNotes));
      } else {
        // Add new note
        notes.push(newNote);
        await AsyncStorage.setItem(projectId, JSON.stringify(notes));
      }

      // Trigger callback if provided
      if (route.params?.onNewNoteAdded) {
        route.params.onNewNoteAdded(newNote);
      }

      // Navigate back to the ProjectDetails screen
      navigation.navigate('ProjectDetails', {projectId});
      k;
    } catch (error) {
      console.error('Error saving note to AsyncStorage:', error);
    }
  };

  // Inside the CollectDataScreen component
  const openCameravial = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 1,
        saveToPhotos: true,
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        // Get the project number
        const projectNumber = await getProjectNumber();

        // Set the expedition value dynamically
        const expedition = `E${projectNumber}`;

        const vialCount = images.length + 1; // Increment for each habitat image
        const generatedImageName = `${projectName}_${localityNumber}_V0${vialCount}`;

        const newImage = {
          uri: imageUri,
          name: generatedImageName,
        };

        setImages([...images, newImage]); // Add the new image to the images array

        console.log('Image captured and saved with name:', generatedImageName);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const handlevialSaveImage = () => {
    if (customImageName.trim() === '') {
      Alert.alert('Error', 'Please enter a valid name for the image.');
      return;
    }

    const lastImage = images[images.length - 1]; // Get last image captured
    const updatedImage = {uri: lastImage.uri, name: customImageName}; // Create new image object with name

    // Update images state without duplicating the last image
    const updatedImages = [...images];
    updatedImages[updatedImages.length - 1] = updatedImage; // Replace last image with updated image

    setImages(updatedImages); // Update images state
    setCustomImageName('');
    setDialogVisible(false);
  };

  const getProjectNumber = async () => {
    try {
      const user = auth().currentUser;
      if (user && user.email) {
        const projectRef = firestore()
          .collection('UserInformation')
          .doc(user.email)
          .collection('Allocated Project')
          .doc(projectId);

        const projectSnapshot = await projectRef.get();
        if (projectSnapshot.exists) {
          const projectData = projectSnapshot.data();
          return parseInt(projectData.Number, 10); // Assuming Number field holds the project number
        }
      }
    } catch (error) {
      console.error('Error fetching project number:', error);
    }
  };

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
        const sizeInMB = (asset.fileSize / (1024 * 1024)).toFixed(2); // Convert fileSize to MB

        // Generate the image name automatically
        const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of the year
        //const expedition = 'E1';
        // Get the project number
        const projectNumber = await getProjectNumber();

        // Set the expedition value dynamically
        const expedition = `E${projectNumber}`;
        const habitatCount = imagess.length + 1; // Increment for each habitat image
        const generatedImageName = `${projectName}_${localityNumber}_H0${habitatCount}`;

        const newImage = {
          uri: asset.uri,
          name: generatedImageName,
          sizeMB: sizeInMB,
        };
        console.log('sdfsfsdf>>>>>>', imagess);
        // Add the new image to the imagess state
        setImagess([...imagess, newImage]);
        console.log('Image saved with name:', generatedImageName);
      }
    } catch (error) {
      console.error('Error opening camera: ', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleHabitatSaveImage = () => {
    if (customImageNames.trim() === '') {
      Alert.alert('Error', 'Please enter a valid name for the image.');
      return;
    }

    const lastImages = imagess[imagess.length - 1]; // Get last image captured
    const updatedImages = {uri: lastImages.uri, name: customImageNames}; // Create new image object with name

    // Update images state without duplicating the last image
    const updatedImagess = [...imagess];
    updatedImagess[updatedImagess.length - 1] = updatedImages; // Replace last image with updated image

    setImagess(updatedImagess); // Update images state
    setCustomImageNames('');
    setDialogVisibles(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CollectScreen2')}
            style={styles.backIconContainer}>
            <Text style={styles.backIcon}>{'\u2039'}</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Sampling Field Notes</Text>
        </View>

        {/* Location Section */}
        <Text style={styles.sectionHeader}>Location</Text>
        <View style={styles.separator} />
        <TextInput
          style={styles.input}
          value={localityDesignation}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Landmark Nearby"
          value={landmarkNearby}
          onChangeText={setLandmarkNearby}
        />

        {coordinates && (
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesText}>
              Latitude:{' '}
              <Text style={styles.coordinatesValue}>
                {coordinates.latitude.toFixed(5)}
              </Text>
            </Text>
            <Text style={styles.coordinatesText}>
              Longitude:{' '}
              <Text style={styles.coordinatesValue}>
                {coordinates.longitude.toFixed(5)}
              </Text>
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={collectGPSCoordinates}>
          <Text style={styles.buttonText}>Capture coordinates</Text>
        </TouchableOpacity>

        {/* Planarians Question Section */}
        {!isAnswered && (
          <View>
            <Text style={styles.sectionHeader}>Planarians present</Text>
            <View style={styles.separator} />
            <View
              style={[
                styles.buttonContainer,
                {flexDirection: 'row', justifyContent: 'space-between'},
              ]}>
              <TouchableOpacity
                onPress={() => handleAnswer('Yes')}
                style={styles.optionButton}>
                <Text style={styles.buttonText2}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAnswer('No')}
                style={styles.optionButton}>
                <Text style={styles.buttonText2}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {isAnswered && planariansPresent === 'Yes' && (
          <>
            {/* Planarians Section */}
            <Text style={styles.sectionHeader}>Planarians</Text>
            <View style={styles.separator} />
            <TextInput
              style={styles.input}
              placeholder="No. of Vials"
              value={numOfVials}
              onChangeText={setNumOfVials}
            />
            <TextInput
              style={styles.input}
              placeholder="Morphs"
              value={morphs}
              onChangeText={setMorphs}
            />

            <Text style={styles.label}>Abundance</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={abundance}
                onValueChange={value => setAbundance(value)}
                minimumTrackTintColor="#2E6C6A" // Dark green color for the filled part of the track
                maximumTrackTintColor="#E0F2F1" // Light teal color for the unfilled part of the track
                thumbTintColor="#4EA8A5" // Color for the thumb
              />
            </View>

            <Text style={styles.sliderValue}>{abundance}</Text>

            <Text style={styles.label}>Observations</Text>
            <TextInput
              style={[styles.input, styles.observationsInput]}
              placeholder="E.g. Blastemas, eggs, etc ..."
              multiline
              numberOfLines={4}
              value={observation}
              onChangeText={setObservation}
            />

            {/* Pictures Section */}
            <Text style={styles.sectionHeader}>Pictures</Text>
            <View style={styles.separator} />
            <Text style={styles.label}>Vial pictures</Text>

            {/* Conditionally render camera icon or image preview */}
            {images.length < 1 ? (
              <TouchableOpacity
                style={styles.pictureContainer}
                onPress={openCameravial}>
                <Text style={styles.placeholderText}>No Photos added</Text>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.habitatPicturesContainer}
                onPress={() => {
                  // Generate a random size for each image, with two decimal places
                  const randomSizes = imagess.map(() =>
                    (Math.random() * (9 - 3) + 3).toFixed(1),
                  );
                  const projectId = route.params?.projectId;

                  const noteNumber = route.params?.note
                    ? route.params.note.Serial // If editing, keep the same Serial
                    : `Note 0${note.length + 1}`; // New note gets the next number

                  // Check if projectId exists before navigating
                  if (projectId) {
                    console.log(
                      'sdfsfSD>>>>',
                      noteNumber,
                      countryName,
                      projectName,
                      localityNumber,
                      images,
                      route.params?.note,
                    );
                    navigation.navigate('VialPicture', {
                      projectId: projectId, // Pass the project ID
                      serial: noteNumber,
                      country: countryName,
                      projectName,
                      localityNumber,
                      imageList: images,
                      goBack: list => setImages(list),
                    });
                  } else {
                    console.error('Project ID is not defined!');
                  }
                }}>
                {/* Display the image(s) */}
                {images.map((images, index) => (
                  <Image key={index} source={images} style={styles.imageIcon} />
                ))}
              </TouchableOpacity>
            )}

            {/* Dialog for Custom Image Name for vial Image*/}
            <Dialog.Container visible={dialogVisible}>
              <Dialog.Title>Save Image</Dialog.Title>
              <Dialog.Description>
                Enter a name for the photo you just captured:
              </Dialog.Description>
              <Dialog.Input
                value={customImageName}
                onChangeText={setCustomImageName}
                placeholder="Image name"
              />
              <Dialog.Button
                label="Cancel"
                onPress={() => setDialogVisible(false)}
              />
              <Dialog.Button label="Save" onPress={handlevialSaveImage} />
            </Dialog.Container>

            <Text style={styles.label}>Habitat pictures </Text>
            {/* Conditionally render camera icon or image preview */}
            {imagess.length < 1 ? (
              <TouchableOpacity
                style={styles.pictureContainer}
                onPress={openCameraHabitat}>
                <Text style={styles.placeholderText}>No Photos added</Text>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.habitatPicturesContainer}
                onPress={() => {
                  // Generate a random size for each image, with two decimal places
                  const randomSizes = imagess.map(() =>
                    (Math.random() * (9 - 3) + 3).toFixed(1),
                  );
                  const projectId = route.params?.projectId;

                  console.log('projectI:', projectId);
                  const noteNumber = route.params?.note
                    ? route.params.note.Serial // If editing, keep the same Serial
                    : `Note 0${note.length + 1}`; // New note gets the next number

                  //console.log('noteNumber:', noteNumber);

                  // Check if projectId exists before navigating
                  if (projectId) {
                    navigation.navigate('HabitatPicture', {
                      projectId: projectId, // Pass the project ID
                      serial: noteNumber,
                      country: countryName,
                      projectName,
                      localityNumber,
                      imageList: imagess,
                      goBack: list => setImagess(list),
                    });
                  } else {
                    console.error('Project ID is not defined!');
                  }
                }}>
                {/* Display the image(s) */}
                {imagess.map((imagess, index) => (
                  <Image
                    key={index}
                    source={imagess}
                    style={styles.imageIcon}
                  />
                ))}
              </TouchableOpacity>
            )}

            {/* Dialog for Custom Image Name for Habitat Image*/}
            <Dialog.Container visible={dialogVisibles}>
              <Dialog.Title>Save Image</Dialog.Title>
              <Dialog.Description>
                Enter a name for the photo you just captured:
              </Dialog.Description>
              <Dialog.Input
                value={customImageNames}
                onChangeText={setCustomImageNames}
                placeholder="Image name"
              />
              <Dialog.Button
                label="Cancel"
                onPress={() => setDialogVisibles(false)}
              />
              <Dialog.Button label="Save" onPress={handleHabitatSaveImage} />
            </Dialog.Container>

            {/* Habitat Description Section */}
            <Text style={styles.sectionHeader}>Habitats</Text>
            <View style={styles.separator} />
            <Text style={styles.sectionHeader}>Habitat Description</Text>
            <View style={styles.habitatContainer}>
              <View style={styles.habitatDescriptionBox}>
                <View style={styles.selectedHabitatsContainer}>
                  <View style={styles.selectedHabitatsWrapper}>
                    {selectedHabitats.slice(0, 3).map((habitat, index) => (
                      <Text key={index} style={styles.habitatTag}>
                        {habitat}
                      </Text>
                    ))}
                    {selectedHabitats.length > 3 && (
                      <Text style={styles.additionalText}>
                        +{selectedHabitats.length - 3}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => toggleExpand('habitats')}>
                    <Icon
                      name={
                        expandedBox === 'habitats'
                          ? 'expand-less'
                          : 'expand-more'
                      }
                      size={29}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
                {expandedBox === 'habitats' && (
                  <View style={styles.habitatList}>
                    {habitats.map((habitat, index) => (
                      <View key={index} style={styles.habitatCheckboxContainer}>
                        <CheckBox
                          value={selectedHabitats.includes(habitat)}
                          onValueChange={() => toggleHabitat(habitat)}
                          tintColors={{true: '#48938F', false: '#000000'}}
                          style={styles.checkbox}
                        />
                        <Text style={styles.habitatText}>{habitat}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Substrate Section */}
            <Text style={styles.sectionHeader}>Substrate</Text>
            <View style={styles.habitatContainer}>
              <View style={styles.habitatDescriptionBox}>
                <View style={styles.selectedHabitatsContainer}>
                  <View style={styles.selectedHabitatsWrapper}>
                    {selectedSubstrates.slice(0, 3).map((substrates, index) => (
                      <Text key={index} style={styles.habitatTag}>
                        {substrates}
                      </Text>
                    ))}
                    {selectedSubstrates.length > 3 && (
                      <Text style={styles.additionalText}>
                        +{selectedSubstrates.length - 3}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => toggleExpand('substrates')}>
                    <Icon
                      name={
                        expandedBox === 'substrates'
                          ? 'expand-less'
                          : 'expand-more'
                      }
                      size={29}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
                {expandedBox === 'substrates' && (
                  <View style={styles.habitatList}>
                    {substrates.map((substrates, index) => (
                      <View key={index} style={styles.habitatCheckboxContainer}>
                        <CheckBox
                          value={selectedSubstrates.includes(substrates)}
                          onValueChange={() => toggleSubstrate(substrates)}
                          tintColors={{true: '#48938F', false: '#000000'}}
                          style={styles.checkbox}
                        />
                        <Text style={styles.habitatText}>{substrates}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Water Section */}
            <Text style={styles.sectionHeader}>Water</Text>
            <View style={styles.habitatContainer}>
              <View style={styles.habitatDescriptionBox}>
                <View style={styles.selectedHabitatsContainer}>
                  <View style={styles.selectedHabitatsWrapper}>
                    {selectedWaterTypes.slice(0, 3).map((waterTypes, index) => (
                      <Text key={index} style={styles.habitatTag}>
                        {waterTypes}
                      </Text>
                    ))}
                    {selectedWaterTypes.length > 3 && (
                      <Text style={styles.additionalText}>
                        +{selectedWaterTypes.length - 3}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => toggleExpand('waterTypes')}>
                    <Icon
                      name={
                        expandedBox === 'WaterTypes'
                          ? 'expand-less'
                          : 'expand-more'
                      }
                      size={29}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
                {expandedBox === 'waterTypes' && (
                  <View style={styles.habitatList}>
                    {waterTypes.map((waterTypes, index) => (
                      <View key={index} style={styles.habitatCheckboxContainer}>
                        <CheckBox
                          value={selectedWaterTypes.includes(waterTypes)}
                          onValueChange={() => toggleWater(waterTypes)}
                          tintColors={{true: '#48938F', false: '#000000'}}
                          style={styles.checkbox}
                        />
                        <Text style={styles.habitatText}>{waterTypes}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Temperature"
              value={temperature}
              onChangeText={setTemperature}
            />
            <View style={styles.measurementContainer}>
              <TextInput
                style={styles.measurementBox}
                placeholder="conductivity"
                value={conductivity}
                onChangeText={setConductivity}
              />
              <TextInput
                style={styles.measurementBox}
                placeholder="pH"
                value={pH}
                onChangeText={setPH}
              />
            </View>
            <View style={styles.measurementContainer}>
              <TextInput
                style={styles.measurementBox}
                placeholder="turbidity"
                value={turbidity}
                onChangeText={setTurbidity}
              />
              <TextInput
                style={styles.measurementBox}
                placeholder="o2dis"
                value={o2dis}
                onChangeText={setO2dis}
              />
            </View>

            {/* Geology Section */}
            <Text style={styles.sectionHeader}>Geology</Text>
            <View style={styles.habitatContainer}>
              <View style={styles.habitatDescriptionBox}>
                <View style={styles.selectedHabitatsContainer}>
                  <View style={styles.selectedHabitatsWrapper}>
                    {selectedGeology.slice(0, 3).map((geologyTypes, index) => (
                      <Text key={index} style={styles.habitatTag}>
                        {geologyTypes}
                      </Text>
                    ))}
                    {selectedGeology.length > 3 && (
                      <Text style={styles.additionalText}>
                        +{selectedGeology.length - 3}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleExpand('geologyTypes')}>
                    <Icon
                      name={
                        expandedBox === 'geologyTypes'
                          ? 'expand-less'
                          : 'expand-more'
                      }
                      size={29}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
                {expandedBox === 'geologyTypes' && (
                  <View style={styles.habitatList}>
                    {geologyTypes.map((geologyTypes, index) => (
                      <View key={index} style={styles.habitatCheckboxContainer}>
                        <CheckBox
                          value={selectedGeology.includes(geologyTypes)}
                          onValueChange={() => toggleGeology(geologyTypes)}
                          tintColors={{true: '#48938F', false: '#000000'}}
                          style={styles.checkbox}
                        />
                        <Text style={styles.habitatText}>{geologyTypes}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.observationsInput]}
              placeholder="E.g. Blastemas, eggs, etc ..."
              multiline
              numberOfLines={6}
              value={additional}
              onChangeText={setAdditional}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          //disabled={!validateForm()}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const {width, height} = Dimensions.get('window');

// Helper for scaling sizes
const scaleSize = size => size * (width / 375); // 375 is base screen width

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ACCAC8',
  },
  scrollViewContent: {
    padding: scaleSize(20),
    flexGrow: 1,
    paddingBottom: scaleSize(50),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(6),
  },
  backIconContainer: {
    position: 'absolute',
    left: 0,
    marginLeft: scaleSize(9),
  },
  header: {
    fontSize: scaleSize(22),
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'Playfair Display',
  },
  backIcon: {
    fontSize: scaleSize(45),
    fontWeight: 'bold',
    color: 'black',
  },
  sectionHeader: {
    fontSize: scaleSize(18),
    fontWeight: 'bold',
    marginTop: scaleSize(28),
    color: '#000000',
    marginLeft: scaleSize(5),
    fontFamily: 'Playfair Display',
  },
  separator: {
    height: scaleSize(2),
    backgroundColor: '#000000',
    marginVertical: scaleSize(10),
  },
  label: {
    fontSize: scaleSize(18),
    color: '#000000',
    marginBottom: scaleSize(15),
    fontWeight: 'bold',
    marginLeft: scaleSize(5),
    marginTop: scaleSize(15),
  },
  input: {
    height: scaleSize(67),
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: scaleSize(10),
    padding: scaleSize(17),
    marginTop: scaleSize(15),
    backgroundColor: '#FFF',
    color: 'black',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSize(28),
    marginBottom: scaleSize(-6),
  },
  coordinatesText: {
    fontSize: scaleSize(16),
    fontWeight: 'bold',
    color: 'black',
    marginHorizontal: scaleSize(6),
  },
  coordinatesValue: {
    color: 'black',
  },

  observationsInput: {
    height: 160,
    textAlignVertical: 'top',
    marginTop: 2,
  },
  button: {
    width: width * 0.9,
    height: height * 0.07,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.03,
    backgroundColor: 'black',
    marginRight: width * 0.04,
  },
  buttonText: {
    color: '#FFF',
    fontSize: scaleSize(16),
    fontWeight: 'bold',
  },
  pictureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 75,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  placeholderText: {
    fontSize: 16,
    color: 'black',
    marginLeft: 18,
  },
  cameraIcon: {
    fontSize: 30,
    color: 'black',
    marginRight: 10,
    marginBottom: 7,
  },
  habitatPicturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  habitatContainer: {
    marginTop: 5,
  },
  habitatDescriptionBox: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 10,
    padding: 17,
    backgroundColor: '#FFF',
    marginTop: 5,
  },
  selectedHabitatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedHabitatsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    maxWidth: '80%',
  },
  habitatTag: {
    backgroundColor: 'black',
    color: '#FFF',
    borderRadius: 15,
    padding: 6,
    marginRight: 7,
    marginBottom: 5,
  },
  toggleText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  habitatList: {
    marginTop: 10,
  },
  habitatCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkbox: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#000000',
  },
  habitatText: {
    fontSize: 17,
    color: 'black',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  measurementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  measurementBox: {
    width: '48%',
    height: 67,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFF',
  },

  sliderContainer: {
    height: 70,
    justifyContent: 'center',
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    overflow: 'hidden',
  },
  slider: {
    height: 90,
  },

  sliderValue: {
    fontSize: 16,
    color: 'black',
    textAlign: 'right',
    marginRight: 10,
    marginTop: -25,
  },

  imageIcon: {
    width: 40,
    height: 40,
    borderRadius: 5,
    margin: 12,
    marginTop: -2,
    marginBottom: -2,
    marginLeft: 0,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  optionButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  buttonText2: {
    fontSize: 16,
    fontWeight: '600',
    color:"black"
  },
});

export default CollectDataScreen;
