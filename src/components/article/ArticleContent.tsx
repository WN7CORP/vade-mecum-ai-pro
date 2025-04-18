
import React from 'react';

interface ArticleHighlight {
  id: string;
  text: string;
  color: "purple" | "yellow" | "blue" | "green" | "pink";
  startOffset: number;
  endOffset: number;
}

interface ArticleContentProps {
  content: string;
  highlights: ArticleHighlight[];
  fontSize: number;
}

const HIGHLIGHT_COLORS = {
  purple: "bg-purple-500/30",
  yellow: "bg-yellow-500/30",
  blue: "bg-blue-500/30",
  green: "bg-green-500/30",
  pink: "bg-pink-500/30"
};

const ArticleContent = React.forwardRef<HTMLDivElement, ArticleContentProps>(
  ({ content, highlights, fontSize }, ref) => {
    const formatContent = (text: string) => {
      return text.split(/\n/).map((paragraph, index) => {
        const formattedParagraph = paragraph
          .replace(/(Art\.\s+\d+[°º]?(?:-[A-Z])?)/g, '<strong>$1</strong>')
          .replace(/(Parágrafo Único)/g, '<strong>$1</strong>');

        return (
          <p
            key={index}
            className="my-2"
            dangerouslySetInnerHTML={{
              __html: formattedParagraph || '<br />'
            }}
          />
        );
      });
    };

    const formattedContentWithHighlights = () => {
      if (highlights.length === 0) {
        return formatContent(content);
      }

      const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
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

        const paragraphHighlights = sortedHighlights
          .filter(h => {
            return (
              (h.startOffset >= paragraphStart && h.startOffset < paragraphEnd) ||
              (h.endOffset > paragraphStart && h.endOffset <= paragraphEnd) ||
              (h.startOffset <= paragraphStart && h.endOffset >= paragraphEnd)
            );
          })
          .map(h => ({
            ...h,
            startOffset: Math.max(0, h.startOffset - paragraphStart),
            endOffset: Math.min(paragraphLength, h.endOffset - paragraphStart)
          }));

        let formattedParagraph = paragraph
          .replace(/(Art\.\s+\d+[°º]?(?:-[A-Z])?)/g, '<strong>$1</strong>')
          .replace(/(Parágrafo Único)/g, '<strong>$1</strong>');

        if (paragraphHighlights.length === 0) {
          currentOffset += paragraphLength + 1;
          return (
            <p
              key={paragraphIndex}
              className="my-2"
              dangerouslySetInnerHTML={{
                __html: formattedParagraph
              }}
            />
          );
        }

        let result = [];
        let lastIndex = 0;

        for (const highlight of paragraphHighlights) {
          if (highlight.startOffset > lastIndex) {
            const beforeText = formattedParagraph.substring(lastIndex, highlight.startOffset);
            result.push(
              <span
                key={`${paragraphIndex}-${lastIndex}`}
                dangerouslySetInnerHTML={{
                  __html: beforeText
                }}
              />
            );
          }

          const highlightedText = formattedParagraph.substring(
            highlight.startOffset,
            highlight.endOffset
          );
          result.push(
            <span
              key={`highlight-${highlight.id}`}
              className={`${HIGHLIGHT_COLORS[highlight.color]} px-1 rounded`}
              dangerouslySetInnerHTML={{
                __html: highlightedText
              }}
            />
          );
          lastIndex = highlight.endOffset;
        }

        if (lastIndex < formattedParagraph.length) {
          const afterText = formattedParagraph.substring(lastIndex);
          result.push(
            <span
              key={`${paragraphIndex}-end`}
              dangerouslySetInnerHTML={{
                __html: afterText
              }}
            />
          );
        }

        currentOffset += paragraphLength + 1;
        return <p key={paragraphIndex} className="my-2">{result}</p>;
      });
    };

    return (
      <div
        ref={ref}
        className="article-content prose prose-invert max-w-none"
        style={{ fontSize: `${fontSize}px` }}
      >
        {formattedContentWithHighlights()}
      </div>
    );
  }
);

ArticleContent.displayName = "ArticleContent";

export default ArticleContent;
