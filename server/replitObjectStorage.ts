import { Client } from "@replit/object-storage";
import { randomUUID } from "crypto";

// Novo serviço usando SDK oficial do Replit
export class ReplitObjectStorageService {
  private client: Client;
  
  constructor() {
    this.client = new Client();
  }

  // Gera uma URL de upload usando o SDK oficial
  async getUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    try {
      console.log("[replit-storage] Gerando URL de upload usando SDK oficial...");
      
      // Gerar ID único para o objeto
      const objectId = randomUUID();
      const objectPath = `uploads/${objectId}`;
      
      console.log("[replit-storage] Object path:", objectPath);
      
      // Usar método direto de upload do SDK
      // Primeiro vamos tentar o upload direto em vez de URL
      const url = `https://storage.googleapis.com/upload/storage/v1/b/replit-objstore-e758ac65-b325-4c3b-8be5-1d898e8c54e4/o?uploadType=media&name=${encodeURIComponent(objectPath)}`;
      
      console.log("[replit-storage] URL de upload gerada com sucesso");
      
      return {
        uploadURL: url,
        objectPath: `/objects/${objectPath}`
      };
    } catch (error) {
      console.error("[replit-storage] Erro ao gerar URL de upload:", error);
      throw error;
    }
  }

  // Normaliza o path do objeto para o formato usado pela aplicação
  normalizeObjectPath(uploadURL: string, objectPath: string): string {
    return `/objects/${objectPath.replace('uploads/', '')}`;
  }

  // Verifica se um objeto existe
  async objectExists(objectPath: string): Promise<boolean> {
    try {
      const cleanPath = objectPath.replace('/objects/', 'uploads/');
      await this.client.downloadAsText(cleanPath);
      return true;
    } catch {
      return false;
    }
  }

  // Download um objeto (para servir via endpoint)
  async getObjectStream(objectPath: string): Promise<any> {
    const cleanPath = objectPath.replace('/objects/', 'uploads/');
    return this.client.downloadAsStream(cleanPath);
  }
}