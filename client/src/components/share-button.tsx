import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, Check } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  professionalName: string;
  professionalId: string;
  variant?: "icon" | "button";
  size?: "sm" | "default";
}

export default function ShareButton({ 
  professionalName, 
  professionalId, 
  variant = "icon",
  size = "default"
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const profileUrl = `${window.location.origin}/profissional/${professionalId}`;
  const shareText = `Confira o perfil de ${professionalName} no Monte Everest!`;

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${profileUrl}`)}`;
    window.open(url, "_blank");
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank");
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank");
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank");
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copiado para Instagram!",
        description: "Cole o link nos seus Stories ou bio do Instagram.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do perfil foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className={size === "sm" ? "h-8 w-8" : "h-10 w-10"}
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size={size}
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer">
          <FaWhatsapp className="h-4 w-4 mr-2 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebook} className="cursor-pointer">
          <FaFacebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter} className="cursor-pointer">
          <FaTwitter className="h-4 w-4 mr-2 text-sky-500" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLinkedIn} className="cursor-pointer">
          <FaLinkedin className="h-4 w-4 mr-2 text-blue-700" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleInstagram} className="cursor-pointer">
          <FaInstagram className="h-4 w-4 mr-2 text-pink-500" />
          Instagram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copiar link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
