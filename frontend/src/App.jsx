import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Clasificar from './pages/Clasificar.jsx';
import Historial from './pages/Historial.jsx';
import Taxonomia from './pages/Taxonomia.jsx';
import SelectorAnalista from './components/SelectorAnalista.jsx';

const CLAVE = 'analista';

// localStorage puede no estar disponible (modo privado): la app funciona igual, sin recordar.
const leer = () => {
  try { return localStorage.getItem(CLAVE) || ''; } catch { return ''; }
};
const guardar = (nombre) => {
  try { localStorage.setItem(CLAVE, nombre); } catch { /* sin almacenamiento: no se recuerda */ }
};

export default function App() {
  const [analista, setAnalista] = useState(leer);
  const cambiar = (nombre) => { setAnalista(nombre); guardar(nombre); };

  // Sin analista (visitante) solo se ve /taxonomia.
  const protegida = (pagina) =>
    analista ? pagina : <p className="aviso" data-testid="sin-analista">Selecciona tu nombre para continuar</p>;

  return (
    <>
      <header>
        <strong>FarmaNova · Clasificador</strong>
        <nav>
          <NavLink to="/" end>Clasificar</NavLink>
          <NavLink to="/historial">Historial</NavLink>
          <NavLink to="/taxonomia">Taxonomía</NavLink>
        </nav>
        <SelectorAnalista analista={analista} cambiar={cambiar} />
      </header>
      <main>
        <Routes>
          <Route path="/" element={protegida(<Clasificar analista={analista} />)} />
          <Route path="/historial" element={protegida(<Historial analista={analista} />)} />
          <Route path="/taxonomia" element={<Taxonomia />} />
        </Routes>
      </main>
    </>
  );
}
