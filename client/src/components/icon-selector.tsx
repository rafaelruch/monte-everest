import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  // Casa e Imóveis
  faHome, faBuilding, faWarehouse, faStore, faHotel, faSchool, faHospital, faUniversity,
  faBed, faCouch, faBath, faToiletPaper, faDoorOpen,
  
  // Ferramentas e Construção
  faWrench, faHammer, faTools, faScrewdriver, faHardHat, faRuler,
  faRoad, faIndustry, faFire, faBolt,
  
  // Arte e Design
  faPaintBrush, faPalette, faPencilAlt, faPen, faImage, faCamera, faVideo,
  faMusic, faMicrophone, faHeadphones, faVolumeUp, faPlayCircle,
  faFilm, faTheaterMasks,
  
  // Saúde e Medicina
  faStethoscope, faHeartbeat, faPills, faSyringe, faUserMd, faAmbulance,
  faMedkit, faThermometer, faTooth, faEye,
  faHeart, faWheelchair,
  
  // Educação e Livros
  faBook, faGraduationCap, faBookOpen, faCalculator, faFlask,
  faMicroscope, faAtom, faGlobe, faMapMarkedAlt, faLanguage,
  
  // Tecnologia e Computação
  faDesktop, faLaptop, faMobile, faWifi, faServer, faCode, faBug,
  faDatabase, faCloud, faShieldAlt, faLock, faKey, faFingerprint,
  faRobot, faMicrochip, faKeyboard, faMouse, faHeadset,
  
  // Transporte e Veículos
  faCar, faTruck, faBus, faBicycle, faMotorcycle, faPlane, faHelicopter,
  faTrain, faShip, faRocket, faGasPump, faTaxi,
  faSubway, faTractor, faAnchor, faRoute,
  
  // Negócios e Finanças
  faMoneyBill, faDollarSign, faCoins, faCreditCard, faReceipt, faChartBar,
  faChartLine, faChartPie, faHandshake, faBriefcase,
  faShoppingCart, faTag, faPercent, faBalanceScale,
  
  // Comida e Bebida
  faUtensils, faCoffee, faBeer, faWineGlass, faPizzaSlice, faHamburger,
  faBirthdayCake, faIceCream, faAppleAlt, faCarrot, faBreadSlice,
  faFish, faEgg, faCheese, faCandyCane, faWineBottle, faCocktail,
  
  // Esportes e Atividades
  faDumbbell, faRunning, faBiking, faSwimmer, faSkiing, faFootballBall,
  faBasketballBall, faBaseballBall, faTableTennis, faHockeyPuck,
  faGolfBall, faMedal, faTrophy, faAward, faStopwatch, faFistRaised,
  
  // Natureza e Meio Ambiente
  faTree, faSeedling, faLeaf, faSun, faCloudRain, faSnowflake,
  faUmbrella, faMountain, faWater, faRecycle, faGlobeAmericas,
  faPaw, faDog, faCat, faFeather,
  
  // Pessoas e Relacionamentos
  faUser, faUsers, faUserFriends, faChild, faBaby, faUserTie, faUserNurse,
  faUserSecret, faUserAstronaut, faUserNinja, faSmile, faKiss,
  faUserPlus, faUserMinus, faUserCheck, faUserClock,
  
  // Comunicação e Social
  faPhone, faEnvelope, faComment, faComments, faShareAlt, faThumbsUp,
  faThumbsDown, faRetweet, faStar, faBookmark, faFlag,
  faBell, faBullhorn, faNewspaper, faRss, faAt,
  
  // Vestuário e Moda
  faTshirt, faHatCowboy, faGlasses, faRing, faGem,
  faShoppingBag, faShirt, faCrown, faHatWizard, faMask,
  
  // Utilidades e Objetos
  faPlug, faLightbulb, faBroom, faShower, faFaucet, faTrash,
  faBoxes, faGift, faCog,
  faMagnet, faBattery, faCalendar, faClock,
  
  // Símbolos e Interface
  faCheck, faTimes, faPlus, faMinus, faArrowUp, faArrowDown, faArrowLeft, faArrowRight,
  faSearch, faFilter, faSort, faRandom, faSync, faDownload, faUpload,
  faExpand, faCompress, faPlay, faPause, faStop, faForward, faBackward,
  
  // Diversos
  faGamepad, faDice, faPuzzlePiece, faBomb, faMagic,
  faQuestion, faExclamation, faInfo,
  faCompass, faMap, faLocationArrow, faMapPin, faBinoculars, faZap
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search } from "lucide-react";

