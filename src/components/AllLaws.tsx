
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ArrowLeft, FileText, Bookmark } from "lucide-react";
import ArticleView from "./ArticleView";
import googleSheetsService from "@/services/GoogleSheetsService";

interface Law {
  title: string;
  index: number;
}

interface Article {
  number: string;
  content: string;
}

const AllLaws = () => {
  const [laws, setLaws] = useState<Law[]>([]);
  const [selectedLawIndex, setSelectedLawIndex] = useState<number | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Article[]>([]);

  // Carregar leis disponíveis
  useEffect(() => {
    const loadLaws = async () => {
      try {
        const availableLaws = await googleSheetsService.getLaws();
        setLaws(availableLaws);
      } catch (error) {
        console.error("Erro ao carregar leis:", error);
        setError("Falha ao carregar as leis disponíveis");
      }
    };

    loadLaws();
  }, []);

  // Carregar artigos de uma lei específica
  const loadArticles = async (lawIndex: number) => {
    setIsLoading(true);
    setError(null);
    setSelectedLawIndex(lawIndex);
    setSelectedArticle(null);
    
    try {
      const allArticles = await googleSheetsService.getAllArticles(lawIndex);
      setArticles(allArticles);
    } catch (error) {
      console.error("Erro ao carregar artigos:", error);
      setError("Falha ao carregar os artigos. Tente novamente mais tarde.");
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Visualizar um artigo específico
  const viewArticle = (article: Article) => {
    setSelectedArticle(article);
  };

  // Voltar para a lista de artigos
  const backToArticles = () => {
    setSelectedArticle(null);
  };

  // Voltar para a lista de leis
  const backToLaws = () => {
    setSelectedLawIndex(null);
    setArticles([]);
    setSelectedArticle(null);
  };

  // Adicionar aos favoritos
  const toggleFavorite = (article: Article) => {
    const isAlreadyFavorite = favorites.some(fav => 
      fav.number === article.number && fav.content === article.content
    );
    
    if (isAlreadyFavorite) {
      setFavorites(favorites.filter(fav => 
        !(fav.number === article.number && fav.content === article.content)
      ));
    } else {
      setFavorites([...favorites, article]);
    }
  };

  // Verificar se um artigo está nos favoritos
  const isArticleFavorite = (article: Article) => {
    return favorites.some(fav => 
      fav.number === article.number && fav.content === article.content
    );
  };

  // Determinar qual visualização exibir
  const renderContent = () => {
    if (selectedArticle) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <Button
              variant="ghost"
              onClick={backToArticles}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          <ArticleView
            articleNumber={selectedArticle.number}
            content={selectedArticle.content}
            lawTitle={selectedLawIndex !== null ? laws[selectedLawIndex]?.title || "" : ""}
          />
        </div>
      );
    }
    
    if (selectedLawIndex !== null) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <Button
              variant="ghost"
              onClick={backToLaws}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar às Leis
            </Button>
            <h2 className="text-lg font-medium truncate">
              {laws[selectedLawIndex]?.title}
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-destructive/20 p-4 rounded-lg text-center">
              <p className="text-destructive-foreground">{error}</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {articles.map((article) => (
                  <Card 
                    key={article.number}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => viewArticle(article)}
                  >
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-xl font-medium">
                        {article.number}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article);
                        }}
                      >
                        <Bookmark 
                          className={`h-5 w-5 ${isArticleFavorite(article) ? 'fill-primary text-primary' : ''}`} 
                        />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="line-clamp-3 text-muted-foreground">
                        {article.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                
                {articles.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-8">
                    <p className="text-muted-foreground">Nenhum artigo encontrado nesta lei.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold text-center text-primary">Leis Disponíveis</h1>
        
        <Tabs defaultValue="laws" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="laws" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Todas as Leis
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Favoritos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="laws" className="mt-4">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {laws.map((law, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => loadArticles(index)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-xl font-medium">
                        {law.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Ver artigos</span>
                    </CardContent>
                  </Card>
                ))}
                
                {laws.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-8">
                    <p className="text-muted-foreground">Nenhuma lei disponível no momento.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="favorites" className="mt-4">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((article, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-xl font-medium">
                        {article.number}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article);
                        }}
                      >
                        <Bookmark className="h-5 w-5 fill-primary text-primary" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="line-clamp-3 text-muted-foreground">
                        {article.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                
                {favorites.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-8">
                    <p className="text-muted-foreground">Você ainda não adicionou nenhum artigo aos favoritos.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {renderContent()}
    </div>
  );
};

export default AllLaws;
