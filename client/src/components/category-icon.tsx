import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Importando TODOS os ícones do IconSelector para garantir compatibilidade total
import { 
  // Casa e Imóveis
  faHome, faBuilding, faWarehouse, faStore, faHotel, faSchool, faHospital, faUniversity,
  faBed, faCouch, faBath, faShower, faDoorOpen,
  
  // Ferramentas e Construção
  faWrench, faHammer, faTools, faScrewdriver, faHardHat, faRuler,
  faRoad, faIndustry, faFire, faBolt,
  
  // Arte e Design
  faPaintBrush, faPalette, faPencilAlt, faPen, faImage, faCamera, faVideo,
  faMusic, faMicrophone, faHeadphones, faVolumeUp, faPlayCircle,
  faFilm, faTheaterMasks,
  
  // Saúde e Medicina
  faStethoscope, faHeartbeat, faPills, faSyringe, faUserMd, faAmbulance,
  faMedkit, faThermometer, faTooth, faEye, faHeart, faWheelchair,
  
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
  faPlug, faLightbulb, faBroom, faFaucet, faTrash,
  faBoxes, faGift, faCog, faMagnet, faBattery, faCalendar, faClock,
  
  // Símbolos e Interface
  faCheck, faTimes, faPlus, faMinus, faArrowUp, faArrowDown, faArrowLeft, faArrowRight,
  faSearch, faFilter, faSort, faRandom, faSync, faDownload, faUpload, faExpand, faCompress,
  faPlay, faPause, faStop, faForward, faBackward,
  
  // Jogos e Entretenimento
  faGamepad, faDice, faPuzzlePiece, faBomb, faMagic,
  faQuestion, faExclamation, faInfo, faCompass, faMap, faLocationArrow, faMapPin,
  
  // Extras
  faQuestionCircle, faDroplet, faShield, faHourglass
} from "@fortawesome/free-solid-svg-icons";

