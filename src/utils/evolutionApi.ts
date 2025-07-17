// Configurações da Evolution API
export const EVOLUTION_CONFIG = {
  baseUrl: "https://evolutionapi.golawtech.com.br",
  instanceName: "financeiro",
  apiKey: "CBC133AC3891-47A8-A371-A1EDCBC2D880"
};

// Tipos para a API
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface EvolutionApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface QRCodeResponse {
  base64?: string;
  code?: string;
}

export interface ConnectionStateResponse {
  instance?: {
    state: string;
    instanceName: string;
  };
}

// Classe para gerenciar a Evolution API
export class EvolutionApiService {
  private baseUrl: string;
  private instanceName: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = EVOLUTION_CONFIG.baseUrl;
    this.instanceName = EVOLUTION_CONFIG.instanceName;
    this.apiKey = EVOLUTION_CONFIG.apiKey;
  }

  // Headers padrão para as requisições
  private getHeaders(): HeadersInit {
    return {
      'apikey': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Verificar status da conexão
  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/instance/connectionState/${this.instanceName}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (response.ok) {
        const data: ConnectionStateResponse = await response.json();
        return data.instance?.state === "open" ? "connected" : "disconnected";
      } else {
        return "error";
      }
    } catch (error) {
      console.error("Erro ao verificar status da conexão:", error);
      return "error";
    }
  }

  // Gerar QR Code para conexão
  async generateQRCode(): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/instance/connect/${this.instanceName}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (response.ok) {
        const data: QRCodeResponse = await response.json();
        if (data.base64) {
          return { success: true, qrCode: data.base64 };
        } else {
          return { success: false, error: "QR Code não encontrado na resposta" };
        }
      } else {
        const errorText = await response.text();
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      return { success: false, error: "Erro de conexão com a API" };
    }
  }

  // Desconectar instância
  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/instance/logout/${this.instanceName}`,
        {
          method: 'DELETE',
          headers: this.getHeaders()
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      return { success: false, error: "Erro de conexão com a API" };
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(
    phoneNumber: string, 
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Limpar o número de telefone (remover caracteres não numéricos)
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // Adicionar código do país se não estiver presente
      const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

      const response = await fetch(
        `${this.baseUrl}/message/sendText/${this.instanceName}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            number: formattedNumber,
            text: message
          })
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return { success: false, error: "Erro de conexão com a API" };
    }
  }

  // Criar instância (se necessário)
  async createInstance(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/instance/create`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            instanceName: this.instanceName,
            token: this.apiKey,
            qrcode: true,
            markMessagesRead: true,
            delayMessage: 1000,
            msgRetryCounterValue: 3,
            alwaysOnline: true,
            readMessages: true,
            readStatus: true,
            syncFullHistory: true
          })
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error("Erro ao criar instância:", error);
      return { success: false, error: "Erro de conexão com a API" };
    }
  }

  // Verificar se a instância existe
  async instanceExists(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/instance/fetchInstances`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) && data.some(instance => 
          instance.instance?.instanceName === this.instanceName
        );
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar instância:", error);
      return false;
    }
  }
}

// Instância singleton do serviço
export const evolutionApiService = new EvolutionApiService();