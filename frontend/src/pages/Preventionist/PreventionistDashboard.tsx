import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import ActivityCalendarView from '@/components/ActivityCalendar/ActivityCalendarView';

const PreventionistDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock user ID (in real app, this would come from authenticated user)
  const userId = 1;

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

        <ActivityCalendarView userId={userId} />
      </div>
    </div>
  );
};

export default PreventionistDashboard;
