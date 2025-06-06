import React from 'react'
import { useNavigate } from 'react-router-dom'; // Adaugă importul
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CallMadeOutlinedIcon from '@mui/icons-material/CallMadeOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

const Hero = () => {
    const navigate = useNavigate();
  return (
    <section className="bg-gradient-to-r from-[#1D4CA0] to-[#1D4CA0] text-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Platforma de monitorizare a indicatorilor de activitate pentru Servicii Tehnologii Informaționale
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-10 text-blue-100">
            Aici vei putea vizualiza și completa indicatorii specifici subdiviziunii tale
          </p>
          
          {/* CTA Button */}
         <button 
            onClick={() => navigate('/dashboard')} // Redirecționează către /dashboard
            className="inline-block bg-white text-[#1D4CA0] px-6 py-3 rounded-md mb-12 text-lg font-medium transition hover:bg-blue-50 cursor-pointer"
          >
            Începe Monitorizarea
          </button> 

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {/* Feature 1 */}
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm flex flex-col items-center">
              <MapOutlinedIcon className="text-white text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Centralizare completă</h3>
              <p className="text-blue-100">
                Accesează datele în timp real, cu o privire de ansamblu clară asupra performanței subdiviziunii tale.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm flex flex-col items-center">
              <SettingsOutlinedIcon className="text-white text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Automatizarea raportării</h3>
              <p className="text-blue-100">
                Generează rapoarte precise fără a depinde de procese manuale, economisind timp și resurse.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm flex flex-col items-center">
              <CallMadeOutlinedIcon className="text-white text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Îmbunătățirea eficienței</h3>
              <p className="text-blue-100">
                Monitorizează indicatorii continuu pentru a identifica rapid zonele de îmbunătățire.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm flex flex-col items-center">
              <SecurityOutlinedIcon className="text-white text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Securitate și confidențialitate</h3>
              <p className="text-blue-100">
              Protejează datele tale cu standarde avansate, asigurând confidențialitate și acces controlat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero;
