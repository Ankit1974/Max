import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StyleSheet, TouchableOpacity, Modal, Image, Dimensions 
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const MangerVialPictureUploaded = ({ route }) => {
  const { projectName } = route.params;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
   const navigation = useNavigation();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        console.log(`Fetching notes for project: ${projectName}`);
        const doc = await firestore().collection('NotesUploaded').doc(projectName).get();
        if (doc.exists) {
          console.log('Document found:', doc.data());
          setNotes(doc.data().notes || []);
        } else {
          console.log('No document found for project:', projectName);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [projectName]);

  if (loading) {
    console.log('Loading notes...');
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }


  return (
      <View style={styles.container}>
       <View style={styles.headerContainer}>
  <TouchableOpacity onPress={() => navigation.navigate('Project')}>
    <Text style={styles.backText2}>{'\u2039'}</Text>
  </TouchableOpacity>
  <Text style={styles.header}>Vial Picture</Text>
</View>

        <FlatList
          data={notes}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item, index }) => {
            console.log(`Rendering note ${index}:`, item);
            return item.images?.map((img, imgIndex) => {
              console.log(`Rendering image ${imgIndex}:`, img);
              return (
                <TouchableOpacity 
                  key={imgIndex} 
                  style={styles.noteEntry} 
                  onPress={() => setSelectedImage(img.uri)}
                >
                  <View style={styles.iconContainer}>
                    <FontAwesome name="file-image-o" size={34} color="black" />
                  </View>
                  <View style={styles.noteInfo}>
                    <Text style={styles.imageName}>{img.name || 'Unnamed'}.jpeg</Text>
                    <Text style={styles.imageSize}>{img.sizeMB || '0'}MB</Text>
                  </View>
                </TouchableOpacity>
              );
            });
          }}
          contentContainerStyle={styles.listContent}
        />
    
    
      {/* Modal to show full image */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B9D1D0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
  },
  iconContainer: {
    marginRight: 15,
  },
  noteInfo: {
    justifyContent: 'center',
    flex: 1,
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
  listContent: {
    paddingBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width * 0.9,
    height: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
  },
  closeText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color:"black",
    textAlign: 'center',
    marginVertical: 10,
  },
  headerContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
  },  
  backText2: {
    fontSize: width * 0.10,
    color: 'black',
    fontWeight: 'bold',
    marginRight: 0,  // Reduced spacing for better alignment
    marginLeft:7
  },
  header: {
    fontSize: width * 0.053,
    fontWeight: 'bold',
    color: 'black',
    flex: 1,
    textAlign: 'center',  // Keeps "Vial Picture" centered
  },
  
});

export default MangerVialPictureUploaded;
