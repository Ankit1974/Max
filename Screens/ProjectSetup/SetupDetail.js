import React, {useState , useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Dimensions} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialIcons'; // or another icon set
import {useUploadStatus} from '../../ContextAPI/UploadStatusProvider';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; // To get the logged-in user's email
const {width, height} = Dimensions.get('window');
const SetupDetail = () => {
  

  // State variables to manage project details and UI states
  const [selectedHabitats, setSelectedHabitats] = useState([]); // Tracks selected Team Members
  const [projectId, setProjectId] = useState(''); // Stores generated project ID
  const [projectName, setProjectName] = useState(''); // Stores project name
  const [cityName, setCityName] = useState(''); // Stores city name
  const [expandedBox, setExpandedBox] = useState(null); // Tracks which box is expanded
  const [fromDate, setFromDate] = useState(null); // Tracks start date
  const [toDate, setToDate] = useState(null); // Tracks end date
  const [showDatePicker, setShowDatePicker] = useState({
    isVisible: false, // Tracks visibility of date picker
    field: '', // Tracks which field (from or to date) to update
  });
  const [description, setDescription] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigation = useNavigation();
  const [habitats, setHabitats] = useState([]);
  //const habitats = ['Ankit', 'Raj', 'Ayush', 'Anuj'];

  // Hardcoded list of 200 country names
  const countries = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'Andorra',
    'Angola',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'Brunei',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cabo Verde',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo (Congo-Brazzaville)',
    'Congo (Congo-Kinshasa)',
    'Costa Rica',
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czech Republic (Czechia)',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Eswatini',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Greece',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Korea (North)',
    'Korea (South)',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Myanmar (Burma)',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'North Macedonia',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Sweden',
    'Switzerland',
    'Syria',
    'Taiwan',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Vatican City',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Zambia',
    'Zimbabwe',
  ];
  const [searchText, setSearchText] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Access addProject from context API
  const {addProject} = useUploadStatus();

  // Handles selecting a country from the dropdown
  const handleCountrySelection = country => {
    setSelectedCountry(country); // Set the selected country
    setSearchText(''); // Clear the search text
    setIsDropdownVisible(false); // Hide the dropdown
  };

   // Fetch user names from Firestore
   useEffect(() => {
    const fetchHabitats = async () => {
      try {
        const userRef = firestore().collection('ALLUserName'); // Assuming 'users' collection
        const snapshot = await userRef.get();
        const userNames = snapshot.docs.map(doc => doc.data().name); // Assuming 'name' field in user document
        setHabitats(userNames);
      } catch (error) {
        console.error('Error fetching habitats:', error);
        Alert.alert('Error', 'There was an error fetching the habitat names.');
      }
    };

    fetchHabitats();
  }, []);

  const fetchTeamMembersMapping = async () => {
    const snapshot = await firestore()
      .collection('ALLUserName')
      .get();
  
    const mapping = {};
    snapshot.forEach(doc => {
      const { name, email } = doc.data();
      mapping[name] = email;
    });
    return mapping;
  };
  

  // Toggles Team Members selection
  const toggleHabitat = habitat => {
    if (selectedHabitats.includes(habitat)) {
      setSelectedHabitats(selectedHabitats.filter(item => item !== habitat)); // Remove if already selected
    } else {
      setSelectedHabitats([...selectedHabitats, habitat]); // Add if not already selected
    }
  };

  // Focus handlers for description input
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Generates a unique project ID using selected country , start date and Random Character / Number
  const generateProjectId = () => {

    // Get first 3 characters of the country
    const countryCode =
      selectedCountry && selectedCountry.length >= 3
        ? selectedCountry.trim().substring(0, 3).toUpperCase()
        : selectedCountry.trim().toUpperCase();

    // Format the date as DDMMYY
    const datePart =
      fromDate instanceof Date
        ? (function () {
            const localDate = new Date(fromDate); // Ensure it's treated as a Date object
            const day = String(localDate.getDate()).padStart(2, '0'); // Local day
            const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Local month
            const year = String(localDate.getFullYear()).slice(2, 4); // Last two digits of the year
            return `${day}${month}${year}`;
          })()
        : '';
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${countryCode}${datePart}${randomPart}`;
  };


  // function to format the date
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');  // Ensure two digits for day
  const month = String(date.getMonth() + 1).padStart(2, '0');  // Ensure two digits for month
  const year = date.getFullYear();  // Get full year (e.g., 2024)
  
  return `${day}/${month}/${year}`;
};

  // Handles date picker changes
  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'set') {
      if (showDatePicker.field === 'from') {
        setFromDate(selectedDate);
      } else if (showDatePicker.field === 'to') {
        setToDate(selectedDate);
      }
    }
    setShowDatePicker({isVisible: false, field: ''});
  };

  // Displays date picker for specific fields
  const showDatePickerHandler = field => {
    setShowDatePicker({isVisible: true, field});
  };

  // Validates form inputs and submits the project
  const handleSubmit = async () => {
    try {
      const teamMembersMapping = await fetchTeamMembersMapping();
  
      if (selectedHabitats.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one team member.');
        return;
      }
  
      if (fromDate && toDate && fromDate > toDate) {
        Alert.alert('Date Error', 'From date cannot be later than To date.');
        return;
      }
  
      const generatedId = generateProjectId();
      setProjectId(generatedId);
  
      const newProject = {
        id: generatedId,
        projectName,
        habitats: selectedHabitats,
        country: selectedCountry,
        cityName,
        fromDate: fromDate ? fromDate.toISOString() : null,
        toDate: toDate ? toDate.toISOString() : null,
        description,
      };
  
      // Store the new project locally
      const storedProjects = await AsyncStorage.getItem('projects');
      const projects = storedProjects ? JSON.parse(storedProjects) : [];
      projects.push(newProject);
      await AsyncStorage.setItem('projects', JSON.stringify(projects));
  
      // Store the new project for the current user
      const user = auth().currentUser;
      if (user && user.email) {
        const userRef = firestore()
          .collection('UserInformation')
          .doc(user.email)
          .collection('Project Created')
          .doc(generatedId);
        await userRef.set(newProject);
      }
  
      // Allocate project to team members
      for (const member of selectedHabitats) {
        const memberEmail = teamMembersMapping[member];
        if (memberEmail) {
          const memberRef = firestore()
            .collection('UserInformation')
            .doc(memberEmail)
            .collection('Allocated Project')
            .doc(generatedId);
          await memberRef.set(newProject);
        }
      }
  
      // Update project count for the selected country
      // Update project count for the selected country
const countryRef = firestore()
.collection('Country Number')
.doc(generatedId)
.collection('selectedCountry')
.doc(selectedCountry);

await firestore().runTransaction(async (transaction) => {
const doc = await transaction.get(countryRef);
if (!doc.exists) {
  transaction.set(countryRef, { count: 1 }); // Initialize count for the country
} else {
  const newCount = (doc.data().count || 0) + 1;
  transaction.update(countryRef, { count: newCount });
}
});

  
      // Add project to the global state
      addProject(newProject);
  
      Alert.alert('Success', 'Project created and allocated to team members successfully!');
      navigation.navigate('SetupScreen2', { newProject });
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Error', 'There was an error saving your project.');
    }
  };
  
  // Function to toggle expand/collapse of the selected box
  const toggleExpand = box => {
    setExpandedBox(expandedBox === box ? null : box); // Close if already open, open new box
  };

  // Function to check if all required fields are filled
  const isFormValid = () => {
    return (
      projectName &&
      selectedHabitats.length > 0 &&
      cityName &&
      fromDate &&
      toDate &&
      description &&
      selectedCountry
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SetupScreen')}
            style={styles.backIconContainer}>
            <Text style={styles.backIcon}>{'\u2039'}</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Setup Project</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Project Name"
          placeholderTextColor="gray"
          value={projectName}
          onChangeText={text => setProjectName(text)}
        />
        <View style={styles.habitatContainer}>
          <View style={styles.habitatDescriptionBox}>
            <View style={styles.selectedHabitatsContainer}>
              <View style={styles.selectedHabitatsWrapper}>
                {selectedHabitats.length === 0 ? (
                  <Text style={styles.placeholderText}>Select Team</Text>
                ) : (
                  selectedHabitats.map((habitat, index) => (
                    <Text key={index} style={styles.habitatTag}>
                      {habitat}
                    </Text>
                  ))
                )}
                {selectedHabitats.length > 4 && !isExpanded && (
                  <Text style={styles.additionalText}>
                    +{selectedHabitats.length - 4}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => toggleExpand('habitats')}>
                <Icon
                  name={
                    expandedBox === 'habitats' ? 'expand-less' : 'expand-more'
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
                      v
                      style={styles.checkbox}
                    />
                    <Text style={styles.habitatText}>{habitat}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          placeholder="Country"
          placeholderTextColor="gray"
          value={selectedCountry}
          onFocus={() => setIsDropdownVisible(true)}
          onChangeText={text => {
            setSelectedCountry(text);
            setIsDropdownVisible(true);
          }}
        />
        {isDropdownVisible && (
          <FlatList
            data={countries.filter(
              country =>
                selectedCountry &&
                country.toLowerCase().includes(selectedCountry.toLowerCase()),
            )}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => handleCountrySelection(item)}>
                <Text style={styles.countryText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.countryList}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="City"
          placeholderTextColor="gray"
          value={cityName}
          onChangeText={text => setCityName(text)}
        />

        {/* Select Start Date */}
        <Text style={styles.label}>Dates</Text>
        <TouchableOpacity onPress={() => showDatePickerHandler('from')}>
          <View style={styles.dateBoxContainer}>
            <TextInput
              style={styles.dateBox}
              placeholder="Select Start Date"
              placeholderTextColor="gray"
              value={fromDate ? formatDate(fromDate) : ''}
              editable={false}
            />
            <Icons
              name="calendar-today"
              size={20}
              color="gray"
              style={styles.calendarIcon}
            />
          </View>
        </TouchableOpacity>

        {/* Select End Date */}
        <TouchableOpacity onPress={() => showDatePickerHandler('to')}>
          <View style={styles.dateBoxContainer}>
            <TextInput
              style={styles.dateBox}
              placeholder="Select End Date"
              placeholderTextColor="gray"
              value={toDate ? formatDate(toDate) : ''}
              editable={false}
            />
            <Icons
              name="calendar-today"
              size={20}
              color="gray"
              style={styles.calendarIcon}
            />
          </View>
        </TouchableOpacity>
        {showDatePicker.isVisible && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="calendar"
            onChange={handleDateChange}
          />
        )}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input2}
          value={description}
          onChangeText={text => setDescription(text)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline
        />

        {/* Conditionally render the Submit Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={!isFormValid()}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ACCAC8',
  },
  scrollViewContent: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  backIconContainer: {
    position: 'absolute',
    left: 0,
    marginLeft: 9,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'Playfair Display',
  },
  backIcon: {
    fontSize: 45,
    fontWeight: 'bold',
    color: 'black',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 28,
    color: '#000000',
    marginLeft: 5,
    fontFamily: 'Playfair Display',
  },
  habitatContainer: {
    marginTop: 20,
  },
  input: {
    height: 72,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    padding: 25,
    marginTop: 15,
    color: 'black',
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  input2: {
    height: 200,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 18,
    color: 'black',
    padding: 17,
    marginTop: 15,
    backgroundColor: '#FFF',
    textAlignVertical: 'top',
  },
  observationsInput: {
    height: 125,
    textAlignVertical: 'top',
    marginTop: 2,
  },
  habitatDescriptionBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 21,
    marginBottom: 5,
    borderColor: '#000000',
    borderWidth: 1,
  },
  selectedHabitatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedHabitatsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  habitatTag: {
    backgroundColor: 'black',
    color: '#FFF',
    padding: 9,
    borderRadius: 12,
    margin: 2,
    fontSize: 12,
  },
  additionalText: {
    fontSize: 12,
    color: '#808080',
  },
  habitatList: {
    marginTop: 10,
  },
  habitatCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 10,
  },
  habitatText: {
    fontSize: 16,
    color: 'black',
  },
  measurementContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementBox: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    borderColor: '#000000',
    paddingHorizontal: 40,
    backgroundColor: '#fff', 
    color: '#000', 
  },
  placeholderText: {
    fontSize: 16,
    color: 'gray',
    margin: 2,
  },
  button: {
    width: width * 0.9, 
    height: 60, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    marginTop: 35,
    backgroundColor: '#48938F',
    marginLeft: 'auto', 
    marginRight: 'auto',
  },
  buttonText: {
    color: 'black',
    fontSize: 21,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 2,
    fontWeight: 'bold',
    marginLeft: 5,
    marginTop: 17,
  },
  dateBox: {
    height: 74,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    padding: 28,
    marginTop: 15,
    color: 'black',
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  dateBoxWrapper: {
    position: 'relative',
  },
  calendarIcon: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{translateY: -10}],
    fontSize: 33,
    color: 'black',
  },
  countryList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: 'black',
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
  },
  countryText: {
    fontSize: 16,
    padding: 4,
    marginLeft: 10,
    borderColor: 'black',
    color: 'black',
  },
  selectedCountry: {
    fontSize: 16,
    color: 'green',
    marginTop: 10,
  },
  noResultText: {
    fontSize: 14,
    color: 'red',
    marginTop: 5,
  },
});

export default SetupDetail;


