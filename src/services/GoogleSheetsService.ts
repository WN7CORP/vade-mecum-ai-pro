import { GoogleSpreadsheet } from 'google-spreadsheet';

// Constantes
const SPREADSHEET_ID = '1rctu_xg4P0KkMWKbzu7-mgJp-HjCu-cT8DZqNAzln-s';
const API_KEY = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';

/**
 * Normaliza strings de artigo removendo prefixos e caracteres especiais,
 * deixando apenas dígitos para comparação.
 */
function normalizeArticleKey(value: any): string {
  if (value == null) return '';
  // Converte para string, minúsculas, e remove todas as letras e símbolos não numéricos
  return value
    .toString()
    .toLowerCase()
    // Remove palavras 'art' ou 'artigo' e possíveis pontos
    .replace(/art(igo)?\.?\s*/g, '')
    // Remove símbolos de grau e qualquer coisa não numérica
    .replace(/[^0-9]/g, '')
    .trim();
}

interface Law {
  title: string;
  index: number;
}

interface Article {
  number: string;    // Valor original da célula A
  content: string;   // Texto da célula B
  example?: string;
  technicalExplanation?: string;
  simpleExplanation?: string;
}

export class GoogleSheetsService {
  private doc: GoogleSpreadsheet;
  private initialized: boolean = false;
  private laws: Law[] = [];

  constructor() {
    this.doc = new GoogleSpreadsheet(SPREADSHEET_ID, { apiKey: API_KEY });
  }

  async init() {
    if (this.initialized) return;
    await this.doc.loadInfo();
    this.laws = [];
    for (let i = 0; i < this.doc.sheetCount; i++) {
      this.laws.push({ title: this.doc.sheetsByIndex[i].title, index: i });
    }
    this.initialized = true;
  }

  async getLaws(): Promise<Law[]> {
    if (!this.initialized) await this.init();
    return this.laws;
  }

  /**
   * Busca um artigo por número, aceitando variações como '1', '1°', 'Art. 1', etc.
   */
  async getArticleByNumber(lawIndex: number, articleQuery: string): Promise<Article | null> {
    if (!this.initialized) await this.init();
    const sheet = this.doc.sheetsByIndex[lawIndex];
    await sheet.loadCells('A1:E1000');

    const targetKey = normalizeArticleKey(articleQuery);
    for (let row = 0; row < 1000; row++) {
      const keyCell = sheet.getCell(row, 0);
      const rawKey = keyCell.value;
      const normalizedKey = normalizeArticleKey(rawKey);

      if (normalizedKey && normalizedKey === targetKey) {
        const contentCell = sheet.getCell(row, 1);
        const exampleCell = sheet.getCell(row, 2);
        const technicalExplanationCell = sheet.getCell(row, 3);
        const simpleExplanationCell = sheet.getCell(row, 4);
        
        return {
          number: rawKey?.toString() || '',
          content: contentCell.value?.toString() || '',
          example: exampleCell.value?.toString() || '',
          technicalExplanation: technicalExplanationCell.value?.toString() || '',
          simpleExplanation: simpleExplanationCell.value?.toString() || ''
        };
      }
    }
    return null;
  }

  async getAllArticles(lawIndex: number): Promise<Article[]> {
    if (!this.initialized) await this.init();
    const sheet = this.doc.sheetsByIndex[lawIndex];
    await sheet.loadCells('A1:E1000');

    const articles: Article[] = [];
    for (let row = 0; row < 1000; row++) {
      const numCell = sheet.getCell(row, 0);
      const contentCell = sheet.getCell(row, 1);
      const exampleCell = sheet.getCell(row, 2);
      const technicalExplanationCell = sheet.getCell(row, 3);
      const simpleExplanationCell = sheet.getCell(row, 4);

      if (numCell.value) {
        articles.push({
          number: numCell.value.toString(),
          content: contentCell.value?.toString() || '',
          example: exampleCell.value?.toString() || '',
          technicalExplanation: technicalExplanationCell.value?.toString() || '',
          simpleExplanation: simpleExplanationCell.value?.toString() || ''
        });
      }
      if (!numCell.value && !contentCell.value && articles.length > 0) {
        break;
      }
    }
    return articles;
  }
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
