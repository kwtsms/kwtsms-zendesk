import React, { useState } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import Logs from './pages/Logs';
import { ZafProvider } from './hooks/useZafClient';

export default function App() {
  const [selectedTab, setSelectedTab] = useState('dashboard');

  return (
    <ZafProvider>
      <div style={{ padding: '16px' }}>
        <Tabs selectedItem={selectedTab} onChange={setSelectedTab}>
          <TabList>
            <Tab item="dashboard">Dashboard</Tab>
            <Tab item="settings">Settings</Tab>
            <Tab item="templates">Templates</Tab>
            <Tab item="logs">Logs</Tab>
          </TabList>
          <TabPanel item="dashboard"><Dashboard /></TabPanel>
          <TabPanel item="settings"><Settings /></TabPanel>
          <TabPanel item="templates"><Templates /></TabPanel>
          <TabPanel item="logs"><Logs /></TabPanel>
        </Tabs>
      </div>
    </ZafProvider>
  );
}
