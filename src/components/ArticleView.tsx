
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, 
  FileDown, 
  MicIcon, 
  MicOffIcon, 
  PauseIcon, 
  PlayIcon, 
  GanttChartSquare,
  Bookmark,
  BookmarkPlusIcon,
  StickyNote,
  FilePlus,
  Highlighter,
  MessageSquare,
  ArrowUpCircle,
  Lightbulb,
  ChevronUp
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import geminiAIService from "@/services/GeminiAIService";
import speechService from "@/services/SpeechService";

interface ArticleViewProps {
  articleNumber: string;
  content: string;
  lawTitle: string;
}

type HighlightColor = "purple" | "yellow" | "blue" | "green" | "pink";

interface Highlight {
  text: string;
  color: HighlightColor;
  startIndex: number;
  endIndex: number;
}

interface Note {
  id: string;
  text: string;
  highlights: Highlight[];
  createdAt: Date;
}

const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  purple: "bg-purple-500/30",
  yellow: "bg-yellow-500/30",
  blue: "bg-blue-500/30",
  green: "bg-green-500/30",
  pink: "bg-pink-500/30"
};

const ArticleView: React.FC<ArticleViewProps> = ({ 
  articleNumber, 
  content, 
  lawTitle 
}) => {
  // Estados para as operações do artigo
  const [isFavorite, setIsFavorite] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [explanation, setExplanation] = useState<string>("");
  const [example, setExample] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [aiNotes, setAiNotes] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<HighlightColor>("yellow");
  const [newNote, setNewNote] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  // Formatar o conteúdo para exibição (dividir em parágrafos)
  const formattedContent = content
    .split(/\n/)
    .map((paragraph, index) => (
      <p key={index} className="my-2">{paragraph || <br />}</p>
    ));

  // Carregar explicação do artigo quando o componente montar
  useEffect(() => {
    // Por enquanto, apenas um stub. Implementação completa precisaria de um API key real.
    /*
    const loadExplanation = async () => {
      try {
        setIsLoadingAI(true);
        const explanation = await geminiAIService.explainArticle(content);
        setExplanation(explanation);
      } catch (error) {
        console.error('Falha ao carregar explicação:', error);
        setExplanation("Não foi possível carregar a explicação neste momento.");
      } finally {
        setIsLoadingAI(false);
      }
    };

    loadExplanation();
    */
    
    // Simulação para demo
    setTimeout(() => {
      setExplanation(
        `Este artigo estabelece os princípios fundamentais que regem a relação jurídica em questão. 
        
        De forma detalhada, podemos entender que:
        
        1. O primeiro elemento define as condições necessárias para aplicação da norma;
        
        2. Os requisitos precisam ser observados de forma cumulativa;
        
        3. As consequências jurídicas se desdobram em múltiplas esferas;
        
        4. A interpretação deve considerar o contexto sistemático da legislação.`
      );
      
      setExample(
        `Exemplo Prático:
        
        Um cidadão chamado João precisava resolver uma questão relacionada a este artigo. Ele se encontrava na situação X, onde as condições A, B e C estavam presentes.
        
        Ao aplicar o disposto neste artigo, João conseguiu obter o resultado Y, demonstrando a eficácia prática da norma em questão.
        
        O tribunal entendeu que, na situação específica de João, todos os requisitos legais foram atendidos, o que resultou no deferimento de seu pedido.`
      );
      
      setAiNotes(
        `Anotações Importantes:
        
        • Conceito central: [definição jurídica principal]
        
        • Jurisprudência relevante: STF - RE 123456/DF
        
        • Conecta-se com os seguintes dispositivos: Art. 15, Lei 9.876/99
        
        • Interpretação dominante: [corrente majoritária]
        
        • Exceções aplicáveis: [casos específicos]`
      );
    }, 1000);
  }, [content]);

  // Detectar scroll para mostrar o botão de voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      if (articleRef.current) {
        setShowScrollToTop(articleRef.current.scrollTop > 300);
      }
    };

    const currentRef = articleRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Funções para Text-to-Speech
  const startReading = () => {
    speechService.speak(
      content,
      () => {
        setIsReading(true);
        setIsPaused(false);
      },
      () => {
        setIsReading(false);
        setIsPaused(false);
      }
    );
  };

  const pauseReading = () => {
    if (isReading && !isPaused) {
      speechService.pause();
      setIsPaused(true);
    } else if (isPaused) {
      speechService.resume();
      setIsPaused(false);
    }
  };

  const stopReading = () => {
    speechService.stop();
    setIsReading(false);
    setIsPaused(false);
  };

  // Copiar conteúdo do artigo
  const copyArticle = () => {
    const textToCopy = `${articleNumber}\n\n${content}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // Poderia mostrar uma notificação de sucesso
        console.log('Artigo copiado!');
      })
      .catch(err => {
        console.error('Erro ao copiar artigo:', err);
      });
  };

  // Adicionar aos favoritos
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    
    // Aqui adicionaríamos lógica para salvar/remover dos favoritos persistentes
  };

  // Aumentar/diminuir tamanho da fonte
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 28));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  // Solicitar explicação da IA
  const askQuestion = async () => {
    if (!question.trim()) return;
    
    try {
      setIsLoadingAI(true);
      // Simulação para demo
      setTimeout(() => {
        setAnswer(
          `Resposta à pergunta "${question}":
          
          A interpretação correta deste dispositivo legal, em relação à sua pergunta, envolve os seguintes aspectos:
          
          1. O elemento principal que você questiona está relacionado à [conceito específico];
          
          2. De acordo com a doutrina majoritária, a aplicação nesse caso específico deve considerar [explicação detalhada];
          
          3. Existe precedente jurisprudencial que confirma esta interpretação no [julgado específico];
          
          4. Na prática, isso significa que [consequência prática para o caso].
          
          Espero ter esclarecido sua dúvida. Para informações mais específicas, recomendo consultar um profissional jurídico especializado.`
        );
        setIsLoadingAI(false);
      }, 1500);
      
      // Implementação real
      // const response = await geminiAIService.askQuestion(content, question);
      // setAnswer(response);
    } catch (error) {
      console.error('Falha ao obter resposta:', error);
      setAnswer("Não foi possível processar sua pergunta neste momento. Tente novamente mais tarde.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Adicionar nova anotação
  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      text: newNote,
      highlights: [],
      createdAt: new Date()
    };
    
    setNotes(prev => [...prev, note]);
    setNewNote("");
  };

  // Exportar para PDF
  const exportToPDF = () => {
    // Esta seria uma implementação mais complexa necessitando de bibliotecas adicionais
    console.log('Exportando para PDF...');
    alert('Funcionalidade de exportação para PDF será implementada em breve.');
  };

  // Botão voltar ao topo
  const scrollToTop = () => {
    articleRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative flex flex-col w-full h-full">
      {/* Botão flutuante para aumentar/diminuir fonte */}
      <div className="fixed bottom-24 left-4 z-10 flex flex-col gap-2 bg-card p-2 rounded-full shadow-lg border border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={increaseFontSize}
          aria-label="Aumentar fonte"
          className="rounded-full h-10 w-10 flex items-center justify-center"
        >
          <span className="text-lg font-bold">A+</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={decreaseFontSize}
          aria-label="Diminuir fonte"
          className="rounded-full h-10 w-10 flex items-center justify-center"
        >
          <span className="text-lg font-bold">A-</span>
        </Button>
      </div>

      {/* Botão voltar ao topo */}
      {showScrollToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-4 right-4 z-10 rounded-full"
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}

      <Card className="flex-1 overflow-hidden border-none shadow-none bg-transparent">
        <CardHeader className="px-4 py-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">{lawTitle}</p>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                {articleNumber} 
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFavorite}
                  className="ml-1"
                  aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {isFavorite ? (
                    <Bookmark className="h-5 w-5 text-primary fill-primary" />
                  ) : (
                    <BookmarkPlusIcon className="h-5 w-5" />
                  )}
                </Button>
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyArticle}
                aria-label="Copiar artigo"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={exportToPDF}
                aria-label="Exportar para PDF"
              >
                <FileDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Controles de áudio */}
          <div className="flex items-center gap-2">
            {!isReading ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={startReading}
                className="gap-1"
              >
                <PlayIcon className="h-4 w-4" />
                Ouvir
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={pauseReading}
                  className="gap-1"
                >
                  {isPaused ? (
                    <>
                      <PlayIcon className="h-4 w-4" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <PauseIcon className="h-4 w-4" />
                      Pausar
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={stopReading}
                  className="gap-1"
                >
                  <MicOffIcon className="h-4 w-4" />
                  Parar
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent ref={articleRef} className="p-0 overflow-y-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
          <Tabs defaultValue="article" className="w-full">
            <TabsList className="grid grid-cols-5 mx-4">
              <TabsTrigger value="article">Artigo</TabsTrigger>
              <TabsTrigger value="explanation">Explicação</TabsTrigger>
              <TabsTrigger value="example">Exemplo</TabsTrigger>
              <TabsTrigger value="notes">Anotações</TabsTrigger>
              <TabsTrigger value="questions">Dúvidas</TabsTrigger>
            </TabsList>

            <TabsContent value="article" className="mt-2 px-6 pb-4">
              <div 
                ref={contentRef}
                className="article-content prose prose-invert max-w-none py-4"
                style={{ fontSize: `${fontSize}px` }}
              >
                {formattedContent}
              </div>
            </TabsContent>

            <TabsContent value="explanation" className="mt-2 px-6 pb-4">
              <div className="bg-secondary/50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Explicação</h3>
                </div>
                {isLoadingAI ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none whitespace-pre-line">
                    {explanation}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="example" className="mt-2 px-6 pb-4">
              <div className="bg-secondary/50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <GanttChartSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Exemplo Prático</h3>
                </div>
                {isLoadingAI ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none whitespace-pre-line">
                    {example}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-2 px-6 pb-4">
              <div className="space-y-4">
                {/* IA Generated Notes */}
                <div className="bg-secondary/50 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <StickyNote className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Anotações Automáticas</h3>
                  </div>
                  {isLoadingAI ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none whitespace-pre-line">
                      {aiNotes}
                    </div>
                  )}
                </div>

                {/* User Notes */}
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <FilePlus className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Minhas Anotações</h3>
                  </div>
                  
                  <div className="space-y-4 mb-4">
                    {notes.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Você ainda não tem anotações. Adicione uma abaixo!
                      </p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="bg-secondary/30 p-4 rounded-md">
                          <p className="whitespace-pre-line">{note.text}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Adicione uma nova anotação..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                    
                    <div className="flex justify-between items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Highlighter className="h-4 w-4" />
                            Destacar
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex gap-1">
                            {Object.entries(HIGHLIGHT_COLORS).map(([color, className]) => (
                              <div 
                                key={color}
                                className={`w-6 h-6 rounded-full cursor-pointer ${className} ${selectedHighlightColor === color ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => setSelectedHighlightColor(color as HighlightColor)}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button onClick={addNote}>Adicionar Anotação</Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="mt-2 px-6 pb-4">
              <div className="bg-secondary/50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Pergunte à IA</h3>
                </div>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Digite sua pergunta sobre este artigo..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={askQuestion}
                      disabled={isLoadingAI || !question.trim()}
                    >
                      {isLoadingAI ? 'Processando...' : 'Perguntar'}
                    </Button>
                  </div>
                  
                  {answer && (
                    <div className="mt-6 bg-card p-4 rounded-md border border-border">
                      <h4 className="text-sm font-medium mb-2 text-primary">Resposta:</h4>
                      <div className="prose prose-invert max-w-none whitespace-pre-line">
                        {answer}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleView;
