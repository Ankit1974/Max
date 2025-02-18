

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Function to scale font sizes based on screen width
const scaleFont = (size) => {
  const scale = width / 320;
  return Math.round(size * scale);
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);


  useEffect(() => {
    const checkLoginStatus = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        navigation.replace('MainTabs');
      }
    };

    checkLoginStatus();
  }, []);


  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
  
    try {
      // Firebase login
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      await AsyncStorage.setItem('user', JSON.stringify(userCredential.user));
      //Alert.alert('Success', `Welcome back, ${userCredential.user.name}!`);
      const userName = userCredential.user.displayName ;
      Alert.alert('Success', `Welcome back, ${userName}!`);

      navigation.replace('MainTabs'); // Replace the login screen with MainTabs
    } catch (error) {
      // Handle Firebase authentication errors
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No user found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };
  

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <View style={styles.container}>
      <Image
        source={{ uri: 'logo4' }} // Ensure this is a valid image URL
        style={styles.image}
      />
      <Text style={styles.welcomeText}>Welcome!</Text>
      <Text style={styles.instituteText}>Max Planck Institute</Text>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Icon
            name="email-outline"
            size={24}
            color="#6e6e6e"
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Email ID"
            style={styles.textInput}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail} // Update email state
          />
        </View>
        <View style={styles.separator} />

        <View style={styles.inputWrapper}>
          <Icon
            name="lock-outline"
            size={26}
            color="#6e6e6e"
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Password"
            style={styles.textInput}
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword} // Update password state
          />
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.eyeIconWrapper}>
            <Icon
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={27}
              color="black"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      {/* Divider */}
      <Text style={styles.orText}>OR</Text>

      {/* Register Link */}
      <Text style={styles.registerText}>
        New User?{' '}
        <Text style={styles.registerLink} onPress={() => navigation.navigate('SignUpScreen')}>
          Register
        </Text>
      </Text>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: width * 0.05,
    justifyContent: 'center',
    //height: height,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: 'contain',
    borderRadius: 30,
    backgroundColor: 'white',
    marginLeft: width * 0.03,
  },
  welcomeText: {
    fontSize: scaleFont(29),
    fontWeight: 'bold',
    color: 'black',
    marginLeft: width * 0.26,
  },
  instituteText: {
    fontSize: scaleFont(18),
    color: 'black',
    fontWeight: 'bold',
    marginTop: height * 0.005,
    marginLeft: width * 0.20,
    marginBottom: height * 0.03,
  },
  loginButton: {
    marginTop: height * 0.03,
    backgroundColor: '#48938F',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.09,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    marginLeft: width * 0.06,
    marginRight: width * 0.06,
  },
  loginButtonText: {
    fontSize: scaleFont(18),
    color: 'black',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: height * 0.02,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.003,
    paddingHorizontal: width * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
  },
  inputIcon: {
    marginRight: width * 0.04,
    marginLeft: -7,
    color: 'black',
  },
  textInput: {
    flex: 1,
    height: height * 0.05,
    color:"black"
  },
  eyeIconWrapper: {
    marginLeft: width * 0.03,
  },
  forgotPassword: {
    textAlign: 'right',
    color: 'blue',
    fontSize: width * 0.04,
    marginBottom: height * 0.045,
    marginRight: 15,
  },
  orText: {
    textAlign: 'center',
    color: '#6e6e6e',
    marginVertical: height * 0.03,
  },
  registerText: {
    textAlign: 'center',
    marginTop: height * 0.02,
    color: 'black',
    fontSize: 15,
  },
  registerLink: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 15,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 0,
    marginLeft: 50,
    marginBottom: 25,
    marginRight: 15,
  },
});

export default LoginScreen;
