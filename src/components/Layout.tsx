
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Moon, Sun, Scale, Pc } from "lucide-react";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchArticle from "./SearchArticle";
import AllLaws from "./AllLaws";

const Layout = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("search");
  const isMobile = useIsMobile();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 hidden md:flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h1 className="text-primary font-serif font-bold text-xl">VADE MECUM <span className="text-gradient-primary font-bold">PRO</span></h1>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <Tabs 
              value={activeTab} 
              onValueChange={handleTabChange}
              className="flex-1 md:flex-initial"
            >
              <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Pesquisar</span>
                </TabsTrigger>
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Ver Tudo</span>
                </TabsTrigger>
                {!isMobile && (
                  <TabsTrigger value="pc" className="flex items-center gap-2">
                    <Pc className="h-4 w-4" />
                    <span className="hidden sm:inline">Versão PC</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className={`container py-3 ${isMobile ? 'px-2' : 'py-8'}`}>
          {activeTab === "search" && <SearchArticle />}
          {activeTab === "browse" && <AllLaws />}
          {activeTab === "pc" && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <Pc className="h-16 w-16 text-primary" />
              <h2 className="text-2xl font-bold text-center">Versão para Desktop</h2>
              <p className="text-center text-muted-foreground max-w-md">
                Esta versão do VADE MECUM PRO foi otimizada para uso em computadores desktop, oferecendo recursos avançados de edição e análise.
              </p>
              <Button variant="default" size="lg" className="mt-4">
                Acessar versão completa
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        <div className="container">
          <p>VADE MECUM <span className="font-bold">PRO</span> &copy; {new Date().getFullYear()} - leis tiradas do site https://www.gov.br/planalto/pt-br</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