// Mapeamento automático de TODOS os ícones disponíveis no IconSelector
const iconMap: { [key: string]: any } = {
  // Casa e Construção
  "home": faHome,
  "building": faBuilding,
  "warehouse": faWarehouse,
  "store": faStore,
  "hotel": faHotel,
  "school": faSchool,
  "hospital": faHospital,
  "university": faUniversity,
  "bed": faBed,
  "couch": faCouch,
  "bath": faBath,
  "shower": faShower,
  "door-open": faDoorOpen,

  // Ferramentas e Construção
  "wrench": faWrench,
  "hammer": faHammer,
  "tools": faTools,
  "screwdriver": faScrewdriver,
  "hard-hat": faHardHat,
  "ruler": faRuler,
  "road": faRoad,
  "industry": faIndustry,
  "fire": faFire,
  "bolt": faBolt,

  // Arte e Design
  "paint-brush": faPaintBrush,
  "palette": faPalette,
  "pencil-alt": faPencilAlt,
  "pen": faPen,
  "image": faImage,
  "camera": faCamera,
  "video": faVideo,
  "music": faMusic,
  "microphone": faMicrophone,
  "headphones": faHeadphones,
  "volume-up": faVolumeUp,
  "play-circle": faPlayCircle,
  "film": faFilm,
  "theater-masks": faTheaterMasks,

  // Saúde e Medicina
  "stethoscope": faStethoscope,
  "heartbeat": faHeartbeat,
  "pills": faPills,
  "syringe": faSyringe,
  "user-md": faUserMd,
  "ambulance": faAmbulance,
  "medkit": faMedkit,
  "thermometer": faThermometer,
  "tooth": faTooth,
  "eye": faEye,
  "heart": faHeart,
  "wheelchair": faWheelchair,

  // Educação
  "book": faBook,
  "graduation-cap": faGraduationCap,
  "book-open": faBookOpen,
  "calculator": faCalculator,
  "flask": faFlask,
  "microscope": faMicroscope,
  "atom": faAtom,
  "globe": faGlobe,
  "map-marked-alt": faMapMarkedAlt,
  "language": faLanguage,

  // Tecnologia
  "desktop": faDesktop,
  "laptop": faLaptop,
  "mobile": faMobile,
  "wifi": faWifi,
  "server": faServer,
  "code": faCode,
  "bug": faBug,
  "database": faDatabase,
  "cloud": faCloud,
  "shield-alt": faShieldAlt,
  "lock": faLock,
  "key": faKey,
  "fingerprint": faFingerprint,
  "robot": faRobot,
  "microchip": faMicrochip,
  "keyboard": faKeyboard,
  "mouse": faMouse,
  "headset": faHeadset,

  // Transporte
  "car": faCar,
  "truck": faTruck,
  "bus": faBus,
  "bicycle": faBicycle,
  "motorcycle": faMotorcycle,
  "plane": faPlane,
  "helicopter": faHelicopter,
  "train": faTrain,
  "ship": faShip,
  "rocket": faRocket,
  "gas-pump": faGasPump,
  "taxi": faTaxi,
  "subway": faSubway,
  "tractor": faTractor,
  "anchor": faAnchor,
  "route": faRoute,

  // Negócios
  "money-bill": faMoneyBill,
  "dollar-sign": faDollarSign,
  "coins": faCoins,
  "credit-card": faCreditCard,
  "receipt": faReceipt,
  "chart-bar": faChartBar,
  "chart-line": faChartLine,
  "chart-pie": faChartPie,
  "handshake": faHandshake,
  "briefcase": faBriefcase,
  "shopping-cart": faShoppingCart,
  "tag": faTag,
  "percent": faPercent,
  "balance-scale": faBalanceScale,

  // Comida
  "utensils": faUtensils,
  "coffee": faCoffee,
  "beer": faBeer,
  "wine-glass": faWineGlass,
  "pizza-slice": faPizzaSlice,
  "hamburger": faHamburger,
  "birthday-cake": faBirthdayCake,
  "ice-cream": faIceCream,
  "apple-alt": faAppleAlt,
  "carrot": faCarrot,
  "bread-slice": faBreadSlice,
  "fish": faFish,
  "egg": faEgg,
  "cheese": faCheese,
  "candy-cane": faCandyCane,
  "wine-bottle": faWineBottle,
  "cocktail": faCocktail,

  // Esportes
  "dumbbell": faDumbbell,
  "running": faRunning,
  "biking": faBiking,
  "swimmer": faSwimmer,
  "skiing": faSkiing,
  "football-ball": faFootballBall,
  "basketball-ball": faBasketballBall,
  "baseball-ball": faBaseballBall,
  "table-tennis": faTableTennis,
  "hockey-puck": faHockeyPuck,
  "golf-ball": faGolfBall,
  "medal": faMedal,
  "trophy": faTrophy,
  "award": faAward,
  "stopwatch": faStopwatch,
  "fist-raised": faFistRaised,

  // Natureza
  "tree": faTree,
  "seedling": faSeedling,
  "leaf": faLeaf,
  "sun": faSun,
  "cloud-rain": faCloudRain,
  "snowflake": faSnowflake,
  "umbrella": faUmbrella,
  "mountain": faMountain,
  "water": faWater,
  "recycle": faRecycle,
  "globe-americas": faGlobeAmericas,
  "paw": faPaw,
  "dog": faDog,
  "cat": faCat,
  "feather": faFeather,

  // Pessoas
  "user": faUser,
  "users": faUsers,
  "user-friends": faUserFriends,
  "child": faChild,
  "baby": faBaby,
  "user-tie": faUserTie,
  "user-nurse": faUserNurse,
  "user-secret": faUserSecret,
  "user-astronaut": faUserAstronaut,
  "user-ninja": faUserNinja,
  "smile": faSmile,
  "kiss": faKiss,
  "user-plus": faUserPlus,
  "user-minus": faUserMinus,
  "user-check": faUserCheck,
  "user-clock": faUserClock,

  // Comunicação
  "phone": faPhone,
  "envelope": faEnvelope,
  "comment": faComment,
  "comments": faComments,
  "share-alt": faShareAlt,
  "thumbs-up": faThumbsUp,
  "thumbs-down": faThumbsDown,
  "retweet": faRetweet,
  "star": faStar,
  "bookmark": faBookmark,
  "flag": faFlag,
  "bell": faBell,
  "bullhorn": faBullhorn,
  "newspaper": faNewspaper,
  "rss": faRss,
  "at": faAt,

  // Vestuário
  "tshirt": faTshirt,
  "hat-cowboy": faHatCowboy,
  "glasses": faGlasses,
  "ring": faRing,
  "gem": faGem,
  "shopping-bag": faShoppingBag,
  "shirt": faShirt,
  "crown": faCrown,
  "hat-wizard": faHatWizard,
  "mask": faMask,

  // Utilidades
  "plug": faPlug,
  "lightbulb": faLightbulb,
  "broom": faBroom,
  "faucet": faFaucet,
  "trash": faTrash,
  "boxes": faBoxes,
  "gift": faGift,
  "cog": faCog,
  "magnet": faMagnet,
  "battery": faBattery,
  "calendar": faCalendar,
  "clock": faClock,

  // Interface
  "check": faCheck,
  "times": faTimes,
  "plus": faPlus,
  "minus": faMinus,
  "arrow-up": faArrowUp,
  "arrow-down": faArrowDown,
  "arrow-left": faArrowLeft,
  "arrow-right": faArrowRight,
  "search": faSearch,
  "filter": faFilter,
  "sort": faSort,
  "random": faRandom,
  "sync": faSync,
  "download": faDownload,
  "upload": faUpload,
  "expand": faExpand,
  "compress": faCompress,
  "play": faPlay,
  "pause": faPause,
  "stop": faStop,
  "forward": faForward,
  "backward": faBackward,

  // Jogos
  "gamepad": faGamepad,
  "dice": faDice,
  "puzzle-piece": faPuzzlePiece,
  "bomb": faBomb,
  "magic": faMagic,
  "question": faQuestion,
  "exclamation": faExclamation,
  "info": faInfo,
  "compass": faCompass,
  "map": faMap,
  "location-arrow": faLocationArrow,
  "map-pin": faMapPin,
  
  // Ícones especiais e aliases
  "zap": faBolt, // Mapeamento especial para raio
  "scale": faBalanceScale, // Alias
  "droplet": faDroplet,
  "shield": faShieldAlt, // Alias
  "hourglass": faHourglass,
  "question-circle": faQuestionCircle,

  // Aliases para compatibilidade
  "paintbrush": faPaintBrush,
  "cut": faScrewdriver, // fallback
  "scissors": faScrewdriver, // fallback
  "megaphone": faBullhorn,
  "activity": faHeartbeat,
  "flower": faLeaf, // fallback
  "languages": faLanguage,
  "refrigerator": faHome, // fallback
  "Music": faMusic, // case-insensitive
};

interface CategoryIconProps {
  iconName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CategoryIcon({ iconName, className = "", size = "md" }: CategoryIconProps) {
  const icon = iconName ? iconMap[iconName as keyof typeof iconMap] : null;
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }[size];

  if (!icon) {
    return <FontAwesomeIcon icon={faQuestionCircle} className={`${sizeClass} ${className}`} />;
  }

  return <FontAwesomeIcon icon={icon} className={`${sizeClass} ${className}`} />;
}