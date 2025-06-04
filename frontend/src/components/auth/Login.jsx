import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    const result = await login(values.username, values.password)
    setLoading(false)
    
    if (!result.success) {
      message.error(result.message)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center',   
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card title="Autentificare" style={{ width: 400 }}>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Introduceți numele de utilizator!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nume utilizator" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Introduceți parola!' }]}
          >
            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder="Parolă"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              Autentificare
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login