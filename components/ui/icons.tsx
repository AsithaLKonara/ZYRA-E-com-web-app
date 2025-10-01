import React from 'react';
import { LucideIcon } from 'lucide-react';

// Re-export commonly used icons from lucide-react
export {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  X,
  Loader2,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Heart,
  Share2,
  MessageCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Menu,
  X as Close,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  StarHalf,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Github,
  Linkedin,
  ExternalLink,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Save,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Grid,
  List,
  Layout,
  Sidebar,
  MoreHorizontal,
  MoreVertical,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  CreditCard,
  Wallet,
  Package,
  Truck,
  Home,
  Building,
  Map,
  Navigation,
  Compass,
  Target,
  Zap,
  Shield,
  Key,
  Fingerprint,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Headphones,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Image,
  File,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Send,
  Reply,
  Forward,
  ReplyAll,
  Trash,
  ArchiveRestore,
  Pin,
  PinOff,
  Bell,
  BellOff,
  BellRing,
  Moon,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Sunrise,
  Sunset,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  DollarSign as Dollar,
  Euro,
  PoundSterling,
  JapaneseYen,
  IndianRupee,
  Bitcoin,
  CreditCard as Card,
  Wallet as WalletIcon,
  Receipt,
  Calculator,
  Percent,
  TrendingUp as Growth,
  TrendingDown as Decline,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowLeftRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Move,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  RotateCcw as Undo,
  RotateCw as Redo,
  History,
  Clock as Time,
  Timer,
  Hourglass,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  Star as CalendarStar,
  Calendar as Event,
  Calendar as EventIcon,
  Clock as ClockIcon,
  Timer as TimerIcon,
  Timer as StopwatchIcon,
  Hourglass as HourglassIcon,
  type LucideIcon as IconType,
} from 'lucide-react';

// Create a type for icon names
export type IconName = 
  | 'alert-circle'
  | 'arrow-left'
  | 'arrow-right'
  | 'check'
  | 'check-circle'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'mail'
  | 'user'
  | 'x'
  | 'loader2'
  | 'plus'
  | 'minus'
  | 'search'
  | 'shopping-cart'
  | 'heart'
  | 'share2'
  | 'message-circle'
  | 'play'
  | 'pause'
  | 'volume2'
  | 'volume-x'
  | 'settings'
  | 'menu'
  | 'close'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'star'
  | 'star-half'
  | 'filter'
  | 'sort-asc'
  | 'sort-desc'
  | 'calendar'
  | 'clock'
  | 'map-pin'
  | 'phone'
  | 'globe'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'github'
  | 'linkedin'
  | 'external-link'
  | 'download'
  | 'upload'
  | 'edit'
  | 'trash2'
  | 'copy'
  | 'save'
  | 'refresh-cw'
  | 'rotate-ccw'
  | 'rotate-cw'
  | 'zoom-in'
  | 'zoom-out'
  | 'maximize'
  | 'minimize'
  | 'grid'
  | 'list'
  | 'layout'
  | 'sidebar'
  | 'more-horizontal'
  | 'more-vertical'
  | 'flag'
  | 'bookmark'
  | 'tag'
  | 'hash'
  | 'at-sign'
  | 'dollar-sign'
  | 'credit-card'
  | 'wallet'
  | 'package'
  | 'truck'
  | 'home'
  | 'building'
  | 'map'
  | 'navigation'
  | 'compass'
  | 'target'
  | 'zap'
  | 'shield'
  | 'key'
  | 'fingerprint'
  | 'smartphone'
  | 'monitor'
  | 'tablet'
  | 'laptop'
  | 'headphones'
  | 'camera'
  | 'mic'
  | 'mic-off'
  | 'video'
  | 'video-off'
  | 'image'
  | 'file'
  | 'file-text'
  | 'folder'
  | 'folder-open'
  | 'archive'
  | 'inbox'
  | 'send'
  | 'reply'
  | 'forward'
  | 'reply-all'
  | 'trash'
  | 'archive-restore'
  | 'pin'
  | 'pin-off'
  | 'bell'
  | 'bell-off'
  | 'bell-ring'
  | 'moon'
  | 'sun'
  | 'cloud'
  | 'cloud-rain'
  | 'cloud-snow'
  | 'cloud-lightning'
  | 'wind'
  | 'droplets'
  | 'thermometer'
  | 'umbrella'
  | 'sunrise'
  | 'sunset'
  | 'activity'
  | 'bar-chart3'
  | 'trending-up'
  | 'trending-down'
  | 'line-chart'
  | 'pie-chart'
  | 'dollar'
  | 'euro'
  | 'pound-sterling'
  | 'yen'
  | 'indian-rupee'
  | 'bitcoin'
  | 'card'
  | 'wallet-icon'
  | 'receipt'
  | 'calculator'
  | 'percent'
  | 'growth'
  | 'decline'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-up-down'
  | 'arrow-left-right'
  | 'arrow-up-left'
  | 'arrow-up-right'
  | 'arrow-down-left'
  | 'arrow-down-right'
  | 'move'
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'undo'
  | 'redo'
  | 'history'
  | 'time'
  | 'timer'
  | 'stopwatch'
  | 'hourglass'
  | 'calendar-icon'
  | 'calendar-days'
  | 'calendar-check'
  | 'calendar-x'
  | 'calendar-plus'
  | 'calendar-minus'
  | 'calendar-range'
  | 'calendar-search'
  | 'calendar-heart'
  | 'calendar-star'
  | 'event'
  | 'event-icon'
  | 'clock-icon'
  | 'timer-icon'
  | 'stopwatch-icon'
  | 'hourglass-icon';

