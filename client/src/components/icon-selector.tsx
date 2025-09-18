import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHome, faWrench, faHammer, faPaintBrush, faShower, faLeaf, faCar,
  faLightbulb, faFaucet, faTools, faBroom, faHardHat, faPlug,
  faWifi, faDesktop, faCamera, faMusic, faGamepad, faGraduationCap,
  faHeartbeat, faStethoscope, faCut, faUserMd, faDumbbell, faRunning,
  faUtensils, faCoffee, faBirthdayCake, faPizzaSlice, faIceCream, faWineGlass,
  faTruck, faBus, faBicycle, faMotorcycle, faPlane, faShip,
  faTree, faSeedling, faAppleAlt, faDog, faCat,
  faShoppingBag, faGift, faTshirt, faGem, faRing, faUmbrella,
  faBook, faPen, faCalculator, faGlobe, faEnvelope, faPhone,
  faHeart, faStar, faThumbsUp, faSmile, faHandshake, faAward,
  faShield, faKey, faLock, faCog, faChartBar, faMoneyBill
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search } from "lucide-react";

const availableIcons = [
  { icon: faHome, name: "home", label: "Casa" },
  { icon: faWrench, name: "wrench", label: "Chave Inglesa" },
  { icon: faHammer, name: "hammer", label: "Martelo" },
  { icon: faPaintBrush, name: "paint-brush", label: "Pincel" },
  { icon: faShower, name: "shower", label: "Chuveiro" },
  { icon: faLeaf, name: "leaf", label: "Folha" },
  { icon: faCar, name: "car", label: "Carro" },
  { icon: faLightbulb, name: "lightbulb", label: "Lâmpada" },
  { icon: faFaucet, name: "faucet", label: "Torneira" },
  { icon: faTools, name: "tools", label: "Ferramentas" },
  { icon: faBroom, name: "broom", label: "Vassoura" },
  { icon: faHardHat, name: "hard-hat", label: "Capacete" },
  { icon: faPlug, name: "plug", label: "Tomada" },
  { icon: faWifi, name: "wifi", label: "WiFi" },
  { icon: faDesktop, name: "desktop", label: "Desktop" },
  { icon: faCamera, name: "camera", label: "Câmera" },
  { icon: faMusic, name: "music", label: "Música" },
  { icon: faGamepad, name: "gamepad", label: "Controle" },
  { icon: faGraduationCap, name: "graduation-cap", label: "Formatura" },
  { icon: faHeartbeat, name: "heartbeat", label: "Batimento" },
  { icon: faStethoscope, name: "stethoscope", label: "Estetoscópio" },
  { icon: faCut, name: "cut", label: "Tesoura" },
  { icon: faUserMd, name: "user-md", label: "Médico" },
  { icon: faDumbbell, name: "dumbbell", label: "Haltere" },
  { icon: faRunning, name: "running", label: "Corrida" },
  { icon: faUtensils, name: "utensils", label: "Utensílios" },
  { icon: faCoffee, name: "coffee", label: "Café" },
  { icon: faBirthdayCake, name: "birthday-cake", label: "Bolo" },
  { icon: faPizzaSlice, name: "pizza-slice", label: "Pizza" },
  { icon: faIceCream, name: "ice-cream", label: "Sorvete" },
  { icon: faWineGlass, name: "wine-glass", label: "Taça" },
  { icon: faTruck, name: "truck", label: "Caminhão" },
  { icon: faBus, name: "bus", label: "Ônibus" },
  { icon: faBicycle, name: "bicycle", label: "Bicicleta" },
  { icon: faMotorcycle, name: "motorcycle", label: "Moto" },
  { icon: faPlane, name: "plane", label: "Avião" },
  { icon: faShip, name: "ship", label: "Navio" },
  { icon: faTree, name: "tree", label: "Árvore" },
  { icon: faSeedling, name: "seedling", label: "Mudinha" },
  { icon: faAppleAlt, name: "apple-alt", label: "Maçã" },
  { icon: faDog, name: "dog", label: "Cachorro" },
  { icon: faCat, name: "cat", label: "Gato" },
  { icon: faShoppingBag, name: "shopping-bag", label: "Sacola" },
  { icon: faGift, name: "gift", label: "Presente" },
  { icon: faTshirt, name: "tshirt", label: "Camiseta" },
  { icon: faGem, name: "gem", label: "Gema" },
  { icon: faRing, name: "ring", label: "Anel" },
  { icon: faUmbrella, name: "umbrella", label: "Guarda-chuva" },
  { icon: faBook, name: "book", label: "Livro" },
  { icon: faPen, name: "pen", label: "Caneta" },
  { icon: faCalculator, name: "calculator", label: "Calculadora" },
  { icon: faGlobe, name: "globe", label: "Globo" },
  { icon: faEnvelope, name: "envelope", label: "Envelope" },
  { icon: faPhone, name: "phone", label: "Telefone" },
  { icon: faHeart, name: "heart", label: "Coração" },
  { icon: faStar, name: "star", label: "Estrela" },
  { icon: faThumbsUp, name: "thumbs-up", label: "Curtir" },
  { icon: faSmile, name: "smile", label: "Sorriso" },
  { icon: faHandshake, name: "handshake", label: "Aperto de Mão" },
  { icon: faAward, name: "award", label: "Prêmio" },
  { icon: faShield, name: "shield", label: "Escudo" },
  { icon: faKey, name: "key", label: "Chave" },
  { icon: faLock, name: "lock", label: "Cadeado" },
  { icon: faCog, name: "cog", label: "Engrenagem" },
  { icon: faChartBar, name: "chart-bar", label: "Gráfico" },
  { icon: faMoneyBill, name: "money-bill", label: "Dinheiro" },
];

interface IconSelectorProps {
  value?: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

export default function IconSelector({ value, onChange, placeholder = "Selecione um ícone" }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedIcon = availableIcons.find(icon => icon.name === value);
  
  const filteredIcons = availableIcons.filter(icon => 
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          className="w-full justify-start h-10"
          data-testid="icon-selector-trigger"
        >
          {selectedIcon ? (
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={selectedIcon.icon} className="h-4 w-4" />
              <span>{selectedIcon.label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ícones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              data-testid="icon-search-input"
            />
          </div>
          
          <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto p-2">
            {filteredIcons.map((iconData) => (
              <Button
                key={iconData.name}
                type="button"
                variant="ghost"
                className="h-16 w-16 flex flex-col items-center justify-center gap-1 hover:bg-primary/10"
                onClick={() => handleIconSelect(iconData.name)}
                data-testid={`icon-option-${iconData.name}`}
                title={iconData.label}
              >
                <FontAwesomeIcon icon={iconData.icon} className="h-6 w-6" />
                <span className="text-xs truncate w-full text-center">
                  {iconData.label}
                </span>
              </Button>
            ))}
          </div>
          
          {filteredIcons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum ícone encontrado para "{searchTerm}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}