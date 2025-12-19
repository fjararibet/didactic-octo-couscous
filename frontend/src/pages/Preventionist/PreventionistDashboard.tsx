import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';

const PreventionistDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Prevencionista</h1>
            <p className="text-sm text-gray-500 mt-1">Sesión: {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800">Bienvenido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bienvenido al área de gestión de seguridad y prevención.</p>
            <div className="mt-4 p-4 border rounded-md bg-white">
              <h3 className="font-semibold mb-2">Reportes de Seguridad</h3>
              <p className="text-sm text-gray-500">Aquí se mostrarán los últimos incidentes y auditorías de seguridad.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreventionistDashboard;
