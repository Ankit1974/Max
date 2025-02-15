import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Svg, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DonutChart = React.memo(() => {
  const size = 115;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const uploadedProgress = 0.74;
  const pendingProgress = 0.14;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E0E0E0"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#48938F"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${uploadedProgress * circumference}, ${circumference}`}
        strokeDashoffset={0}
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#ACCAC8"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${pendingProgress * circumference}, ${circumference}`}
        strokeDashoffset={-uploadedProgress * circumference}
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
});

const HomeScreen = ({ navigation }) => {
  const [allocatedProjects, setAllocatedProjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

  const totalCreated = useMemo(() => allocatedProjects.length, [allocatedProjects]);
  const totalAllocated = useMemo(() => allocatedProjects.filter(project => project.isAllocated).length, [allocatedProjects]);
  const totalCount = useMemo(() => totalCreated + totalAllocated, [totalCreated, totalAllocated]);
  const uploadedCount = useMemo(() => allocatedProjects.filter(project => project.isUploaded).length, [allocatedProjects]);
  const pendingCount = useMemo(() => totalCreated - uploadedCount, [totalCreated, uploadedCount]);

  // Helper function to format dates
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date(dateString));
  };


  // Function for fetching data from Allocated Project ( Sub - Collection ) when Internet are Avilable 
  const fetchAllocatedProjects = useCallback(async () => {
    try {
      const user = auth().currentUser;
      if (user && user.email) {
        const allocatedProjectsRef = firestore()
          .collection('UserInformation')
          .doc(user.email)
          .collection('Allocated Project'); 

        const snapshot = await allocatedProjectsRef.get();
        const projects = snapshot.docs.map(doc => doc.data());

        setAllocatedProjects(projects);
        await AsyncStorage.setItem('allocatedProjects', JSON.stringify(projects));
      }
    } catch (error) {
      console.error('Error fetching allocated projects:', error);
    }
  }, []);

  //Fteching the User Data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const userDoc = await firestore().collection('UserInformation').doc(currentUser.email).get();
          if (userDoc.exists) {
            setUserData(userDoc.data());
            await AsyncStorage.setItem('UserData', JSON.stringify(userDoc.data()));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);
  
    
  

  
  //Function for fetching data from allocatedProjects when Internet are not Avilable 
  const loadOfflineData = useCallback(async () => {
    try {
      const savedAllocatedProjects = await AsyncStorage.getItem('allocatedProjects');
      if (savedAllocatedProjects) setAllocatedProjects(JSON.parse(savedAllocatedProjects));
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

 //Checking Intenet Connection
  useEffect(() => {
    const checkConnectionAndFetch = async () => {
      try {
        const online = true; 
        if (online) {
          fetchAllocatedProjects();
        } else {
          await loadOfflineData();
        }
      } catch (error) {
        console.error('Error in connection check:', error);
      }
    };
    checkConnectionAndFetch();
  }, [fetchAllocatedProjects, loadOfflineData]);

 //Refresh to Load new projects
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllocatedProjects().finally(() => setRefreshing(false));
  }, [fetchAllocatedProjects]);


 //Project Rendering 
  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.projectItem}
      onPress={() =>
        navigation.navigate('ProjectDetails', { projectId: item.id })
      }
    >
      <View style={styles.projectDetails}>
        <Text style={styles.projectID}>{item.projectName}</Text>
        <Text style={styles.CityCountry}>
          {item.cityName || 'No city'}, {item.country || 'No country'}
        </Text>
        <Text style={styles.Date}>
          {item.fromDate && item.toDate
            ? `${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`
            : 'No date range'}
        </Text>
      </View>
      <View style={styles.statusIcon}>
        {item.isUploaded ? (
          <Icon name="cloud-done" size={28} color="black" />
        ) : (
          <Icon name="pending-actions" size={28} color="black" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Image source={{ uri: 'logo5' }} style={styles.logo} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.instituteName}>Max Planck Institute</Text>
          <Text style={styles.instituteDesc}>For multidisciplinary Sciences</Text>
        </View>
        <TouchableOpacity
          style={styles.profileIcon}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Icon name="account-circle" size={43} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalProjects}>
        <Text style={styles.totalTitle}>Total Projects</Text>
        <View style={styles.projectContent}>
          <View style={styles.donutChart}>
            <DonutChart />
            <Text style={styles.totalCount}>{totalCount}</Text>
          </View>
          <View style={styles.statusLegend}>
            <View style={styles.statusRow}>
              <View style={[styles.statusColorBox, { backgroundColor: '#48938F' }]} />
              <Text style={styles.statusText}>
                <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{uploadedCount}</Text> Uploaded
              </Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusColorBox, { backgroundColor: '#ACCAC8' }]} />
              <Text style={styles.statusText}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{pendingCount}</Text> Pending
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Allocated Projects</Text>
      <FlatList
        data={allocatedProjects}
        renderItem={renderProject}
        keyExtractor={item => item.id}
        style={styles.projectList}
      />
    </ScrollView>
  );
};

