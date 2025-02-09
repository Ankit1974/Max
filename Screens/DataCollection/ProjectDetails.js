import React, { useState, useCallback , useEffect } from 'react'; 
 import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';
 import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
 import Icon from 'react-native-vector-icons/MaterialIcons';
 import { useUploadStatus } from '../../ContextAPI/UploadStatusProvider';
 import firestore from '@react-native-firebase/firestore';
 import auth from '@react-native-firebase/auth'; // Import Firebase auth
 import AsyncStorage from '@react-native-async-storage/async-storage';
 import * as XLSX from 'xlsx';
 import { saveAs } from 'file-saver';
 import RNFS from 'react-native-fs';
 import Share from 'react-native-share';



  
 const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
 
 const ProjectDetails = () => {
   const navigation = useNavigation();
   const route = useRoute();
   const { projects, updateProjectUploadStatus, uploadedNotes, setUploadedNotes } = useUploadStatus();
   const { projectId } = route.params;
   const [project, setProject] = useState(null);
   const [showFullDescription, setShowFullDescription] = useState(false);
   const [notes, setNotes] = useState([]);
   
 
   const toggleDescription = () => {
     setShowFullDescription(!showFullDescription);
   };


 
   const getUserEmail = () => {
     const user = auth().currentUser;
     return user ? user.email : null;
   };

   useEffect(() => {
    const interval = setInterval(() => {
      loadProjectDetails();  // Refresh data every 30 seconds
    }, 10000);
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, [projectId]); // Re-run if projectId changes

   

   const loadProjectDetails = async () => {
    try {
        console.log('Loading project details...');
        const userEmail = getUserEmail();
        if (!userEmail) {
            console.error('No logged-in user email found.');
            return;
        }

        const projectRef = firestore()
            .collection('UserInformation')
            .doc(userEmail)
            .collection('Allocated Project')
            .doc(projectId);

        // Fetch project details from Firestore
        const projectDoc = await projectRef.get();
        if (projectDoc.exists) {
            const projectData = projectDoc.data();
            console.log('Fetched project data:', projectData);
            setProject(projectData);
        } else {
            console.error('Project not found in Firestore for the given ID.');
        }

        // Fetch notes only from AsyncStorage
        const storedNotes = await AsyncStorage.getItem(projectId);
        let asyncStorageNotes = storedNotes ? JSON.parse(storedNotes) : [];
        console.log('Fetched notes from AsyncStorage:', asyncStorageNotes);

        // Ensure new notes have `isUploaded: false`
        const allNotes = asyncStorageNotes.map(note => ({
            ...note,
            isUploaded: note.isUploaded || false,  // Ensure unuploaded notes are marked correctly
        }));

        console.log('Final notes:', allNotes);

        // Set state
        setUploadedNotes(allNotes);

    } catch (error) {
        console.error('Error loading project details:', error);
    }
};

  
   

  
 
   // Reload project details whenever the screen comes into focus
   useFocusEffect(
     useCallback(() => {
       loadProjectDetails();
     }, [projectId])
   );
 
   const handleNotePress = note => {
    const { projectName } = project;
     if (project.isUploaded) {
       navigation.navigate('UploadedNoteScreen', {
         note,
         noteSerial: note.Serial,
         projectId,
       });
     } else {
     // const formattedNoteSerial2 = parseInt(note.Serial.replace(/[^\d]/g, ''), 10);
     const formattedNoteSerial2 = note.Serial.replace(/[^\d]/g, '').slice(-1);
      console.log('serial2:',formattedNoteSerial2)
       navigation.navigate('CollectScreen', {
         note,
         projectId,
         country: project.country,
         noteSerial2: formattedNoteSerial2,
         projectName
       });
     }
   };
 
   const handleAddNotesPress = async () => {
    const { projectName } = project;
    const noteSerial = uploadedNotes.length + 1;

    // Navigate to CollectScreen to add the note
    navigation.navigate('CollectScreen', {
        projectId,
        noteSerial,
        country: project.country,
        projectName
    });

    // Reload project details after navigating back
    setTimeout(() => {
        loadProjectDetails();
    }, 1000);  // Delay to allow note creation
};

const handleUploadNotesPress = async () => { 
  const userEmail = getUserEmail();
  if (!userEmail) {
    console.error('No logged-in user email found.');
    return;
  }

  try {
    console.log('Uploading notes...');

    const unuploadedNotes = uploadedNotes.filter(note => !note.isUploaded);
    if (unuploadedNotes.length === 0) {
      console.log('All notes are already uploaded.');
      return;
    }

    const projectRef = firestore()
      .collection('UserInformation')
      .doc(userEmail)
      .collection('Allocated Project')
      .doc(projectId);

    const batch = firestore().batch();
    const updatedNotes = [...uploadedNotes];

    for (let note of unuploadedNotes) {
      try {
        console.log(`Uploading images for note ${note.Serial}...`);

        // Upload vial and habitat images
        const uploadedVialImages = await Promise.all(note.images.map(image => uploadToCloudinary(image)));
        const uploadedHabitatImages = await Promise.all(note.imagess.map(image => uploadToCloudinary(image)));

        // Update note with Cloudinary URLs
        note.images = uploadedVialImages;
        note.imagess = uploadedHabitatImages;
        note.isUploaded = true;

        console.log(`Images uploaded for note ${note.Serial}, updating Firestore...`);

        // Firestore batch update
        const noteRef = projectRef.collection('Uploaded Note').doc(note.Serial.toString());
        batch.set(noteRef, note);
      } catch (error) {
        console.error(`Error uploading images for note ${note.Serial}:`, error);
      }
    }

    console.log('Committing batch to Firestore...');
    // Commit batch to Firestore
    await batch.commit();
    console.log('Notes uploaded successfully.');

    // Update the NotesUploaded collection
    const notesUploadedRef = firestore().collection('NotesUploaded').doc(project.projectName);
    const existingProjectDoc = await notesUploadedRef.get();

    if (existingProjectDoc.exists) {
      const existingNotes = existingProjectDoc.data().notes || [];
      const updatedNotesList = [...existingNotes, ...unuploadedNotes];
      console.log('Updating NotesUploaded collection with new notes...');
      await notesUploadedRef.update({ notes: updatedNotesList });
    } else {
      console.log('Creating new NotesUploaded document...');
      await notesUploadedRef.set({ notes: unuploadedNotes });
    }

    // Update project status in Firestore if all notes are uploaded
    const allNotesUploaded = uploadedNotes.every(note => note.isUploaded || unuploadedNotes.includes(note));
    if (allNotesUploaded) {
      console.log('All notes uploaded, updating project status...');
      await projectRef.update({ isUploaded: true });
      updateProjectUploadStatus(projectId, true);
    }

    // Update local storage and AsyncStorage
    const finalNotes = uploadedNotes.map(note =>
      unuploadedNotes.some(unNote => unNote.Serial === note.Serial)
        ? { ...note, isUploaded: true }
        : note
    );

    console.log('Updating AsyncStorage with uploaded notes...');
    setUploadedNotes(finalNotes);
    await AsyncStorage.setItem(projectId, JSON.stringify(finalNotes));

    console.log('AsyncStorage updated with uploaded notes.');

  } catch (error) {
    console.error('Error uploading notes:', error);
  }
};

const uploadToCloudinary = async (image) => {
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dvockpszn/image/upload'; // Replace with your Cloudinary URL
  const formData = new FormData();
  formData.append('file', {
    uri: image.uri,
    type: image.type || 'image/jpeg', // Ensure type is set
    name: image.name || 'upload.jpg',
  });
  
  formData.append('upload_preset', 'profile2');  // Replace with your Cloudinary upload preset

  try {
    console.log('Preparing to upload image to Cloudinary...');
    console.log('Image details:', {
      uri: image.uri,
      type: image.type,
      name: image.name,
    });

    // Log the form data to ensure it's correctly built
    console.log('Form data being sent to Cloudinary:', formData);

    // Log before making the upload request
    console.log('Sending POST request to Cloudinary...');

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    

    console.log('Cloudinary response status:', response.status); // Log response status

    // Log response headers for troubleshooting
    const responseHeaders = response.headers;
    console.log('Cloudinary response headers:', responseHeaders);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed with status:', response.status, errorText);
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload response:', data); // Log the full Cloudinary response

    // Check for the presence of secure_url in the response
    if (data.secure_url) {
      console.log('Image uploaded successfully to Cloudinary. URL:', data.secure_url);
      return data.secure_url;  // Return the Cloudinary URL
    } else {
      console.error('Cloudinary response did not contain secure_url:', data);
      throw new Error('Image upload failed, secure_url missing.');
    }
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};



const updateExcelFile = async (project, uploadedNotes, existingFilePath) => {
  try {
    let workbook;
    let worksheet;

    if (existingFilePath) {
      // Read existing file
      const fileData = await RNFS.readFile(existingFilePath, 'base64');
      const binaryData = Buffer.from(fileData, 'base64').toString('binary');
      workbook = XLSX.read(binaryData, { type: 'binary' });
    } else {
      // Create new workbook
      workbook = XLSX.utils.book_new();
    }

    // Define style for the header row (dark font)
    const headerStyle = {
      font: { bold: true, color: { rgb: '000000' } },  // Dark black color for font
    };

    // Function to add column widths
    const setColumnWidths = (worksheet, widths) => {
      worksheet['!cols'] = widths.map(width => ({ wch: width }));
    };

    // Check if "final" sheet exists
    if (workbook.SheetNames.includes("final")) {
      worksheet = workbook.Sheets["final"];
    } else {
      // Create sheet with headers and apply dark style to each header cell
      const headerRow = [
        ["Project", "Team", "Country", "City", "Start Date", "End Date", "Description", 
         "Site (Current Locality)", "Landmark Nearby", "Latitude", "Longitude", "No. of Vials", 
         "Morphs", "Abundance", "Observations", "Vial Pictures URIs", "Habitat Pictures URIs", "Substrate", 
         "Water", "Temperature", "Conductivity", "pH", "Turbidity (FNU)", "O2 Dis (%)", "Geology", 
         "Additional Notes"]
      ];
      
      worksheet = XLSX.utils.aoa_to_sheet(headerRow);

      // Apply header style to each cell in the header row
      Object.keys(worksheet).forEach((key) => {
        if (key[1] === '1') {  // Check if it's a header cell
          worksheet[key].s = headerStyle;
        }
      });

      // Set column widths for the header row
      setColumnWidths(worksheet, [10, 10, 10, 10, 30, 30, 30, 15, 20, 15, 15, 15, 15, 15, 20, 30, 30, 20, 20, 15, 15, 10, 20, 10, 20, 20]);

      XLSX.utils.book_append_sheet(workbook, worksheet, "final");
    }

    // Get existing data
    const existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Append each note as a separate row
    uploadedNotes.forEach(note => {
      const vialPicturesURIs = note.images.map(img => img.uri).join(', ');
      const habitatPicturesURIs = note.imagess.map(img => img.uri).join(', ');
      const selectedWaterTypes = note.selectedWaterTypes.join(', ');  // Join elements of selectedWaterTypes array
      const selectedSubstrates = note.selectedSubstrates.join(', ');
      const selectedGeology = note.selectedGeology.join(', ');

      const rowData = [
        project.projectName || '',
        project.habitats || '',
        project.country || '',
        project.cityName || '',
        project.fromDate || '',
        project.toDate || '',
        project.description || '',
        note.localityDesignation || '',  // Site Name
        note.landmarkNearby || '',
        note.coordinates ? note.coordinates.latitude : '',  // Check for null coordinates
        note.coordinates ? note.coordinates.longitude : '',  // Check for null coordinates
        note.numOfVials || '',
        note.morphs || '',
        note.abundance || '',
        note.observation || '',
        vialPicturesURIs || '',  // Vial Pictures URIs
        habitatPicturesURIs || '',  // Habitat Pictures URIs
        selectedSubstrates || '',
        selectedWaterTypes || '',  // Include each element of selectedWaterTypes array
        note.temperature || '',
        note.conductivity || '',
        note.pH || '',
        note.turbidity || '',
        note.o2dis || '',
        selectedGeology || '',
        note.additional || '',
      ];
      existingData.push(rowData);
    });

    // Update worksheet with new data
    worksheet = XLSX.utils.aoa_to_sheet(existingData);
    workbook.Sheets["final"] = worksheet;

    // Set column widths after converting to a sheet
    setColumnWidths(worksheet, [10, 10, 10, 10, 30, 30, 30, 15, 20, 15, 15, 15, 15, 10, 20, 30, 30, 20, 20, 15, 15, 10, 20, 10, 20, 20]);

    // Apply header style after converting to a sheet
    Object.keys(worksheet).forEach((key) => {
      if (key[1] === '1') {  // Check if it's a header cell
        worksheet[key].s = headerStyle;
      }
    });

    // Write updated Excel file
    const excelOutput = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

    // Define file path
    const filePath = `${RNFS.ExternalDirectoryPath}/Updated_APP_export.xlsx`;

    // Save file
    await RNFS.writeFile(filePath, excelOutput, 'base64');

    // Share the updated file
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      title: 'Updated Excel File',
    });

    console.log('Excel file updated successfully:', filePath);
  } catch (error) {
    console.error('Error updating the Excel file:', error);
  }
};


 
   const formatDate = dateString => {
     const date = new Date(dateString);
     return date.toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'short',
       day: 'numeric',
     });
   };
 
   if (!project) {
     return (
       <View style={styles.container}>
         <Text style={styles.loadingText}>Loading Project Details...</Text>
       </View>
     );
   }
 
 
   return (
     <ScrollView style={styles.container}>
       <View style={styles.headerContainer}>
         <TouchableOpacity onPress={() => navigation.navigate('Home2')} style={styles.backIconContainer}>
           <Text style={styles.backIcon}>{'\u2039'}</Text>
         </TouchableOpacity>
         <Text style={styles.projectId}>{project.projectName}</Text>
       </View>
 
       <View style={styles.locationSection}>
         <Text style={styles.location}>
           {project.cityName}, {project.country}
         </Text>
         <Text style={styles.dateRange}>
           {formatDate(project.fromDate)} - {formatDate(project.toDate)}
         </Text>
       </View>
 
       <View style={styles.teamSection}>
         <Text style={styles.teamLabel}>Team</Text>
         <Text style={styles.teamMembers}>
           {Array.isArray(project.habitats) ? project.habitats.join(' , ') : project.habitats}
         </Text>
       </View>
 
       <View style={styles.descriptionSection}>
         <Text style={styles.teamLabel}>Description:</Text>
         <Text style={styles.teamMembers}>
           {showFullDescription ? project.description : `${project.description.substring(0, 100)}`}
           <Text style={styles.toggleText} onPress={toggleDescription}>
             {showFullDescription ? '   ......less' : '  .....more'}
           </Text>
         </Text>
       </View>
 
       <View style={styles.fieldNotesSection}>
         <Text style={styles.fieldNotesLabel}>Field Notes</Text>
         {(uploadedNotes || []).length > 0 ? (
           <FlatList
           data={uploadedNotes}
           renderItem={({ item }) => (
               <TouchableOpacity
                   style={styles.noteEntry}
                   onPress={() => handleNotePress(item)}>
                   <View style={styles.noteInfo}>
                       <Text style={styles.noteDate}>{item.Serial}</Text>
                       <Text style={styles.noteUser}>{item.createdBy}</Text>
                   </View>
                   <Icon
                       name={item.isUploaded ? 'cloud-done' : 'edit'}
                       style={styles.noteIcon}
                   />
               </TouchableOpacity>
           )}
           keyExtractor={item => `${item.Serial}`}
       />
       
         ) : (
           <>
             <Text style={styles.noNotesMessage}>No field notes available.</Text>
             <Text style={styles.noNotesSubtext}>Create your first note to get started!</Text>
           </>
         )}
       </View>
 
       <View style={styles.buttonContainer}>
  <TouchableOpacity
    style={styles.uploadButton}
    onPress={handleUploadNotesPress}>
    <Text style={styles.uploadButtonText}>Upload</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.addButton2} onPress={handleAddNotesPress}>
    <Text style={styles.addButtonText2}>Add Site</Text>
  </TouchableOpacity>
