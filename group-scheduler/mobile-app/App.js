import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import CreateSessionScreen from './src/screens/CreateSessionScreen';
import JoinSessionScreen from './src/screens/JoinSessionScreen';
import ImportCalendarScreen from './src/screens/ImportCalendarScreen';
import ResultsScreen from './src/screens/ResultsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Group Scheduler' }}
        />
        <Stack.Screen 
          name="CreateSession" 
          component={CreateSessionScreen} 
          options={{ title: 'Create Session' }}
        />
        <Stack.Screen 
          name="JoinSession" 
          component={JoinSessionScreen} 
          options={{ title: 'Join Session' }}
        />
        <Stack.Screen 
          name="ImportCalendar" 
          component={ImportCalendarScreen} 
          options={{ title: 'Import Calendar' }}
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen} 
          options={{ title: 'Results' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
