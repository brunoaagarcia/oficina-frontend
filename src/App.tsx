import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { RotaProtegida } from './components/RotaProtegida';
import { Login } from './pages/Login';
import { TrocarSenha } from './pages/TrocarSenha';
import { ListaOS } from './pages/ListaOS';
import { AbrirOS } from './pages/AbrirOS';
import { DetalheOS } from './pages/DetalheOS';
import { Usuarios } from './pages/Usuarios';
import { Painel } from './pages/Painel';
import { Backup } from './pages/Backup';
import { Clientes } from './pages/Clientes';
import { DetalheCliente } from './pages/DetalheCliente';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/trocar-senha"
            element={
              <RotaProtegida semNav>
                <TrocarSenha />
              </RotaProtegida>
            }
          />
          <Route
            path="/"
            element={
              <RotaProtegida>
                <ListaOS />
              </RotaProtegida>
            }
          />
          <Route
            path="/abrir"
            element={
              <RotaProtegida>
                <AbrirOS />
              </RotaProtegida>
            }
          />
          <Route
            path="/os/:id"
            element={
              <RotaProtegida>
                <DetalheOS />
              </RotaProtegida>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RotaProtegida>
                <Usuarios />
              </RotaProtegida>
            }
          />
          <Route
            path="/painel"
            element={
              <RotaProtegida>
                <Painel />
              </RotaProtegida>
            }
          />
          <Route
            path="/backup"
            element={
              <RotaProtegida>
                <Backup />
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes"
            element={
              <RotaProtegida>
                <Clientes />
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <RotaProtegida>
                <DetalheCliente />
              </RotaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
