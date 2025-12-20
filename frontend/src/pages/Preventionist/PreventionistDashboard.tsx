import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import type { UserInfo } from '@/services/authService';

const PreventionistDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [supervisors, setSupervisors] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const data = await userService.getSupervisors();
        setSupervisors(data);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisors();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectSupervisor = (supervisorId: number) => {
    // For now we just log it, we'll implement navigation later
    console.log('Selected supervisor:', supervisorId);
    // navigate(`/preventionist/supervisor/${supervisorId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Prevencionista</h1>
            <p className="text-sm text-gray-500 mt-1">Sesión: {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700">Supervisores a cargo</h2>
        
        {loading ? (
          <p>Cargando supervisores...</p>
        ) : supervisors.length === 0 ? (
          <p className="text-gray-500 italic">No tienes supervisores asignados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisors.map((supervisor) => (
              <Card key={supervisor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{supervisor.username}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{supervisor.email}</p>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectSupervisor(supervisor.id)}
                  >
                    Ver Actividades
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreventionistDashboard;
