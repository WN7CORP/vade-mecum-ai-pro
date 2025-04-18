import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, FileDown, MicIcon, MicOffIcon, PauseIcon, PlayIcon, GanttChartSquare, Bookmark, BookmarkPlusIcon, StickyNote, FilePlus, Highlighter, MessageSquare, ArrowUpCircle, Lightbulb, ChevronUp, AlertCircle, Trash2, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import geminiAIService from "@/services/GeminiAIService";
import speechService from "@/services/SpeechService";
import pdfService from "@/services/PDFService";
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
interface ArticleHighlight {
  id: string;
  text: string;
  color: HighlightColor;
  startOffset: number;
  endOffset: number;
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
  const [explanationMode, setExplanationMode] = useState<'technical' | 'formal'>('technical');
  const [example, setExample] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [aiNotes, setAiNotes] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<HighlightColor>("yellow");
  const [articleHighlights, setArticleHighlights] = useState<ArticleHighlight[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [explanationLoaded, setExplanationLoaded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  // Formatar o conteúdo para exibição (com negrito para Art. e Parágrafo Único)
  const formatContent = (text: string) => {
    // Quebrar o texto em parágrafos
    return text.split(/\n/).map((paragraph, index) => {
      // Aplicar negrito em "Art." e "Parágrafo Único"
      const formattedParagraph = paragraph
      // Para "Art. X" ou "Art. X-Y"
      .replace(/(Art\.\s+\d+[°º]?(?:-[A-Z])?)/g, '<strong>$1</strong>')
      // Para "Parágrafo Único"
      .replace(/(Parágrafo Único)/g, '<strong>$1</strong>');

      // Retornar com dangerouslySetInnerHTML para interpretar as tags HTML
      return <p key={index} className="my-2" dangerouslySetInnerHTML={{
        __html: formattedParagraph || '<br />'
      }} />;
    });
  };

  // Formatar o conteúdo com os destaques do usuário
  const formattedContentWithHighlights = () => {
    if (articleHighlights.length === 0) {
      return formatContent(content);
    }

    // Ordenar os destaques por posição para processá-los corretamente
    const sortedHighlights = [...articleHighlights].sort((a, b) => a.startOffset - b.startOffset);

    // Dividir o conteúdo em parágrafos para manter a formatação de quebra de linha
    const paragraphs = content.split(/\n/);
    let currentOffset = 0;
    return paragraphs.map((paragraph, paragraphIndex) => {
      if (!paragraph) {
        currentOffset += 1; // Contar o caractere de quebra de linha
        return <p key={paragraphIndex} className="my-2"><br /></p>;
      }

      // Calcular os destaques que pertencem a este parágrafo
      const paragraphLength = paragraph.length;
      const paragraphStart = currentOffset;
      const paragraphEnd = paragraphStart + paragraphLength;

      // Filtrar e ajustar os destaques para este parágrafo
      const paragraphHighlights = sortedHighlights.filter(h => {
        return h.startOffset >= paragraphStart && h.startOffset < paragraphEnd || h.endOffset > paragraphStart && h.endOffset <= paragraphEnd || h.startOffset <= paragraphStart && h.endOffset >= paragraphEnd;
      }).map(h => {
        return {
          ...h,
          // Ajustar os offsets para o contexto do parágrafo
          startOffset: Math.max(0, h.startOffset - paragraphStart),
          endOffset: Math.min(paragraphLength, h.endOffset - paragraphStart)
        };
      });

      // Aplicar transformações de formatação no parágrafo (Art. e Parágrafo Único)
      let formattedParagraph = paragraph.replace(/(Art\.\s+\d+[°º]?(?:-[A-Z])?)/g, '<strong>$1</strong>').replace(/(Parágrafo Único)/g, '<strong>$1</strong>');

      // Se não houver destaques no parágrafo, retornar com as formatações básicas
      if (paragraphHighlights.length === 0) {
        currentOffset += paragraphLength + 1; // +1 para o caractere de quebra de linha
        return <p key={paragraphIndex} className="my-2" dangerouslySetInnerHTML={{
          __html: formattedParagraph
        }} />;
      }

      // Se houver destaques, construir o parágrafo com eles
      let result = [];
      let lastIndex = 0;

      // Ordenar os destaques do parágrafo
      paragraphHighlights.sort((a, b) => a.startOffset - b.startOffset);

      // Processar cada destaque
      for (const highlight of paragraphHighlights) {
        // Adicionar o texto antes do destaque
        if (highlight.startOffset > lastIndex) {
          const beforeText = formattedParagraph.substring(lastIndex, highlight.startOffset);
          result.push(<span key={`${paragraphIndex}-${lastIndex}`} dangerouslySetInnerHTML={{
            __html: beforeText
          }} />);
        }

        // Adicionar o texto destacado
        const highlightedText = formattedParagraph.substring(highlight.startOffset, highlight.endOffset);
        result.push(<span key={`highlight-${highlight.id}`} className={`${HIGHLIGHT_COLORS[highlight.color]} px-1 rounded`} dangerouslySetInnerHTML={{
          __html: highlightedText
        }} />);
        lastIndex = highlight.endOffset;
      }

      // Adicionar o texto restante após o último destaque
      if (lastIndex < formattedParagraph.length) {
        const afterText = formattedParagraph.substring(lastIndex);
        result.push(<span key={`${paragraphIndex}-end`} dangerouslySetInnerHTML={{
          __html: afterText
        }} />);
      }
      currentOffset += paragraphLength + 1; // +1 para o caractere de quebra de linha
      return <p key={paragraphIndex} className="my-2">{result}</p>;
    });
  };

  // Carregar explicação do artigo quando o usuário seleciona um modo
  const loadExplanation = useCallback(async (mode: 'technical' | 'formal') => {
    try {
      setIsLoadingAI(true);
      const explanation = await geminiAIService.explainArticle(content, mode);
      setExplanation(explanation);
      setExplanationMode(mode);
      setExplanationLoaded(true);
    } catch (error) {
      console.error('Falha ao carregar explicação:', error);
      setExplanation("Não foi possível carregar a explicação neste momento.");
      toast({
        title: "Erro",
        description: "Não foi possível gerar a explicação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
    }
  }, [content]);

  // Carregar exemplo quando necessário
  const loadExample = useCallback(async () => {
    if (example) return; // Já carregado

    try {
      setIsLoadingAI(true);
      const exampleText = await geminiAIService.generateExample(content);
      setExample(exampleText);
    } catch (error) {
      console.error('Falha ao carregar exemplo prático:', error);
      setExample("Não foi possível carregar o exemplo prático neste momento.");
      toast({
        title: "Erro",
        description: "Não foi possível gerar o exemplo prático. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
    }
  }, [content, example]);

  // Carregar anotações automáticas quando necessário
  const loadAINotes = useCallback(async () => {
    if (aiNotes) return; // Já carregado

    try {
      setIsLoadingAI(true);
      const notes = await geminiAIService.generateNotes(content);
      setAiNotes(notes);
    } catch (error) {
      console.error('Falha ao carregar anotações automáticas:', error);
      setAiNotes("Não foi possível carregar as anotações automáticas neste momento.");
      toast({
        title: "Erro",
        description: "Não foi possível gerar as anotações automáticas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
    }
  }, [content, aiNotes]);

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
    speechService.loadVoices().then(() => {
      speechService.speak(content, () => {
        setIsReading(true);
        setIsPaused(false);
      }, () => {
        setIsReading(false);
        setIsPaused(false);
      });
    });
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
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: "Artigo copiado!",
        description: "O conteúdo do artigo foi copiado para a área de transferência.",
        duration: 3000
      });
    }).catch(err => {
      console.error('Erro ao copiar artigo:', err);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o artigo. Tente novamente.",
        variant: "destructive"
      });
    });
  };

  // Adicionar aos favoritos
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: isFavorite ? "O artigo foi removido dos seus favoritos." : "O artigo foi adicionado aos seus favoritos.",
      duration: 3000
    });

    // Aqui adicionaríamos lógica para salvar/remover dos favoritos persistentes
  };

  // Aumentar/diminuir tamanho da fonte
  const increaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 2, 28);
      return newSize;
    });
  };
  const decreaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 2, 12);
      return newSize;
    });
  };

  // Solicitar explicação da IA
  const askQuestion = async () => {
    if (!question.trim()) return;
    try {
      setIsLoadingAI(true);
      const response = await geminiAIService.askQuestion(content, question);
      setAnswer(response);
    } catch (error) {
      console.error('Falha ao obter resposta:', error);
      setAnswer("Não foi possível processar sua pergunta neste momento. Tente novamente mais tarde.");
      toast({
        title: "Erro",
        description: "Não foi possível processar sua pergunta. Tente novamente.",
        variant: "destructive"
      });
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
    toast({
      title: "Anotação adicionada",
      description: "Sua anotação foi adicionada com sucesso.",
      duration: 3000
    });
  };

  // Remover uma anotação
  const removeNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: "Anotação removida",
      description: "Sua anotação foi removida com sucesso.",
      duration: 3000
    });
  };

  // Adicionar destaque ao texto do artigo
  const addArticleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      toast({
        title: "Nenhum texto selecionado",
        description: "Selecione um trecho do texto para destacar.",
        variant: "destructive"
      });
      return;
    }
    try {
      const range = selection.getRangeAt(0);
      const container = contentRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        toast({
          title: "Seleção inválida",
          description: "Selecione apenas texto dentro do artigo.",
          variant: "destructive"
        });
        return;
      }

      // Calcular a posição relativa do texto selecionado no conteúdo completo
      const textContent = content;
      const selectedText = selection.toString();

      // Função para encontrar todas as ocorrências de uma substring
      const findAllOccurrences = (str: string, substr: string) => {
        const result = [];
        let idx = str.indexOf(substr);
        while (idx !== -1) {
          result.push(idx);
          idx = str.indexOf(substr, idx + 1);
        }
        return result;
      };

      // Encontrar todas as ocorrências do texto selecionado
      const occurrences = findAllOccurrences(textContent, selectedText);
      if (occurrences.length === 0) {
        toast({
          title: "Erro ao destacar",
          description: "Não foi possível determinar a posição do texto selecionado.",
          variant: "destructive"
        });
        return;
      }

      // Usar a primeira ocorrência como estimativa (pode ser melhorado)
      const startOffset = occurrences[0];
      const endOffset = startOffset + selectedText.length;

      // Criar o novo destaque
      const newHighlight: ArticleHighlight = {
        id: Date.now().toString(),
        text: selectedText,
        color: selectedHighlightColor,
        startOffset,
        endOffset
      };

      // Adicionar o destaque à lista
      setArticleHighlights(prev => [...prev, newHighlight]);

      // Limpar a seleção
      selection.removeAllRanges();
      toast({
        title: "Texto destacado",
        description: "O trecho foi destacado com sucesso.",
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao destacar texto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar destacar o texto.",
        variant: "destructive"
      });
    }
  };

  // Remover todos os destaques do artigo
  const clearAllHighlights = () => {
    setArticleHighlights([]);
    toast({
      title: "Destaques removidos",
      description: "Todos os destaques foram removidos.",
      duration: 3000
    });
  };

  // Exportar para PDF
  const exportToPDF = async () => {
    try {
      setIsExportingPDF(true);

      // Verificar se temos as informações necessárias
      if (!explanationLoaded) {
        await loadExplanation(explanationMode);
      }
      if (!example) {
        await loadExample();
      }

      // Preparar os dados para o PDF
      const pdfData = {
        number: articleNumber,
        content,
        lawTitle,
        explanation,
        example
      };

      // Gerar o PDF
      const downloadLink = await pdfService.generatePDF(pdfData);
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo estará disponível por 7 dias.",
        duration: 5000
      });

      // Abrir o link em uma nova janela/aba
      window.open(downloadLink, '_blank');
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Botão voltar ao topo
  const scrollToTop = () => {
    articleRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Renderização do componente
  return <div className="relative flex flex-col w-full h-full">
      {/* Botão flutuante para aumentar/diminuir fonte */}
      <div className="fixed bottom-24 left-4 z-10 flex flex-col gap-2 bg-card p-2 rounded-full shadow-lg border border-border">
        <Button variant="ghost" size="icon" onClick={increaseFontSize} aria-label="Aumentar fonte" className="rounded-full h-10 w-10 flex items-center justify-center">
          <span className="text-lg font-bold">A+</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={decreaseFontSize} aria-label="Diminuir fonte" className="rounded-full h-10 w-10 flex items-center justify-center">
          <span className="text-lg font-bold">A-</span>
        </Button>
      </div>

      {/* Botão voltar ao topo */}
      {showScrollToTop && <Button variant="secondary" size="icon" className="fixed bottom-4 right-4 z-10 rounded-full" onClick={scrollToTop} aria-label="Voltar ao topo">
          <ChevronUp className="h-5 w-5" />
        </Button>}

      <Card className="flex-1 overflow-hidden border-none shadow-none bg-transparent">
        <CardHeader className="px-4 py-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">{lawTitle}</p>
              <CardTitle className="text-2xl text-primary flex items-center gap-2 font-serif">
                {articleNumber} 
                <Button variant="ghost" size="icon" onClick={toggleFavorite} className="ml-1" aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                  {isFavorite ? <Bookmark className="h-5 w-5 text-primary fill-primary" /> : <BookmarkPlusIcon className="h-5 w-5" />}
                </Button>
                {articleHighlights.length > 0 && <div className="ml-2 text-sm text-yellow-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Destaques: {articleHighlights.length}</span>
                  </div>}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={copyArticle} aria-label="Copiar artigo">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={exportToPDF} disabled={isExportingPDF} aria-label="Exportar para PDF">
                {isExportingPDF ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <FileDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Controles de áudio */}
          <div className="flex items-center gap-2">
            {!isReading ? <Button variant="outline" size="sm" onClick={startReading} className="gap-1">
                <PlayIcon className="h-4 w-4" />
                Ouvir
              </Button> : <>
                <Button variant="outline" size="sm" onClick={pauseReading} className="gap-1">
                  {isPaused ? <>
                      <PlayIcon className="h-4 w-4" />
                      Continuar
                    </> : <>
                      <PauseIcon className="h-4 w-4" />
                      Pausar
                    </>}
                </Button>
                <Button variant="outline" size="sm" onClick={stopReading} className="gap-1">
                  <MicOffIcon className="h-4 w-4" />
                  Parar
                </Button>
              </>}
            
            {/* Botão para destacar texto */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 ml-auto">
                  <Highlighter className="h-4 w-4" />
                  Destacar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Selecione a cor e depois o texto no artigo</p>
                  <div className="flex gap-1">
                    {Object.entries(HIGHLIGHT_COLORS).map(([color, className]) => <div key={color} className={`w-6 h-6 rounded-full cursor-pointer ${className} ${selectedHighlightColor === color ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedHighlightColor(color as HighlightColor)} />)}
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button size="sm" variant="outline" onClick={addArticleHighlight}>
                      Aplicar
                    </Button>
                    {articleHighlights.length > 0 && <Button size="sm" variant="destructive" onClick={clearAllHighlights}>
                        Limpar todos
                      </Button>}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent ref={articleRef} className="p-0 overflow-y-auto" style={{
        maxHeight: "calc(100vh - 250px)"
      }}>
          <Tabs defaultValue="article" className="w-full">
            <TabsList className="grid grid-cols-5 mx-4">
              <TabsTrigger value="article">Artigo</TabsTrigger>
              <TabsTrigger value="explanation">Explicação</TabsTrigger>
              <TabsTrigger value="example">Exemplo</TabsTrigger>
              <TabsTrigger value="notes">Anotações</TabsTrigger>
              <TabsTrigger value="questions">Dúvidas</TabsTrigger>
            </TabsList>

            <TabsContent value="article" className="mt-2 pb-4 my-[2px] px-[2px]">
              <div ref={contentRef} className="article-content prose prose-invert max-w-none py-4" style={{
              fontSize: `${fontSize}px`
            }}>
                {formattedContentWithHighlights()}
              </div>
            </TabsContent>

            <TabsContent value="explanation" className="mt-2 px-6 pb-4">
              <div className="bg-secondary/50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Explicação</h3>
                  </div>
                  
                  {/* Seleção do modo de explicação */}
                  <div className="flex gap-2">
                    <Button size="sm" variant={explanationMode === 'technical' ? 'default' : 'outline'} onClick={() => loadExplanation('technical')} className="text-xs">
                      <Info className="h-3 w-3 mr-1" />
                      Técnica
                    </Button>
                    <Button size="sm" variant={explanationMode === 'formal' ? 'default' : 'outline'} onClick={() => loadExplanation('formal')} className="text-xs">
                      <Info className="h-3 w-3 mr-1" />
                      Simplificada
                    </Button>
                  </div>
                </div>
                
                {isLoadingAI ? <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div> : !explanationLoaded ? <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <p className="text-center text-muted-foreground">
                      Selecione o tipo de explicação que deseja visualizar
                    </p>
                  </div> : <div className="prose prose-invert max-w-none whitespace-pre-line">
                    {explanation}
                  </div>}
              </div>
            </TabsContent>

            <TabsContent value="example" className="mt-2 px-6 pb-4">
              <div className="bg-secondary/50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <GanttChartSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Exemplo Prático</h3>
                </div>
                {isLoadingAI ? <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div> : !example ? <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <p className="text-center text-muted-foreground">
                      Clique abaixo para gerar um exemplo prático
                    </p>
                    <Button onClick={loadExample}>Gerar exemplo</Button>
                  </div> : <div className="prose prose-invert max-w-none whitespace-pre-line">
                    {example}
                  </div>}
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
                  {isLoadingAI ? <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div> : !aiNotes ? <div className="flex flex-col items-center justify-center h-40 gap-4">
                      <p className="text-center text-muted-foreground">
                        Clique abaixo para gerar anotações automáticas
                      </p>
                      <Button onClick={loadAINotes}>Gerar anotações</Button>
                    </div> : <div className="prose prose-invert max-w-none whitespace-pre-line">
                      {aiNotes}
                    </div>}
                </div>

                {/* User Notes */}
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <FilePlus className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Minhas Anotações</h3>
                  </div>
                  
                  <div className="space-y-4 mb-4">
                    {notes.length === 0 ? <p className="text-muted-foreground text-center py-4">
                        Você ainda não tem anotações. Adicione uma abaixo!
                      </p> : notes.map(note => <div key={note.id} className="bg-secondary/30 p-4 rounded-md">
                          <p className="whitespace-pre-line">{note.text}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => removeNote(note.id)} className="h-6 w-6">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>)}
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea placeholder="Adicione uma nova anotação..." value={newNote} onChange={e => setNewNote(e.target.value)} className="min-h-[100px]" />
                    
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
                            {Object.entries(HIGHLIGHT_COLORS).map(([color, className]) => <div key={color} className={`w-6 h-6 rounded-full cursor-pointer ${className} ${selectedHighlightColor === color ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedHighlightColor(color as HighlightColor)} />)}
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
                  <Textarea placeholder="Digite sua pergunta sobre este artigo..." value={question} onChange={e => setQuestion(e.target.value)} className="min-h-[100px]" />
                  
                  <div className="flex justify-end">
                    <Button onClick={askQuestion} disabled={isLoadingAI || !question.trim()}>
                      {isLoadingAI ? 'Processando...' : 'Perguntar'}
                    </Button>
                  </div>
                  
                  {answer && <div className="mt-6 bg-card p-4 rounded-md border border-border">
                      <h4 className="text-sm font-medium mb-2 text-primary">Resposta:</h4>
                      <div className="prose prose-invert max-w-none whitespace-pre-line">
                        {answer}
                      </div>
                    </div>}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default ArticleView;