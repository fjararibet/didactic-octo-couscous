import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import SupervisorCalendarView from './SupervisorCalendarView';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Supervisor</h1>
            <p className="text-sm text-gray-500 mt-1">Sesión: {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">Bienvenido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bienvenido al área de gestión de supervisores.</p>
            <div className="mt-4 p-4 border rounded-md bg-white">
              <h3 className="font-semibold mb-2">Resumen de Actividad</h3>
              <p className="text-sm text-gray-500">Aquí se mostrarán métricas y alertas relevantes para el rol de supervisión.</p>
            </div>
            <SupervisorCalendarView />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
