import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Página não encontrada</p>
        <p className="text-sm text-muted-foreground mb-6">
          A página que você está tentando acessar não existe ou foi movida.
        </p>
        <a 
          href="/" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Voltar para o Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