const availableIcons = [
  // Casa e Imóveis
  { icon: faHome, name: "home", label: "Casa" },
  { icon: faBuilding, name: "building", label: "Prédio" },
  { icon: faWarehouse, name: "warehouse", label: "Armazém" },
  { icon: faStore, name: "store", label: "Loja" },
  { icon: faHotel, name: "hotel", label: "Hotel" },
  { icon: faSchool, name: "school", label: "Escola" },
  { icon: faHospital, name: "hospital", label: "Hospital" },
  { icon: faUniversity, name: "university", label: "Universidade" },
  { icon: faBed, name: "bed", label: "Cama" },
  { icon: faCouch, name: "couch", label: "Sofá" },
  { icon: faBath, name: "bath", label: "Banheira" },
  { icon: faShower, name: "shower", label: "Chuveiro" },
  { icon: faDoorOpen, name: "door-open", label: "Porta" },
  
  // Ferramentas e Construção
  { icon: faWrench, name: "wrench", label: "Chave Inglesa" },
  { icon: faHammer, name: "hammer", label: "Martelo" },
  { icon: faTools, name: "tools", label: "Ferramentas" },
  { icon: faScrewdriver, name: "screwdriver", label: "Chave de Fenda" },
  { icon: faHardHat, name: "hard-hat", label: "Capacete" },
  { icon: faRuler, name: "ruler", label: "Régua" },
  { icon: faRoad, name: "road", label: "Estrada" },
  { icon: faIndustry, name: "industry", label: "Indústria" },
  { icon: faFire, name: "fire", label: "Fogo" },
  { icon: faBolt, name: "bolt", label: "Raio" },
  
  // Arte e Design
  { icon: faPaintBrush, name: "paint-brush", label: "Pincel" },
  { icon: faPalette, name: "palette", label: "Paleta" },
  { icon: faPencilAlt, name: "pencil-alt", label: "Lápis" },
  { icon: faPen, name: "pen", label: "Caneta" },
  { icon: faImage, name: "image", label: "Imagem" },
  { icon: faCamera, name: "camera", label: "Câmera" },
  { icon: faVideo, name: "video", label: "Vídeo" },
  { icon: faMusic, name: "music", label: "Música" },
  { icon: faMicrophone, name: "microphone", label: "Microfone" },
  { icon: faHeadphones, name: "headphones", label: "Fones" },
  { icon: faVolumeUp, name: "volume-up", label: "Volume" },
  { icon: faPlayCircle, name: "play-circle", label: "Play" },
  { icon: faFilm, name: "film", label: "Filme" },
  { icon: faTheaterMasks, name: "theater-masks", label: "Teatro" },
  
  // Saúde e Medicina
  { icon: faStethoscope, name: "stethoscope", label: "Estetoscópio" },
  { icon: faHeartbeat, name: "heartbeat", label: "Batimento" },
  { icon: faPills, name: "pills", label: "Remédios" },
  { icon: faSyringe, name: "syringe", label: "Seringa" },
  { icon: faUserMd, name: "user-md", label: "Médico" },
  { icon: faAmbulance, name: "ambulance", label: "Ambulância" },
  { icon: faMedkit, name: "medkit", label: "Kit Médico" },
  { icon: faThermometer, name: "thermometer", label: "Termômetro" },
  { icon: faTooth, name: "tooth", label: "Dente" },
  { icon: faEye, name: "eye", label: "Olho" },
  { icon: faHeart, name: "heart", label: "Coração" },
  { icon: faWheelchair, name: "wheelchair", label: "Cadeira de Rodas" },
  
  // Educação e Livros
  { icon: faBook, name: "book", label: "Livro" },
  { icon: faGraduationCap, name: "graduation-cap", label: "Formatura" },
  { icon: faBookOpen, name: "book-open", label: "Livro Aberto" },
  { icon: faCalculator, name: "calculator", label: "Calculadora" },
  { icon: faFlask, name: "flask", label: "Laboratório" },
  { icon: faMicroscope, name: "microscope", label: "Microscópio" },
  { icon: faAtom, name: "atom", label: "Átomo" },
  { icon: faGlobe, name: "globe", label: "Globo" },
  { icon: faMapMarkedAlt, name: "map-marked-alt", label: "Mapa" },
  { icon: faLanguage, name: "language", label: "Idioma" },
  
  // Tecnologia e Computação
  { icon: faDesktop, name: "desktop", label: "Desktop" },
  { icon: faLaptop, name: "laptop", label: "Notebook" },
  { icon: faMobile, name: "mobile", label: "Celular" },
  { icon: faWifi, name: "wifi", label: "WiFi" },
  { icon: faServer, name: "server", label: "Servidor" },
  { icon: faCode, name: "code", label: "Código" },
  { icon: faBug, name: "bug", label: "Bug" },
  { icon: faDatabase, name: "database", label: "Banco de Dados" },
  { icon: faCloud, name: "cloud", label: "Nuvem" },
  { icon: faShieldAlt, name: "shield-alt", label: "Segurança" },
  { icon: faLock, name: "lock", label: "Cadeado" },
  { icon: faKey, name: "key", label: "Chave" },
  { icon: faRobot, name: "robot", label: "Robô" },
  { icon: faMicrochip, name: "microchip", label: "Chip" },
  { icon: faKeyboard, name: "keyboard", label: "Teclado" },
  { icon: faMouse, name: "mouse", label: "Mouse" },
  { icon: faHeadset, name: "headset", label: "Headset" },
  
  // Transporte e Veículos
  { icon: faCar, name: "car", label: "Carro" },
  { icon: faTruck, name: "truck", label: "Caminhão" },
  { icon: faBus, name: "bus", label: "Ônibus" },
  { icon: faBicycle, name: "bicycle", label: "Bicicleta" },
  { icon: faMotorcycle, name: "motorcycle", label: "Moto" },
  { icon: faPlane, name: "plane", label: "Avião" },
  { icon: faHelicopter, name: "helicopter", label: "Helicóptero" },
  { icon: faTrain, name: "train", label: "Trem" },
  { icon: faShip, name: "ship", label: "Navio" },
  { icon: faRocket, name: "rocket", label: "Foguete" },
  { icon: faGasPump, name: "gas-pump", label: "Posto de Gasolina" },
  { icon: faTaxi, name: "taxi", label: "Táxi" },
  { icon: faSubway, name: "subway", label: "Metrô" },
  { icon: faTractor, name: "tractor", label: "Trator" },
  { icon: faAnchor, name: "anchor", label: "Âncora" },
  { icon: faRoute, name: "route", label: "Rota" },
  
  // Negócios e Finanças
  { icon: faMoneyBill, name: "money-bill", label: "Dinheiro" },
  { icon: faDollarSign, name: "dollar-sign", label: "Dólar" },
  { icon: faCoins, name: "coins", label: "Moedas" },
  { icon: faCreditCard, name: "credit-card", label: "Cartão" },
  { icon: faReceipt, name: "receipt", label: "Recibo" },
  { icon: faChartBar, name: "chart-bar", label: "Gráfico" },
  { icon: faChartLine, name: "chart-line", label: "Gráfico Linear" },
  { icon: faChartPie, name: "chart-pie", label: "Gráfico Pizza" },
  { icon: faHandshake, name: "handshake", label: "Aperto de Mão" },
  { icon: faBriefcase, name: "briefcase", label: "Maleta" },
  { icon: faShoppingCart, name: "shopping-cart", label: "Carrinho" },
  { icon: faTag, name: "tag", label: "Tag" },
  { icon: faPercent, name: "percent", label: "Porcentagem" },
  { icon: faBalanceScale, name: "balance-scale", label: "Balança" },
  
  // Comida e Bebida
  { icon: faUtensils, name: "utensils", label: "Utensílios" },
  { icon: faCoffee, name: "coffee", label: "Café" },
  { icon: faBeer, name: "beer", label: "Cerveja" },
  { icon: faWineGlass, name: "wine-glass", label: "Taça" },
  { icon: faPizzaSlice, name: "pizza-slice", label: "Pizza" },
  { icon: faHamburger, name: "hamburger", label: "Hambúrguer" },
  { icon: faBirthdayCake, name: "birthday-cake", label: "Bolo" },
  { icon: faIceCream, name: "ice-cream", label: "Sorvete" },
  { icon: faAppleAlt, name: "apple-alt", label: "Maçã" },
  { icon: faCarrot, name: "carrot", label: "Cenoura" },
  { icon: faBreadSlice, name: "bread-slice", label: "Pão" },
  { icon: faFish, name: "fish", label: "Peixe" },
  { icon: faEgg, name: "egg", label: "Ovo" },
  { icon: faCheese, name: "cheese", label: "Queijo" },
  { icon: faCandyCane, name: "candy-cane", label: "Doce" },
  { icon: faWineBottle, name: "wine-bottle", label: "Vinho" },
  { icon: faCocktail, name: "cocktail", label: "Drink" },
  
  // Esportes e Atividades
  { icon: faDumbbell, name: "dumbbell", label: "Haltere" },
  { icon: faRunning, name: "running", label: "Corrida" },
  { icon: faBiking, name: "biking", label: "Ciclismo" },
  { icon: faSwimmer, name: "swimmer", label: "Natação" },
  { icon: faSkiing, name: "skiing", label: "Esqui" },
  { icon: faFootballBall, name: "football-ball", label: "Futebol" },
  { icon: faBasketballBall, name: "basketball-ball", label: "Basquete" },
  { icon: faBaseballBall, name: "baseball-ball", label: "Baseball" },
  { icon: faTableTennis, name: "table-tennis", label: "Ping Pong" },
  { icon: faHockeyPuck, name: "hockey-puck", label: "Hockey" },
  { icon: faGolfBall, name: "golf-ball", label: "Golf" },
  { icon: faMedal, name: "medal", label: "Medalha" },
  { icon: faTrophy, name: "trophy", label: "Troféu" },
  { icon: faAward, name: "award", label: "Prêmio" },
  { icon: faStopwatch, name: "stopwatch", label: "Cronômetro" },
  { icon: faFistRaised, name: "fist-raised", label: "Punho" },
  
  // Natureza e Meio Ambiente
  { icon: faTree, name: "tree", label: "Árvore" },
  { icon: faSeedling, name: "seedling", label: "Mudinha" },
  { icon: faLeaf, name: "leaf", label: "Folha" },
  { icon: faSun, name: "sun", label: "Sol" },
  { icon: faCloudRain, name: "cloud-rain", label: "Chuva" },
  { icon: faSnowflake, name: "snowflake", label: "Neve" },
  { icon: faUmbrella, name: "umbrella", label: "Guarda-chuva" },
  { icon: faMountain, name: "mountain", label: "Montanha" },
  { icon: faWater, name: "water", label: "Água" },
  { icon: faRecycle, name: "recycle", label: "Reciclagem" },
  { icon: faGlobeAmericas, name: "globe-americas", label: "Terra" },
  { icon: faPaw, name: "paw", label: "Pata" },
  { icon: faDog, name: "dog", label: "Cachorro" },
  { icon: faCat, name: "cat", label: "Gato" },
  { icon: faFeather, name: "feather", label: "Pena" },
  
  // Pessoas e Relacionamentos
  { icon: faUser, name: "user", label: "Usuário" },
  { icon: faUsers, name: "users", label: "Usuários" },
  { icon: faUserFriends, name: "user-friends", label: "Amigos" },
  { icon: faChild, name: "child", label: "Criança" },
  { icon: faBaby, name: "baby", label: "Bebê" },
  { icon: faUserTie, name: "user-tie", label: "Executivo" },
  { icon: faUserNurse, name: "user-nurse", label: "Enfermeiro" },
  { icon: faUserSecret, name: "user-secret", label: "Agente" },
  { icon: faUserAstronaut, name: "user-astronaut", label: "Astronauta" },
  { icon: faUserNinja, name: "user-ninja", label: "Ninja" },
  { icon: faSmile, name: "smile", label: "Sorriso" },
  { icon: faKiss, name: "kiss", label: "Beijo" },
  { icon: faUserPlus, name: "user-plus", label: "Adicionar Usuário" },
  { icon: faUserMinus, name: "user-minus", label: "Remover Usuário" },
  { icon: faUserCheck, name: "user-check", label: "Usuário Verificado" },
  { icon: faUserClock, name: "user-clock", label: "Usuário Tempo" },
  
  // Comunicação e Social
  { icon: faPhone, name: "phone", label: "Telefone" },
  { icon: faEnvelope, name: "envelope", label: "Email" },
  { icon: faComment, name: "comment", label: "Comentário" },
  { icon: faComments, name: "comments", label: "Comentários" },
  { icon: faShareAlt, name: "share-alt", label: "Compartilhar" },
  { icon: faThumbsUp, name: "thumbs-up", label: "Curtir" },
  { icon: faThumbsDown, name: "thumbs-down", label: "Não Curtir" },
  { icon: faRetweet, name: "retweet", label: "Retweet" },
  { icon: faStar, name: "star", label: "Estrela" },
  { icon: faBookmark, name: "bookmark", label: "Favorito" },
  { icon: faFlag, name: "flag", label: "Bandeira" },
  { icon: faBell, name: "bell", label: "Sino" },
  { icon: faBullhorn, name: "bullhorn", label: "Megafone" },
  { icon: faNewspaper, name: "newspaper", label: "Jornal" },
  { icon: faRss, name: "rss", label: "RSS" },
  { icon: faAt, name: "at", label: "Arroba" },
  
  // Vestuário e Moda
  { icon: faTshirt, name: "tshirt", label: "Camiseta" },
  { icon: faHatCowboy, name: "hat-cowboy", label: "Chapéu" },
  { icon: faGlasses, name: "glasses", label: "Óculos" },
  { icon: faRing, name: "ring", label: "Anel" },
  { icon: faGem, name: "gem", label: "Gema" },
  { icon: faShoppingBag, name: "shopping-bag", label: "Sacola" },
  { icon: faShirt, name: "shirt", label: "Camisa" },
  { icon: faCrown, name: "crown", label: "Coroa" },
  { icon: faHatWizard, name: "hat-wizard", label: "Chapéu de Mago" },
  { icon: faMask, name: "mask", label: "Máscara" },
  
  // Utilidades e Objetos
  { icon: faPlug, name: "plug", label: "Tomada" },
  { icon: faLightbulb, name: "lightbulb", label: "Lâmpada" },
  { icon: faBroom, name: "broom", label: "Vassoura" },
  { icon: faShower, name: "shower", label: "Chuveiro" },
  { icon: faFaucet, name: "faucet", label: "Torneira" },
  { icon: faTrash, name: "trash", label: "Lixo" },
  { icon: faBoxes, name: "boxes", label: "Caixas" },
  { icon: faGift, name: "gift", label: "Presente" },
  { icon: faCog, name: "cog", label: "Engrenagem" },
  { icon: faMagnet, name: "magnet", label: "Ímã" },
  { icon: faBattery, name: "battery", label: "Bateria" },
  { icon: faCalendar, name: "calendar", label: "Calendário" },
  { icon: faClock, name: "clock", label: "Relógio" },
  
  // Símbolos e Interface
  { icon: faCheck, name: "check", label: "Check" },
  { icon: faTimes, name: "times", label: "X" },
  { icon: faPlus, name: "plus", label: "Mais" },
  { icon: faMinus, name: "minus", label: "Menos" },
  { icon: faArrowUp, name: "arrow-up", label: "Seta Cima" },
  { icon: faArrowDown, name: "arrow-down", label: "Seta Baixo" },
  { icon: faArrowLeft, name: "arrow-left", label: "Seta Esquerda" },
  { icon: faArrowRight, name: "arrow-right", label: "Seta Direita" },
  { icon: faSearch, name: "search", label: "Busca" },
  { icon: faFilter, name: "filter", label: "Filtro" },
  { icon: faSort, name: "sort", label: "Ordenar" },
  { icon: faZap, name: "zap", label: "Raio" },
  { icon: faRandom, name: "random", label: "Aleatório" },
  { icon: faSync, name: "sync", label: "Sincronizar" },
  { icon: faDownload, name: "download", label: "Download" },
  { icon: faUpload, name: "upload", label: "Upload" },
  { icon: faExpand, name: "expand", label: "Expandir" },
  { icon: faCompress, name: "compress", label: "Comprimir" },
  { icon: faPlay, name: "play", label: "Play" },
  { icon: faPause, name: "pause", label: "Pause" },
  { icon: faStop, name: "stop", label: "Stop" },
  { icon: faForward, name: "forward", label: "Avançar" },
  { icon: faBackward, name: "backward", label: "Voltar" },
  
  // Diversos
  { icon: faGamepad, name: "gamepad", label: "Controle" },
  { icon: faDice, name: "dice", label: "Dado" },
  { icon: faPuzzlePiece, name: "puzzle-piece", label: "Quebra-cabeça" },
  { icon: faBomb, name: "bomb", label: "Bomba" },
  { icon: faMagic, name: "magic", label: "Mágica" },
  { icon: faQuestion, name: "question", label: "Pergunta" },
  { icon: faExclamation, name: "exclamation", label: "Exclamação" },
  { icon: faInfo, name: "info", label: "Informação" },
  { icon: faCompass, name: "compass", label: "Bússola" },
  { icon: faMap, name: "map", label: "Mapa" },
  { icon: faLocationArrow, name: "location-arrow", label: "Localização" },
  { icon: faMapPin, name: "map-pin", label: "Pin do Mapa" },
  { icon: faBinoculars, name: "binoculars", label: "Binóculo" }
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