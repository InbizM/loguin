import React, { useState, useEffect, FormEvent, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// Fix: Add paypal to the Window interface to avoid TypeScript errors.
declare global {
  interface Window {
    paypal: any;
  }
}

// --- Gemini API Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- User Data Structure ---
interface UserData {
  password: string;
  credits: number;
  profileImage: string | null;
}

// --- Falsa base de datos en localStorage ---
const DB_KEY = 'betterimg_users_v2';

const getUsers = (): Record<string, UserData> => {
  try {
    const users = localStorage.getItem(DB_KEY);
    return users ? JSON.parse(users) : {};
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
    return {};
  }
};

const saveUsers = (users: Record<string, UserData>) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
};

// --- Icon Components ---
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

const DefaultAvatarIcon = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="60" fill="url(#grad)"/>
        <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E1E1E"/>
                <stop offset="1" stopColor="#121212"/>
            </linearGradient>
        </defs>
        <path d="M60 40L75 55L60 70L45 55L60 40Z" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
        <path d="M50 60L60 70L70 60" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
    </svg>
);


// --- Componente del Formulario de Autenticación ---
interface AuthFormProps {
  isRegister: boolean;
  onSubmit: (email: string, password: string) => void;
  toggleForm: () => void;
  error: string;
  isGenerating: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isRegister, onSubmit, toggleForm, error, isGenerating }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [animateError, setAnimateError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const currentError = error || localError;

  useEffect(() => {
    if (currentError) {
      setAnimateError(true);
      const timer = setTimeout(() => setAnimateError(false), 500); // Duración de la animación
      return () => clearTimeout(timer);
    }
  }, [currentError]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (isRegister && password !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }
    if (!email || !password) {
      setLocalError("Por favor, completa todos los campos.");
      return;
    }
    onSubmit(email, password);
  };

  const title = isRegister ? "Crear Cuenta" : "Iniciar Sesión";
  let buttonText = isRegister ? "Registrarse" : "Entrar";
  if (isRegister && isGenerating) {
    buttonText = "Generando avatar...";
  }
  const toggleText = isRegister ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?";
  const toggleButtonText = isRegister ? "Inicia sesión" : "Regístrate";

  return (
    <div className="auth-container">
      <h1 className="logo">betterimg<span>.art</span></h1>
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Correo electrónico"
            disabled={isGenerating}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <div className="password-input-wrapper">
             <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Contraseña"
              disabled={isGenerating}
            />
            <button 
              type="button" 
              className="password-toggle-btn" 
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              disabled={isGenerating}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        {isRegister && (
          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-label="Confirmar Contraseña"
                disabled={isGenerating}
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={isGenerating}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        )}
        <p className={`error-message ${animateError ? 'active-error' : ''}`} aria-live="polite">{currentError}</p>
        <button type="submit" className={`btn btn-primary ${isGenerating ? 'loading' : ''}`} disabled={isGenerating}>
          {buttonText}
        </button>
      </form>
      <div className="toggle-auth">
        {toggleText} <button onClick={toggleForm} disabled={isGenerating}>{toggleButtonText}</button>
      </div>
    </div>
  );
};

