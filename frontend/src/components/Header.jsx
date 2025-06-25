import React from 'react'
import { Button, Dropdown, Avatar } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login') // Redirecționează la login după logout
    }
    if (key === 'profile') {
      // Navigare către Dashboard în loc de profil
      navigate('/dashboard')
    }
  }

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Deconectare',
    },
  ]

  return (
    <header className="bg-white">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/images/sti_logo.png" 
            alt="STI logo" 
            className="h-12 w-auto" 
            onClick={() => navigate('/dashboard')} // Adaugă navigare la dashboard la click pe logo
            style={{ cursor: 'pointer' }}
          />
        </div> 

        <div className="flex items-center gap-4 cursor-pointer">
          {currentUser ? (
            <Dropdown 
              menu={{ items: menuItems, onClick: handleMenuClick }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar 
                  size="default" 
                  icon={<UserOutlined />} 
                  src={currentUser.avatar}
                />
                <span className="font-medium">{currentUser.username}</span>
              </div>
            </Dropdown>
          ) : (
            <Button 
              type="primary" 
              onClick={() => navigate('/login')}
              className="bg-[#1D4CA0] hover:bg-[#1D4CA0]/90 font-semibold text-white px-4 py-2.5 rounded-md transition-colors"
            >
              Autentificare
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header