// Icon mapping object
export const iconMap: Record<IconName, LucideIcon> = {
  'alert-circle': AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'check': Check,
  'check-circle': CheckCircle,
  'eye': Eye,
  'eye-off': EyeOff,
  'lock': Lock,
  'mail': Mail,
  'user': User,
  'x': X,
  'loader2': Loader2,
  'plus': Plus,
  'minus': Minus,
  'search': Search,
  'shopping-cart': ShoppingCart,
  'heart': Heart,
  'share2': Share2,
  'message-circle': MessageCircle,
  'play': Play,
  'pause': Pause,
  'volume2': Volume2,
  'volume-x': VolumeX,
  'settings': Settings,
  'menu': Menu,
  'close': Close,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'star': Star,
  'star-half': StarHalf,
  'filter': Filter,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  'calendar': Calendar,
  'clock': Clock,
  'map-pin': MapPin,
  'phone': Phone,
  'globe': Globe,
  'facebook': Facebook,
  'instagram': Instagram,
  'twitter': Twitter,
  'youtube': Youtube,
  'github': Github,
  'linkedin': Linkedin,
  'external-link': ExternalLink,
  'download': Download,
  'upload': Upload,
  'edit': Edit,
  'trash2': Trash2,
  'copy': Copy,
  'save': Save,
  'refresh-cw': RefreshCw,
  'rotate-ccw': RotateCcw,
  'rotate-cw': RotateCw,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  'maximize': Maximize,
  'minimize': Minimize,
  'grid': Grid,
  'list': List,
  'layout': Layout,
  'sidebar': Sidebar,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  'flag': Flag,
  'bookmark': Bookmark,
  'tag': Tag,
  'hash': Hash,
  'at-sign': AtSign,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  'wallet': Wallet,
  'package': Package,
  'truck': Truck,
  'home': Home,
  'building': Building,
  'map': Map,
  'navigation': Navigation,
  'compass': Compass,
  'target': Target,
  'zap': Zap,
  'shield': Shield,
  'key': Key,
  'fingerprint': Fingerprint,
  'smartphone': Smartphone,
  'monitor': Monitor,
  'tablet': Tablet,
  'laptop': Laptop,
  'headphones': Headphones,
  'camera': Camera,
  'mic': Mic,
  'mic-off': MicOff,
  'video': Video,
  'video-off': VideoOff,
  'image': Image,
  'file': File,
  'file-text': FileText,
  'folder': Folder,
  'folder-open': FolderOpen,
  'archive': Archive,
  'inbox': Inbox,
  'send': Send,
  'reply': Reply,
  'forward': Forward,
  'reply-all': ReplyAll,
  'trash': Trash,
  'archive-restore': ArchiveRestore,
  'pin': Pin,
  'pin-off': PinOff,
  'bell': Bell,
  'bell-off': BellOff,
  'bell-ring': BellRing,
  'moon': Moon,
  'sun': Sun,
  'cloud': Cloud,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'wind': Wind,
  'droplets': Droplets,
  'thermometer': Thermometer,
  'umbrella': Umbrella,
  'sunrise': Sunrise,
  'sunset': Sunset,
  'activity': Activity,
  'bar-chart3': BarChart3,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'line-chart': LineChart,
  'pie-chart': PieChart,
  'dollar': Dollar,
  'euro': Euro,
  'pound-sterling': PoundSterling,
  'yen': JapaneseYen,
  'indian-rupee': IndianRupee,
  'bitcoin': Bitcoin,
  'card': Card,
  'wallet-icon': WalletIcon,
  'receipt': Receipt,
  'calculator': Calculator,
  'percent': Percent,
  'growth': Growth,
  'decline': Decline,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-up-down': ArrowUpDown,
  'arrow-left-right': ArrowLeftRight,
  'arrow-up-left': ArrowUpLeft,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-left': ArrowDownLeft,
  'arrow-down-right': ArrowDownRight,
  'move': Move,
  'move-up': MoveUp,
  'move-down': MoveDown,
  'move-left': MoveLeft,
  'move-right': MoveRight,
  'undo': Undo,
  'redo': Redo,
  'history': History,
  'time': Time,
  'timer': Timer,
  'stopwatch': Timer,
  'hourglass': Hourglass,
  'calendar-icon': CalendarIcon,
  'calendar-days': CalendarDays,
  'calendar-check': CalendarCheck,
  'calendar-x': CalendarX,
  'calendar-plus': CalendarPlus,
  'calendar-minus': CalendarMinus,
  'calendar-range': CalendarRange,
  'calendar-search': CalendarSearch,
  'calendar-heart': CalendarHeart,
  'calendar-star': CalendarStar,
  'event': Event,
  'event-icon': EventIcon,
  'clock-icon': ClockIcon,
  'timer-icon': TimerIcon,
  'stopwatch-icon': StopwatchIcon,
  'hourglass-icon': HourglassIcon,
};

