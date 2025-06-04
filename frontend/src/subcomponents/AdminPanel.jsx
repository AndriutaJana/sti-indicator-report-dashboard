import React, { useState } from 'react';
import { Card, Select, Spin } from 'antd';
import IndicatorsForm from './IndicatorsForm';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

const AdminPanel = () => {
  const [subdivisions, setSubdivisions] = useState([]);
  const [selectedSubdivision, setSelectedSubdivision] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchSubdivisions = async () => {
      setLoading(true);
      try {
        const response = await api.get('/subdivisions');
        setSubdivisions(response.data);
      } catch (error) {
        console.error('Error fetching subdivisions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubdivisions();
  }, []);

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <Card title="Admin Dashboard">
      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 300 }}
          placeholder="Select a subdivision"
          onChange={setSelectedSubdivision}
          value={selectedSubdivision}
        >
          {subdivisions.map(subdivision => (
            <Option key={subdivision.id} value={subdivision.id}>
              {subdivision.name}
            </Option>
          ))}
        </Select>
      </div>

      {selectedSubdivision && (
        <IndicatorsForm subdivisionId={selectedSubdivision} />
      )}
    </Card>
  );
};

export default AdminPanel;