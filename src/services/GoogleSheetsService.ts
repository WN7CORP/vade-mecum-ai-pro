
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';

// Constantes
const SPREADSHEET_ID = '1rctu_xg4P0KkMWKbzu7-mgJp-HjCu-cT8DZqNAzln-s';
const API_KEY = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';

interface Law {
  title: string;
  index: number;
}

interface Article {
  number: string;
  content: string;
}

class GoogleSheetsService {
  private doc: GoogleSpreadsheet;
  private initialized: boolean = false;
  private laws: Law[] = [];

  constructor() {
    this.doc = new GoogleSpreadsheet(SPREADSHEET_ID, { apiKey: API_KEY });
  }

  async init() {
    if (this.initialized) return;

    try {
      // Load document properties and sheets
      await this.doc.loadInfo();
      this.initialized = true;

      // Carrega as leis disponíveis
      this.laws = [];
      for (let i = 0; i < this.doc.sheetCount; i++) {
        const sheet = this.doc.sheetsByIndex[i];
        this.laws.push({
          title: sheet.title,
          index: i
        });
      }
    } catch (error) {
      console.error('Falha ao inicializar o serviço do Google Sheets:', error);
      throw error;
    }
  }

  async getLaws() {
    if (!this.initialized) await this.init();
    return this.laws;
  }

  async getArticleByNumber(lawIndex: number, articleNumber: string): Promise<Article | null> {
    if (!this.initialized) await this.init();

    try {
      const sheet = this.doc.sheetsByIndex[lawIndex];
      await sheet.loadCells('A1:B1000'); // Carrega um número razoável de células

      // Procura pelo número do artigo na coluna A
      for (let i = 0; i < 1000; i++) {
        const cell = sheet.getCell(i, 0);
        if (cell.value === articleNumber) {
          // Encontrou o artigo, retorna o conteúdo da coluna B
          const contentCell = sheet.getCell(i, 1);
          return {
            number: articleNumber,
            content: contentCell.value?.toString() || ''
          };
        }
      }

      return null; // Artigo não encontrado
    } catch (error) {
      console.error('Falha ao buscar artigo:', error);
      throw error;
    }
  }

  async getAllArticles(lawIndex: number): Promise<Article[]> {
    if (!this.initialized) await this.init();

    try {
      const sheet = this.doc.sheetsByIndex[lawIndex];
      await sheet.loadCells('A1:B1000'); // Carrega um número razoável de células

      const articles: Article[] = [];

      // Percorre todas as linhas até encontrar uma vazia
      for (let i = 0; i < 1000; i++) {
        const numberCell = sheet.getCell(i, 0);
        const contentCell = sheet.getCell(i, 1);

        // Se a célula A não está vazia, é um artigo
        if (numberCell.value) {
          articles.push({
            number: numberCell.value.toString(),
            content: contentCell.value?.toString() || ''
          });
        }

        // Se ambas as células estão vazias, assumimos que chegamos ao fim dos dados
        if (!numberCell.value && !contentCell.value) {
          if (articles.length > 0) break;
        }
      }

      return articles;
    } catch (error) {
      console.error('Falha ao buscar todos os artigos:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
