import React, { useEffect, useState } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs';
import { useApi } from '../hooks/useApi';
import TemplateCard from '../components/TemplateCard';

export default function Templates() {
  const { get, put } = useApi();
  const [locale, setLocale] = useState('en');
  const [templates, setTemplates] = useState([]);

  const fetchTemplates = async () => {
    try {
      const result = await get(`/api/templates?locale=${locale}`);
      setTemplates(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Templates fetch failed:', err);
    }
  };

  useEffect(() => { fetchTemplates(); }, [locale]);

  const handleSave = async (templateId, body) => {
    await put(`/api/templates/${templateId}`, { body });
  };

  return (
    <div>
      <Tabs selectedItem={locale} onChange={setLocale}>
        <TabList>
          <Tab item="en">English</Tab>
          <Tab item="ar">العربية</Tab>
        </TabList>
        <TabPanel item="en">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onSave={handleSave} />
          ))}
          {templates.length === 0 && <p style={{ color: '#87929d', padding: '16px' }}>No templates found. Connect your gateway first.</p>}
        </TabPanel>
        <TabPanel item="ar">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onSave={handleSave} />
          ))}
          {templates.length === 0 && <p style={{ color: '#87929d', padding: '16px' }}>لا توجد قوالب. قم بتوصيل البوابة اولا.</p>}
        </TabPanel>
      </Tabs>
    </div>
  );
}