</View>

     </ScrollView>
   );
 };
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#B6D4D2',
     padding: screenWidth * 0.05,
   },
   projectId: {
     fontSize: screenWidth * 0.06,
     fontWeight: 'bold',
     color: 'black',
   },
   locationSection: {
     marginBottom: screenHeight * 0.015,
   },
   location: {
     fontSize: screenWidth * 0.05,
     fontWeight: 'bold',
     color: 'black',
     marginLeft: screenWidth * 0.05,
     marginTop: screenHeight * 0.04,
   },
   dateRange: {
     fontSize: screenWidth * 0.04,
     color: 'black',
     marginLeft: screenWidth * 0.05,
     fontWeight: 'bold',
     marginTop: screenHeight * 0.01,
   },
   teamSection: {
     marginBottom: screenHeight * 0.02,
   },
   teamLabel: {
     fontSize: screenWidth * 0.05,
     fontWeight: 'bold',
     color: 'black',
     marginLeft: screenWidth * 0.05,
     marginTop: screenHeight * 0.02,
   },
   teamMembers: {
     fontSize: screenWidth * 0.04,
     color: 'black',
     marginLeft: screenWidth * 0.05,
     marginTop: screenHeight * 0.01,
   },
   fieldNotesSection: {
     marginBottom: screenHeight * 0.04,
     marginTop: screenHeight * 0.03,
   },
   fieldNotesLabel: {
     fontSize: screenWidth * 0.05,
     fontWeight: 'bold',
     color: 'black',
     marginLeft: screenWidth * 0.05,
     marginBottom: screenHeight * 0.02,
   },
   noNotesMessage: {
     fontSize: screenWidth * 0.04,
     color: 'black',
     marginTop: screenHeight * 0.15,
     textAlign: 'center',
     fontWeight: 'bold',
   },
   noNotesSubtext: {
     fontSize: screenWidth * 0.045,
     color: 'black',
     textAlign: 'center',
     marginTop: screenHeight * 0.005,
   },
   buttonContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginLeft: screenWidth * 0.05,
     marginRight: screenWidth * 0.05,
   },
   addButton: {
     backgroundColor: '#48938F',
     paddingVertical: screenHeight * 0.018,
     alignItems: 'center',
     marginTop: screenHeight * 0.12,
     paddingHorizontal: screenWidth * 0.25,
     justifyContent: 'center',
     borderRadius: 7,
     borderWidth: 2,
     marginLeft: screenWidth * 0.013,
     borderColor: 'black',
     marginBottom: screenHeight * 0.05
   },
   addButtonText: {
     fontSize: screenWidth * 0.058,
     fontWeight: 'bold',
     color: 'black',
   },
   addButton2: {
     backgroundColor: '#48938F',
     paddingVertical: screenHeight * 0.018,
     alignItems: 'center',
     paddingHorizontal: screenWidth * 0.05,
     borderRadius: 7,
     borderWidth: 2,
     borderColor: 'black',
     marginBottom: screenHeight * 0.04,
   },
   addButtonText2: {
     fontSize: screenWidth * 0.05,
     fontWeight: 'bold',
     color: 'black',
   },
   uploadButton: {
     backgroundColor: '#48938F',
     paddingVertical: screenHeight * 0.015,
     alignItems: 'center',
     paddingHorizontal: screenWidth * 0.08,
     borderRadius: 7,
     borderWidth: 2,
     borderColor: 'black',
     marginBottom: screenHeight * 0.04,
   },
   uploadButtonText: {
     fontSize: screenWidth * 0.055,
     fontWeight: 'bold',
     color: 'black',
   },
   noteEntry: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#48938F',
     padding: screenHeight * 0.02,
     borderRadius: 10,
     marginVertical: screenHeight * 0.005,
     marginLeft: screenWidth * 0.045,
     marginRight: screenWidth * 0.045,
   },
   iconContainer: {
     width: screenWidth * 0.08,
     justifyContent: 'center',
     alignItems: 'center',
   },
   noteInfo: {
     flex: 1,
     paddingLeft: screenWidth * 0.04,
   },
   noteDate: {
     fontSize: screenWidth * 0.04,
     fontWeight: 'bold',
     paddingBottom: screenHeight * 0.005,
     color: 'black',
   },
   noteUser: {
     fontSize: screenWidth * 0.035,
     color: 'black',
   },
   noteIcon: {
     fontSize: screenWidth * 0.08,
     fontWeight: 'bold',
     color: 'black',
   },
   loadingText: {
     fontSize: 18,
     textAlign: 'center',
     color: 'gray',
   },
   toggleText: {
     color: 'blue',
     fontSize: 16,
   },
   headerContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'flex-start',
     marginBottom: screenHeight * 0.02,
   },
   backIconContainer: {
     marginRight: screenWidth * 0.17,
     marginLeft: screenWidth * 0.058,
     marginBottom: screenHeight * 0.01,
   },
   backIcon: {
     fontSize: screenWidth * 0.10,
     fontWeight: 'bold',
     color: 'black',
   },
 });
 
 export default ProjectDetails;





