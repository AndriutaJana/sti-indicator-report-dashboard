import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Card, Row, Col, Spin, message } from 'antd';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const IndicatorsForm = ({ subdivisionId }) => {
  const [form] = Form.useForm();
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchIndicators = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/indicators/subdivision/${subdivisionId}`);
        setIndicators(response.data);
        
        // Initialize form with empty values for each indicator
        const initialValues = {};
        response.data.forEach(indicator => {
          initialValues[`indicator_${indicator.id}`] = null;
        });
        form.setFieldsValue(initialValues);
      } catch (error) {
        console.error('Error fetching indicators:', error);
        message.error('Failed to load indicators');
      } finally {
        setLoading(false);
      }
    };

    if (subdivisionId) {
      fetchIndicators();
    }
  }, [subdivisionId, form]);

  const onFinish = async (values) => { 
    setSubmitting(true);
    try {
      // Prepare records for submission
      const records = indicators.map(indicator => ({
        indicator_id: indicator.id,
        value: values[`indicator_${indicator.id}`],
        record_date: new Date().toISOString().split('T')[0],
        notes: '' // Can be extended to include notes if needed
      }));

      // Send to backend
      await api.post('/indicators/records', { records });
      
      message.success('Indicators saved successfully!');
      form.resetFields();
    } catch (error) {
      console.error('Error saving indicators:', error);
      message.error('Failed to save indicators');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card title={`Loading indicators...`}>
        <Spin size="large" />
      </Card>
    );
  }

  if (!indicators.length) {
    return (
      <Card title={`No indicators found for this subdivision`}>
        <p>Please contact your administrator to set up indicators.</p>
      </Card>
    );
  }

  return (
    <Card title={`Enter Indicator Values - ${currentUser.subdivision_name || ''}`}>
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        initialValues={{}}
      >
        <Row gutter={16}>
          {indicators.map(indicator => (
            <Col span={8} key={indicator.id}>
              <Form.Item
                name={`indicator_${indicator.id}`}
                label={`${indicator.name} (${indicator.measurement_unit})`}
                rules={[
                  { required: true, message: 'This field is required' },
                  { 
                    type: 'number',
                    min: 0,
                    message: 'Value must be positive'
                  }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder={`Enter value in ${indicator.measurement_unit}`}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={submitting}
          >
            Save Indicators
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default IndicatorsForm;