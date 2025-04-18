import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Sparkles, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const SearchArticle = () => {
  const [laws, setLaws] = useState<Law[]>([]);
  const [selectedLawIndex, setSelectedLawIndex] = useState<number | null>(null);
  const [articleNumber, setArticleNumber] = useState("");
  const [searchedArticle, setSearchedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeSearch, setShakeSearch] = useState(false);

  useEffect(() => {
    const loadLaws = async () => {
      try {
        const availableLaws = await googleSheetsService.getLaws();
        setLaws(availableLaws);
        
        if (availableLaws.length > 0) {
          setSelectedLawIndex(0);
        }
      } catch (error) {
        console.error("Erro ao carregar leis:", error);
        setError("Falha ao carregar as leis disponíveis");
      }
    };

    loadLaws();
  }, []);

  const searchArticle = async () => {
    if (!articleNumber.trim()) {
      setShakeSearch(true);
      setTimeout(() => setShakeSearch(false), 500);
      return;
    }

    if (selectedLawIndex === null) {
      setError("Por favor, selecione uma lei primeiro");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const article = await googleSheetsService.getArticleByNumber(
        selectedLawIndex,
        articleNumber.trim()
      );
      
      if (!article) {
        setError(`Artigo ${articleNumber} não encontrado na lei selecionada`);
        setSearchedArticle(null);
      } else {
        setSearchedArticle(article);
      }
    } catch (error) {
      console.error("Erro ao buscar artigo:", error);
      setError("Falha ao buscar o artigo. Tente novamente mais tarde.");
      setSearchedArticle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchArticle();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {!searchedArticle ? (
          <motion.div
            key="search"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            variants={containerVariants}
            className="space-y-8 px-4 py-6"
          >
            <motion.div variants={itemVariants} className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-primary font-serif flex items-center justify-center gap-2">
                <Scale className="h-6 w-6" />
                VADE MECUM <span className="text-gradient-primary font-bold">PRO</span>
              </h1>
              <p className="text-muted-foreground">
                Pesquise e estude a legislação com explicações detalhadas
              </p>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="bg-card p-6 rounded-lg border border-border shadow-sm"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lei</label>
                  <Select
                    value={selectedLawIndex !== null ? selectedLawIndex.toString() : ""}
                    onValueChange={(value) => setSelectedLawIndex(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma lei" />
                    </SelectTrigger>
                    <SelectContent>
                      {laws.map((law, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {law.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número do Artigo</label>
                  <div className="flex gap-2">
                    <motion.div 
                      className="flex-1"
                      variants={shakeVariants}
                      animate={shakeSearch ? "shake" : ""}
                    >
                      <Input
                        placeholder="Ex: Art. 5º ou 5"
                        value={articleNumber}
                        onChange={(e) => setArticleNumber(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </motion.div>
                    <Button 
                      onClick={searchArticle}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Buscar
                    </Button>
                  </div>
                </div>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}
              
              <motion.div 
                variants={itemVariants}
                className="mt-6 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Com explicação</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center mb-4 px-4">
              <Button
                variant="ghost"
                onClick={() => setSearchedArticle(null)}
                className="gap-2"
              >
                ← Voltar à pesquisa
              </Button>
            </div>
            
            <ArticleView
              articleNumber={searchedArticle.number}
              content={searchedArticle.content}
              lawTitle={laws[selectedLawIndex!]?.title || ""}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchArticle;
