
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Moon, Sun, Scale } from "lucide-react";
import { useTheme } from "next-themes";
import SearchArticle from "./SearchArticle";
import AllLaws from "./AllLaws";

const Layout = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("search");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="mr-4 hidden md:flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h1 className="text-primary font-serif font-bold text-xl">
              VADE MECUM <span className="text-gradient-primary font-bold">PRO</span>
            </h1>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 md:flex-initial">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Pesquisar</span>
                </TabsTrigger>
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Ver Tudo</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="px-0">
          {activeTab === "search" && <SearchArticle />}
          {activeTab === "browse" && <AllLaws />}
        </div>
      </main>
      
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <div className="px-4">
          <p>VADE MECUM <span className="font-bold">PRO</span> &copy; {new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
