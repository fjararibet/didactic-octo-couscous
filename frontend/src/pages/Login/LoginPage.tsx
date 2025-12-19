import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('supervisor');
  const [errors, setErrors] = useState({ email: '', password: '' });

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(selectedRole === 'supervisor' ? '/dashboard/supervisor' : '/dashboard/preventionist');
    }
  }, [isAuthenticated, navigate, selectedRole]);

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El correo electrónico no es válido';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
      isValid = false;
    } else if (password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm() && selectedRole) {
      login(email, selectedRole);
      const redirectPath = selectedRole === 'supervisor'
        ? '/dashboard/supervisor'
        : '/dashboard/preventionist';
      navigate(redirectPath);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  placeholder="usuario@empresa.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="role">Rol</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={selectedRole === 'supervisor' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSelectedRole('supervisor')}
                  >
                    Supervisor
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === 'preventionist' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSelectedRole('preventionist')}
                  >
                    Prevencionista
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => {
            setEmail('');
            setPassword('');
            setSelectedRole('supervisor');
          }}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleLogin}>Ingresar</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
