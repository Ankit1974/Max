import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const scale = width / 375; // Base width for scaling
const responsiveSize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));


const ProfileScreen = ({navigation}) => {  // Add navigation as a prop
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;

        if (currentUser) {
          const userDoc = await firestore()
            .collection('UserInformation')
            .doc(currentUser.email)
            .get();



          if (userDoc.exists) {
            const {name, photo, phone, institution, email} = userDoc.data();
            setName(name || '');
            setProfileImage(photo || null);
            setPhone(phone || '');
            setInstitution(institution || '');
            setEmail(email || '');
            console.log(phone)
          } else {
            console.error('User data not found in Firestore.');
            Alert.alert('Error', 'User data could not be retrieved.');
          }
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
        Alert.alert('Error', 'Failed to fetch user data.');
      }
    };

    fetchUserData();
  }, []);

  

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      await auth().signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Logout failed.');
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', onPress: handleDeleteAccount, style: 'destructive'},
      ],
    );
  };

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 300,
      maxHeight: 300,
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const uri = response.assets[0].uri;
        setProfileImage(uri);
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
          <Icon name="log-out-outline" size={30} color="black"  fontWeight="bold"/>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.headerText}>My Profile</Text>
        <TouchableOpacity onPress={pickImage}>
          {profileImage ? (
            <Image source={{uri: profileImage}} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text>Upload Profile Picture</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone:</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Institution:</Text>
          <TextInput
            style={styles.input}
            value={institution}
            onChangeText={setInstitution}
            placeholder="Enter your institution"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your institution"
          />
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#A0B6B0',
  },
  header: {
    backgroundColor: '#A0B6B0',
    height: height * 0.15,
    borderBottomLeftRadius: responsiveSize(10),
    borderBottomRightRadius: responsiveSize(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
  },
  logoutIcon: {
    padding: responsiveSize(10),
  },
  headerText: {
    fontSize: responsiveSize(24),
    fontWeight: 'bold',
    color: 'black',
  },
  container: {
    flex: 1,
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderTopLeftRadius: responsiveSize(30),
    borderTopRightRadius: responsiveSize(30),
  },
  image: {
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: height * 0.03,
  },
  imagePlaceholder: {
    width: width * 0.35,
    height: width * 0.35,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  inputContainer: {
    marginBottom: height * 0.02,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: width * 0.03,
    borderRadius: responsiveSize(20),
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    color: 'black',
  },
  deleteButton: {
    marginTop: height * 0.03,
    backgroundColor: '#48938F',
    paddingVertical: responsiveSize(18),
    borderRadius: responsiveSize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: responsiveSize(18),
    fontWeight: '600',
    color: 'black',
  },
  label: {
    fontSize: responsiveSize(16),
    fontWeight: 'bold',
    color: 'gray',
  },
});
export default ProfileScreen;
