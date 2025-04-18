import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Copy, FileDown, PlayIcon, PauseIcon, MicOffIcon, 
  Bookmark, BookmarkPlusIcon, Highlighter, MessageSquare,
  Lightbulb, Info, Trash2, GanttChartSquare, StickyNote, FilePlus
} from "lucide-react";
import speechService from '@/services/SpeechService';
import pdfService from '@/services/PDFService';
import geminiAIService from '@/services/GeminiAIService';

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

  const isMobile = useIsMobile();

  const formatContent = (text: string) => {
    return text.split(/\n/).map((paragraph, index) => {
      const formattedParagraph = paragraph
      .replace(/(Art\.\s+\d+[°º]?(?:-[A-Z])?)/g, '<strong>$1</strong>')
      .replace(/(Parágrafo Único)/g, '<strong>$1</strong>');

      return <p key={index} className="my-2" dangerouslySetInnerHTML={{
        __html: formattedParagraph || '<br />'
      }} />;
    });
  };

  const formattedContentWithHighlights = () => {
    if (articleHighlights.length === 0) {
      return formatContent(content);
    }

    const sortedHighlights = [...articleHighlights].sort((a, b) => a.startOffset - b.startOffset);

    const paragraphs = content.split(/\n/);
    let currentOffset = 0;
    return paragraphs.map((paragraph, paragraphIndex) => {
      if (!paragraph) {
        currentOffset += 1;
        return <p key={paragraphIndex} className="my-2"><br /></p>;
      }

      const paragraphLength = paragraph.length;
      const paragraphStart = currentOffset;
      const paragraphEnd = paragraphStart + paragraphLength;

      const paragraphHighlights = sortedHighlights.filter(h => {
        return h.startOffset >= paragraphStart && h.startOffset < paragraphEnd || h.endOffset > paragraphStart && h.endOffset <= paragraphEnd || h.startOffset <= paragraphStart && h.endOffset >= paragraphEnd;
      }).map(h => {
        return {
          ...h,
          startOffset: Math.max(0, h.startOffset - paragraphStart),
          endOffset: Math.min(paragraphLength, h.endOffset - paragraphStart)
        };
      });

      let formattedParagraph = paragraph.replace(/(Art\.\s+\d+[°º]?(?:-[A-Z])?)/g, '<strong>$1</strong>').replace(/(Parágrafo Único)/g, '<strong>$1</strong>');

      if (paragraphHighlights.length === 0) {
        currentOffset += paragraphLength + 1;
        return <p key={paragraphIndex} className="my-2" dangerouslySetInnerHTML={{
          __html: formattedParagraph
        }} />;
      }

      let result = [];
      let lastIndex = 0;

      paragraphHighlights.sort((a, b) => a.startOffset - b.startOffset);

      for (const highlight of paragraphHighlights) {
        if (highlight.startOffset > lastIndex) {
          const beforeText = formattedParagraph.substring(lastIndex, highlight.startOffset);
          result.push(<span key={`${paragraphIndex}-${lastIndex}`} dangerouslySetInnerHTML={{
            __html: beforeText
          }} />);
        }

        const highlightedText = formattedParagraph.substring(highlight.startOffset, highlight.endOffset);
        result.push(<span key={`highlight-${highlight.id}`} className={`${HIGHLIGHT_COLORS[highlight.color]} px-1 rounded`} dangerouslySetInnerHTML={{
          __html: highlightedText
        }} />);
        lastIndex = highlight.endOffset;
      }

      if (lastIndex < formattedParagraph.length) {
        const afterText = formattedParagraph.substring(lastIndex);
        result.push(<span key={`${paragraphIndex}-end`} dangerouslySetInnerHTML={{
          __html: afterText
        }} />);
      }
      currentOffset += paragraphLength + 1;
      return <p key={paragraphIndex} className="my-2">{result}</p>;
    });
  };

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

  const loadExample = useCallback(async () => {
    if (example) return;

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

  const loadAINotes = useCallback(async () => {
    if (aiNotes) return;

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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: isFavorite ? "O artigo foi removido dos seus favoritos." : "O artigo foi adicionado aos seus favoritos.",
      duration: 3000
    });
  };

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

  const removeNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: "Anotação removida",
      description: "Sua anotação foi removida com sucesso.",
      duration: 3000
    });
  };

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

      const textContent = content;
      const selectedText = selection.toString();

      const findAllOccurrences = (str: string, substr: string) => {
        const result = [];
        let idx = str.indexOf(substr);
        while (idx !== -1) {
          result.push(idx);
          idx = str.indexOf(substr, idx + 1);
        }
        return result;
      };

      const occurrences = findAllOccurrences(textContent, selectedText);
      if (occurrences.length === 0) {
        toast({
          title: "Erro ao destacar",
          description: "Não foi possível determinar a posição do texto selecionado.",
          variant: "destructive"
        });
        return;
      }

      const startOffset = occurrences[0];
      const endOffset = startOffset + selectedText.length;

      const newHighlight: ArticleHighlight = {
        id: Date.now().toString(),
        text: selectedText,
        color: selectedHighlightColor,
        startOffset,
        endOffset
      };

      setArticleHighlights(prev => [...prev, newHighlight]);

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

  const clearAllHighlights = () => {
    setArticleHighlights([]);
    toast({
      title: "Destaques removidos",
      description: "Todos os destaques foram removidos.",
      duration: 3000
    });
  };

  const exportToPDF = async () => {
    try {
      setIsExportingPDF(true);

      if (!explanationLoaded) {
        await loadExplanation(explanationMode);
      }
      if (!example) {
        await loadExample();
      }

      const pdfData = {
        number: articleNumber,
        content,
        lawTitle,
        explanation,
        example
      };

      const downloadLink = await pdfService.generatePDF(pdfData);
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo estará disponível por 7 dias.",
        duration: 5000
      });

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

  const scrollToTop = () => {
    articleRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative flex flex-col w-full h-full max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-2 py-2 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={decreaseFontSize}>A-</Button>
          <Button variant="outline" size="sm" onClick={increaseFontSize}>A+</Button>
        </div>
      </div>

      <Card className="flex-1 mt-4 overflow-hidden border-none shadow-none bg-transparent">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{lawTitle}</p>
              <CardTitle className="text-2xl text-primary flex items-center gap-2 font-serif">
                {articleNumber}
                <Button variant="ghost" size="icon" onClick={toggleFavorite} 
                  className="ml-1" 
                  aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                  {isFavorite ? 
                    <Bookmark className="h-5 w-5 text-primary fill-primary" /> : 
                    <BookmarkPlusIcon className="h-5 w-5" />}
                </Button>
              </CardTitle>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={copyArticle} className="flex-1 sm:flex-none">
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF} 
                disabled={isExportingPDF} 
                className="flex-1 sm:flex-none">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isReading ? (
              <Button variant="outline" size="sm" onClick={startReading} className="w-full sm:w-auto">
                <PlayIcon className="h-4 w-4 mr-2" />
                Ouvir artigo
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={pauseReading} className="flex-1 sm:w-auto">
                  {isPaused ? (
                    <>
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <PauseIcon className="h-4 w-4 mr-2" />
                      Pausar
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={stopReading} className="flex-1 sm:w-auto">
                  <MicOffIcon className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent ref={articleRef} className="overflow-y-auto" style={{
          maxHeight: "calc(100vh - 250px)"
        }}>
          <Tabs defaultValue="article" className="w-full">
            <TabsList className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-5'} mb-4`}>
              <TabsTrigger value="article">Artigo</TabsTrigger>
              <TabsTrigger value="explanation">Explicação</TabsTrigger>
              {!isMobile && <TabsTrigger value="example">Exemplo</TabsTrigger>}
              {!isMobile && <TabsTrigger value="notes">Anotações</TabsTrigger>}
              {!isMobile && <TabsTrigger value="questions">Dúvidas</TabsTrigger>}
            </TabsList>

            <TabsContent value="article" className="mt-2 pb-4">
              <div ref={contentRef} className="prose prose-invert max-w-none space-y-4" 
                style={{ fontSize: `${fontSize}px` }}>
                {formattedContentWithHighlights()}
              </div>
            </TabsContent>

            <TabsContent value="explanation" className="mt-2 space-y-4">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Explicação</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" 
                      variant={explanationMode === 'technical' ? 'default' : 'outline'} 
                      onClick={() => loadExplanation('technical')}>
                      <Info className="h-4 w-4 mr-1" />
                      Técnica
                    </Button>
                    <Button size="sm" 
                      variant={explanationMode === 'formal' ? 'default' : 'outline'} 
                      onClick={() => loadExplanation('formal')}>
                      <Info className="h-4 w-4 mr-1" />
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

            <TabsContent value="example" className="mt-2 space-y-4">
              <div className="bg-card p-6 rounded-lg border">
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

            <TabsContent value="notes" className="mt-2 space-y-4">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                  <StickyNote className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Anotações</h3>
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
            </TabsContent>

            <TabsContent value="questions" className="mt-2 space-y-4">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Dúvidas</h3>
                </div>
                {isLoadingAI ? <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div> : !question ? <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <p className="text-center text-muted-foreground">
                      Faça uma pergunta sobre este artigo
                    </p>
                  </div> : <div className="prose prose-invert max-w-none whitespace-pre-line">
                    {answer}
                  </div>}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleView;
