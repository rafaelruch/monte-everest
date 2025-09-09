import { Client } from "@replit/object-storage";
import { randomUUID } from "crypto";
import { Readable } from "stream";

// Novo serviço usando SDK oficial do Replit com upload direto
export class ReplitObjectStorageService {
  private client: Client;
  
  constructor() {
    this.client = new Client();
  }

  // Faz upload direto de um arquivo para o object storage
  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    try {
      console.log("[replit-storage] Fazendo upload direto do arquivo...");
      
      // Gerar ID único para o objeto
      const objectId = randomUUID();
      const extension = fileName.split('.').pop() || 'jpg';
      const objectPath = `uploads/${objectId}.${extension}`;
      
      console.log("[replit-storage] Object path:", objectPath);
      console.log("[replit-storage] Tamanho do arquivo:", fileBuffer.length, "bytes");
      
      // Converter buffer para stream
      const stream = new Readable({
        read() {
          this.push(fileBuffer);
          this.push(null);
        }
      });
      
      // Upload usando o SDK oficial
      const result = await this.client.upload(objectPath, stream);
      
      if (!result.ok) {
        throw new Error(`Upload falhou: ${result.error}`);
      }
      
      console.log("[replit-storage] Upload concluído com sucesso");
      
      return `/objects/${objectPath}`;
    } catch (error) {
      console.error("[replit-storage] Erro no upload:", error);
      throw error;
    }
  }

  // Verifica se um objeto existe
  async objectExists(objectPath: string): Promise<boolean> {
    try {
      const cleanPath = objectPath.replace('/objects/', 'uploads/');
      const result = await this.client.downloadAsText(cleanPath);
      return result.ok;
    } catch {
      return false;
    }
  }

  // Download um objeto (para servir via endpoint)
  async downloadObject(objectPath: string): Promise<{ data: Readable; mimeType?: string } | null> {
    try {
      const cleanPath = objectPath.replace('/objects/', 'uploads/');
      const result = await this.client.downloadAsStream(cleanPath);
      
      if (!result.ok) {
        return null;
      }
      
      // Determinar o tipo MIME baseado na extensão
      const extension = cleanPath.split('.').pop()?.toLowerCase();
      const mimeType = this.getMimeType(extension || '');
      
      return {
        data: result.value,
        mimeType
      };
    } catch (error) {
      console.error("[replit-storage] Erro ao baixar objeto:", error);
      return null;
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
}