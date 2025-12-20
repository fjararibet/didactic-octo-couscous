import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'supervisor' ? '/dashboard/supervisor' : '/dashboard/preventionist');
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors = { email: '', password: '', general: '' };
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({ email: '', password: '', general: '' });

    try {
      await login(email, password);
      // Navigation will happen via the useEffect above
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        email: '',
        password: '',
        general: error instanceof Error ? error.message : 'Error al iniciar sesión. Verifica tus credenciales.',
      });
    } finally {
      setIsLoading(false);
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
              {errors.general && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  placeholder="usuario@empresa.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email || errors.general) setErrors({ email: '', password: '', general: '' });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogin(e);
                    }
                  }}
                  className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={isLoading}
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
                    if (errors.password || errors.general) setErrors({ email: '', password: '', general: '' });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogin(e);
                    }
                  }}
                  className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            type="submit"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
