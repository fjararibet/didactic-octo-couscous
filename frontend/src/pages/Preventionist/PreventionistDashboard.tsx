import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import type { UserInfo } from '@/services/authService';
import { User } from 'lucide-react';
import { StatusesPieChart } from '../Supervisor/StatusesPieChart';

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
    navigate(`/preventionist/supervisor/${supervisorId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    return colors[id % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Prevencionista</h1>
            <p className="text-sm text-gray-500 mt-1">Sesión: {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/preventionist/activities')}>
              Ver Actividades
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700">Supervisores a cargo</h2>
        
        {loading ? (
          <p>Cargando supervisores...</p>
        ) : supervisors.length === 0 ? (
          <p className="text-gray-500 italic">No tienes supervisores asignados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisors.map((supervisor) => (
              <Card key={supervisor.id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className={`w-20 h-20 rounded-full ${getAvatarColor(supervisor.id)} flex items-center justify-center mb-4 shadow-md`}>
                      <span className="text-2xl font-bold text-white">
                        {getInitials(supervisor.username)}
                      </span>
                    </div>

                    {/* Info */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {supervisor.username}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1 flex items-center justify-center gap-1">
                      <User className="w-3 h-3" />
                      Supervisor
                    </p>
                    <p className="text-xs text-gray-600 mb-4">{supervisor.email}</p>

                    {/* Chart */}
                    <StatusesPieChart userId={supervisor.id} />

                    {/* Button */}
                    <Button
                      className="w-full cursor-pointer"
                      onClick={() => handleSelectSupervisor(supervisor.id)}
                    >
                      Ver Actividades
                    </Button>
                  </div>
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