const { width, height } = Dimensions.get('window');

const scaleFont = size => size * PixelRatio.getFontScale();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: width * 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.07,
    marginTop: height * 0.02,
  },
  logo: {
    width: width * 0.12,
    height: width * 0.12,
    marginRight: width * 0.06,
    marginLeft: width * 0.03,
  },
  instituteName: {
    fontSize: scaleFont(22),
    fontWeight: 'bold',
    color: '#333',
  },
  headerTextContainer: {
    flex: 1,
  },
  instituteDesc: {
    fontSize: scaleFont(14),
    color: 'black',
  },
  totalProjects: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'black',
    height: height * 0.25,
    marginHorizontal: width * 0.02,
    marginLeft: width * 0.04,
  },
  totalTitle: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    marginBottom: height * 0.01,
    color: 'black',
    marginLeft: width * 0.02,
  },
  projectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: width * 0.02,
  },
  donutChart: {
    position: 'relative',
    width: width * 0.3,
    height: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.05,
    marginTop: height * 0.01,
  },
  totalCount: {
    position: 'absolute',
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: 'black',
  },
  statusLegend: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
    marginLeft: width * 0.06,
    marginTop: height * 0.017,
  },
  statusColorBox: {
    width: width * 0.05,
    height: width * 0.03,
    marginRight: width * 0.02,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  statusText: {
    fontSize: 15,
    color: 'black',
  },
  sectionTitle: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    marginBottom: height * 0.026,
    color: 'black',
    marginLeft: width * 0.04,
    marginTop: height * 0.012,
  },
  projectList: {
    marginBottom: 8,
    marginLeft: width * 0.04,
    marginRight: width * 0.036,
  },
  projectItem: {
    flexDirection: 'row',
    padding: width * 0.06,
    alignItems: 'center',
    backgroundColor: '#ACCAC8',
    borderRadius: 10,
    marginBottom: height * 0.015,
    height: height * 0.15,
  },
  projectDetails: {
    flex: 1,
  },
  projectID: {
    fontSize: scaleFont(16),
    color: 'black',
    marginBottom: height * 0.008,
  },
  CityCountry: {
    fontSize: scaleFont(16),
    color: 'black',
    fontWeight: 'bold',
    marginBottom: height * 0.008,
  },
  Date: {
    fontSize: scaleFont(16),
    color: 'black',
  },
  statusIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * -0.06,
  },
  profileIcon: {
    marginLeft: 'auto',
  },
});

export default HomeScreen;








// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   FlatList,
//   TouchableOpacity,
//   RefreshControl,
//   ScrollView,
//   Dimensions,
//   PixelRatio,
// } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Svg, Circle } from 'react-native-svg';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const DonutChart = React.memo(() => {
//   const size = 115;
//   const strokeWidth = 10;
//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;

//   const uploadedProgress = 0.74;
//   const pendingProgress = 0.14;

//   return (
//     <Svg width={size} height={size}>
//       <Circle
//         cx={size / 2}
//         cy={size / 2}
//         r={radius}
//         stroke="#E0E0E0"
//         strokeWidth={strokeWidth}
//         fill="none"
//       />
//       <Circle
//         cx={size / 2}
//         cy={size / 2}
//         r={radius}
//         stroke="#48938F"
//         strokeWidth={strokeWidth}
//         fill="none"
//         strokeDasharray={`${uploadedProgress * circumference}, ${circumference}`}
//         strokeDashoffset={0}
//         rotation={-90}
//         origin={`${size / 2}, ${size / 2}`}
//       />
//       <Circle
//         cx={size / 2}
//         cy={size / 2}
//         r={radius}
//         stroke="#ACCAC8"
//         strokeWidth={strokeWidth}
//         fill="none"
//         strokeDasharray={`${pendingProgress * circumference}, ${circumference}`}
//         strokeDashoffset={-uploadedProgress * circumference}
//         rotation={-90}
//         origin={`${size / 2}, ${size / 2}`}
//       />
//     </Svg>
//   );
// });

// const HomeScreen = ({ navigation }) => {
//   const [allocatedProjects, setAllocatedProjects] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [lastVisible, setLastVisible] = useState(null); // Track last visible document


//   // Measure rendering start time
//   const renderStartTime = performance.now();

//   useEffect(() => {
//     // Measure rendering end time
//     const renderEndTime = performance.now();
//     console.log(`HomeScreen render time: ${(renderEndTime - renderStartTime).toFixed(2)} ms`);
//   }, []);



