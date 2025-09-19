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
  faShield, faKey, faLock, faCog, faChartBar, faMoneyBill,
  faQuestionCircle, faSnowflake, faLanguage, faBaby, faPalette,
  faBullhorn, faDroplet, faBalanceScale, faBuilding, faBolt
} from "@fortawesome/free-solid-svg-icons";

const iconMap = {
  "home": faHome,
  "wrench": faWrench,
  "hammer": faHammer,
  "paint-brush": faPaintBrush,
  "paintbrush": faPaintBrush, // alias
  "shower": faShower,
  "leaf": faLeaf,
  "car": faCar,
  "lightbulb": faLightbulb,
  "faucet": faFaucet,
  "tools": faTools,
  "broom": faBroom,
  "hard-hat": faHardHat,
  "plug": faPlug,
  "wifi": faWifi,
  "desktop": faDesktop,
  "laptop": faDesktop, // usando desktop como alternativa para laptop
  "camera": faCamera,
  "music": faMusic,
  "Music": faMusic, // case-insensitive
  "gamepad": faGamepad,
  "graduation-cap": faGraduationCap,
  "heartbeat": faHeartbeat,
  "stethoscope": faStethoscope,
  "cut": faCut,
  "scissors": faCut, // alias para cut
  "user-md": faUserMd,
  "dumbbell": faDumbbell,
  "running": faRunning,
  "utensils": faUtensils,
  "coffee": faCoffee,
  "birthday-cake": faBirthdayCake,
  "pizza-slice": faPizzaSlice,
  "ice-cream": faIceCream,
  "wine-glass": faWineGlass,
  "truck": faTruck,
  "bus": faBus,
  "bicycle": faBicycle,
  "motorcycle": faMotorcycle,
  "plane": faPlane,
  "ship": faShip,
  "tree": faTree,
  "seedling": faSeedling,
  "apple-alt": faAppleAlt,
  "dog": faDog,
  "cat": faCat,
  "shopping-bag": faShoppingBag,
  "gift": faGift,
  "tshirt": faTshirt,
  "shirt": faTshirt, // alias
  "gem": faGem,
  "ring": faRing,
  "umbrella": faUmbrella,
  "book": faBook,
  "pen": faPen,
  "calculator": faCalculator,
  "globe": faGlobe,
  "envelope": faEnvelope,
  "phone": faPhone,
  "heart": faHeart,
  "star": faStar,
  "thumbs-up": faThumbsUp,
  "smile": faSmile,
  "handshake": faHandshake,
  "award": faAward,
  "shield": faShield,
  "key": faKey,
  "lock": faLock,
  "cog": faCog,
  "chart-bar": faChartBar,
  "money-bill": faMoneyBill,
  // Novos ícones para mapear os existentes no banco
  "snowflake": faSnowflake,
  "refrigerator": faHome, // usando home como fallback para refrigerator
  "languages": faLanguage,
  "language": faLanguage,
  "zap": faBolt, // mapeamento correto para zap
  "baby": faBaby,
  "palette": faPalette,
  "megaphone": faBullhorn,
  "droplet": faDroplet,
  "scale": faBalanceScale,
  "activity": faHeartbeat, // usando heartbeat como alternativa para activity
  "flower": faLeaf, // usando leaf como alternativa para flower
  "building": faBuilding, // mapeamento para prédio
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