// Dynamic icon component
export interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  [key: string]: any;
}

export function Icon({ name, size = 24, className = '', color, strokeWidth = 2, ...props }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent
      size={size}
      className={className}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}

// Convenience exports for commonly used icons
export const Icons = {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  X,
  Loader2,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Heart,
  Share2,
  MessageCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Menu,
  Close,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  StarHalf,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Github,
  Linkedin,
  ExternalLink,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Save,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Grid,
  List,
  Layout,
  Sidebar,
  MoreHorizontal,
  MoreVertical,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  CreditCard,
  Wallet,
  Package,
  Truck,
  Home,
  Building,
  Map,
  Navigation,
  Compass,
  Target,
  Zap,
  Shield,
  Key,
  Fingerprint,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Headphones,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Image,
  File,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Send,
  Reply,
  Forward,
  ReplyAll,
  Trash,
  ArchiveRestore,
  Pin,
  PinOff,
  Bell,
  BellOff,
  BellRing,
  Moon,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Sunrise,
  Sunset,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  Dollar,
  Euro,
  PoundSterling,
  JapaneseYen,
  IndianRupee,
  Bitcoin,
  Card,
  WalletIcon,
  Receipt,
  Calculator,
  Percent,
  Growth,
  Decline,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowLeftRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Move,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  Undo,
  Redo,
  History,
  Time,
  Timer,
  Hourglass,
  CalendarIcon,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  CalendarStar,
  Event,
  EventIcon,
  ClockIcon,
  TimerIcon,
  StopwatchIcon,
  HourglassIcon,
};

export default Icon;