//   const totalCreated = useMemo(() => allocatedProjects.length, [allocatedProjects]);
//   const totalAllocated = useMemo(() => allocatedProjects.filter(project => project.isAllocated).length, [allocatedProjects]);
//   const totalCount = useMemo(() => totalCreated + totalAllocated, [totalCreated, totalAllocated]);
//   const uploadedCount = useMemo(() => allocatedProjects.filter(project => project.isUploaded).length, [allocatedProjects]);
//   const pendingCount = useMemo(() => totalCreated - uploadedCount, [totalCreated, uploadedCount]);

  
//   // Helper function to format dates
//   const formatDate = (dateString) => {
//     const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
//     return new Intl.DateTimeFormat('en-GB', options).format(new Date(dateString));
//   };



//   // Function for fetching data from Allocated Project ( Sub - Collection ) when Internet are Avilable 
//   const fetchAllocatedProjects = useCallback(async (isLoadMore = false) => {
//     try {
//       const user = auth().currentUser;
//       if (user && user.email) {
//         const allocatedProjectsRef = firestore()
//           .collection('UserInformation')
//           .doc(user.email)
//           .collection('Allocated Project')
//           .limit(3);
        
//           if (lastVisible) {
//             allocatedProjectsRef = allocatedProjectsRef.startAfter(lastVisible); // Start after the last visible document
//           }

//         const snapshot = await allocatedProjectsRef.get();
//         const projects = snapshot.docs.map(doc => doc.data());
//         //const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1]; // Get the last document from the snapshot

//         //setAllocatedProjects(projects);
//         if (isLoadMore) {
//           setAllocatedProjects(prevProjects => [...prevProjects, ...projects]);
//         } else {
//           setAllocatedProjects(projects);
//         }
//         //setLastVisible(lastVisibleDoc); // Update the last visible document
//         setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);

//         await AsyncStorage.setItem('allocatedProjects', JSON.stringify(projects));
//       }
//     } catch (error) {
//       console.error('Error fetching allocated projects:', error);
//     }
//   }, [lastVisible]);


//   const loadMoreProjects = () => {
//     if (!loadingMore) {
//       setLoadingMore(true);
//       fetchAllocatedProjects().finally(() => setLoadingMore(false));
//     }
//   };


  
//   //Function for fetching data from allocatedProjects when Internet are not Avilable 
//   const loadOfflineData = useCallback(async () => {
//     try {
//       const savedAllocatedProjects = await AsyncStorage.getItem('allocatedProjects');
//       if (savedAllocatedProjects) setAllocatedProjects(JSON.parse(savedAllocatedProjects));
//     } catch (error) {
//       console.error('Error loading offline data:', error);
//     }
//   }, []);

//  //Checking Intenet Connection
//   useEffect(() => {
//     const checkConnectionAndFetch = async () => {
//       try {
//         const online = true; 
//         if (online) {
//           fetchAllocatedProjects();
//         } else {
//           await loadOfflineData();
//         }
//       } catch (error) {
//         console.error('Error in connection check:', error);
//       }
//     };
//     checkConnectionAndFetch();
//   }, [fetchAllocatedProjects, loadOfflineData]);

//  //Refresh to Load new projects
//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     setLastVisible(null); // Reset last visible document for a fresh start
//     setAllocatedProjects([]);
//     fetchAllocatedProjects().finally(() => setRefreshing(false));
//   }, [fetchAllocatedProjects]);


//  //Project Rendering 
//   const renderProject = ({ item }) => (
//     <TouchableOpacity
//       style={styles.projectItem}
//       onPress={() =>
//         navigation.navigate('ProjectDetails', { projectId: item.id })
//       }
//     >
//       <View style={styles.projectDetails}>
//         <Text style={styles.projectID}>{item.projectName}</Text>
//         <Text style={styles.CityCountry}>
//           {item.cityName || 'No city'}, {item.country || 'No country'}
//         </Text>
//         <Text style={styles.Date}>
//           {item.fromDate && item.toDate
//             ? `${formatDate(item.fromDate)} - ${formatDate(item.toDate)}`
//             : 'No date range'}
//         </Text>
//       </View>
//       <View style={styles.statusIcon}>
//         {item.isUploaded ? (
//           <Icon name="cloud-done" size={28} color="black" />
//         ) : (
//           <Icon name="pending-actions" size={28} color="black" />
//         )}
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//     >
//       <View style={styles.header}>
//         <Image source={{ uri: 'logo5' }} style={styles.logo} />
//         <View style={styles.headerTextContainer}>
//           <Text style={styles.instituteName}>Max Planck Institute</Text>
//           <Text style={styles.instituteDesc}>For multidisciplinary Sciences</Text>
//         </View>
//         <TouchableOpacity
//           style={styles.profileIcon}
//           onPress={() => navigation.navigate('ProfileScreen')}
//         >
//           <Icon name="account-circle" size={43} color="black" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.totalProjects}>
//         <Text style={styles.totalTitle}>Total Projects</Text>
//         <View style={styles.projectContent}>
//           <View style={styles.donutChart}>
//             <DonutChart />
//             <Text style={styles.totalCount}>{totalCount}</Text>
//           </View>
//           <View style={styles.statusLegend}>
//             <View style={styles.statusRow}>
//               <View style={[styles.statusColorBox, { backgroundColor: '#48938F' }]} />
//               <Text style={styles.statusText}>
//                 <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{uploadedCount}</Text> Uploaded
//               </Text>
//             </View>
//             <View style={styles.statusRow}>
//               <View style={[styles.statusColorBox, { backgroundColor: '#ACCAC8' }]} />
//               <Text style={styles.statusText}>
//                 <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{pendingCount}</Text> Pending
//               </Text>
//             </View>
//           </View>
//         </View>
//       </View>