// --- Componente del Panel de Usuario ---
interface DashboardProps {
    user: UserData;
    email: string;
    onLogout: () => void;
    onAddCredits: (amount: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, email, onLogout, onAddCredits }) => {
    const [showPayPal, setShowPayPal] = useState(false);
    
    const imageUrl = user.profileImage
        ? `data:image/png;base64,${user.profileImage}`
        : `data:image/svg+xml;base64,${btoa('<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="58" stroke="rgba(255,255,255,0.2)" stroke-width="2"/><path d="M60 40L80 60L60 80L40 60L60 40Z" stroke="#00f2ea" stroke-width="2"/><path d="M50 70L60 80L70 70" stroke="#00f2ea" stroke-width="1"/></svg>')}`;

    const handlePayPalApprove = useCallback(async (data: any, actions: any) => {
        try {
            const order = await actions.order.capture();
            console.log('Pago completado:', order);
            onAddCredits(100);
            setShowPayPal(false); // Ocultar botones después de la compra
        } catch (error) {
             console.error('Error capturando el pago de PayPal:', error);
        }
    }, [onAddCredits]);

    useEffect(() => {
        if (!showPayPal || !window.paypal) {
            return;
        }

        const container = document.getElementById('paypal-button-container');
        if (!container) {
            return;
        }
        
        container.innerHTML = '';
        
        try {
            window.paypal.Buttons({
                createOrder: (data: any, actions: any) => {
                    return actions.order.create({
                        purchase_units: [{
                            description: '100 créditos para betterimg.art',
                            amount: {
                                value: '5.00', // Valor de prueba
                            },
                        }],
                    });
                },
                onApprove: handlePayPalApprove,
                onError: (err: any) => {
                    console.error('Error de PayPal SDK:', err);
                },
            }).render('#paypal-button-container');
        } catch (error) {
            console.error('Fallo al renderizar los botones de PayPal:', error);
        }
    }, [showPayPal, handlePayPalApprove]);

    return (
        <div className="auth-container dashboard-container">
            <h1 className="logo">betterimg<span>.art</span></h1>
            <h2>Panel de Usuario</h2>
            <img src={imageUrl} alt="Avatar de perfil" className="profile-image" />
            <div className="user-info">
                 <p><strong>Usuario:</strong> {email}</p>
                 <p className="user-credits"><strong>Créditos:</strong> <span>{user.credits}</span></p>
            </div>
            
            <div className="buy-credits-section">
                <div className="divider" />
                {!showPayPal && (
                    <button onClick={() => setShowPayPal(true)} className="btn btn-primary">
                        Comprar 100 Créditos
                    </button>
                )}
                <div id="paypal-button-container" style={{ display: showPayPal ? 'block' : 'none', marginTop: '15px' }}></div>
            </div>

            <button onClick={onLogout} className="btn btn-secondary">Cerrar Sesión</button>
        </div>
    );
};


// --- Componente Principal de la Aplicación ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<{email: string; data: UserData} | null>(null);
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Simular sesión persistente
    const userEmail = sessionStorage.getItem('currentUser');
    if (userEmail) {
      const users = getUsers();
      if(users[userEmail]) {
        setCurrentUser({ email: userEmail, data: users[userEmail] });
      }
    }
  }, []);

  const handleAddCredits = useCallback((amount: number) => {
    setCurrentUser(prevUser => {
        if (!prevUser) return null;

        const users = getUsers();
        const userEmail = prevUser.email;
        const userData = users[userEmail];

        if (userData) {
            const updatedUserData: UserData = {
                ...userData,
                credits: userData.credits + amount
            };
            
            const updatedUsers = { ...users, [userEmail]: updatedUserData };
            saveUsers(updatedUsers);

            return { email: userEmail, data: updatedUserData };
        }
        return prevUser;
    });
  }, []);

  const handleRegister = async (email: string, password: string) => {
    setError('');
    const users = getUsers();
    if (users[email]) {
      setError("Este correo electrónico ya está registrado.");
      return;
    }
    
    setIsGenerating(true);
    let profileImage: string | null = null;
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'An abstract, artistic, futuristic avatar for a digital art platform. A glowing neon orb of creative energy, with vibrant cyan and magenta light trails on a dark, minimalist background. A sense of digital innovation and artistry. Logo-like simplicity.',
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        profileImage = response.generatedImages[0].image.imageBytes;
    } catch (e) {
        console.error("AI image generation failed:", e);
        setError("No se pudo generar el avatar. Inténtalo más tarde.");
    }

    const newUser: UserData = {
        password: password, 
        credits: 10,
        profileImage: profileImage
    };

    const newUsers = { ...users, [email]: newUser };
    saveUsers(newUsers);
    setIsGenerating(false);

    if (profileImage) { 
      handleLogin(email, password); 
    }
  };

  const handleLogin = (email: string, password: string) => {
    setError('');
    const users = getUsers();
    const userData = users[email];
    if (userData && userData.password === password) {
      setCurrentUser({ email, data: userData });
      sessionStorage.setItem('currentUser', email);
    } else {
      setError("Correo electrónico o contraseña incorrectos.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setError('');
    setIsRegisterView(false);
  };

  if (currentUser) {
    return (
      <Dashboard
        user={currentUser.data}
        email={currentUser.email}
        onLogout={handleLogout}
        onAddCredits={handleAddCredits}
      />
    );
  }

  return (
    <AuthForm
      key={isRegisterView ? 'register' : 'login'}
      isRegister={isRegisterView}
      onSubmit={isRegisterView ? handleRegister : handleLogin}
      toggleForm={() => {
        setIsRegisterView(!isRegisterView);
        setError('');
      }}
      error={error}
      isGenerating={isGenerating}
    />
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}