import { useState } from "react";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function useViaCep() {
  const [loading, setLoading] = useState(false);

  const fetchAddressByCep = async (cep: string): Promise<ViaCepResponse | null> => {
    if (!cep || cep.length < 8) return null;
    
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return null;

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchAddressByCep, loading };
}