//       <Text style={styles.sectionTitle}>Allocated Projects</Text>
//       <FlatList
//         data={allocatedProjects}
//         renderItem={renderProject}
//         keyExtractor={item => item.id}
//          onEndReached={loadMoreProjects}
//         onEndReachedThreshold={0.5}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//         style={styles.projectList}
//       />
//     </ScrollView>
//   );
// };

// const { width, height } = Dimensions.get('window');

// const scaleFont = size => size * PixelRatio.getFontScale();

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//     padding: width * 0.04,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: height * 0.07,
//     marginTop: height * 0.02,
//   },
//   logo: {
//     width: width * 0.12,
//     height: width * 0.12,
//     marginRight: width * 0.06,
//     marginLeft: width * 0.03,
//   },
//   instituteName: {
//     fontSize: scaleFont(22),
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   instituteDesc: {
//     fontSize: scaleFont(14),
//     color: 'black',
//   },
//   totalProjects: {
//     backgroundColor: 'white',
//     borderRadius: 8,
//     padding: width * 0.05,
//     marginBottom: height * 0.02,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: 'black',
//     height: height * 0.25,
//     marginHorizontal: width * 0.02,
//     marginLeft: width * 0.04,
//   },
//   totalTitle: {
//     fontSize: scaleFont(20),
//     fontWeight: 'bold',
//     marginBottom: height * 0.01,
//     color: 'black',
//     marginLeft: width * 0.02,
//   },
//   projectContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: width * 0.02,
//   },
//   donutChart: {
//     position: 'relative',
//     width: width * 0.3,
//     height: width * 0.3,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: width * 0.05,
//     marginTop: height * 0.01,
//   },
//   totalCount: {
//     position: 'absolute',
//     fontSize: scaleFont(24),
//     fontWeight: 'bold',
//     color: 'black',
//   },
//   statusLegend: {
//     flex: 1,
//   },
//   statusRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: height * 0.01,
//     marginLeft: width * 0.06,
//     marginTop: height * 0.017,
//   },
//   statusColorBox: {
//     width: width * 0.05,
//     height: width * 0.03,
//     marginRight: width * 0.02,
//     borderRadius: 5,
//     borderWidth: 1,
//     borderColor: 'black',
//   },
//   statusText: {
//     fontSize: 15,
//     color: 'black',
//   },
//   sectionTitle: {
//     fontSize: scaleFont(20),
//     fontWeight: 'bold',
//     marginBottom: height * 0.026,
//     color: 'black',
//     marginLeft: width * 0.04,
//     marginTop: height * 0.012,
//   },
//   projectList: {
//     marginBottom: 8,
//     marginLeft: width * 0.04,
//     marginRight: width * 0.036,
//   },
//   projectItem: {
//     flexDirection: 'row',
//     padding: width * 0.06,
//     alignItems: 'center',
//     backgroundColor: '#ACCAC8',
//     borderRadius: 10,
//     marginBottom: height * 0.015,
//     height: height * 0.15,
//   },
//   projectDetails: {
//     flex: 1,
//   },
//   projectID: {
//     fontSize: scaleFont(16),
//     color: 'black',
//     marginBottom: height * 0.008,
//   },
//   CityCountry: {
//     fontSize: scaleFont(16),
//     color: 'black',
//     fontWeight: 'bold',
//     marginBottom: height * 0.008,
//   },
//   Date: {
//     fontSize: scaleFont(16),
//     color: 'black',
//   },
//   statusIcon: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: height * -0.06,
//   },
//   profileIcon: {
//     marginLeft: 'auto',
//   },
// });

// export default HomeScreen;
